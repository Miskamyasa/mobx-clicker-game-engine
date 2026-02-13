import type { RootStore } from "./RootStore"
import type { AchievementsSnapshot, FlatGainsMap, MultipliersMap, Resource, Resources } from "./shared"

import { makeAutoObservable } from "mobx"
import { z } from "zod"
import {

  achievementsSnapshotSchema,
  bonusSchema,
  createFlatGainsMap,
  createMultipliersMap,

  nonNegativeIntegerSchema,
  nonNegativeNumberSchema,

  resourceRateSchema,

  resourceSchema,
} from "./shared"

export const achievementConditionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("resourceTotal"),
    resource: resourceSchema,
    amount: nonNegativeIntegerSchema,
  }),
  z.object({
    type: z.literal("levelUnlocked"),
    level: nonNegativeIntegerSchema,
  }),
  z.object({
    type: z.literal("operationsCompleted"),
    count: nonNegativeIntegerSchema,
  }),
  z.object({
    type: z.literal("operationLevel"),
    operationId: z.string(),
    level: nonNegativeIntegerSchema,
  }),
  z.object({
    type: z.literal("workerCount"),
    count: nonNegativeIntegerSchema,
  }),
  z.object({
    type: z.literal("resourceRate"),
    resource: resourceRateSchema,
    rate: nonNegativeNumberSchema,
  }),
  z.object({
    type: z.literal("prestigeCount"),
    count: nonNegativeIntegerSchema,
  }),
  z.object({
    type: z.literal("playTime"),
    seconds: nonNegativeIntegerSchema,
  }),
]).readonly()

export type AchievementCondition = z.infer<typeof achievementConditionSchema>

const categoriesSchema = z.enum([
  // Any game aspect, so no specific category
  "general",
  // Operations advancement
  "operations",
  // Clicks
  "collection",
  // Workers hiring and resource production
  "production",
  // Prestige and rebirth mechanics
  "prestige",
]).readonly()

export const achievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  category: categoriesSchema,
  // Condition required to unlock the achievement
  condition: achievementConditionSchema,
  // Permanent reward granted upon unlocking the achievement
  reward: bonusSchema.optional(),
  // Hides the achievement from the list until it's unlocked
  hidden: z.boolean().optional(),
}).readonly()

export type Achievement = z.infer<typeof achievementSchema>

export class AchievementsStore {
  constructor(private root: RootStore) {
    makeAutoObservable(this)
    this.loadAchievements()
  }

  state: "pending" | "ready" | "error" = "pending"

  achievements: Achievement[] = []

  get mappedAchievements(): Map<string, Achievement> {
    return new Map(this.achievements.map(a => [a.id, a]))
  }

  * loadAchievements() {
    try {
      const dataSource = this.root.dataSource
      if (!dataSource) {
        throw new Error("RootStore dataSource is required to load achievements.")
      }
      const response: unknown = yield dataSource.fetchAchievements()
      this.achievements = z.array(achievementSchema).parse(response)
      this.state = "ready"
    }
    catch (e) {
      console.error("Failed to load achievements:", e)
      this.state = "error"
    }
  }

  totalResources: Resources = {
    energy: 0,
    output: 0,
    reputation: 0,
    money: 0,
  }

  addResourceTotals(key: Resource, amount: number) {
    this.totalResources[key] += nonNegativeIntegerSchema.parse(amount)
    this.root.sync.markDirty("achievements")
  }

  totalWorkers = 0

  addWorkers(count: number) {
    this.totalWorkers += nonNegativeIntegerSchema.parse(count)
    this.root.sync.markDirty("achievements")
  }

  totalArticlesOpened = 0

  addArticlesOpened() {
    this.totalArticlesOpened += 1
    this.root.sync.markDirty("achievements")
  }

  maxLevelReached = 0

  levelReached(level: number) {
    if (level > this.maxLevelReached) {
      this.maxLevelReached = level
      this.root.sync.markDirty("achievements")
    }
  }

  operationsCompleted = 0

  completeOperation() {
    this.operationsCompleted += 1
    this.root.sync.markDirty("achievements")
  }

  unlockedAchievements = new Set<string>()

  unlockAchievement(achievement: Achievement) {
    if (!this.unlockedAchievements.has(achievement.id)) {
      this.unlockedAchievements.add(achievement.id)
      this.root.sync.markDirty("achievements")
      this.root.toast.showAchievementToast(achievement)
    }
  }

  get multipliers(): MultipliersMap {
    const map = createMultipliersMap(1.0)
    for (const id of this.unlockedAchievements) {
      const achievement = this.mappedAchievements.get(id)
      if (!achievement || !achievement.reward) {
        continue
      }
      if (achievement.reward.type === "multiplier") {
        map.set(achievement.reward.target, map.get(achievement.reward.target)! * achievement.reward.value)
      }
    }
    return map
  }

  get flatGains(): FlatGainsMap {
    const map = createFlatGainsMap(0)
    for (const id of this.unlockedAchievements) {
      const achievement = this.mappedAchievements.get(id)
      if (!achievement || !achievement.reward) {
        continue
      }
      if (achievement.reward.type === "flat") {
        map.set(achievement.reward.target, map.get(achievement.reward.target)! + achievement.reward.value)
      }
    }
    return map
  }

  checkAchievement(condition: AchievementCondition): boolean {
    switch (condition.type) {
      case "resourceTotal":
        return condition.amount <= this.totalResources[condition.resource]
      case "levelUnlocked":
        return condition.level <= this.maxLevelReached
      case "operationsCompleted":
        return condition.count <= this.operationsCompleted
      case "operationLevel":
        return condition.level <= (this.root.operations.operationsFinished[condition.operationId] ?? 0)
      case "workerCount":
        return condition.count <= this.totalWorkers
      case "resourceRate": {
        let rate = 0
        switch (condition.resource) {
          case "energy":
            rate = this.root.resources.energyPerRound
            break
          case "money":
            rate = this.root.resources.moneyPerRound
            break
        }
        return condition.rate <= rate
      }
      case "prestigeCount":
        return condition.count <= this.root.prestige.prestigeCount
      case "playTime":
        return condition.seconds <= this.root.prestige.totalPlaytimeSeconds
    }
  }

  round() {
    for (const achievement of this.achievements) {
      if (this.unlockedAchievements.has(achievement.id)) {
        continue
      }
      if (this.checkAchievement(achievement.condition)) {
        this.unlockAchievement(achievement)
      }
    }
  }

  getSnapshot(): AchievementsSnapshot {
    return {
      totalResources: this.totalResources,
      totalWorkers: this.totalWorkers,
      totalArticlesOpened: this.totalArticlesOpened,
      maxLevelReached: this.maxLevelReached,
      operationsCompleted: this.operationsCompleted,
      unlockedAchievements: Array.from(this.unlockedAchievements),
    }
  }

  loadSnapshot(snapshot: { achievements: AchievementsSnapshot }) {
    const validated = achievementsSnapshotSchema.parse(snapshot.achievements)
    this.totalResources = validated.totalResources
    this.totalWorkers = validated.totalWorkers
    this.totalArticlesOpened = validated.totalArticlesOpened
    this.maxLevelReached = validated.maxLevelReached
    this.operationsCompleted = validated.operationsCompleted
    this.unlockedAchievements = new Set(validated.unlockedAchievements)
  }

  reset() {
    this.totalResources = {
      energy: 0,
      output: 0,
      reputation: 0,
      money: 0,
    }
    this.totalWorkers = 0
    this.totalArticlesOpened = 0
    this.maxLevelReached = 0
    this.operationsCompleted = 0
    this.unlockedAchievements = new Set()
  }
}
