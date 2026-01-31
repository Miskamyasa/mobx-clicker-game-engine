import {z} from "zod"


export const nonNegativeIntegerSchema = z.int().nonnegative()
export const nonNegativeNumberSchema = z.number().nonnegative()

export const stringsArraySchema = z.array(z.string())

export const RARITY = ["common", "uncommon", "rare", "epic", "legendary"] as const
export const raritySchema = z.enum(RARITY)

export type Rarity = z.infer<typeof raritySchema>;

export const RESOURCES = ["energy", "output", "reputation", "money"] as const
export const resourceSchema = z.enum(RESOURCES)

export type Resource = z.infer<typeof resourceSchema>

export const resourcesSchema = z.object({
    energy: nonNegativeIntegerSchema,
    output: nonNegativeIntegerSchema,
    reputation: nonNegativeIntegerSchema,
    money: nonNegativeIntegerSchema,
})

export type Resources = z.infer<typeof resourcesSchema>;

export const resourceRateSchema = resourceSchema.extract(["energy", "money"])

export const gainMultipliers = [
    "energyGain",
    "outputGain",
    "operationCostReduction", // e.g., 1.2 means a 20% reduction
    "reputationGain",
    "moneyGain",
    "workersEfficiency",
    "operationDurationReduction", // e.g., 1.2 means a 20% reduction
    "offlineEfficiency",
    "workerCostReduction",      // Reduces worker hire costs
] as const

export type GainMultiplier = typeof gainMultipliers[number];

export type MultipliersMap = Map<GainMultiplier, number>;

export function createMultipliersMap(initialValue: number): MultipliersMap {
    const map: MultipliersMap = new Map()
    for (const key of gainMultipliers) {
        map.set(key, initialValue)
    }
    return map
}

export const flatGains = [
    "prestigeBonus",
] as const

export type FlatGain = typeof flatGains[number];

export type FlatGainsMap = Map<FlatGain, number>;

export function createFlatGainsMap(initialValue: number): FlatGainsMap {
    const map: FlatGainsMap = new Map()
    for (const key of flatGains) {
        map.set(key, initialValue)
    }
    return map
}

export const multipliersSchema = z.object({
    type: z.literal("multiplier"),
    target: z.enum(gainMultipliers),
    value: nonNegativeNumberSchema,
    id: z.string().optional(),
    duration: nonNegativeIntegerSchema.optional(),
})

const flatGainsSchema = z.object({
    type: z.literal("flat"),
    target: z.enum(flatGains),
    value: nonNegativeIntegerSchema,
    duration: nonNegativeIntegerSchema.optional(),
})

export const bonusSchema = z.discriminatedUnion("type", [
    multipliersSchema,
    flatGainsSchema,
])

export const workersSnapshotSchema = z.object({
    hiredWorkers: z.record(z.string(), nonNegativeIntegerSchema),
})

export type WorkersSnapshot = z.infer<typeof workersSnapshotSchema>;

export const operationIdSchema = z.string()

const operationsProgressSchema = z.record(operationIdSchema, z.object({
    claimableAt: z.number(),
    cooldownTill: z.number(),
}))

export type OperationsProgress = z.infer<typeof operationsProgressSchema>;

const activeBonusSchema = z.object({
    bonus: bonusSchema,
    expiresAt: z.number(),
})

export type ActiveBonus = z.infer<typeof activeBonusSchema>;

export const operationsSnapshotSchema = z.object({
    operationsFinished: z.record(z.string(), nonNegativeIntegerSchema),
    activeBonuses: z.array(activeBonusSchema),
    operationsProgress: operationsProgressSchema,
})

export type OperationsSnapshot = z.infer<typeof operationsSnapshotSchema>;

export const codexSnapshotSchema = z.object({
    unlockedArticles: stringsArraySchema,
})

export type CodexSnapshot = z.infer<typeof codexSnapshotSchema>;

export const levelSnapshotSchema = z.object({
    currentLevel: nonNegativeIntegerSchema,
    maxLevelReached: nonNegativeIntegerSchema,
})

export type LevelSnapshot = z.infer<typeof levelSnapshotSchema>;

export const upgradesSnapshotSchema = z.object({
    unlockedUpgrades: z.record(z.string(), nonNegativeIntegerSchema),
})

export type UpgradesSnapshot = z.infer<typeof upgradesSnapshotSchema>;

export const achievementsSnapshotSchema = z.object({
    totalResources: z.record(resourceSchema, nonNegativeIntegerSchema),
    totalWorkers: nonNegativeIntegerSchema,
    totalArticlesOpened: nonNegativeIntegerSchema,
    maxLevelReached: nonNegativeIntegerSchema,
    operationsCompleted: nonNegativeIntegerSchema,
    unlockedAchievements: stringsArraySchema,
})

export type AchievementsSnapshot = z.infer<typeof achievementsSnapshotSchema>;

export const prestigeSnapshotSchema = z.object({
    points: nonNegativeIntegerSchema,
    lifetimePoints: nonNegativeIntegerSchema,
    prestigeCount: nonNegativeIntegerSchema,
    currentRunSeconds: nonNegativeIntegerSchema,
    totalPlaytimeSeconds: nonNegativeIntegerSchema,
    purchasedUpgrades: z.record(z.string(), nonNegativeIntegerSchema),
    stats: z.object({
        firstPrestigeAt: z.number().nullable(),
        fastestRunSeconds: z.number().nullable(),
        highestOperationsBeforePrestige: nonNegativeIntegerSchema,
    }),
})

export type PrestigeSnapshot = z.infer<typeof prestigeSnapshotSchema>;

export const STORES_TO_SYNC = [
    "resources",
    "workers",
    "operations",
    "codex",
    "level",
    "achievements",
    "upgrades",
    "prestige",
] as const

export const gameSaveSchema = z.object({
    version: z.string(),
    timestamp: z.number(),
    resources: resourcesSchema,
    workers: workersSnapshotSchema,
    operations: operationsSnapshotSchema,
    codex: codexSnapshotSchema,
    level: levelSnapshotSchema,
    achievements: achievementsSnapshotSchema,
    upgrades: upgradesSnapshotSchema,
    prestige: prestigeSnapshotSchema,
})

export type GameSaveSnapshot = z.infer<typeof gameSaveSchema>;
