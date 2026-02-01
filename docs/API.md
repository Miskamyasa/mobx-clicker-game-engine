# MobX Clicker Game Engine - API Documentation

A data-driven clicker game engine built on MobX stores. You provide the UI (React/Vue/etc.) and JSON game content - the engine handles state management, progression, and persistence.

## Table of Contents

- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Data Contracts](#data-contracts)
- [React Integration](#react-integration)
- [Advanced Topics](#advanced-topics)

## Getting Started

### Installation

```bash
npm install @miskamyasa/mobx-clicker-game-engine mobx-react-lite mobx
```

### Quick Start with React

1. **Create your data files** in `public/settings/my-theme/`:
   - `workers.json`
   - `levels.json` 
   - `operations.json`
   - `upgrades.json`
   - `achievements.json`
   - `articles.json`
   - `prestige-upgrades.json`

2. **Initialize the engine:**

```typescript
// engine.ts
import { createEngine } from "@miskamyasa/mobx-clicker-game-engine"

const theme = "my-theme"

export const engine = createEngine({
  dataUrls: {
    workers: `/settings/${theme}/workers.json`,
    levels: `/settings/${theme}/levels.json`,
    operations: `/settings/${theme}/operations.json`,
    upgrades: `/settings/${theme}/upgrades.json`,
    achievements: `/settings/${theme}/achievements.json`,
    articles: `/settings/${theme}/articles.json`,
    prestigeUpgrades: `/settings/${theme}/prestige-upgrades.json`,
  }
})
```

3. **Create a basic React component:**

```typescript
import { observer } from "mobx-react-lite"
import { engine } from "./engine"

const GameComponent = observer(() => {
  if (!engine.dataReady) {
    return <div>Loading game data...</div>
  }

  const { resources, game } = engine

  return (
    <div>
      <div>Energy: {resources.energy}</div>
      <div>Output: {resources.output}</div>
      <button onClick={() => game.click()}>
        Collect ({game.energyCost} energy → {game.outputGain} output)
      </button>
    </div>
  )
})
```

4. **Start the game:**

```typescript
// In your app initialization
useEffect(() => {
  engine.game.start()
  return () => engine.game.stop()
}, [])
```

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

The core game loop follows this progression:

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

## API Reference

### Entry Point

#### `createEngine(options: RootStoreOptions): RootStore`

Creates and initializes the game engine.

**Parameters:**
- `options.dataUrls`: Object mapping required data URLs

**Returns:** `RootStore` instance with all child stores

**Example:**
```typescript
const engine = createEngine({
  dataUrls: {
    workers: "/data/workers.json",
    levels: "/data/levels.json",
    operations: "/data/operations.json",
    upgrades: "/data/upgrades.json", 
    achievements: "/data/achievements.json",
    articles: "/data/articles.json",
    prestigeUpgrades: "/data/prestige-upgrades.json"
  }
})
```

### RootStore

The main container for all game stores.

#### Properties

- `dataReady: boolean` - True when all JSON data has loaded successfully
- `options: RootStoreOptions` - Configuration passed to `createEngine()`
- `dataSource: EngineDataSource` - Handles fetching JSON data

All child stores are accessible as properties:
- `game`, `resources`, `workers`, `operations`, `upgrades`, `level`
- `achievements`, `prestige`, `codex`, `sync`, `config`, `toast`, `confirmation`

**React Example:**
```typescript
const GameStatus = observer(() => {
  const { dataReady, resources, game } = engine
  
  if (!dataReady) return <div>Loading...</div>
  
  return (
    <div>
      <div>Game Running: {game.running ? "Yes" : "No"}</div>
      <div>Resources: {JSON.stringify(resources.getSnapshot())}</div>
    </div>
  )
})
```

### GameStore

Controls the main game loop and core click action.

#### Methods

##### `start(): void`
Starts the game loop (1-second intervals).

##### `stop(): void` 
Stops the game loop and saves progress.

##### `reset(): void`
Stops the game and resets all progress.

##### `click(): void`
Executes the main click action: spend energy to gain output.

#### Properties

- `running: boolean` - Whether game loop is active
- `energyCost: number` - Energy cost for next click
- `outputGain: number` - Output gained from next click

**React Example:**
```typescript
const ClickButton = observer(() => {
  const { game, resources } = engine
  
  const canClick = resources.energy >= game.energyCost
  
  return (
    <button 
      onClick={() => game.click()}
      disabled={!canClick}
      className={canClick ? "clickable" : "disabled"}
    >
      Collect ({game.energyCost} energy → {game.outputGain} output)
    </button>
  )
})
```

### ResourcesStore

Manages the four core resources and their production rates.

#### Methods

##### `addResource(resource: Resource, amount: number): void`
Adds resources safely (validates non-negative).

##### `spendResource(resource: Resource, amount: number): boolean`
Attempts to spend resources. Returns `true` if successful.

##### `spendResourcesByCost(cost: Partial<Resources>, multiplier: number): boolean`
Spends multiple resources atomically. Returns `true` if all costs were paid.

#### Properties

- `energy: number` - Current energy amount
- `output: number` - Current output amount  
- `reputation: number` - Current reputation amount
- `money: number` - Current money amount
- `energyPerRound: number` - Energy produced each game round
- `outputPerRound: number` - Output produced each game round
- `moneyPerRound: number` - Money produced each game round

**React Example:**
```typescript
const ResourceDisplay = observer(() => {
  const { resources } = engine
  
  return (
    <div className="resources">
      <div>Energy: {resources.energy} (+{resources.energyPerRound}/s)</div>
      <div>Output: {resources.output} (+{resources.outputPerRound}/s)</div>
      <div>Reputation: {resources.reputation}</div>
      <div>Money: {resources.money} (+{resources.moneyPerRound}/s)</div>
    </div>
  )
})
```

### WorkersStore

Handles hiring workers and calculating production bonuses.

#### Methods

##### `hireWorker(worker: Worker): void`
Hires a worker if you have enough money. Throws error if insufficient funds.

##### `calculateWorkerCost(worker: Worker, currentCount?: number): number`
Calculates the cost to hire the next worker of this type.

#### Properties

- `workers: Worker[]` - All available worker definitions (from JSON)
- `hiredWorkers: Record<string, number>` - Count of each worker type hired
- `unlockedWorkers: Worker[]` - Workers that meet unlock conditions
- `totalWorkers: number` - Total count of all hired workers
- `totalEnergyProduction: number` - Energy multiplier from all workers
- `totalOutputProduction: number` - Output multiplier from all workers

**React Example:**
```typescript
const WorkersPanel = observer(() => {
  const { workers, resources } = engine
  
  return (
    <div className="workers-panel">
      {workers.unlockedWorkers.map(worker => {
        const cost = workers.calculateWorkerCost(worker)
        const canAfford = resources.money >= cost
        const hiredCount = workers.hiredWorkers[worker.id] || 0
        
        return (
          <div key={worker.id} className="worker-card">
            <h3>{worker.name}</h3>
            <p>{worker.description}</p>
            <div>Owned: {hiredCount}</div>
            <div>Cost: {cost} money</div>
            <button 
              onClick={() => workers.hireWorker(worker)}
              disabled={!canAfford}
            >
              Hire
            </button>
          </div>
        )
      })}
    </div>
  )
})
```

### OperationsStore

Manages operations (research actions) with duration and cooldown mechanics.

#### Methods

##### `conductOperation(operation: Operation): number`
Starts an operation if you can afford it. Returns duration in seconds for animations.

##### `claimOperation(operation: Operation): void`
Claims rewards from a completed operation.

##### `actOnOperation(operation: Operation): number | undefined`
Combined method: conducts if idle, claims if ready. Returns duration or 0.

##### `canAffordOperation(operation: Operation): boolean`
Checks if you have enough resources to start an operation.

#### Properties

- `operations: Operation[]` - All available operations (from JSON)
- `availableOperations: Operation[]` - Operations available at current level
- `operationsFinished: Record<string, number>` - Completion count per operation
- `totalOperationsCompleted: number` - Total operations completed this run
- `operationsInProgress: Set<string>` - Operations currently running
- `operationsClaimable: Set<string>` - Operations ready to claim
- `operationsInCooldown: Set<string>` - Operations in cooldown period

**React Example:**
```typescript
const OperationsPanel = observer(() => {
  const { operations } = engine
  
  return (
    <div className="operations-panel">
      {operations.availableOperations.map(operation => {
        const inProgress = operations.operationsInProgress.has(operation.id)
        const claimable = operations.operationsClaimable.has(operation.id) 
        const inCooldown = operations.operationsInCooldown.has(operation.id)
        const canAfford = operations.canAffordOperation(operation)
        
        let buttonText = "Start"
        if (inProgress) buttonText = "In Progress..."
        if (claimable) buttonText = "Claim Rewards"
        if (inCooldown) buttonText = "Cooldown..."
        
        return (
          <div key={operation.id} className="operation-card">
            <h3>{operation.name}</h3>
            <p>{operation.description}</p>
            <div>Completed: {operations.operationsFinished[operation.id] || 0}</div>
            <button 
              onClick={() => operations.actOnOperation(operation)}
              disabled={!canAfford && !claimable}
            >
              {buttonText}
            </button>
          </div>
        )
      })}
    </div>
  )
})
```

### UpgradesStore

Handles purchasing permanent upgrades that provide multiplier bonuses.

#### Methods

##### `purchaseUpgrade(upgrade: Upgrade): void`
Purchases the next level of an upgrade. Throws error if can't afford or maxed out.

##### `canPurchaseUpgrade(upgrade: Upgrade): boolean`
Checks if upgrade can be purchased (affordable, unlocked, not maxed).

#### Properties

- `upgrades: Upgrade[]` - All available upgrades (from JSON)
- `unlockedUpgrades: Record<string, number>` - Current level of each upgrade
- `visibleUpgrades: Upgrade[]` - Upgrades that should show in UI
- `multipliers: MultipliersMap` - Combined multiplier effects from all upgrades

**React Example:**
```typescript
const UpgradesPanel = observer(() => {
  const { upgrades, resources } = engine
  
  return (
    <div className="upgrades-panel">
      {upgrades.visibleUpgrades.map(upgrade => {
        const currentLevel = upgrades.unlockedUpgrades[upgrade.id] || 0
        const canPurchase = upgrades.canPurchaseUpgrade(upgrade)
        const levelCostMultiplier = Math.pow(upgrade.costMultiplier, currentLevel)
        
        return (
          <div key={upgrade.id} className="upgrade-card">
            <h3>{upgrade.name}</h3>
            <p>{upgrade.description}</p>
            <div>Level: {currentLevel} / {upgrade.maxLevel}</div>
            <div>Cost: {Object.entries(upgrade.cost).map(([resource, amount]) => 
              `${Math.ceil(amount * levelCostMultiplier)} ${resource}`
            ).join(", ")}</div>
            <button 
              onClick={() => upgrades.purchaseUpgrade(upgrade)}
              disabled={!canPurchase}
            >
              Purchase
            </button>
          </div>
        )
      })}
    </div>
  )
})
```

### LevelStore

Manages progression through different game levels/zones.

#### Methods

##### `selectLevel(levelIndex: number): void`
Changes to a different unlocked level. Throws error if level not unlocked.

#### Properties

- `levels: Level[]` - All level definitions (from JSON)
- `unlockedLevels: Level[]` - Levels that meet unlock conditions
- `currentLevel: number` - Index of currently selected level
- `maxLevelReached: number` - Highest level ever unlocked
- `currentLevelConfig: Level` - Configuration for current level

**React Example:**
```typescript
const LevelSelector = observer(() => {
  const { level } = engine
  
  return (
    <div className="level-selector">
      <h3>Current: {level.currentLevelConfig?.name}</h3>
      <div className="level-buttons">
        {level.unlockedLevels.map((levelConfig, index) => (
          <button
            key={levelConfig.id}
            onClick={() => level.selectLevel(index)}
            className={level.currentLevel === index ? "active" : ""}
          >
            {levelConfig.name}
          </button>
        ))}
      </div>
    </div>
  )
})
```

### AchievementsStore

Tracks achievement unlock conditions and provides rewards.

#### Properties

- `achievements: Achievement[]` - All achievement definitions (from JSON)
- `unlockedAchievements: Set<string>` - Achievement IDs that have been earned
- `multipliers: MultipliersMap` - Multiplier bonuses from unlocked achievements
- Stats tracking properties: `totalResources`, `totalWorkers`, `operationsCompleted`, etc.

**React Example:**
```typescript
const AchievementsPanel = observer(() => {
  const { achievements } = engine
  
  const visibleAchievements = achievements.achievements.filter(
    achievement => !achievement.hidden || achievements.unlockedAchievements.has(achievement.id)
  )
  
  return (
    <div className="achievements-panel">
      {visibleAchievements.map(achievement => {
        const isUnlocked = achievements.unlockedAchievements.has(achievement.id)
        const meetsCondition = achievements.checkAchievement(achievement.condition)
        
        return (
          <div 
            key={achievement.id} 
            className={`achievement ${isUnlocked ? "unlocked" : ""}`}
          >
            <div className="achievement-icon">{achievement.icon}</div>
            <div>
              <h4>{achievement.name}</h4>
              <p>{achievement.description}</p>
              {isUnlocked && <span className="reward">✓ Unlocked</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
})
```

### PrestigeStore

Handles meta-progression through prestige resets.

#### Methods

##### `executePrestige(): void`
Performs prestige reset: awards points, resets progress, applies bonuses.

##### `purchaseUpgrade(upgradeId: string): void`
Purchases a prestige upgrade with breakthrough points.

##### `calculatePotentialBP(): number`
Calculates breakthrough points that would be earned from prestiging now.

##### `canPrestige(): boolean`
Returns true if you meet the minimum requirements to prestige.

#### Properties

- `upgrades: PrestigeUpgrade[]` - Available prestige upgrades (from JSON)
- `points: number` - Spendable breakthrough points
- `lifetimePoints: number` - Total BP ever earned
- `prestigeCount: number` - Number of prestiges completed
- `purchasedUpgrades: Record<string, number>` - Levels of owned prestige upgrades

**React Example:**
```typescript
const PrestigePanel = observer(() => {
  const { prestige } = engine
  
  const potentialBP = prestige.calculatePotentialBP()
  const canPrestige = prestige.canPrestige()
  
  return (
    <div className="prestige-panel">
      <div className="prestige-info">
        <div>Breakthrough Points: {prestige.points}</div>
        <div>Potential BP: {potentialBP}</div>
        <div>Prestige Count: {prestige.prestigeCount}</div>
      </div>
      
      <button 
        onClick={() => prestige.executePrestige()}
        disabled={!canPrestige}
        className="prestige-button"
      >
        {canPrestige ? `Prestige (+${potentialBP} BP)` : "Requirements not met"}
      </button>
      
      <div className="prestige-upgrades">
        {prestige.upgrades.map(upgrade => {
          const level = prestige.getUpgradeLevel(upgrade.id)
          const cost = prestige.getUpgradeCost(upgrade.id)
          const maxLevel = upgrade.maxLevel || 1
          const canAfford = prestige.points >= cost && level < maxLevel
          
          return (
            <div key={upgrade.id} className="prestige-upgrade">
              <h4>{upgrade.name}</h4>
              <p>{upgrade.description}</p>
              <div>Level: {level} / {maxLevel}</div>
              <button
                onClick={() => prestige.purchaseUpgrade(upgrade.id)}
                disabled={!canAfford}
              >
                Buy ({cost} BP)
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
})
```

### CodexStore

Manages unlockable lore articles.

#### Methods

##### `unlockArticle(articleId: string): void`
Unlocks an article and shows a toast notification.

#### Properties

- `articles: Article[]` - All article definitions (from JSON)
- `unlockedArticles: Set<string>` - Article IDs that have been unlocked

**React Example:**
```typescript
const CodexPanel = observer(() => {
  const { codex } = engine
  
  const unlockedArticles = codex.articles.filter(
    article => codex.unlockedArticles.has(article.id)
  )
  
  return (
    <div className="codex-panel">
      <h3>Research Log ({unlockedArticles.length}/{codex.articles.length})</h3>
      {unlockedArticles.map(article => (
        <details key={article.id} className="article">
          <summary>{article.title}</summary>
          <div className="article-content">
            {article.content}
          </div>
        </details>
      ))}
    </div>
  )
})
```

### SyncStore

Handles save/load operations with localStorage.

#### Methods

##### `save(): Promise<void>`
Saves current game state to localStorage (generator function, use with `flowResult`).

##### `load(): Promise<number | undefined>`  
Loads game state from localStorage. Returns save timestamp or undefined.

##### `reset(): void`
Resets all stores to initial state and clears localStorage.

#### Properties

- `state: "idle" | "saving" | "loading" | "error"` - Current operation state
- `isDirty: boolean` - Whether unsaved changes exist
- `lastSave: number` - Timestamp of last successful save

**React Example:**
```typescript
const SaveControls = observer(() => {
  const { sync } = engine
  
  const handleSave = async () => {
    try {
      await flowResult(sync.save())
      console.log("Game saved!")
    } catch (error) {
      console.error("Save failed:", error)
    }
  }
  
  const handleLoad = async () => {
    try {
      const timestamp = await flowResult(sync.load())
      if (timestamp) {
        console.log("Game loaded from:", new Date(timestamp))
      }
    } catch (error) {
      console.error("Load failed:", error)
    }
  }
  
  return (
    <div className="save-controls">
      <button onClick={handleSave} disabled={sync.state !== "idle"}>
        Save Game {sync.isDirty && "*"}
      </button>
      <button onClick={handleLoad} disabled={sync.state !== "idle"}>
        Load Game
      </button>
      <button onClick={() => sync.reset()}>
        Reset Progress
      </button>
      <div>Status: {sync.state}</div>
    </div>
  )
})
```

### ToastStore

Shows temporary notification messages.

#### Methods

##### `showToast(options: Omit<ToastMessage, "id">): void`
Displays a toast notification with auto-dismiss.

##### `dismissToast(id: number): void`
Manually dismisses a specific toast.

##### `showAchievementToast(achievement: Achievement): void`
Convenience method for achievement notifications.

##### `showArticleToast(article: Article): void`
Convenience method for article unlock notifications.

#### Properties

- `toasts: Map<number, ToastMessage>` - Currently displayed toasts

**React Example:**
```typescript
const ToastContainer = observer(() => {
  const { toast } = engine
  
  return (
    <div className="toast-container">
      {Array.from(toast.toasts.values()).map(toastMsg => (
        <div 
          key={toastMsg.id} 
          className={`toast toast-${toastMsg.type}`}
          onClick={() => toast.dismissToast(toastMsg.id)}
        >
          {toastMsg.icon && <span className="toast-icon">{toastMsg.icon}</span>}
          <div>
            <div className="toast-title">{toastMsg.title}</div>
            {toastMsg.message && <div className="toast-message">{toastMsg.message}</div>}
          </div>
        </div>
      ))}
    </div>
  )
})
```

### ConfirmationStore

Handles modal confirmation dialogs.

#### Methods

##### `ask(options: ConfirmationOptions): Promise<boolean>`
Shows a confirmation dialog and returns user's choice.

##### `resolve(confirmed: boolean): void`
Resolves the current confirmation dialog.

#### Properties

- `currentConfirmation: ConfirmationRequest | null` - Active confirmation dialog

**React Example:**
```typescript
const ConfirmationDialog = observer(() => {
  const { confirmation } = engine
  
  if (!confirmation.currentConfirmation) return null
  
  const dialog = confirmation.currentConfirmation
  
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-dialog">
        <h3>{dialog.title}</h3>
        <p>{dialog.description}</p>
        <div className="confirmation-buttons">
          <button 
            onClick={() => confirmation.resolve(false)}
            className="cancel"
          >
            {dialog.cancelText}
          </button>
          <button 
            onClick={() => confirmation.resolve(true)}
            className="confirm"
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
})
```

### Types & Constants

#### Resource Constants
```typescript
const RESOURCES = ["energy", "output", "reputation", "money"] as const
type Resource = typeof RESOURCES[number]
```

#### Rarity Enum
```typescript  
const RARITY = ["common", "uncommon", "rare", "epic", "legendary"] as const
type Rarity = typeof RARITY[number]
```

#### Multiplier Types
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

## Data Contracts

Define your game content with these JSON schemas:

### workers.json

Array of worker definitions:

```json
[
  {
    "id": "volunteer",
    "name": "Volunteers", 
    "description": "Enthusiastic helpers handling basic tasks",
    "cost": 50,
    "production": {
      "energy": 2,
      "output": 0
    },
    "costMultiplier": 1.15,
    "unlockConditions": [
      {"type": "default"}
    ]
  }
]
```

**Fields:**
- `id` (string): Unique identifier
- `name` (string): Display name
- `description` (string): Flavor text
- `cost` (number): Base hiring cost in money
- `production.energy` (number): Energy produced per round
- `production.output` (number, optional): Output produced per round  
- `costMultiplier` (number): Cost scaling factor (e.g., 1.15 = +15% per hire)
- `unlockConditions` (array): Requirements to make worker available
  - `{"type": "default"}`: Available from start
  - `{"type": "totalWorkers", "count": 10}`: Need 10 total workers
  - `{"type": "hiredWorkers", "workerId": "diver", "count": 5}`: Need 5 divers
  - `{"type": "level", "level": 2}`: Need to reach level 2

### levels.json

Array of progression levels:

```json
[
  {
    "id": "sunlight-zone",
    "name": "Sunlight Zone",
    "description": "Shallow waters full of familiar life and low risk",
    "progress": {
      "start": 0,
      "end": 200
    },
    "unlockCost": {
      "unlockedArticles": [],
      "operationsCompleted": 0
    },
    "energyCostMultiplier": 1.0,
    "samplesGainMultiplier": 1.0,
    "operations": ["coral-reefs", "surface-fish"]
  }
]
```

**Fields:**
- `id` (string): Unique identifier
- `name` (string): Display name
- `description` (string): Flavor text
- `progress.start/end` (number): Depth/progress range for theming
- `unlockCost.unlockedArticles` (array): Required article IDs
- `unlockCost.operationsCompleted` (number): Required total operations
- `energyCostMultiplier` (number): Scales click energy cost
- `samplesGainMultiplier` (number): Scales click output gain
- `operations` (array): Operation IDs available at this level

### operations.json

Array of research operations:

```json
[
  {
    "id": "coral-reefs",
    "name": "Coral Reefs Study",
    "description": "Colorful ecosystems teeming with life",
    "rarity": "common",
    "duration": 30,
    "cooldown": 60,
    "cost": {
      "output": 10,
      "energy": 5
    },
    "rewards": {
      "reputation": 5,
      "bonus": {
        "type": "multiplier",
        "target": "outputGain", 
        "value": 1.1,
        "duration": 300
      }
    },
    "requirements": [
      {"type": "level", "level": 0}
    ],
    "articlesUnlocks": [
      {"level": 1, "id": "reef-basics"},
      {"level": 5, "id": "reef-symbiosis"}
    ]
  }
]
```

**Fields:**
- `id` (string): Unique identifier
- `name` (string): Display name  
- `description` (string): Flavor text
- `rarity` (string): "common" | "uncommon" | "rare" | "epic" | "legendary"
- `duration` (number): Seconds to complete
- `cooldown` (number): Additional seconds before can start again
- `cost` (object): Resources consumed to start
- `rewards.reputation` (number): Reputation gained on completion
- `rewards.output` (number, optional): Output gained on completion
- `rewards.money` (number, optional): Money gained on completion
- `rewards.bonus` (object, optional): Temporary multiplier effect
- `requirements` (array): Unlock conditions
- `articlesUnlocks` (array): Articles unlocked at completion milestones

### upgrades.json

Array of permanent upgrades:

```json
[
  {
    "id": "better-equipment",
    "name": "Better Equipment",
    "description": "Improved tools increase energy efficiency",
    "category": "energy", 
    "cost": {
      "money": 100
    },
    "costMultiplier": 1.5,
    "effect": [
      {"type": "energyGain", "value": 1.2}
    ],
    "unlockCondition": {
      "type": "level",
      "level": 1
    },
    "maxLevel": 10
  }
]
```

**Fields:**
- `id` (string): Unique identifier
- `name` (string): Display name
- `description` (string): Effect description
- `category` (string): "energy" | "output" | "operations" | "workers"
- `cost` (object): Resources required per purchase
- `costMultiplier` (number): Cost scaling per level
- `effect` (array): Multiplier effects granted
- `unlockCondition` (object, optional): Requirements to unlock
- `maxLevel` (number): Maximum purchaseable level

### achievements.json

Array of milestone achievements:

```json
[
  {
    "id": "first-dive", 
    "name": "First Dive",
    "description": "Take your first dive into the deep",
    "icon": "🌊",
    "category": "general",
    "condition": {
      "type": "resourceTotal",
      "resource": "output", 
      "amount": 10
    },
    "reward": {
      "type": "multiplier",
      "target": "energyGain",
      "value": 1.05
    },
    "hidden": false
  }
]
```

**Fields:**
- `id` (string): Unique identifier
- `name` (string): Display name
- `description` (string): Unlock description
- `icon` (string): Display emoji/icon
- `category` (string): "general" | "operations" | "collection" | "production" | "prestige" 
- `condition` (object): Unlock requirement
- `reward` (object, optional): Permanent bonus granted
- `hidden` (boolean, optional): Hide until unlocked

### articles.json

Array of lore content:

```json
[
  {
    "id": "reef-basics",
    "title": "Reef Ecology Basics", 
    "content": "Coral reefs are among the most diverse ecosystems on Earth..."
  }
]
```

**Fields:**
- `id` (string): Unique identifier  
- `title` (string): Article title
- `content` (string): Article text content

### prestige-upgrades.json

Array of meta-progression upgrades:

```json
[
  {
    "id": "starting-energy",
    "name": "Emergency Reserves",
    "description": "Begin each expedition with extra energy",
    "category": "starting",
    "baseCost": 1,
    "costMultiplier": 2.0,
    "maxLevel": 5,
    "effects": [
      {
        "type": "startingResource",
        "resource": "energy", 
        "amount": 50
      }
    ]
  }
]
```

**Fields:**
- `id` (string): Unique identifier
- `name` (string): Display name
- `description` (string): Effect description
- `category` (string): "production" | "starting" | "level" | "qol" | "meta"
- `baseCost` (number): Base breakthrough point cost
- `costMultiplier` (number, optional): Cost scaling for multi-level upgrades
- `maxLevel` (number, optional): Max level (default: 1 for one-time purchases)
- `effects` (array): Benefits granted per level

## React Integration

### Setup with mobx-react-lite

```bash
npm install mobx-react-lite
```

### Component Patterns

**Observer Components:**
```typescript
import { observer } from "mobx-react-lite"

// Always wrap components that read from stores
const GameComponent = observer(() => {
  const { resources } = engine
  return <div>Energy: {resources.energy}</div>
})
```

**Initialization Hook:**
```typescript
import { useEffect } from "react"
import { flowResult } from "mobx"

function useGameEngine() {
  useEffect(() => {
    // Start game loop
    engine.game.start()
    
    // Load saved progress
    flowResult(engine.sync.load()).catch(console.error)
    
    // Cleanup on unmount
    return () => {
      engine.game.stop()
    }
  }, [])
  
  return engine
}
```

### Performance Tips

- Only wrap components that actually read store data with `observer()`
- Use computed properties in stores for expensive calculations
- Keep component render functions pure - all side effects in event handlers
- Use `flowResult()` to properly handle MobX generator functions

### Best Practices

**Do:**
```typescript
// ✅ Wrap store readers with observer
const ResourceDisplay = observer(() => {
  const { energy } = engine.resources
  return <div>{energy}</div>
})

// ✅ Keep side effects in handlers
const ClickButton = observer(() => {
  return <button onClick={() => engine.game.click()}>Click</button>
})
```

**Don't:**
```typescript
// ❌ Missing observer wrapper
const ResourceDisplay = () => {
  const { energy } = engine.resources // Won't react to changes!
  return <div>{energy}</div>
}

// ❌ Side effects in render
const GameComponent = observer(() => {
  engine.game.start() // Don't do this!
  return <div>...</div>
})
```

## Advanced Topics

### Custom Fetch Implementation

Provide your own fetch function for special requirements:

```typescript
import { createEngine } from "@miskamyasa/mobx-clicker-game-engine"

// Custom fetcher with authentication
const authenticatedFetch = async (url: string, options?: RequestInit) => {
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': 'Bearer ' + getAuthToken()
    }
  })
}

const engine = createEngine({
  dataUrls: { /* your URLs */ },
  fetcher: authenticatedFetch
})
```

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
  
  // Add custom methods
  superClick() {
    for (let i = 0; i < 10; i++) {
      this.baseStore.click()
    }
  }
  
  // Delegate to base store
  get running() { return this.baseStore.running }
  start() { this.baseStore.start() }
  // ... etc
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
// After engine initialization
engine.config.baseEnergyCost = 10        // Higher click costs
engine.config.localSaveInterval = 10000  // Save every 10 seconds
engine.config.operationScaleFactor.rare = 2.0  // More expensive rare operations
```