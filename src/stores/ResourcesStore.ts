import {makeAutoObservable} from "mobx"

import type {RootStore} from "./RootStore"
import {
    type GainMultiplier,
    nonNegativeIntegerSchema, nonNegativeNumberSchema,
    type Resource,
    RESOURCES,
    type Resources,
    resourceSchema,
    resourcesSchema
} from "./shared"


export class ResourcesStore {
    constructor(private root: RootStore) {
        makeAutoObservable(this)
    }

    state = "ready"

    // Produced automatically each round, consumed by clicks and operations
    energy = 0
    // Produced by clicking or automatically if suitable workers are present
    output = 0
    // Produced by finished operations, upgrades and prestige bonuses
    reputation = 0
    // Produced by reputation over time, used to buy upgrades, workers or start operations
    money = 0

    addResource(resource: Resource, amount: number) {
        this[resource] += nonNegativeIntegerSchema.parse(amount)
        this.root.sync.markDirty("resources")
        this.root.achievements.addResourceTotals(resource, amount)
    }

    // Returns true if the resource was successfully spent
    spendResource(resource: Resource, amount: number): boolean {
        if (this[resource] >= amount) {
            this[resource] -= nonNegativeIntegerSchema.parse(amount)
            this.root.sync.markDirty("resources")
            return true
        }
        return false
    }

    spendResourcesByCost(cost: Partial<Resources>, multiplier: number) {
        // Pre-compute required rounded amounts to keep the operation atomic
        const required = new Map<Resource, number>()
        for (const [k, v] of Object.entries(cost)) {
            const resource = resourceSchema.parse(k)
            required.set(resource, Math.ceil(v * multiplier))
        }

        // Abort early if any resource is insufficient
        for (const [resource, amount] of required) {
            if (this[resource] < amount) {
                return false
            }
        }

        // Deduct after validation
        for (const [resource, amount] of required) {
            this[resource] -= nonNegativeIntegerSchema.parse(amount)
        }

        this.root.sync.markDirty("resources")
        return true
    }

    getMultipliers(key: GainMultiplier): number {
        return nonNegativeNumberSchema.parse(
            this.root.achievements.multipliers.get(key)!
            * this.root.upgrades.multipliers.get(key)!
            * this.root.prestige.multipliers.get(key)!
            * this.root.operations.multipliers.get(key)!
        )
    }

    // Calculated per round based on workers, upgrades and prestige bonuses
    get energyPerRound() {
        const rate = this.root.config.baseEnergyProduction
            * this.root.workers.totalEnergyProduction
            * this.getMultipliers("workersEfficiency")
            * this.getMultipliers("energyGain")
        // Math.ceil to avoid 0 energy production per round
        return Math.ceil(rate)
    }

    get outputPerRound() {
        const rate = this.root.config.baseOutputProduction
            * this.root.workers.totalOutputProduction
            * this.getMultipliers("workersEfficiency")
            * this.getMultipliers("outputGain")
        // Math.ceil to avoid 0 output production per round
        return Math.ceil(rate)
    }

    // Calculated per round based on reputation, upgrades and prestige bonuses
    get moneyPerRound() {
        const rate = this.root.config.moneyPerReputation
            * this.reputation
            * this.getMultipliers("moneyGain")
        // Math.ceil to avoid 0 money production per round
        return Math.ceil(rate)
    }

    // Called automatically each round to add passive resources
    round() {
        // Expire bonuses before calculating resources for this round
        this.root.operations.expireBonuses()

        if (this.energyPerRound >= 1) {
            this.addResource("energy", this.energyPerRound)
        }
        if (this.outputPerRound >= 1) {
            this.addResource("output", this.outputPerRound)
        }
        if (this.moneyPerRound >= 1) {
            this.addResource("money", this.moneyPerRound)
        }
    }

    getSnapshot(): Resources {
        return {
            energy: this.energy,
            output: this.output,
            reputation: this.reputation,
            money: this.money,
        }
    }

    loadSnapshot(snapshot: {resources: Resources}) {
        const validated = resourcesSchema.parse(snapshot.resources)
        for (const resource of RESOURCES) {
            this[resource] = validated[resource]
        }
    }

    reset() {
        for (const resource of RESOURCES) {
            this[resource] = 0
        }
    }
}
