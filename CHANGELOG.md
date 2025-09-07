# Changelog

All notable changes to this project will be documented in this file.

## [0.1.12] - 2025-09-08
### Changed
- Enforced map boundaries by clamping spawn and movement targets and rejecting out-of-bounds paths.
- Pathfinding now observes terrain speed and hydration costs.
- World map dimensions refresh on regeneration with tests for edge movement and colonization.

## [0.1.11] - 2025-09-08
### Added
- Snail panel opens automatically when selecting a snail and refreshes when choosing another.
- Clicking colony tiles now reveals a colony panel with details.

## [0.1.10] - 2025-09-07
### Added
- Procedural map generator with REST endpoint and dashboard controls for width and height.
- Terrain legend and responsive server UI that sends the latest map to clients on game start.
- Unit tests verifying generation and regeneration guards.

### Changed
- Server dashboard themed to match client with dynamic buttons.
- Map regeneration disabled once the game has started.

## [0.1.9] - 2025-09-07
### Added
- Highlight clicked map tiles and dispatch precise move commands so snails move to the chosen square and stop.
- Clamp snail velocity for consistent speed and halt on arrival.
- Regression tests cover diagonal normalization and stop-at-destination.

## [0.1.8] - 2025-09-07
### Added
- Render entities on maps with snail selection and move commands.
- Display snail stat icons and star ratings.

## [0.1.7] - 2025-09-06
### Added
- Debug buttons for colony and snail panels.
### Changed
- Default to development mode using Vite's `import.meta.env.DEV`.

## [0.1.6] - 2025-09-05
### Added
- Single persistent lobby with readiness gating before game start
- Client requires name and offers Ready toggle
### Changed
- World ticks only after lobby starts
- Sample map expanded to 5×5 tiles

## [0.1.5] - 2025-09-04
### Fixed
- Corrected server dashboard to load map renderer from `/ui`, ensuring the map initializes.

## [0.1.4] - 2025-09-04
### Added
- Map protocol with terrain tiles and room state snapshot.
- Server MapService that loads and validates a JSON map seed and exposes a REST endpoint.
### Changed
- WebSocket gateway now sends the initial room state to new clients.
- Server bundle built via `pnpm deploy` to include workspace dependencies.

## [0.1.3] - 2025-09-04
### Added
- Reusable log console for IN/OUT/System messages with timestamps in client and server UIs.
- Entity status component showing coordinates and hydration.
### Changed
- Normalize WebSocket URL to ensure scheme and /ws suffix.
- Timestamp server dashboard logs.

## [0.1.2] - 2025-09-04
### Added
- Basic server dashboard UI served at /ui with lobby controls and real-time state updates.
- ECS world with movement and hydration systems, plus Move command support.
### Changed
- Aligned @nestjs/serve-static with NestJS 10.

## [0.1.1] - 2025-09-03
### Added
- Dockerfiles for client and server to enable containerized builds.
- Configured NestJS server WebSocket adapter and build output.

## [0.1.0] - 2025-09-03
### Added
- Initial monorepo scaffold with client, server, and Docker Compose setup.
- Development scripts for linting, testing, and running services.
