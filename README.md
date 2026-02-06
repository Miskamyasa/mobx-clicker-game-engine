## MobX Clicker Game Engine

An education sandbox for exploring agent‑driven development. This engine provides a stable foundation, while the game settings in `docs/examples` act as creative prompts and structured cases for testing how AI agents and developers iterate, adapt, and extend ideas.

## Goals

- Provide a simple, reusable clicker‑game engine as the baseline.
- Encourage creativity and experimentation through curated example settings.
- Enable evaluation of agent capabilities: planning, iteration, and implementation.

## Project Description

This package provides a data‑driven clicker‑game engine (MobX stores + save system). You bring the UI in any frontend framework, and the game content lives in JSON settings files.

## Quick Example

```ts
import {createEngine} from "@miskamyasa/mobx-clicker-game-engine"

const engine = createEngine({
  dataUrls: {
    workers: "/settings/ocean/workers.json",
    levels: "/settings/ocean/levels.json",
    operations: "/settings/ocean/operations.json",
    upgrades: "/settings/ocean/upgrades.json",
    achievements: "/settings/ocean/achievements.json",
    articles: "/settings/ocean/articles.json",
    prestigeUpgrades: "/settings/ocean/prestige-upgrades.json",
  },
})

engine.game.start()
```

## Documentation

- [Quickstart](./docs/quickstart.md) — Installation, setup, and framework integration
- [API Reference](./docs/API.md) — Store architecture, methods, properties, types
- [Data Contracts](./docs/data-contracts.md) — JSON schema reference for all game content files
- [Game Development Checklist](./docs/game-development-checklist.md) — Phase-by-phase action items
- [Example Themes](./docs/examples/README.md) — Ocean, archaeology, space colony, and how to create your own

## Who It's For

- Developers learning agent‑assisted workflows.
- Researchers evaluating agent performance.
- Educators creating hands‑on exercises around agentic development.

## License

This project is licensed under the GNU General Public License, version 3.0 (GPLv3). For more information, please see the [GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html) license.

[LICENSE](./LICENSE)
