import {makeAutoObservable, runInAction} from "mobx"
import {z} from "zod"

import type {RootStore} from "./RootStore"
import {
    type ActiveBonus,
    bonusSchema,
    createMultipliersMap,
    type GameSaveSnapshot,
    type MultipliersMap,
    nonNegativeIntegerSchema, type OperationsProgress,
    type OperationsSnapshot,
    operationsSnapshotSchema,
    resourceSchema
} from "./shared"
import {raritySchema} from "./shared"


const costSchema = z.object({
    energy: nonNegativeIntegerSchema.optional(),
    output: nonNegativeIntegerSchema.optional(),
    reputation: nonNegativeIntegerSchema.optional(),
    money: nonNegativeIntegerSchema.optional(),
}).refine(
    (data) => data.energy || data.money || data.output,
    {message: "At least one of resources must be specified"}
).readonly()

const rewardsSchema = z.object({
    reputation: nonNegativeIntegerSchema,
    output: nonNegativeIntegerSchema.optional(),
    money: nonNegativeIntegerSchema.optional(),
    bonus: bonusSchema.optional(),
}).readonly()

const requirementsSchema = z.array(z.discriminatedUnion("type", [
    // Level at which the operation becomes available. If there is no such requirement, the operation is available on all levels.
    z.object({
        type: z.literal("level"),
        level: nonNegativeIntegerSchema
    }),
    // Another operation that must be completed a certain number of times
    z.object({
        type: z.literal("operationCompleted"),
        operationId: z.string(), count: nonNegativeIntegerSchema.optional()
    }),
    // Total number of any operations completed
    z.object({
        type: z.literal("operationsCount"),
        count: nonNegativeIntegerSchema
    }),
])).readonly()

const articlesUnlocksSchema = z.array(z.object({
    // Level of the operation opens a new article with id
    level: nonNegativeIntegerSchema,
    // Article id
    id: z.string(),
})).readonly()

export const operationSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    // Rarity of the operation (rare, epic, etc.)
    rarity: raritySchema,
    // Duration in seconds
    duration: nonNegativeIntegerSchema,
    // Cooldown in seconds
    cooldown: nonNegativeIntegerSchema,
    cost: costSchema,
    rewards: rewardsSchema,
    // Requirements to unlock the operation
    requirements: requirementsSchema,
    // Articles unlocked at certain completion levels
    articlesUnlocks: articlesUnlocksSchema,
}).readonly()

export type Operation = z.infer<typeof operationSchema>;

export const operationsSchema = z.array(operationSchema)

export type Operations = z.infer<typeof operationsSchema>

export class OperationsStore {
    constructor(private root: RootStore) {
        makeAutoObservable(this)
        this.loadData.call(this)
    }

    state: "pending" | "ready" | "error" = "pending"

    operations: Operation[] = []

    // Observable tick that forces recalculation of operation states
    // Incremented when operations transition between states
    private tick = 0

    // Active timeout for the next state transition
    private timeoutId?: ReturnType<typeof setTimeout>

    // Helper to determine operation phase based on progress and current time
    private getOperationPhase(
        progress: OperationsProgress[string] | undefined,
        now: number
    ): "idle" | "inProgress" | "claimable" | "cooldown" {
        if (!progress) {
            return "idle"
        }

        if (progress.claimableAt > 0) {
            return progress.claimableAt > now ? "inProgress" : "claimable"
        }

        return progress.cooldownTill > now ? "cooldown" : "idle"
    }

    * loadData() {
        try {
            const dataSource = this.root.dataSource
            if (!dataSource) {
                throw new Error("RootStore dataSource is required to load operations.")
            }
            const response: unknown = yield dataSource.fetchOperations()
            this.operations = operationsSchema.parse(response)
            this.state = "ready"
        }
        catch (e) {
            console.error("Failed to load discoveries:", e)
            this.state = "error"
        }
    }

    // Number of times each operation has been completed
    operationsFinished: Record<Operation["id"], number> = {}

    // Total operations completed for this level
    get totalOperationsCompleted(): number {
        return Object.values(this.operationsFinished).reduce((sum, val) => sum + val, 0)
    }

    // Operations available for collection at the current level
    get availableOperations(): Operation[] {
        return this.operations
            .filter(operation => {
                for (const requirement of operation.requirements) {
                    switch (requirement.type) {
                        case "level":
                            if (requirement.level !== this.root.level.currentLevel) {
                                return false
                            }
                            break
                        case "operationCompleted":
                            const operationProgress = this.operationsFinished[requirement.operationId] ?? 0
                            const requiredCount = requirement.count ?? 1
                            if (operationProgress < requiredCount) {
                                return false
                            }
                            break
                        case "operationsCount":
                            if (this.totalOperationsCompleted < requirement.count) {
                                return false
                            }
                            break
                    }
                }
                return true
            })
    }

    // Active temporary bonuses from completed operations
    activeBonuses: ActiveBonus[] = []

    get multipliers(): MultipliersMap {
        const map = createMultipliersMap(1.0)
        for (const activeBonus of this.activeBonuses) {
            if (activeBonus.bonus.type === "multiplier") {
                const current = map.get(activeBonus.bonus.target)!
                // Multiplicative stacking for same-type bonuses
                map.set(activeBonus.bonus.target, current * activeBonus.bonus.value)
            }
        }
        return map
    }

    expireBonuses() {
        const now = Date.now()
        const before = this.activeBonuses.length
        this.activeBonuses = this.activeBonuses.filter(ab => ab.expiresAt > now)
        if (before !== this.activeBonuses.length) {
            this.root.sync.markDirty("operations")
        }
    }

    // Schedule next tick to update operation states
    private scheduleNextTick() {
        // Clear any existing timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
            this.timeoutId = undefined
        }

        const now = Date.now()
        let nextTransitionTime = Infinity
        let hasActiveCooldowns = false

        // Find the next state transition time (either claimable or cooldown expiry)
        for (const progress of Object.values(this.operationsProgress)) {
            // Check for operations becoming claimable
            if (progress.claimableAt > now && progress.claimableAt < nextTransitionTime) {
                nextTransitionTime = progress.claimableAt
            }

            // Check for operations finishing cooldown (becoming idle again)
            if (progress.cooldownTill > now && progress.cooldownTill < nextTransitionTime) {
                nextTransitionTime = progress.cooldownTill
            }

            // Check if we have any active cooldowns
            if (progress.cooldownTill > now && progress.claimableAt === 0) {
                hasActiveCooldowns = true
            }
        }

        // Calculate delay for the next tick
        let delay: number
        if (nextTransitionTime !== Infinity) {
            delay = Math.max(0, nextTransitionTime - now)
        } else if (hasActiveCooldowns) {
            // If we have active cooldowns but no specific transition time,
            delay = this.root.config.gameRoundInterval
        } else {
            // No active operations, no need to schedule
            return
        }

        if (hasActiveCooldowns && delay > this.root.config.gameRoundInterval) {
            delay = this.root.config.gameRoundInterval
        }

        this.timeoutId = setTimeout(() => {
            runInAction(() => {
                this.tick++ // Update tick to trigger computed getters
            })
            this.scheduleNextTick() // Schedule the next one
        }, delay)
    }

    // Computed getters for UI state derivation
    get operationsInProgress(): Set<string> {
        // The trick to force update
        void this.tick

        const now = Date.now()
        const inProgress = new Set<string>()

        for (const [operationId, progress] of Object.entries(this.operationsProgress)) {
            if (this.getOperationPhase(progress, now) === "inProgress") {
                inProgress.add(operationId)
            }
        }

        return inProgress
    }

    get operationsClaimable(): Set<string> {
        // The trick to force update
        void this.tick

        const now = Date.now()
        const claimable = new Set<string>()

        for (const [operationId, progress] of Object.entries(this.operationsProgress)) {
            if (this.getOperationPhase(progress, now) === "claimable") {
                claimable.add(operationId)
            }
        }

        return claimable
    }

    get operationsInCooldown(): Set<string> {
        // The trick to force update
        void this.tick

        const now = Date.now()
        const inCooldown = new Set<string>()

        for (const [operationId, progress] of Object.entries(this.operationsProgress)) {
            if (this.getOperationPhase(progress, now) === "cooldown") {
                inCooldown.add(operationId)
            }
        }

        return inCooldown
    }

    // Map of operation IDs to their remaining cooldown times in seconds
    get cooldownTimes(): Map<string, number> {
        // The trick to force update
        void this.tick

        const now = Date.now()
        const times = new Map<string, number>()

        for (const [operationId, progress] of Object.entries(this.operationsProgress)) {
            if (this.getOperationPhase(progress, now) === "cooldown") {
                const remainingTime = (progress.cooldownTill - now) / 1000
                times.set(operationId, Math.max(0, remainingTime))
            }
        }

        return times
    }

    // Helper method to get the remaining cooldown time in seconds
    getCooldownRemainingTime(operationId: string): number {
        const progress = this.operationsProgress[operationId]
        const now = Date.now()
        if (this.getOperationPhase(progress, now) !== "cooldown") {
            return 0
        }

        return (progress!.cooldownTill - now) / 1000 // Convert to seconds
    }

    // Helper method to check if the operation needs animation resumption
    getOperationRemainingTime(operationId: string): number {
        const progress = this.operationsProgress[operationId]
        const now = Date.now()
        if (this.getOperationPhase(progress, now) !== "inProgress") {
            return 0
        }

        return (progress!.claimableAt - now) / 1000 // Convert to seconds
    }

    canAffordOperation(operation: Operation): boolean {
        for (const cost of Object.entries(operation.cost)) {
            const resource = resourceSchema.parse(cost[0])
            const value = cost[1] * this.root.config.operationScaleFactor[operation.rarity]
            // Check if enough resources are available
            if (this.root.resources[resource] < value) {
                return false
            }
        }
        return true
    }

    get affordableOperations() {
        const map = new Map<string, boolean>()
        for (const operation of this.availableOperations) {
            map.set(operation.id, this.root.operations.canAffordOperation(operation))
        }
        return map
    }

    // Operations currently in progress
    operationsProgress: OperationsProgress = {}

    conductOperation(operation: Operation) {
        const now = Date.now()

        // if the operation is still in cooldown, throw error
        const cooldownTill = this.operationsProgress[operation.id]?.cooldownTill ?? 0
        if (cooldownTill > now) {
            const remainingSeconds = Math.ceil((cooldownTill - now) / 1000)
            throw new Error(`${operation.name} is on cooldown for ${remainingSeconds} more seconds`)
        }

        // Get the operation cost reduction multiplier from upgrades (e.g., 1.2 means 20% reduction)
        const operationCostReduction = Math.max(
            this.root.resources.getMultipliers("operationCostReduction"),
            0.001
        )
        // Convert the reduction multiplier to a cost multiplier (e.g., 1.2 -> pay ~83% of base cost)
        const upgradeMultiplier = 1 / operationCostReduction
        // Apply both rarity scaling AND upgrade reduction
        const finalMultiplier = this.root.config.operationScaleFactor[operation.rarity] * upgradeMultiplier
        // Attempt to spend resources using the calculated cost multiplier, return early if insufficient resources¸
        if (!this.root.resources.spendResourcesByCost(operation.cost, finalMultiplier)) {
            throw new Error(`Insufficient resources to conduct operation ${operation.id}`)
        }

        // Get the operation duration reduction multiplier from upgrades (e.g., 1.2 means 20% reduction)
        const operationDurationReduction = Math.max(
            this.root.resources.getMultipliers("operationDurationReduction"),
            0.001
        )
        // Convert the reduction multiplier to a duration multiplier (e.g., 1.2 -> ~83% of base duration)
        const durationMultiplier = 1 / operationDurationReduction
        const duration = (operation.duration * durationMultiplier) // in seconds
        const cooldown = duration + operation.cooldown // in seconds

        this.operationsProgress[operation.id] = {
            cooldownTill: now + cooldown * 1000,
            claimableAt: now + duration * 1000,
        }
        this.root.sync.markDirty("operations")

        if (!duration) {
            // if the duration is 0, claim the operation immediately
            this.claimOperation(operation)
            return 0
        }

        // Schedule tick for when this operation becomes claimable
        this.scheduleNextTick()

        // return duration for animation
        return duration
    }

    claimOperation(operation: Operation) {
        const progressEntry = this.operationsProgress[operation.id]
        if (!progressEntry?.claimableAt) {
            throw new Error(`Operation ${operation.id} could not be claimed`)
        }

        const now = Date.now()

        const phase = this.getOperationPhase(progressEntry, now)
        switch (phase) {
            case "inProgress":
                throw new Error(`Operation ${operation.id} is not yet claimable`)
            case "cooldown":
            case "idle":
                throw new Error(`Operation ${operation.id} has already been claimed`)
            case "claimable":
                // This is the expected case, proceed
                break
        }

        const finishedCount = (this.operationsFinished[operation.id] ?? 0) + 1
        this.operationsFinished[operation.id] = finishedCount

        const { resources } = this.root

        // Add reputation amount
        const reputationGain = Math.ceil(operation.rewards.reputation * resources.getMultipliers("reputationGain"))
        resources.addResource("reputation", reputationGain)

        // Add output if specified
        if (operation.rewards.output) {
            const outputYield = Math.ceil(operation.rewards.output * resources.getMultipliers("outputGain"))
            resources.addResource("output", outputYield)
        }

        // Add money if specified
        if (operation.rewards.money) {
            const moneyYield = Math.ceil(operation.rewards.money * resources.getMultipliers("moneyGain"))
            resources.addResource("money", moneyYield)
        }

        // Apply bonus effects if specified
        if (operation.rewards.bonus) {
            const {bonus} = operation.rewards
            // Only handle multiplier type bonuses with duration
            if (bonus.type === "multiplier" && bonus.duration) {
                const expiresAt = Date.now() + (bonus.duration * 1000)
                this.activeBonuses.push({bonus, expiresAt})
            }
        }

        for (const unlock of operation.articlesUnlocks) {
            if (unlock.level <= finishedCount) {
                this.root.codex.unlockArticle(unlock.id)
            }
        }

        this.operationsProgress[operation.id] = {
            ...progressEntry,
            claimableAt: 0,
        }
        this.root.sync.markDirty("operations")

        this.root.achievements.completeOperation()

        // Reschedule next tick for remaining operations
        this.scheduleNextTick()
    }

    // Unified method to handle both conducting and claiming operations
    // If the operation is claimable, it claims it. Otherwise, it conducts it.
    actOnOperation(operation: Operation): number | undefined {
        const now = Date.now()
        const progress = this.operationsProgress[operation.id]
        const phase = this.getOperationPhase(progress, now)

        switch (phase) {
            case "inProgress":
                throw new Error(`Operation ${operation.id} is already in progress`)
            case "cooldown":
                throw new Error(`Operation ${operation.id} is in cooldown`)
            case "claimable":
                this.claimOperation(operation)
                return 0
            case "idle":
                return this.conductOperation(operation)
        }
    }


    getSnapshot(): OperationsSnapshot {
        return {
            operationsFinished: this.operationsFinished,
            operationsProgress: this.operationsProgress,
            activeBonuses: this.activeBonuses,
        }
    }

    loadSnapshot(snapshot: GameSaveSnapshot) {
        const validated = operationsSnapshotSchema.parse(snapshot.operations)
        this.operationsFinished = validated.operationsFinished
        this.operationsProgress = validated.operationsProgress
        this.activeBonuses = validated.activeBonuses

        // Resume timers for operations in progress
        this.scheduleNextTick()
    }

    reset() {
        // Clear any pending timeouts
        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
            this.timeoutId = undefined
        }

        this.operationsFinished = {}
        this.operationsProgress = {}
        this.activeBonuses = []
        this.tick = 0
    }

    resetForPrestige(): void {
        this.operationsFinished = {}
        this.operationsProgress = {}
        this.activeBonuses = []
        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
            this.timeoutId = undefined
        }
        this.root.sync.markDirty("operations")
    }

    // Add synthetic operations completed for prestige starting bonus
    addStartingOperations(count: number): void {
        // Add to a special "prestige-start" entry that counts toward totalOperationsCompleted
        // but doesn't unlock specific operation articles
        const current = this.operationsFinished["_prestige_start"] ?? 0
        this.operationsFinished["_prestige_start"] = current + count
        this.root.sync.markDirty("operations")
    }
}
