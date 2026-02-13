import type { RootStore } from "./RootStore"
import type { GameSaveSnapshot, WorkersSnapshot } from "./shared"

import { makeAutoObservable } from "mobx"
import { z } from "zod"
import { nonNegativeIntegerSchema, nonNegativeNumberSchema, workersSnapshotSchema } from "./shared"

const unlockConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("default") }),
  z.object({ type: z.literal("totalWorkers"), count: nonNegativeIntegerSchema }),
  z.object({ type: z.literal("hiredWorkers"), workerId: z.string(), count: nonNegativeIntegerSchema }),
  z.object({ type: z.literal("level"), level: nonNegativeIntegerSchema }),
])

export const workerSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  cost: nonNegativeIntegerSchema,
  production: z.object({
    energy: nonNegativeIntegerSchema,
    output: nonNegativeIntegerSchema.optional(),
  }),
  costMultiplier: nonNegativeNumberSchema,
  unlockConditions: z.array(unlockConditionSchema).readonly(),
})

export type Worker = z.infer<typeof workerSchema>

export const workersSchema = z.array(workerSchema)

export type Workers = z.infer<typeof workersSchema>

export class WorkersStore {
  constructor(private root: RootStore) {
    makeAutoObservable(this)
    this.loadWorkers()
  }

  workers: Worker[] = []

  state: "pending" | "ready" | "error" = "pending";

  * loadWorkers() {
    try {
      const dataSource = this.root.dataSource
      if (!dataSource) {
        throw new Error("RootStore dataSource is required to load workers.")
      }
      const response: unknown = yield dataSource.fetchWorkers()
      this.workers = workersSchema.parse(response)
      this.state = "ready"
    }
    catch (e) {
      console.error("Failed to load workers:", e)
      this.state = "error"
    }
  }

  hiredWorkers: Record<Worker["id"], number> = {}

  get totalWorkers() {
    return Object.values(this.hiredWorkers).reduce((a, b) => a + b, 0)
  }

  get totalEnergyProduction() {
    let total = 10
    for (const worker of this.workers) {
      const count = this.hiredWorkers[worker.id] || 0
      total += worker.production.energy * count
    }
    return total
  }

  get totalOutputProduction() {
    let total = 0
    for (const worker of this.workers) {
      const count = this.hiredWorkers[worker.id] || 0
      total += (worker.production.output ?? 0) * count
    }
    return total
  }

  get unlockedWorkers(): Worker[] {
    return this.workers.filter((worker) => {
      let meetsAllConditions = true
      for (const condition of worker.unlockConditions) {
        switch (condition.type) {
          case "default":
            break
          case "totalWorkers":
            if (this.totalWorkers < condition.count) {
              meetsAllConditions = false
            }
            break
          case "hiredWorkers":
            { const hiredCount = this.hiredWorkers[condition.workerId] || 0
              if (hiredCount < condition.count) {
                meetsAllConditions = false
              } }
            break
          case "level":
            if (condition.level > this.root.level.unlockedLevels.length - 1) {
              meetsAllConditions = false
            }
            break
        }
      }
      return meetsAllConditions
    })
  }

  calculateWorkerCost(worker: Worker, currentCount: number = this.hiredWorkers[worker.id] ?? 0): number {
    const baseCost = Math.ceil(worker.cost * worker.costMultiplier ** currentCount)
    const reduction = this.root.resources.getMultipliers("workerCostReduction")
    // reduction of 1.2 means 20% cheaper: (2 - 1.2) = 0.8 = 80% of base cost
    const costMultiplier = Math.max(0.1, 2 - reduction)
    return Math.ceil(baseCost * costMultiplier)
  }

  hireWorker(worker: Worker) {
    const currentCount = this.hiredWorkers[worker.id] || 0
    const cost = this.calculateWorkerCost(worker, currentCount)

    if (!this.root.resources.spendResource("money", cost)) {
      throw new Error("Not enough money to hire this worker")
    }

    this.hiredWorkers[worker.id] = currentCount + 1
    this.root.sync.markDirty("workers")
    this.root.achievements.addWorkers(1)
  }

  addWorkers(workerId: string, count: number): void {
    const current = this.hiredWorkers[workerId] ?? 0
    this.hiredWorkers[workerId] = current + count
    this.root.sync.markDirty("workers")
    this.root.achievements.addWorkers(count)
  }

  getSnapshot(): WorkersSnapshot {
    return {
      hiredWorkers: this.hiredWorkers,
    }
  }

  loadSnapshot(snapshot: GameSaveSnapshot): void {
    const validated = workersSnapshotSchema.parse(snapshot.workers)
    this.hiredWorkers = validated.hiredWorkers
  }

  reset(): void {
    this.hiredWorkers = {}
  }
}
