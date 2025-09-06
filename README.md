# SnailColony

Monorepo scaffold for the SnailColony proof of concept game.

## Development

```bash
pnpm install
pnpm dev
```

The application uses Docker for dependencies:

```bash
pnpm compose:up
```

Access the client at http://localhost/ and connect to a server via WebSocket URL. After connecting,
an isometric map is rendered using PixiJS with an optional voxel preview. Use arrow keys or drag to
pan in 2D. Press **G** to toggle grid lines and **W** to enable or disable simple water animation.
A **3D View** button switches to a Three.js scene where the map is rendered as voxels; in this mode
**G** toggles the grid, **W** the water ripple, **Space** pauses animation, and **R** resets the camera.

The server also serves a lightweight dashboard at http://localhost:3000/ui for viewing state, launching simple game actions, and displaying the same isometric map renderer used by the client. A **Redraw Map** button requests the latest room state from the server and refreshes the view.
Debug buttons expose colony and snail panels for inspecting state during development.

## Testing

Run the server unit tests, including the ECS system specs, with:

```bash
pnpm --filter @snail/server test
```

To execute the full test suite across all packages:

```bash
pnpm test
```

## Documentation

- [CHANGELOG](CHANGELOG.md)
- [PLAN](PLAN.md)
- [STAGE](STAGE.md)

Current version: 0.1.7
