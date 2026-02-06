# Data Contracts

JSON schema reference for all game content files. The canonical source of truth is the Zod schemas in `src/stores/*.ts`.

## workers.json

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

### Fields

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

## levels.json

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

### Fields

- `id` (string): Unique identifier
- `name` (string): Display name
- `description` (string): Flavor text
- `progress.start/end` (number): Depth/progress range for theming
- `unlockCost.unlockedArticles` (array): Required article IDs
- `unlockCost.operationsCompleted` (number): Required total operations
- `energyCostMultiplier` (number): Scales click energy cost
- `samplesGainMultiplier` (number): Scales click output gain
- `operations` (array): Operation IDs available at this level

## operations.json

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

### Fields

- `id` (string): Unique identifier
- `name` (string): Display name
- `description` (string): Flavor text
- `rarity` (string): `"common"` | `"uncommon"` | `"rare"` | `"epic"` | `"legendary"`
- `duration` (number): Seconds to complete
- `cooldown` (number): Additional seconds before can start again
- `cost` (object): Resources consumed to start
- `rewards.reputation` (number): Reputation gained on completion
- `rewards.output` (number, optional): Output gained on completion
- `rewards.money` (number, optional): Money gained on completion
- `rewards.bonus` (object, optional): Temporary multiplier effect
- `requirements` (array): Unlock conditions
- `articlesUnlocks` (array): Articles unlocked at completion milestones

## upgrades.json

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

### Fields

- `id` (string): Unique identifier
- `name` (string): Display name
- `description` (string): Effect description
- `category` (string): `"energy"` | `"output"` | `"operations"` | `"workers"`
- `cost` (object): Resources required per purchase
- `costMultiplier` (number): Cost scaling per level
- `effect` (array): Multiplier effects granted
- `unlockCondition` (object, optional): Requirements to unlock
- `maxLevel` (number): Maximum purchaseable level

## achievements.json

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

### Fields

- `id` (string): Unique identifier
- `name` (string): Display name
- `description` (string): Unlock description
- `icon` (string): Display emoji/icon
- `category` (string): `"general"` | `"operations"` | `"collection"` | `"production"` | `"prestige"`
- `condition` (object): Unlock requirement
- `reward` (object, optional): Permanent bonus granted
- `hidden` (boolean, optional): Hide until unlocked

## articles.json

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

### Fields

- `id` (string): Unique identifier
- `title` (string): Article title
- `content` (string): Article text content

## prestige-upgrades.json

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

### Fields

- `id` (string): Unique identifier
- `name` (string): Display name
- `description` (string): Effect description
- `category` (string): `"production"` | `"starting"` | `"level"` | `"qol"` | `"meta"`
- `baseCost` (number): Base breakthrough point cost
- `costMultiplier` (number, optional): Cost scaling for multi-level upgrades
- `maxLevel` (number, optional): Max level (default: 1 for one-time purchases)
- `effects` (array): Benefits granted per level
