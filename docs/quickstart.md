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

See [Data Contracts](./data-contracts.md) for the schema of each file. Use the engine Zod schemas in `src/stores/*.ts` as the source of truth for structure and validation rules.

## Step 2: Initialize the Engine

Provide `dataUrls` with the required keys. The _object keys_ must match the engine contract; the _filenames_ can be anything.

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

Typical integration steps:

1. **Render core stats** — Show resources, level, and progression state from the engine.
2. **Add the primary click action** — Bind a button to `engine.game.click()`.
3. **Add automation and upgrades** — Build panels for workers and upgrades, wire them to the engine actions.
4. **Add operations and codex UI** — Render operations, achievements, and articles as your content expands.

## Framework Integration

- **React:** Use MobX bindings from [mobx-react-lite](https://www.npmjs.com/package/mobx-react-lite).
- **Vue:** Use MobX bindings from [mobx-vue-use](https://www.npmjs.com/package/mobx-vue-use).

## Persistence

Persistence is built into the engine (auto-save, offline progress, localStorage). You don't need to implement save/load manually unless you want custom storage. See [SyncStore](./API.md#syncstore) in the API reference for details.

## Next Steps

- [API Reference](./API.md) — Full store API
- [Examples](./examples/README.md) — Themed game content for inspiration
- [Game Development Checklist](./game-development-checklist.md) — Phase-by-phase action items
