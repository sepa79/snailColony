# Map Expansion System — SnailColony

Design: a map that **reveals/expands by regions** (chunks) after meeting **goals** or other triggers. Integrates with colonies, trails, resources and veteran-snail progression.

---

## 1) Core idea
- World is split into **Regions** (e.g., 32×32 hex each). Start shows only the **Start Region**.
- New regions unlock on **goal** completion or other **triggers**; on unlock they **spawn** their biomes, resources and AI, update navmesh and lift the shroud.
- Each unlocked region can grant **campaign rewards** (e.g., +1 veteran cap, +1 part-slot for new larvae).

---

## 2) Concealment / visibility
- **Shroud (undiscovered)**: fully hidden, AI dormant; no pathing or spawns applied.
- **Fog of War (discovered, no vision)**: terrain visible, units hidden.
- **Region Locks**: entire region stays shrouded until `unlock_condition` is satisfied.

---

## 3) Unlock triggers
1. **Goal-based**: complete current scenario goals (e.g., keep 2 colonies active for 2 days).
2. **Structure-based**: build **Survey Mast**/**Relay Beacon** near edge -> unlock adjacent region.
3. **Event-based**: defeat **Slug Queen** / survive an **Ant raid**.
4. **Economy-based**: deliver X of strategic resources (🪨 lime / 🍄 fungi / ✨ crystal slime) to base.
5. **Campaign-milestone**: after winning scenario, pre-open a corridor to next biome.

> Always provide at least **one guaranteed path** (goal-based). Others are optional/alternative.

---

## 4) World structure (technical)
- **Region** data: `bounds`, `biome`, `difficulty`, `spawn_seed`, `unlock_condition`, `on_unlock_rewards`.
- **AI** outside shroud is **asleep** (no raids). Optional edge-raids if pressure is needed.
- **Navmesh** updated **incrementally** only for newly unlocked region.

**Region JSON example:**
```json
{
  "id": "R-NE-02",
  "bounds": {"x":64,"y":0,"w":32,"h":32},
  "biome": "chalk_hill",
  "difficulty": 2,
  "spawn_seed": 91342,
  "unlock_condition": {
    "type": "AND",
    "req": [
      {"goal":"two_colonies_active","value":true},
      {"colony_level_at_edge":2},
      {"resource_delivery":{"lime":30}}
    ]
  },
  "on_unlock_rewards": {"veteran_cap_plus":1, "new_larva_part_slot_plus":1}
}
```

---

## 5) What unlocks bring
- **Biomes**: bog (💧/🍄), chalk hills (🪨), tall grass (🌾), salt flats (🧂), crystal pockets (✨).
- **Threats**: denser webs, ant nests (waves), tougher slugs (mini-boss).
- **Local weather**: e.g., more rain in bog -> faster shroud-clearing but trails decay faster w/o ✨.

---

## 6) UX / Communication
- **Edge Tease**: silhouettes/contours under shroud at region borders.
- **Region Tracker** HUD: “Next region unlocks when: …” listing active conditions.
- **On Unlock**: camera pan, banner “New Region Discovered”, minimap ping.
- **Tactical Map (M)**: graph of regions, locks, biome icons, intended difficulty.

---

## 7) Pacing & balance
- Each unlocked region can grant: **+1 veteran level cap** for surviving snails, **+1 part-slot** for **new larvae** (configurable).
- Higher resource rarity -> stronger logistics pressure (Trail Posts, Carriers).
- AI escalation: more **Slug Guards**, periodic raids from fresh borders.

---

## 8) Integrations
- **Colonies**: Survey Mast / Relay Beacon as unlock enablers; Trail Posts maintain corridors.
- **Snail-drones**: **Antennae III** can do **micro-reveals** (ping small pockets without full unlock).
- **Resources**: newly unlocked regions add strategic resource mixes (🪨/🍄/🧂/✨).
- **Weather**: per-region modifiers (rain/heat affecting trails, fungi spawn, etc.).

---

## 9) Implementation (MVP)
1. **ShroudLayer**: per-tile boolean + shader; fog cache for discovered tiles.
2. **RegionGraph**: rectangular bounds + adjacency (4/6/8-dir).
3. **UnlockConditionEngine**: AND/OR with hooks to goals, buildings, deliveries, events.
4. **OnUnlock pipeline**: spawn by biome/seed, incremental navmesh, FX, event log.
5. **UX**: Region Tracker panel + minimap border rendering.
6. **Persistence**: store unlocked regions, seeds and rewards in scenario state.

**Optional (T2):** micro-reveals via Antennae ping, edge-raids from locked borders, teaser silhouettes.

---

## 10) Data knobs (generator defaults)
```json
{
  "region_size_hex": 32,
  "reveal_fx": "pan_and_banner",
  "unlock_rules": {
    "default": [{"goal":"main_objective_complete"}],
    "edge_struct": [{"building":"survey_mast","radius_edge":3}]
  },
  "biome_table": {
    "start_plain": {"grass":2.0,"water":1.0,"fibers":0.5},
    "chalk_hill": {"lime":2.0,"grass":0.7,"fungi":0.3},
    "bog": {"water":2.5,"fungi":1.8,"crystal":0.2},
    "salt_flat": {"salt":2.2,"water":0.2}
  }
}
```

---

## 11) Test checklist
- Unlocking a region does **not** break pathfinding (local navmesh update only).
- AI does not path into **Shroud**; optional edge-raids respect locks.
- Spawn determinism: biome + seed -> reproducible nodes/resources.
- UX feedback present: Region Tracker updates, banner, minimap ping.
- Balance sanity: unlocked region yields unique resources and manageable new threats.

---

## 12) Mini task for Codex (ready-to-use)
- Add `RegionGraph` and `RegionLock` data (see JSON).
- Implement `ShroudLayer` with per-tile flags and fog cache.
- Add `UnlockConditionEngine` (hooks: goals, buildings, resource deliveries, events).
- Wire `onUnlock`: region spawn, incremental navmesh rebuild, VFX, event log.
- Implement UI: Region Tracker + minimap border rendering.
