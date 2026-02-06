# Quickstart

## Installation

```bash
npm install @miskamyasa/mobx-clicker-game-engine mobx
```

## Step 1: Create Data Files

Create JSON files in `public/settings/my-theme/`:

- `workers.json`
- `levels.json`
- `operations.json`
- `upgrades.json`
- `achievements.json`
- `articles.json`
- `prestige-upgrades.json`

See [Data Contracts](./data-contracts.md) for the schema of each file.

## Step 2: Initialize the Engine

```typescript
import { createEngine } from "@miskamyasa/mobx-clicker-game-engine"

const theme = "my-theme"

const engine = createEngine({
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

## Step 3: Start the Game Loop

```typescript
engine.game.start()
```

Call `engine.game.stop()` when the game should pause or the app unmounts.

## Step 4: Wire to Your UI

The engine is framework-agnostic. Use MobX bindings for your framework of choice to observe store properties and call store methods from your UI layer.

## Next Steps

- [API Reference](./API.md) - Full store API
- [Examples](./examples/README.md) - Themed game content for inspiration
