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
an isometric map is rendered using PixiJS. Use arrow keys or drag to pan the camera. Press **G** to
toggle grid lines and **W** to enable or disable simple water animation.

The server also serves a lightweight dashboard at http://localhost:3000/ui for viewing state, launching simple game actions, and displaying the same isometric map renderer used by the client. A **Redraw Map** button allows the map to be re-rendered if needed.

## Documentation

- [CHANGELOG](CHANGELOG.md)
- [PLAN](PLAN.md)
- [STAGE](STAGE.md)

Current version: 0.1.1
