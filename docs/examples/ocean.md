# Ocean Explorer: Deep Sea Survey

## Core Fantasy
You're leading a marine research program pushing deeper into the ocean. Click to Dive, collect samples, and build scientific reputation to secure grants and expand your expedition team.

---

> Base mechanics: [Engine Mechanics Contract](./_mechanics-contract.md)

---

## Core Gameplay Loop

```
Workers → Oxygen → Dive → Samples → Research → Publications → Reputation → Grants → Workers
```

---

## Resource Mapping

| Engine | Theme | Description |
|--------|-------|-------------|
| energy | **Oxygen** | Produced by workers, consumed by Dive actions |
| output | **Samples** | Gathered via Dive clicks, spent on research operations |
| reputation | **Reputation** | Earned from research, increases grant income |
| money | **Grants** | Passive income from reputation, used for hiring and upgrades |

---

## Workers (Expedition Team)

| ID | Name | Description | Unlock |
|----|------|-------------|--------|
| `volunteer` | Volunteers | Enthusiastic helpers handling basic tasks. | Default |
| `diver` | Divers | Skilled field divers increasing oxygen production. | 10 total workers |
| `marine-biologist` | Marine Biologists | Specialists improving sample collection. | Zone 2 unlocked |
| `sub-pilot` | Submersible Pilots | Trained operators for deep-zone missions. | Zone 3 unlocked |
| `research-vessel` | Research Vessels | Large-scale operations enabling sustained output. | Zone 4 unlocked |
| `autonomous-drone` | Autonomous Drones | Automated deep-sea collection platforms. | Zone 5 unlocked |

**Production notes:**
- Early workers: high oxygen, low sample output
- Mid-tier: balanced oxygen + samples
- Late-tier: massive throughput via automation

---

## Levels (Depth Zones)

### Level 0: Sunlight Zone
*Shallow waters full of familiar life and low risk.*

**Depth equivalent:** 0-200m

**Operations (Discoveries):**
- `coral-reefs` — Colorful ecosystems teeming with life
- `surface-fish` — Common species with useful baseline data
- `tidal-pools` — Micro-habitats with surprising variety
- `plankton-blooms` — Foundation of the ocean food web

**Expeditions:**
- `shoreline-survey` — Collect samples near the coast
- `shallow-photography` — Document biodiversity hotspots

---

### Level 1: Twilight Zone
*Dim light, strange bioluminescence, and new adaptations.*

**Depth equivalent:** 200-1,000m

**Operations (Discoveries):**
- `bioluminescent-fish` — Light-producing species of the deep
- `lantern-squid` — Predators using lures to hunt
- `deep-jellyfish` — Fragile organisms with alien silhouettes
- `midwater-feeders` — Species adapted to scarce food

**Expeditions:**
- `light-trap-study` — Capture and catalog bioluminescent life
- `depth-profile` — Record environmental shifts by depth

---

### Level 2: Midnight Zone
*Total darkness, extreme pressure, and elusive giants.*

**Depth equivalent:** 1,000-4,000m

**Operations (Discoveries):**
- `giant-squid` — Rare predators rarely seen by humans
- `anglerfish` — Iconic lure-based hunters
- `cold-seep` — Chemosynthetic communities at seep sites
- `deep-crustaceans` — Pressure-adapted scavengers

**Expeditions:**
- `rov-descent` — Remote vehicle survey at depth
- `pressure-sampling` — Preserve specimens for analysis

---

### Level 3: Abyssal Zone
*Sparse life, hydrothermal vents, and alien ecosystems.*

**Depth equivalent:** 4,000-6,000m

**Operations (Discoveries):**
- `hydrothermal-vents` — Volcanic vents with unique life
- `tube-worm-colonies` — Chemosynthetic food chains
- `abyssal-plains` — Vast deserts with rare organisms
- `vent-crustaceans` — Species thriving in toxic conditions

**Expeditions:**
- `vent-mapping` — Locate and chart vent fields
- `thermal-chemistry` — Analyze vent outputs

---

### Level 4: Hadal Zone
*The deepest trenches and the ocean’s final mysteries.*

**Depth equivalent:** 6,000-11,000m

**Operations (Discoveries):**
- `mariana-trench-life` — Organisms adapted to crushing pressure
- `deep-amphipods` — Scavengers at the trench floor
- `hadal-fish` — Fragile life at extreme depths
- `unknown-megafauna` — Massive, undiscovered creatures in the abyss

**Expeditions:**
- `trench-descent` — Reach the deepest point
- `full-spectrum-scan` — Search for anomalous signatures

---

## Prestige Framing

**Trigger:** "New Expedition" — Funding shifts to a fresh region or trench, prompting a full reset.

**Currency:** "Breakthrough Points" — Permanent scientific recognition for future runs.

**Bonuses:** Faster startup, better initial crew, reduced research costs, unlocked shortcuts.

---

## Tone & Aesthetic

- **Mood:** Awe and mystery with a grounded scientific focus
- **Progression arc:** "Known seas" → "Strange adaptations" → "Alien ecosystems" → "Unanswered questions"
- **Visual palette:** Deep blues, bioluminescent accents, instrument panel glows
- **Audio cues:** Submarine hum, sonar pings, distant whale calls

---

## Sample Article Unlocks

| Operation | Level | Article |
|-----------|-------|---------|
| coral-reefs | 1 | "Reef Ecology Basics" |
| coral-reefs | 5 | "Symbiosis in Shallow Waters" |
| coral-reefs | 10 | "Human Impact on Reef Health" |
| unknown-megafauna | 1 | "First Sighting Log" |
| unknown-megafauna | 5 | "Size Estimates and Migration Patterns" |
| unknown-megafauna | 10 | "We Keep Missing It" |
