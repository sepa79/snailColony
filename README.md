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

Access the client at http://localhost/ and connect to a server via WebSocket URL.

The server also serves a lightweight dashboard at http://localhost:3000/ui for viewing state and launching simple game actions.

## Documentation

- [CHANGELOG](CHANGELOG.md)
- [PLAN](PLAN.md)
- [STAGE](STAGE.md)

Current version: 0.1.1
