# AI Agents Guide

## Formatting Instruction

ALWAYS follow these formatting rules for documentation and user communication:

- Output MUST be concise and structured.
- Use markdown headers only at level ## for top sections and ### for subsections.
- Each section should cover ONE concept only.
- Use short bullet points (max 1 line per bullet).
- Do NOT bold random phrases; reserve bold only for section titles inside bullets if absolutely necessary.
- Prefer declarative statements over explanations.

## Project Overview

- TypeScript clicker-game engine built on MobX stores.
- Packaged as `@miskamyasa/mobx-clicker-game-engine` for reuse.
- Frontend-agnostic: consumers provide UI and JSON game content.

## Getting Oriented

- Start with `README.md` for usage and intent.
- Skim `docs/examples/*.md` for themed data contracts/prompts.

## Common Commands

- Install: `pnpm install`
- Build: `pnpm build` (outputs `dist/` via `tsup`)

## Public API

- `createEngine(options)` creates a `RootStore` instance (`src/engine.ts`).
- Package exports live in `src/index.ts`.

## Data Contract

- Required `dataUrls` keys (`src/stores/RootStoreOptions.ts`):
  - `workers`, `levels`, `operations`, `upgrades`, `achievements`, `articles`, `prestigeUpgrades`.
- Canonical resource keys (`src/stores/shared.ts`):
  - `energy`, `output`, `reputation`, `money`.

## Key Files

- `src/stores/RootStore.ts`: store graph and initialization order.
- `src/stores/EngineDataSource.ts`: fetches JSON settings from `dataUrls`.
- `src/stores/shared.ts`: schemas, resource constants, save snapshot schema.
- `src/stores/SyncStore.ts`: local save/load/reset (localStorage).
- `docs/examples/ocean.md`: example theme + mechanics contract.

## Runtime Assumptions

- Requires `fetch` to exist (or be injected into `EngineDataSource`).
- Uses `localStorage` for persistence.
