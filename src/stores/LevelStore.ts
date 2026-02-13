import type { RootStore } from "./RootStore"
import type { LevelSnapshot } from "./shared"

import { makeAutoObservable } from "mobx"
import { z } from "zod"
import { levelSnapshotSchema, nonNegativeIntegerSchema, nonNegativeNumberSchema } from "./shared"

export const levelSchema = z.object({
  id: z.string(),
  name: z.string(),
  progress: z.object({
    start: nonNegativeIntegerSchema,
    end: nonNegativeIntegerSchema,
  }),
  unlockCost: z.object({
    unlockedArticles: z.array(z.string()),
    operationsCompleted: nonNegativeIntegerSchema,
  }),
  energyCostMultiplier: nonNegativeNumberSchema,
  samplesGainMultiplier: nonNegativeNumberSchema,
  description: z.string(),
  operations: z.array(z.string()),
})

export type Level = z.infer<typeof levelSchema>

export const levelsSchema = z.array(levelSchema)

export type Levels = z.infer<typeof levelsSchema>

export class LevelStore {
  constructor(private root: RootStore) {
    makeAutoObservable(this)
    this.loadLevels()
  }

  state: "pending" | "ready" | "error" = "pending"

  levels: Level[] = [];

  * loadLevels() {
    try {
      const dataSource = this.root.dataSource
      if (!dataSource) {
        throw new Error("RootStore dataSource is required to load levels.")
      }
      const response: unknown = yield dataSource.fetchLevels()
      this.levels = levelsSchema.parse(response)
        .sort((a, b) => a.progress.start - b.progress.start)
      this.state = "ready"
    }
    catch (e) {
      console.error("Failed to load levels:", e)
      this.state = "error"
    }
  }

  get unlockedLevels() {
    const unlocked = this.levels.filter((level, index) => {
      const { operationsCompleted, unlockedArticles } = level.unlockCost

      // Apply prestige level threshold modifier
      const modifier = 1 - this.root.prestige.getLevelThresholdModifier(index)
      const adjustedOpsRequired = Math.ceil(operationsCompleted * modifier)

      return (
        adjustedOpsRequired <= this.root.operations.totalOperationsCompleted
        && unlockedArticles.every(p => this.root.codex.unlockedArticles.has(p))
      )
    })
    return unlocked
  }

  maxLevelReached = 0
  currentLevel = 0

  selectLevel(selected: number) {
    if (selected < 0 || selected >= this.levels.length) {
      throw new Error(`Level index out of bounds: ${selected}`)
    }
    if (!this.unlockedLevels.includes(this.levels[selected]!)) {
      throw new Error(`Level not unlocked: ${selected}`)
    }
    this.currentLevel = selected
    this.root.sync.markDirty("level")
  }

  get currentLevelConfig() {
    return this.levels[this.currentLevel]
  }

  get energyCostMultiplier() {
    return this.currentLevelConfig?.energyCostMultiplier ?? 1
  }

  get outputGain() {
    return this.currentLevelConfig?.samplesGainMultiplier ?? 1
  }

  round() {
    const nextLevel = this.unlockedLevels.length - 1
    if (nextLevel > this.maxLevelReached) {
      const newLevel = this.levels[nextLevel]
      if (!newLevel) {
        throw new Error(`No level found at index ${nextLevel}`)
      }

      // Update maxLevelReached BEFORE showing popup to avoid showing it multiple times
      this.maxLevelReached = nextLevel
      this.root.sync.markDirty("level")
      this.root.achievements.levelReached(nextLevel)

      // Show a popup for the newly unlocked level
      this.root.confirmation.ask({
        title: `${newLevel.name} Unlocked!`,
        description: newLevel.description,
        confirmText: this.root.config.levelUpConfirmText,
      }).then((confirmed: boolean) => {
        if (confirmed) {
          this.selectLevel(nextLevel)
        }
      })
    }
  }

  getSnapshot(): LevelSnapshot {
    return {
      currentLevel: this.currentLevel,
      maxLevelReached: this.maxLevelReached,
    }
  }

  loadSnapshot(snapshot: { level: LevelSnapshot }) {
    const validated = levelSnapshotSchema.parse(snapshot.level)
    this.currentLevel = validated.currentLevel
    this.maxLevelReached = validated.maxLevelReached
  }

  reset() {
    this.currentLevel = 0
    this.maxLevelReached = 0
  }
}
