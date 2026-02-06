# AI Agents Guide — Game Project

## Formatting Instruction

ALWAYS follow these formatting rules for documentation and user communication:

- Output MUST be concise and structured.
- Use markdown headers only at level ## for top sections and ### for subsections.
- Each section should cover ONE concept only.
- Use short bullet points (max 1 line per bullet).
- Do NOT bold random phrases; reserve bold only for section titles inside bullets if absolutely necessary.
- Prefer declarative statements over explanations.

## Project Overview

- Clicker game built with `@miskamyasa/mobx-clicker-game-engine`.
- Engine handles: game loop, resources, persistence, progression, prestige.
- This project handles: UI, game theme data (JSON), styling.
- Engine is framework-agnostic — React, Vue, or any other framework.

## Getting Oriented

1. Read this file first.
2. Read the game theme spec (if one exists) in `docs/` or `public/settings/`.
3. Engine documentation: https://raw.githubusercontent.com/Miskamyasa/mobx-clicker-game-engine/refs/heads/main/docs/README.md

## Common Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Engine Integration

- Entry point: `createEngine({ dataUrls })` from `@miskamyasa/mobx-clicker-game-engine`.
- Returns a `RootStore` with child stores accessible as properties.
- All stores are MobX observables — use framework bindings to react to changes.
- Game loop: `engine.game.start()` / `engine.game.stop()`.

## Data Contract

Seven required JSON files in `public/settings/<theme>/`:

| File | Engine key | Content |
|------|-----------|---------|
| `workers.json` | `workers` | Team members that generate resources |
| `levels.json` | `levels` | Progression zones with unlock requirements |
| `operations.json` | `operations` | Actions that consume resources and grant rewards |
| `upgrades.json` | `upgrades` | Permanent improvements with multiplier effects |
| `achievements.json` | `achievements` | Milestone rewards with unlock conditions |
| `articles.json` | `articles` | Lore content unlocked through operations |
| `prestige-upgrades.json` | `prestigeUpgrades` | Meta-progression purchased with prestige points |

Canonical resources: `energy`, `output`, `reputation`, `money`.

Schema reference: [Data Contracts](https://raw.githubusercontent.com/Miskamyasa/mobx-clicker-game-engine/refs/heads/main/docs/data-contracts.md)

## Project Structure

```
public/settings/<theme>/    — JSON game data files
src/                        — Source code for engine integration and UI
docs/                       — Game-specific documentation
```

## Key Stores (Consumer API)

| Store | Access | Purpose |
|-------|--------|---------|
| GameStore | `engine.game` | Game loop, click action |
| ResourcesStore | `engine.resources` | energy, output, reputation, money |
| WorkersStore | `engine.workers` | Hiring, passive production |
| OperationsStore | `engine.operations` | Conduct/claim, cooldowns |
| UpgradesStore | `engine.upgrades` | Purchase upgrades, multipliers |
| LevelStore | `engine.level` | Progression, zone selection |
| AchievementsStore | `engine.achievements` | Unlock tracking, rewards |
| PrestigeStore | `engine.prestige` | Reset mechanics, breakthrough points |
| CodexStore | `engine.codex` | Article unlocking |
| SyncStore | `engine.sync` | Save/load state (localStorage) |
| ToastStore | `engine.toast` | Notification messages |
| ConfirmationStore | `engine.confirmation` | Modal confirmation dialogs |

Full method signatures: [API Reference](https://raw.githubusercontent.com/Miskamyasa/mobx-clicker-game-engine/refs/heads/main/docs/API.md)


## Development Phases

1. **Bootstrap** — Initialize frontend project, install engine + MobX + framework bindings.
2. **Game data** — Create 7 JSON files for your theme following the data contracts.
3. **Design system** — Define tokens (colors, spacing, typography).
4. **Core components** — Button, Card, ResourceDisplay, Modal, Toast, ProgressBar.
5. **Engine integration** — Initialize engine, create lifecycle hook, handle loading states.
6. **Game panels** — Resources, click action, workers, operations, upgrades, level selector.
7. **Progression UI** — Achievements, codex, prestige, statistics.
8. **Polish** — Animations, tooltips, sound effects, transitions.

Detailed checklist: [Game Development Checklist](https://raw.githubusercontent.com/Miskamyasa/mobx-clicker-game-engine/refs/heads/main/docs/game-development-checklist.md)

## Framework Bindings

- **React:** [mobx-react-lite](https://www.npmjs.com/package/mobx-react-lite)
- **Vue:** [mobx-vue-use](https://www.npmjs.com/package/mobx-vue-use)

## Runtime Assumptions

- Requires `fetch` (browser environment).
- Uses `localStorage` for persistence.
- `mobx` must be installed as a peer dependency.
