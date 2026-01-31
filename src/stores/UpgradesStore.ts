import {makeAutoObservable} from "mobx"
import {z} from "zod"

import type {RootStore} from "./RootStore"
import {
    createMultipliersMap,
    type MultipliersMap,
    nonNegativeIntegerSchema,
    nonNegativeNumberSchema,
    resourceSchema,
    type Resource,
    type UpgradesSnapshot,
    upgradesSnapshotSchema
} from "./shared"


const upgradeEffectSchema = z.discriminatedUnion("type", [
    z.object({type: z.literal("energyGain"), value: nonNegativeNumberSchema}),
    z.object({type: z.literal("outputGain"), value: nonNegativeNumberSchema}),
    z.object({type: z.literal("operationCostReduction"), value: nonNegativeNumberSchema}),
    z.object({type: z.literal("reputationGain"), value: nonNegativeNumberSchema}),
    z.object({type: z.literal("moneyGain"), value: nonNegativeNumberSchema}),
    z.object({type: z.literal("workersEfficiency"), value: nonNegativeNumberSchema}),
    z.object({type: z.literal("operationDurationReduction"), value: nonNegativeNumberSchema}),
    z.object({type: z.literal("offlineEfficiency"), value: nonNegativeNumberSchema}),
])

const upgradeSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.enum(["energy", "output", "operations", "workers"]),
    cost: z.partialRecord(resourceSchema, nonNegativeIntegerSchema),
    costMultiplier: nonNegativeNumberSchema,
    effect: z.array(upgradeEffectSchema).readonly(),
    unlockCondition: z.discriminatedUnion("type", [
        z.object({type: z.literal("level"), level: nonNegativeIntegerSchema}),
        z.object({type: z.literal("operationsCompleted"), count: nonNegativeIntegerSchema}),
        z.object({type: z.literal("operation"), operationId: z.string(), level: nonNegativeIntegerSchema}),
        z.object({type: z.literal("worker"), workerId: z.string(), count: nonNegativeIntegerSchema}),
        z.object({type: z.literal("upgrade"), upgradeId: z.string(), level: nonNegativeIntegerSchema}),
    ]).optional(),
    maxLevel: nonNegativeIntegerSchema,
})

export type Upgrade = z.infer<typeof upgradeSchema>;

export const upgradesSchema = z.array(upgradeSchema)

export type Upgrades = z.infer<typeof upgradesSchema>;

export class UpgradesStore {
    constructor(private root: RootStore) {
        makeAutoObservable(this)
        this.loadUpgrades.call(this)
    }

    state: "pending" | "ready" | "error" = "pending"

    upgrades: Upgrade[] = []

    get mappedUpgrades(): Map<Upgrade["id"], Upgrade> {
        return new Map(this.upgrades.map(u => [u.id, u]))
    }

    * loadUpgrades() {
        try {
            const dataSource = this.root.dataSource
            if (!dataSource) {
                throw new Error("RootStore dataSource is required to load upgrades.")
            }
            const response: unknown = yield dataSource.fetchUpgrades()
            this.upgrades = upgradesSchema.parse(response)
            this.state = "ready"
        }
        catch (e) {
            console.error("Failed to load upgrades:", e)
            this.state = "error"
        }
    }

    unlockedUpgrades: Record<Upgrade["id"], number> = {}

    private meetsUnlockCondition(upgrade: Upgrade): boolean {
        const condition = upgrade.unlockCondition
        if (!condition) {
            return true
        }

        switch (condition.type) {
            case "level": {
                return condition.level <= this.root.level.maxLevelReached
            }
            case "operationsCompleted": {
                return this.root.operations.totalOperationsCompleted >= condition.count
            }
            case "operation": {
                const completed = this.root.operations.operationsFinished[condition.operationId] ?? 0
                return completed >= condition.level
            }
            case "worker": {
                const hired = this.root.workers.hiredWorkers[condition.workerId] ?? 0
                return hired >= condition.count
            }
            case "upgrade": {
                const purchased = this.unlockedUpgrades[condition.upgradeId] ?? 0
                return purchased >= condition.level
            }
            default:
                return false
        }
    }

    canPurchaseUpgrade(upgrade: Upgrade) {
        const currentLevel = this.unlockedUpgrades[upgrade.id] ?? 0
        if (currentLevel >= upgrade.maxLevel) {
            return false
        }
        if (!this.meetsUnlockCondition(upgrade)) {
            return false
        }
        const levelCostMultiplier = Math.pow(upgrade.costMultiplier, currentLevel)
        for (const [resource, baseCost] of Object.entries(upgrade.cost) as [Resource, number][]) {
            if (this.root.resources[resource] < baseCost * levelCostMultiplier) {
                return false
            }
        }
        return true
    }

    get visibleUpgrades(): Upgrade[] {
        return this.upgrades.filter(upgrade => {
            const currentLevel = this.unlockedUpgrades[upgrade.id] ?? 0
            return currentLevel > 0 || this.canPurchaseUpgrade(upgrade)
        })
    }

    purchaseUpgrade(upgrade: Upgrade) {
        if (!this.canPurchaseUpgrade(upgrade)) {
            throw new Error(`Cannot purchase upgrade ${upgrade.id}: requirements not met or max level reached`)
        }
        const currentLevel = this.unlockedUpgrades[upgrade.id] ?? 0
        const levelCostMultiplier = Math.pow(upgrade.costMultiplier, currentLevel)
        if (!this.root.resources.spendResourcesByCost(upgrade.cost, levelCostMultiplier)) {
            throw new Error(`Insufficient resources for upgrade: ${upgrade.name}`)
        }
        this.unlockedUpgrades[upgrade.id] = (this.unlockedUpgrades[upgrade.id] ?? 0) + 1
        this.root.sync.markDirty("upgrades")
    }

    get multipliers(): MultipliersMap {
        const map = createMultipliersMap(1.0)
        for (const id of Object.keys(this.unlockedUpgrades)) {
            const upgrade = this.mappedUpgrades.get(id)
            if (!upgrade) {
                continue
            }
            const levels = this.unlockedUpgrades[id]!
            for (const effect of upgrade.effect) {
                const current = map.get(effect.type)!
                map.set(effect.type, current * Math.pow(effect.value, levels))
            }
        }
        return map
    }

    getSnapshot(): UpgradesSnapshot {
        return {
            unlockedUpgrades: this.unlockedUpgrades,
        }
    }

    loadSnapshot(snapshot: {upgrades: UpgradesSnapshot}) {
        const validated = upgradesSnapshotSchema.parse(snapshot.upgrades)
        this.unlockedUpgrades = validated.unlockedUpgrades
    }

    reset() {
        this.unlockedUpgrades = {}
    }
}
