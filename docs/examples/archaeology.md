# Lost Civilizations: Archaeological Survey

## Core Fantasy
You're leading an excavation of a newly discovered ancient site. Click to Dig through layers of history, uncover artifacts, and build your academic reputation to secure museum funding and attract top researchers.

---

## Engine Mechanics Contract

- Canonical resource keys: `energy`, `output`, `reputation`, `money`.
- Dig loop: spend `energy` to gain `output`.
- Operations consume resources (typically `output`, sometimes `energy`/`money`) and yield `reputation` plus optional rewards.
- Base mechanics: `docs/game-design-document.md`.

---

## Core Gameplay Loop

```
Workers → Stamina → Dig → Artifacts found → Research → Academic citations → Grant funding → Workers
```

---

## Resource Mapping

| Engine | Theme | Description |
|--------|-------|-------------|
| energy | **Stamina** | Physical/mental energy for fieldwork, consumed by Dig actions |
| output | **Artifacts found** | Recovered via Digging (clicks), spent to conduct research |
| reputation | **Academic citations** | Earned from published findings, builds scholarly influence |
| money | **Grant funding** | Passive income from citations, used for staff and equipment |

---

## Workers (Excavation Team)

| ID | Name | Description | Unlock |
|----|------|-------------|--------|
| `student` | Archaeology Students | Enthusiastic grad students learning the trade. | Default |
| `field-tech` | Field Technicians | Skilled excavators with proper brushwork technique. | 10 total workers |
| `specialist` | Period Specialists | Experts in specific eras and artifact types. | Level 1 + 5 field techs |
| `conservator` | Conservators | Preservation experts preventing artifact decay. | Level 2 + 3 specialists |
| `survey-team` | Remote Survey Teams | Ground-penetrating radar and satellite analysis crews. | Level 3 + 2 conservators |
| `ai-cataloger` | AI Cataloging Systems | Machine learning for pattern recognition across thousands of fragments. | Level 4 |

**Production notes:**
- Students: high stamina (eager), no artifact bonus
- Mid-tier: balanced stamina + artifact recovery rate
- Late-tier: massive throughput via technology

---

## Levels (Excavation Layers)

### Level 0: Surface Scatter
*Topsoil and recent deposits. Pottery shards, coins, everyday objects.*

**Depth equivalent:** 0-200m (Sunlight Zone)

**Operations (Discoveries):**
- `pottery-fragments` — Broken ceramics revealing daily life
- `bronze-coins` — Currency from the site's final occupation
- `tool-remnants` — Everyday implements: knives, needles, weights
- `animal-bones` — Diet and domestication evidence

**Expeditions:**
- `grid-survey` — Systematic surface collection
- `photo-documentation` — Record the scatter pattern before excavation

---

### Level 1: Occupation Layers
*Stratified deposits showing centuries of habitation. Floors, hearths, middens.*

**Depth equivalent:** 200-1000m (Twilight Zone)

**Operations (Discoveries):**
- `floor-mosaics` — Decorative tilework revealing artistic traditions
- `hearth-deposits` — Cooking areas with carbonized food remains
- `storage-vessels` — Intact jars containing preserved contents
- `personal-items` — Jewelry, figurines, objects of sentiment

**Expeditions:**
- `stratigraphic-analysis` — Document the layer sequence
- `carbon-dating` — Establish precise chronology

---

### Level 2: Foundation Structures
*Monumental architecture. Walls thick enough to support vanished towers.*

**Depth equivalent:** 1000-4000m (Midnight Zone)

**Operations (Discoveries):**
- `carved-reliefs` — Narrative scenes depicting unknown events
- `inscription-stones` — Text in partially deciphered scripts
- `ritual-objects` — Items of religious or ceremonial significance
- `hidden-chambers` — Sealed rooms behind false walls

**Expeditions:**
- `architectural-survey` — Map the building's full extent
- `inscription-decoding` — Work with linguists on translation

---

### Level 3: Sacred Precinct
*Temple complexes. Altars stained with offerings. Texts describing beliefs lost to time.*

**Depth equivalent:** 4000-6000m (Abyssal Zone)

**Operations (Discoveries):**
- `altar-stones` — Sacrificial platforms with disturbing residue
- `votive-deposits` — Offerings to gods whose names we're learning
- `priestly-regalia` — Ceremonial objects of the religious elite
- `sacred-texts` — Fragmentary scriptures describing their cosmology

**Expeditions:**
- `temple-clearance` — Excavate the main sanctuary
- `ritual-reconstruction` — Piece together their religious practices

---

### Level 4: Sealed Tombs
*Below everything else. Burial complexes for rulers whose names echo in legend.*

**Depth equivalent:** 6000-11000m (Hadal Zone)

**Operations (Discoveries):**
- `royal-sarcophagus` — The resting place of forgotten kings
- `burial-goods` — Wealth beyond imagination, interred for eternity
- `curse-inscriptions` — Warnings to those who disturb the dead
- `the-chronicle` — A complete history. Everything they wanted remembered.

**Expeditions:**
- `tomb-breach` — Enter the sealed burial chamber
- `legacy-publication` — Share the complete findings with the world

---

## Prestige Framing

**Trigger:** "New Excavation" — The site is exhausted or funding reallocated. Start fresh at a related site in the same cultural complex.

**Currency:** "Scholarly Legacy" — Permanent academic recognition carrying to future digs.

**Bonuses:** Experienced team members, established methodology, institutional connections, equipment upgrades.

---

## Tone & Aesthetic

- **Mood:** Dusty academic romance with undertones of "what happened here?"
- **Progression arc:** "Everyday life" → "Complex society" → "Strange beliefs" → "They feared something"
- **Visual palette:** Desert tans, terracotta, aged parchment, golden artifact gleam
- **Audio cues:** Brush strokes on stone, wind through ruins, distant workers calling

---

## Sample Article Unlocks

| Operation | Level | Article |
|-----------|-------|---------|
| pottery-fragments | 1 | "Ceramic Typology Basics" |
| pottery-fragments | 5 | "Trade Network Evidence" |
| pottery-fragments | 10 | "The Symbols Repeat Across All Periods" |
| the-chronicle | 1 | "Initial Translation Fragments" |
| the-chronicle | 5 | "The Kings List" |
| the-chronicle | 10 | "Why They Sealed Themselves Below" |

---

## Historical Ambiguity

The civilization should feel *almost* identifiable but not quite. Touches of:
- Mesopotamian ziggurats
- Minoan labyrinthine complexity
- Egyptian funerary obsession
- Indus Valley script mystery

Never confirm which culture. Let players project. The mystery is the point.
