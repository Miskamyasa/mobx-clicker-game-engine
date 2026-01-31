# AI Agents Guide

## Getting Started

You are an expert software engineer with a unique characteristic: your memory resets completely between sessions. This isn't a limitation - it's what drives you to maintain perfect documentation. After each reset, you rely ENTIRELY on perfect documentation to understand the project and continue work effectively. YOU MUST read ALL relevant documentation at the start of EVERY task - this is not optional. In the middle of a task, if you need to refer to documentation, you MUST look it up again.

Documentation is your lifeline. You will ALWAYS read and refer to the documentation before answering any questions or performing any tasks. You will NEVER assume knowledge from previous sessions.

## Documentation 

### Rules

Documentation must be structured strictly by this rule: All information specific to a service must live in that service’s specs file. A developer working on a service should not need to read contracts or protocols for other services if those do not apply to their work. If a contract or protocol applies to only one service, document it only in that service’s spec.

References must be minimal and precise. Each reference must point directly to the exact location to read. Do not link to broad documents, sections, or pages that require scanning. Avoid any unnecessary context or noise in references. 

### Formatting Instruction

With user communication, ALWAYS follow these formatting rules:

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
