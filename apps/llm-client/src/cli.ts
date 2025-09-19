#!/usr/bin/env node
import process from 'node:process';

import { LLMGameClient } from './client';
import { createScriptedBrain } from './brains/sample';

interface ParsedArgs {
  url: string;
  name: string;
  help: boolean;
  unknown: string[];
}

function parseArgs(argv: string[]): ParsedArgs {
  let url: string | undefined;
  let name: string | undefined;
  let help = false;
  const unknown: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }
    if ((arg === '--url' || arg === '-u') && i + 1 < argv.length) {
      url = argv[i + 1];
      i += 1;
      continue;
    }
    if ((arg === '--name' || arg === '-n') && i + 1 < argv.length) {
      name = argv[i + 1];
      i += 1;
      continue;
    }
    unknown.push(arg);
  }

  return {
    url: url ?? 'localhost:3000',
    name: name ?? 'CodexBot',
    help,
    unknown,
  };
}

function printUsage(): void {
  console.log(`Usage: snail-llm-client [options]\n\n` +
    `Options:\n` +
    `  -u, --url <wsUrl>    WebSocket endpoint (default: localhost:3000)\n` +
    `  -n, --name <name>    Player name announced during Join (default: CodexBot)\n` +
    `  -h, --help           Show this message`);
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.unknown.length > 0) {
    for (const arg of parsed.unknown) {
      console.warn(`Ignoring unknown argument: ${arg}`);
    }
  }

  if (parsed.help) {
    printUsage();
    return;
  }

  const brain = createScriptedBrain({
    log: (message) => console.log(`[brain] ${message}`),
  });

  const client = new LLMGameClient({
    url: parsed.url,
    name: parsed.name,
    brain,
    logger: {
      info: (message) => console.log(message),
      error: (message, error) => console.error(message, error),
    },
    onClose: (code, reason) => {
      const reasonText = reason.toString('utf8');
      console.log(
        `Connection closed (code=${code})${reasonText ? `: ${reasonText}` : ''}`,
      );
    },
    onError: (error) => {
      console.error('WebSocket error encountered:', error);
    },
  });

  client.onLobbyState((state) => {
    const status = state.players
      .map((player) => `${player.name}${player.ready ? '✅' : '❌'}`)
      .join(', ');
    console.log(`[lobby] players: ${status}`);
  });

  client.onRoomState((state) => {
    console.log(
      `[room] map=${state.map.width}x${state.map.height} entities=${state.entities.length}`,
    );
  });

  client.onState((state) => {
    console.log(`[state] tick with ${state.entities.length} entities`);
  });

  await client.connect();

  console.log(
    `Connected to ${parsed.url} as ${parsed.name}. Press Ctrl+C to disconnect.`,
  );

  const shutdown = () => {
    console.log('Shutting down client...');
    client.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error in LLM client CLI:', error);
  process.exit(1);
});

