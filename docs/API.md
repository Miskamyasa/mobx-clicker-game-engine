# API Reference

Store architecture, methods, properties, and types for the MobX Clicker Game Engine.

> For setup instructions see [Quickstart](./quickstart.md).
> For JSON schemas see [Data Contracts](./data-contracts.md).

## Core Concepts

### Architecture

The engine consists of interconnected MobX stores:

```
RootStore
├── GameStore         - game loop, click action
├── ResourcesStore    - energy, output, reputation, money
├── WorkersStore      - hiring, passive production  
├── OperationsStore   - conduct/claim, cooldowns
├── UpgradesStore     - purchase upgrades, multipliers
├── LevelStore        - progression, unlocking
├── AchievementsStore - unlock conditions, rewards
├── PrestigeStore     - BP calculation, reset mechanics
├── CodexStore        - article unlocking
├── SyncStore         - save/load, localStorage
├── ConfigStore       - game constants
├── ToastStore        - notifications
└── ConfirmationStore - modal dialogs
```

### Resource Flow

```
Workers → Energy → Click → Output → Operations → Reputation → Money → Workers
```

- **Energy**: Consumed by clicks, produced by workers
- **Output**: Gained from clicks, spent on operations
- **Reputation**: Earned from operations, generates money over time
- **Money**: Used for workers and upgrades

### Game Loop

- Runs in 1-second intervals when `game.start()` is called
- Each round: workers produce resources, reputation generates money
- Auto-saves every 5 seconds (configurable)
- Handles offline progress calculation

### Data URLs Contract

Your `dataUrls` object must contain exactly these keys:
- `workers`: Team members that generate resources
- `levels`: Progression zones with unlock requirements
- `operations`: Actions that consume resources and grant rewards
- `upgrades`: Permanent improvements with multiplier effects
- `achievements`: Milestone rewards with unlock conditions
- `articles`: Lore content unlocked through operations
- `prestigeUpgrades`: Meta-progression purchased with prestige points

## Entry Point

#### `createEngine(options: RootStoreOptions): RootStore`

Creates and initializes the game engine.

**Parameters:**
- `options.dataUrls`: Object mapping required data URLs

**Returns:** `RootStore` instance with all child stores

## RootStore

The main container for all game stores.

### Properties

- `dataReady: boolean` - True when all JSON data has loaded successfully
- `options: RootStoreOptions` - Configuration passed to `createEngine()`
- `dataSource: EngineDataSource` - Handles fetching JSON data

All child stores are accessible as properties:
- `game`, `resources`, `workers`, `operations`, `upgrades`, `level`
- `achievements`, `prestige`, `codex`, `sync`, `config`, `toast`, `confirmation`

## GameStore

Controls the main game loop and core click action.

### Methods

##### `start(): void`
Starts the game loop (1-second intervals).

##### `stop(): void` 
Stops the game loop and saves progress.

##### `reset(): void`
Stops the game and resets all progress.

##### `click(): void`
Executes the main click action: spend energy to gain output.

### Properties

- `running: boolean` - Whether game loop is active
- `energyCost: number` - Energy cost for next click
- `outputGain: number` - Output gained from next click

## ResourcesStore

Manages the four core resources and their production rates.

### Methods

##### `addResource(resource: Resource, amount: number): void`
Adds resources safely (validates non-negative).

##### `spendResource(resource: Resource, amount: number): boolean`
Attempts to spend resources. Returns `true` if successful.

##### `spendResourcesByCost(cost: Partial<Resources>, multiplier: number): boolean`
Spends multiple resources atomically. Returns `true` if all costs were paid.

### Properties

- `energy: number` - Current energy amount
- `output: number` - Current output amount
- `reputation: number` - Current reputation amount
- `money: number` - Current money amount
- `energyPerRound: number` - Energy produced each game round
- `outputPerRound: number` - Output produced each game round
- `moneyPerRound: number` - Money produced each game round

## WorkersStore

Handles hiring workers and calculating production bonuses.

### Methods

##### `hireWorker(worker: Worker): void`
Hires a worker if you have enough money. Throws error if insufficient funds.

##### `calculateWorkerCost(worker: Worker, currentCount?: number): number`
Calculates the cost to hire the next worker of this type.

### Properties

- `workers: Worker[]` - All available worker definitions (from JSON)
- `hiredWorkers: Record<string, number>` - Count of each worker type hired
- `unlockedWorkers: Worker[]` - Workers that meet unlock conditions
- `totalWorkers: number` - Total count of all hired workers
- `totalEnergyProduction: number` - Energy multiplier from all workers
- `totalOutputProduction: number` - Output multiplier from all workers

## OperationsStore

Manages operations (research actions) with duration and cooldown mechanics.

### Methods

##### `conductOperation(operation: Operation): number`
Starts an operation if you can afford it. Returns duration in seconds for animations.

##### `claimOperation(operation: Operation): void`
Claims rewards from a completed operation.

##### `actOnOperation(operation: Operation): number | undefined`
Combined method: conducts if idle, claims if ready. Returns duration or 0.

##### `canAffordOperation(operation: Operation): boolean`
Checks if you have enough resources to start an operation.

### Properties

- `operations: Operation[]` - All available operations (from JSON)
- `availableOperations: Operation[]` - Operations available at current level
- `operationsFinished: Record<string, number>` - Completion count per operation
- `totalOperationsCompleted: number` - Total operations completed this run
- `operationsInProgress: Set<string>` - Operations currently running
- `operationsClaimable: Set<string>` - Operations ready to claim
- `operationsInCooldown: Set<string>` - Operations in cooldown period

## UpgradesStore

Handles purchasing permanent upgrades that provide multiplier bonuses.

### Methods

##### `purchaseUpgrade(upgrade: Upgrade): void`
Purchases the next level of an upgrade. Throws error if can't afford or maxed out.

##### `canPurchaseUpgrade(upgrade: Upgrade): boolean`
Checks if upgrade can be purchased (affordable, unlocked, not maxed).

### Properties

- `upgrades: Upgrade[]` - All available upgrades (from JSON)
- `unlockedUpgrades: Record<string, number>` - Current level of each upgrade
- `visibleUpgrades: Upgrade[]` - Upgrades that should show in UI
- `multipliers: MultipliersMap` - Combined multiplier effects from all upgrades

## LevelStore

Manages progression through different game levels/zones.

### Methods

##### `selectLevel(levelIndex: number): void`
Changes to a different unlocked level. Throws error if level not unlocked.

### Properties

- `levels: Level[]` - All level definitions (from JSON)
- `unlockedLevels: Level[]` - Levels that meet unlock conditions
- `currentLevel: number` - Index of currently selected level
- `maxLevelReached: number` - Highest level ever unlocked
- `currentLevelConfig: Level` - Configuration for current level

## AchievementsStore

Tracks achievement unlock conditions and provides rewards.

### Properties

- `achievements: Achievement[]` - All achievement definitions (from JSON)
- `unlockedAchievements: Set<string>` - Achievement IDs that have been earned
- `multipliers: MultipliersMap` - Multiplier bonuses from unlocked achievements
- Stats tracking properties: `totalResources`, `totalWorkers`, `operationsCompleted`, etc.

## PrestigeStore

Handles meta-progression through prestige resets.

### Methods

##### `executePrestige(): void`
Performs prestige reset: awards points, resets progress, applies bonuses.

##### `purchaseUpgrade(upgradeId: string): void`
Purchases a prestige upgrade with breakthrough points.

##### `calculatePotentialBP(): number`
Calculates breakthrough points that would be earned from prestiging now.

##### `canPrestige(): boolean`
Returns true if you meet the minimum requirements to prestige.

### Properties

- `upgrades: PrestigeUpgrade[]` - Available prestige upgrades (from JSON)
- `points: number` - Spendable breakthrough points
- `lifetimePoints: number` - Total BP ever earned
- `prestigeCount: number` - Number of prestiges completed
- `purchasedUpgrades: Record<string, number>` - Levels of owned prestige upgrades

## CodexStore

Manages unlockable lore articles.

### Methods

##### `unlockArticle(articleId: string): void`
Unlocks an article and shows a toast notification.

### Properties

- `articles: Article[]` - All article definitions (from JSON)
- `unlockedArticles: Set<string>` - Article IDs that have been unlocked

## SyncStore

Handles save/load operations with localStorage.

### Methods

##### `save(): Promise<void>`
Saves current game state to localStorage (generator function, use with `flowResult`).

##### `load(): Promise<number | undefined>`
Loads game state from localStorage. Returns save timestamp or undefined.

##### `reset(): void`
Resets all stores to initial state and clears localStorage.

### Properties

- `state: "idle" | "saving" | "loading" | "error"` - Current operation state
- `isDirty: boolean` - Whether unsaved changes exist
- `lastSave: number` - Timestamp of last successful save

## ToastStore

Shows temporary notification messages.

### Methods

##### `showToast(options: Omit<ToastMessage, "id">): void`
Displays a toast notification with auto-dismiss.

##### `dismissToast(id: number): void`
Manually dismisses a specific toast.

##### `showAchievementToast(achievement: Achievement): void`
Convenience method for achievement notifications.

##### `showArticleToast(article: Article): void`
Convenience method for article unlock notifications.

### Properties

- `toasts: Map<number, ToastMessage>` - Currently displayed toasts

## ConfirmationStore

Handles modal confirmation dialogs.

### Methods

##### `ask(options: ConfirmationOptions): Promise<boolean>`
Shows a confirmation dialog and returns user's choice.

##### `resolve(confirmed: boolean): void`
Resolves the current confirmation dialog.

### Properties

- `currentConfirmation: ConfirmationRequest | null` - Active confirmation dialog

## Types & Constants

### Resource Constants
```typescript
const RESOURCES = ["energy", "output", "reputation", "money"] as const
type Resource = typeof RESOURCES[number]
```

### Rarity Enum
```typescript  
const RARITY = ["common", "uncommon", "rare", "epic", "legendary"] as const
type Rarity = typeof RARITY[number]
```

### Multiplier Types
```typescript
type GainMultiplier = 
  | "energyGain" 
  | "outputGain"
  | "operationCostReduction"
  | "reputationGain" 
  | "moneyGain"
  | "workersEfficiency"
  | "operationDurationReduction"
  | "offlineEfficiency"
  | "workerCostReduction"
```

## Advanced Topics

### Save Data Structure

The engine saves data in this format:

```typescript
interface GameSaveSnapshot {
  version: string
  timestamp: number
  resources: {
    energy: number
    output: number  
    reputation: number
    money: number
  }
  workers: {
    hiredWorkers: Record<string, number>
  }
  operations: {
    operationsFinished: Record<string, number>
    operationsProgress: Record<string, {claimableAt: number, cooldownTill: number}>
    activeBonuses: Array<{bonus: Bonus, expiresAt: number}>
  }
  // ... other store snapshots
}
```

### Offline Progress

The engine automatically calculates offline progress when loading saves:

- Compares `timestamp` in save data to current time
- Simulates resource production for elapsed time (capped at 8 hours)
- Applies 50% efficiency multiplier to offline gains
- Does not progress operations or other active mechanics

### Extending Stores

You can extend the engine by wrapping stores:

```typescript
import { createEngine } from "@miskamyasa/mobx-clicker-game-engine"

class ExtendedGameStore {
  constructor(private baseStore: GameStore) {
    makeObservable(this)
  }
  
  superClick() {
    for (let i = 0; i < 10; i++) {
      this.baseStore.click()
    }
  }
  
  get running() { return this.baseStore.running }
  start() { this.baseStore.start() }
}

const baseEngine = createEngine(options)
const engine = {
  ...baseEngine,
  game: new ExtendedGameStore(baseEngine.game)
}
```

### Configuration Overrides

Modify game balance by accessing `ConfigStore`:

```typescript
engine.config.baseEnergyCost = 10        // Higher click costs
engine.config.localSaveInterval = 10000  // Save every 10 seconds
engine.config.operationScaleFactor.rare = 2.0  // More expensive rare operations
```
