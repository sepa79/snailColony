# @snail/llm-client

Headless TypeScript client for automating SnailColony matches over WebSockets. The package wraps the
raw `ws` connection logic from the React app so a programmable "brain" can react to lobby, room, and
state updates.

## Features

- Normalises SnailColony WebSocket URLs and sends the required `Join`/`SetReady`/`Move` commands.
- Emits typed callbacks (`LobbyState`, `RoomState`, `State`) for custom AI integrations.
- Ships with a small scripted brain and CLI runner for local experimentation.

## Installation

From the monorepo root:

```bash
pnpm install
pnpm --filter @snail/llm-client build
```

## Usage

### Programmatic API

```ts
import { LLMGameClient, createScriptedBrain } from '@snail/llm-client';

const brain = createScriptedBrain();
const client = new LLMGameClient({
  url: 'localhost:3000',
  name: 'CodexBot',
  brain,
});

client.onLobbyState((lobby) => {
  console.log('Lobby players:', lobby.players);
});

await client.connect();
```

Implement the `LLMGameBrain` interface to supply your own decision making. Return `Move` commands
from `onState` or call `context.sendCommand` for direct control.

### CLI runner

The package also includes a thin CLI wrapper that wires the scripted brain to a WebSocket endpoint:

```bash
pnpm --filter @snail/llm-client exec snail-llm-client --url localhost:3000 --name CodexBot
```

Use `--help` to list available flags.

## Testing

Run the Vitest suite:

```bash
pnpm --filter @snail/llm-client test
```

