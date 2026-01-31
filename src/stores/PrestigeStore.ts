import {makeAutoObservable} from "mobx"
import {z} from "zod"

import type {RootStore} from "./RootStore"
import {
    createFlatGainsMap,
    createMultipliersMap,
    type FlatGainsMap,
    gainMultipliers,
    type MultipliersMap,
    nonNegativeIntegerSchema,
    nonNegativeNumberSchema,
    type PrestigeSnapshot,
    prestigeSnapshotSchema,
    type Resource,
    resourceSchema
} from "./shared"

// Effect types for prestige upgrades
const prestigeEffectSchema = z.discriminatedUnion("type", [
    // Multiplier effects (use existing gainMultipliers)
    z.object({
        type: z.literal("multiplier"),
        target: z.enum(gainMultipliers),
        value: nonNegativeNumberSchema,  // e.g., 1.1 = +10%
    }),
    // Starting resource bonus
    z.object({
        type: z.literal("startingResource"),
        resource: z.enum(["energy", "output", "reputation", "money"]),
        amount: nonNegativeIntegerSchema,
    }),
    // Starting workers bonus
    z.object({
        type: z.literal("startingWorkers"),
        workerId: z.string(),
        count: nonNegativeIntegerSchema,
    }),
    // Level threshold reduction
    z.object({
        type: z.literal("levelThreshold"),
        levelIndex: nonNegativeIntegerSchema,
        reduction: nonNegativeNumberSchema,  // e.g., 0.5 = 50% reduction
    }),
    // Starting operations completed (for faster unlocking)
    z.object({
        type: z.literal("startingOperations"),
        count: nonNegativeIntegerSchema,
    }),
])

export type PrestigeEffect = z.infer<typeof prestigeEffectSchema>

const prestigeUpgradeSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.enum(["production", "starting", "level", "qol", "meta"]).readonly(),
    baseCost: nonNegativeIntegerSchema,
    costMultiplier: nonNegativeNumberSchema.optional(),  // For stackable upgrades
    maxLevel: nonNegativeIntegerSchema.optional(),       // undefined = 1 (one-time)
    effects: z.array(prestigeEffectSchema).readonly(),
})

export type PrestigeUpgrade = z.infer<typeof prestigeUpgradeSchema>

export const prestigeUpgradesSchema = z.array(prestigeUpgradeSchema)

export type PrestigeUpgrades = z.infer<typeof prestigeUpgradesSchema>


export class PrestigeStore {
    constructor(private root: RootStore) {
        makeAutoObservable(this)
        this.loadData.call(this)
    }

    state: "pending" | "ready" | "error" = "pending"

    // Loaded upgrade definitions
    upgrades: PrestigeUpgrade[] = []
    get mappedUpgrades() {
        return new Map(this.upgrades.map(u => [u.id, u]))
    }

    // Load upgrade definitions
    * loadData() {
        try {
            const dataSource = this.root.dataSource
            if (!dataSource) {
                throw new Error("RootStore dataSource is required to load prestige upgrades.")
            }
            const response: unknown = yield dataSource.fetchPrestigeUpgrades()
            this.upgrades = prestigeUpgradesSchema.parse(response)
            this.state = "ready"
        }
        catch (e) {
            console.error("Failed to load prestige upgrades:", e)
            this.state = "error"
        }
    }

    points = 0                            // Spendable BP
    lifetimePoints = 0                    // Total BP ever earned
    prestigeCount = 0                     // Number of prestiges completed
    currentRunSeconds = 0                 // Playtime this run (resets on prestige)
    totalPlaytimeSeconds = 0              // Lifetime playtime
    purchasedUpgrades: Record<string, number> = {} // upgradeId → level

    stats: PrestigeSnapshot["stats"] = {
        firstPrestigeAt: null,
        fastestRunSeconds: null,
        highestOperationsBeforePrestige: 0,
    }

    // BP Calculation
    calculatePotentialBP(): number {
        const {baseOperationsCompleted, softCapThreshold, softCapMultiplier} = this.root.config.prestige
        const scaling = 1 + Math.max(0, this.prestigeCount - softCapThreshold) * softCapMultiplier
        const effectiveBase = baseOperationsCompleted * scaling
        const totalOps = this.root.operations.totalOperationsCompleted
        return Math.floor(Math.sqrt(totalOps / effectiveBase))
    }

    canPrestige(): boolean {
        return this.calculatePotentialBP() >= 1
    }

    // Prestige Execution
    executePrestige(): void {
        if (!this.canPrestige()) {
            throw new Error("Cannot prestige: requirements not met")
        }

        const earnedBP = this.calculatePotentialBP()
        const totalOps = this.root.operations.totalOperationsCompleted

        // Update stats
        this.stats.highestOperationsBeforePrestige = Math.max(
            this.stats.highestOperationsBeforePrestige,
            totalOps
        )
        if (this.stats.firstPrestigeAt === null) {
            this.stats.firstPrestigeAt = Date.now()
        }
        if (this.stats.fastestRunSeconds === null || this.currentRunSeconds < this.stats.fastestRunSeconds) {
            this.stats.fastestRunSeconds = this.currentRunSeconds
        }

        // Award BP
        this.addPoints(earnedBP)
        this.incrementPrestigeCount()

        // Reset current run timer
        this.currentRunSeconds = 0

        // Reset other stores (order matters!)
        this.root.resources.reset()
        this.root.workers.reset()
        this.root.operations.resetForPrestige()  // New method - keeps definitions, clears progress
        this.root.level.reset()
        // Note: Do NOT reset achievements, codex, or upgrades

        // Apply starting bonuses from prestige upgrades
        this.applyStartingBonuses()

        this.root.sync.markDirty("prestige")
    }

    private applyStartingBonuses(): void {
        const startingResources = this.getStartingResources()
        for (const [key, amount] of Object.entries(startingResources)) {
            const resource = resourceSchema.parse(key)
            this.root.resources.addResource(resource, Math.ceil(amount))
        }

        const startingWorkers = this.getStartingWorkers()
        for (const [workerId, count] of Object.entries(startingWorkers)) {
            this.root.workers.addWorkers(workerId, Math.ceil(count))
        }

        // Starting operations completed
        const startingOps = this.getStartingOperationsCompleted()
        if (startingOps > 0) {
            this.root.operations.addStartingOperations(startingOps)
        }
    }

    // Upgrade management
    purchaseUpgrade(id: string): void {
        const upgrade = this.mappedUpgrades.get(id)
        if (!upgrade) {
            throw new Error(`Prestige upgrade ${id} not found`)
        }

        const cost = this.getUpgradeCost(id)
        const currentLevel = this.getUpgradeLevel(id)
        const maxLevel = upgrade.maxLevel ?? 1

        if (currentLevel >= maxLevel) {
            throw new Error(`Maximum level reached for: ${upgrade.name}`)
        }

        if (!this.spendPoints(cost)) {
            throw new Error(`Insufficient prestige points for upgrade: ${upgrade.name}. Need ${cost}, have ${this.points}`)
        }
        this.purchasedUpgrades[id] = currentLevel + 1
        this.root.sync.markDirty("prestige")
    }

    getUpgradeLevel(id: string): number {
        return this.purchasedUpgrades[id] ?? 0
    }

    getUpgradeCost(id: string): number {
        const upgrade = this.mappedUpgrades.get(id)
        if (!upgrade) {
            return Infinity
        }

        const currentLevel = this.getUpgradeLevel(id)
        const maxLevel = upgrade.maxLevel ?? 1

        if (currentLevel >= maxLevel) {
            return Infinity
        }

        if (upgrade.costMultiplier && upgrade.maxLevel && upgrade.maxLevel > 1) {
            // Stackable upgrade with cost scaling
            return Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel))
        }
        else {
            // One-time upgrade
            return upgrade.baseCost
        }
    }

    getLevelThresholdModifier(levelIndex: number): number {
        let totalReduction = 0

        for (const [upgradeId, level] of Object.entries(this.purchasedUpgrades)) {
            if (level <= 0) continue

            const upgrade = this.mappedUpgrades.get(upgradeId)
            if (!upgrade) continue

            for (const effect of upgrade.effects) {
                if (effect.type === "levelThreshold" && effect.levelIndex === levelIndex) {
                    totalReduction += effect.reduction
                }
            }
        }

        return Math.min(totalReduction, 0.95) // Cap at 95% reduction
    }

    getStartingResources(): Partial<Record<Resource, number>> {
        const resources: Partial<Record<Resource, number>> = {}

        for (const [upgradeId, level] of Object.entries(this.purchasedUpgrades)) {
            if (level <= 0) {
                continue
            }

            const upgrade = this.mappedUpgrades.get(upgradeId)
            if (!upgrade) {
                continue
            }

            for (const effect of upgrade.effects) {
                if (effect.type === "startingResource") {
                    resources[effect.resource] = (resources[effect.resource] ?? 0) + effect.amount * level
                }
            }
        }

        return resources
    }

    getStartingWorkers(): Record<string, number> {
        const workers: Record<string, number> = {}

        for (const [upgradeId, level] of Object.entries(this.purchasedUpgrades)) {
            if (level <= 0) continue

            const upgrade = this.mappedUpgrades.get(upgradeId)
            if (!upgrade) continue

            for (const effect of upgrade.effects) {
                if (effect.type === "startingWorkers") {
                    workers[effect.workerId] = (workers[effect.workerId] ?? 0) + effect.count * level
                }
            }
        }

        return workers
    }

    getStartingOperationsCompleted(): number {
        let total = 0

        for (const [upgradeId, level] of Object.entries(this.purchasedUpgrades)) {
            if (level <= 0) continue

            const upgrade = this.mappedUpgrades.get(upgradeId)
            if (!upgrade) continue

            for (const effect of upgrade.effects) {
                if (effect.type === "startingOperations") {
                    total += effect.count * level
                }
            }
        }

        return total
    }

    addPoints(points: number) {
        const validPoints = nonNegativeIntegerSchema.parse(points)
        this.points += validPoints
        this.lifetimePoints += validPoints
        this.root.sync.markDirty("prestige")
    }

    spendPoints(points: number) {
        if (this.points >= points) {
            this.points -= nonNegativeIntegerSchema.parse(points)
            this.root.sync.markDirty("prestige")
            return true
        }
        return false
    }

    get multipliers(): MultipliersMap {
        const map = createMultipliersMap(1.0)

        for (const [upgradeId, level] of Object.entries(this.purchasedUpgrades)) {
            if (level <= 0) continue

            const upgrade = this.mappedUpgrades.get(upgradeId)
            if (!upgrade) continue

            for (const effect of upgrade.effects) {
                if (effect.type === "multiplier") {
                    const current = map.get(effect.target)!
                    map.set(effect.target, current * Math.pow(effect.value, level))
                }
            }
        }

        return map
    }

    get flatGains(): FlatGainsMap {
        const map = createFlatGainsMap(0)
        // No flat gains from prestige currently, but keeping for future use
        return map
    }

    incrementPrestigeCount() {
        this.prestigeCount += 1
        this.root.sync.markDirty("prestige")
    }

    round() {
        this.currentRunSeconds += this.root.config.gameRoundInterval
        this.totalPlaytimeSeconds += this.root.config.gameRoundInterval
        this.root.sync.markDirty("prestige")
    }

    getSnapshot(): PrestigeSnapshot {
        return {
            points: this.points,
            lifetimePoints: this.lifetimePoints,
            prestigeCount: this.prestigeCount,
            currentRunSeconds: this.currentRunSeconds,
            totalPlaytimeSeconds: this.totalPlaytimeSeconds,
            purchasedUpgrades: {...this.purchasedUpgrades},
            stats: {...this.stats},
        }
    }

    loadSnapshot(snapshot: {prestige: PrestigeSnapshot}) {
        const validated = prestigeSnapshotSchema.parse(snapshot.prestige)
        this.points = validated.points
        this.lifetimePoints = validated.lifetimePoints
        this.prestigeCount = validated.prestigeCount
        this.currentRunSeconds = validated.currentRunSeconds
        this.totalPlaytimeSeconds = validated.totalPlaytimeSeconds
        this.purchasedUpgrades = {...validated.purchasedUpgrades}
        this.stats = {...validated.stats}
    }

    reset() {
        this.points = 0
        this.lifetimePoints = 0
        this.prestigeCount = 0
        this.currentRunSeconds = 0
        this.totalPlaytimeSeconds = 0
        this.purchasedUpgrades = {}
        this.stats = {
            firstPrestigeAt: null,
            fastestRunSeconds: null,
            highestOperationsBeforePrestige: 0,
        }
    }
}
