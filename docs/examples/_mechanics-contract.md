# Engine Mechanics Contract

Shared base mechanics for all game themes. Each theme maps its own flavor onto these canonical systems.

## Canonical Resources

| Key          | Role                                              |
| ------------ | ------------------------------------------------- |
| `energy`     | Consumed by click actions, produced by workers    |
| `output`     | Gained from clicks, spent on operations           |
| `reputation` | Earned from operations, generates money over time |
| `money`      | Used for workers and upgrades                     |

## Core Loop

```
Workers → energy → Click → output → Operations → reputation → money → Workers
```

## Base Mechanics

- Game runs in 1s rounds: workers generate `energy`/`output`, reputation generates `money`.
- Click action spends `energy` to gain `output` (both scaled by level + multipliers).
- Workers cost `money` and add passive production each round.
- Operations spend resources, then become claimable after `duration` and enter `cooldown`.
- Claiming operations grants `reputation` and may grant resources, temporary bonuses, and articles.
- Levels unlock from total operations + required articles; levels scale click costs/gains.
- Prestige resets most progress for permanent points/upgrades and starting bonuses.
