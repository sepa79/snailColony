# SnailColony — Terrain & Client View Implementation Plan (for Codex)

This package contains **requirements-only** documentation for implementing:
1) Terrain & resource layers (server-authoritative rules & data model).
2) A simple **client view**: isometric 2D and optional voxel 3D preview modes.

> IMPORTANT: This spec uses *requirements and examples*, **not** copy-pasteable code. Codex should infer and scaffold the needed code within the existing monorepo (client React+Pixi, server NestJS).

## Files
- `PHASES.md` — step-by-step phases for Codex to execute.
- `REQUIREMENTS_TERRAIN.md` — terrain/resource types, rules, balancing knobs.
- `REQUIREMENTS_CLIENT_VIEW.md` — client rendering requirements (2D iso & 3D voxel).
- `DATA_MODEL_EXAMPLES.md` — JSON/TypeScript **examples** (not final code).
- `ACCEPTANCE_CRITERIA.md` — what must work to accept the feature.
- `NON_GOALS.md` — what **not** to implement in this iteration.
