## MobX Clicker Game Engine

An education sandbox for exploring agent‑driven development. This engine provides a stable foundation, while the game settings in `docs/examples` act as creative prompts and structured cases for testing how AI agents and developers iterate, adapt, and extend ideas.

## Goals

- Provide a simple, reusable clicker‑game engine as the baseline.
- Encourage creativity and experimentation through curated example settings.
- Enable evaluation of agent capabilities: planning, iteration, and implementation.

## Project Description

This package provides a data‑driven clicker‑game engine (MobX stores + save system). You bring the UI in any frontend framework, and the game content lives in JSON settings files.

## How to Use (Step by Step)

1. **Generate game setting data first.**  
   Create a new setting under `public/settings/<setting>/` with JSON files for `workers`, `levels`, `operations`, `upgrades`, `achievements`, `articles`, and `prestige-upgrades`.  
   Use the example in `repomix-output.xml` as the reference for structure and data patterns.
2. **Create a new frontend app.**  
   Start a fresh React/Vue/other project (Vite, Next, Nuxt, etc.).
3. **Install the engine package.**  
   Add the engine dependency to your app.
4. **Wire the engine to your data URLs.**  
   Create the engine instance and provide the URLs for your setting JSON files (see `src/engine.ts` for the pattern).
5. **Render core stats.**  
   Show resources, level, and progression state from the engine.
6. **Add the primary click action.**  
   Bind a button to the main action (e.g., “dive” / “click”).
7. **Add automation and upgrades.**  
   Build panels for workers and upgrades and wire them to the engine actions.
8. **Add operations and codex UI.**  
   Render operations, achievements, and articles as your content expands.

## Framework Integration

- **React:** Use MobX bindings from [mobx-react-lite](https://www.npmjs.com/package/mobx-react-lite).
- **Vue:** Use MobX bindings from [mobx-vue-use](https://www.npmjs.com/package/mobx-vue-use).

## Persistence

Persistence is built into the engine (auto‑save, offline progress, localStorage). You don’t need to implement save/load manually unless you want custom storage.

## Who It’s For

- Developers learning agent‑assisted workflows.
- Researchers evaluating agent performance.
- Educators creating hands‑on exercises around agentic development.

## License

This project is licensed under the GNU General Public License, version 3.0 (GPLv3). For more information, please see the [GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html) license.

[LICENSE](./LICENSE)
