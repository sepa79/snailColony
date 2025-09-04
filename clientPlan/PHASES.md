# Phases — step-by-step execution plan (for Codex)

Each phase is **atomic** and should result in a PR/commit with tests or a local demo. Avoid writing production UI before the model and protocol are stable.

---
## Phase 0 — Prepare workspace
- Ensure monorepo exists with packages: `apps/client` (React+Vite+Pixi), `apps/server` (NestJS), `libs/protocol` (TS shared types).
- Add linting (ESLint + Prettier) and strict TypeScript.
- Verify Docker compose `client` and `server` build/run.

Deliverable: CI passes, `/health` on server responds OK.

---
## Phase 1 — Terrain & resources data model (no rendering)
**Goal:** introduce server-side model for terrain & overlays (resources, structures).

Requirements:
- Represent **terrain** (base tile), **water** (overlay), **grass** (overlay), and **structure** (overlay) as separate layers per tile.
- Store map in Postgres or JSON seed (for PoC). Provide a loader service.
- Provide REST `/map/:roomId` or WS snapshot field to deliver map layers to clients.

Deliverables:
- Server: `Tile` model + loader + validation.
- Protocol: message/contract update (e.g., `RoomState` includes immutable `MapDef` with layers, version/seed).
- Tests: serialization roundtrip, simple validator for incoherent tiles (e.g., `Cliff` cannot have `Colony`).

---
## Phase 2 — Movement & hydration semantics (server-only)
**Goal:** server computes movement cost and hydration drain from terrain & overlays.

Requirements:
- Implement `moveCost(tile)` and `hydrationModifier(tile)` with merges from layers (details in REQUIREMENTS_TERRAIN).
- Mark blocked tiles (Cliff or Water:Full unless Bridge present).
- Provide A* path sampler test over sample map.

Deliverables:
- Server: pure functions + unit tests (see acceptance metrics). No UI yet.

---
## Phase 3 — Client: Isometric 2D view (PixiJS)
**Goal:** show an **isometric 2D** map using procedurally drawn diamonds, not bitmaps.

Requirements:
- Render 2D iso grid (2:1 diamonds). One `Graphics` per layer or chunk, **batch** heavy geometry.
- Resource overlays: draw above terrain, minimalistic shapes/colors.
- Interaction: camera pan (keys), toggle **G** (grid), toggle **W** (water animation if present).

Deliverables:
- Client: a screen with the map, basic camera, and overlays.
- Tests: screenshot or manual checklist; no gameplay input yet.

---
## Phase 4 — Optional client: Voxel 3D preview (Three.js)
**Goal:** optional toggle to a voxel preview (same data).

Requirements:
- Create a self-contained 3D scene (ESM build) reading the same `MapDef`.
- Render blocks for terrain; thin boxes for puddle/stream; translucent blocks for water:full.
- Keyboard: **G** toggles grid, **W** toggles water ripple, **Space** pause, **R** reset camera.

Deliverables:
- Client: route `/voxel` or toggle button. Non-blocking for main flow.

---
## Phase 5 — Structures & building constraints (server model only)
**Goal:** enforce rules for placing `Colony` and `Bridge` (see REQUIREMENTS_TERRAIN).

Requirements:
- Validate build actions against base terrain + overlays.
- Expose errors over WS (`Error` message with code).

---
## Phase 6 — Snapshot & perf
**Goal:** ensure map layers are transmitted once (immutable), deltas for dynamic overlays later.

Requirements:
- Send map layers once on join (`Welcome` or `RoomState`), include `mapVersion`.
- Clients must cache and reuse layer buffers.
