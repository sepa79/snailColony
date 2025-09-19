import { describe, expect, test, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import type WebSocket from 'ws';
import type { AddressInfo } from 'node:net';
import type { ClientCommand } from '@snail/protocol';
import {
  LLMGameClient,
  type LLMGameBrain,
  type LobbyStateMessage,
  type RoomStateMessage,
  type StateSnapshotMessage,
} from '../src/client';
import {
  GrassLayer,
  Structure,
  TerrainType,
  WaterLayer,
} from '@snail/protocol';

async function waitFor(predicate: () => boolean, timeout = 1000): Promise<void> {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() - start > timeout) {
        reject(new Error('Timed out waiting for condition.'));
        return;
      }
      setTimeout(tick, 5);
    };
    tick();
  });
}

describe('LLMGameClient', () => {
  test('joins, readies after lobby, and forwards brain moves', async () => {
    const server = new WebSocketServer({ port: 0 });
    const address = server.address() as AddressInfo;
    const url = `ws://127.0.0.1:${address.port}`;

    const commands: ClientCommand[] = [];
    let lobbyDelivered = false;

    const brain: LLMGameBrain = {
      async onLobbyState(_state, ctx) {
        ctx.setReady(true);
      },
      async onState() {
        return { t: 'Move', dx: 1, dy: 0 } as const;
      },
    };

    const lobbySpy = vi.spyOn(brain, 'onLobbyState');
    const stateSpy = vi.spyOn(brain, 'onState');

    const client = new LLMGameClient({ url, name: 'TestBot', brain });

    const socketPromise = new Promise<WebSocket>((resolve) => {
      server.once('connection', (socket) => resolve(socket));
    });

    const connectPromise = client.connect();
    const socket = await socketPromise;

    socket.on('message', (raw) => {
      const parsed = JSON.parse(raw.toString()) as ClientCommand;
      commands.push(parsed);
      if (parsed.t === 'Join') {
        setTimeout(() => {
          lobbyDelivered = true;
          const lobby: LobbyStateMessage = {
            t: 'LobbyState',
            players: [{ name: 'TestBot', ready: false }],
            started: false,
          };
          const room: RoomStateMessage = {
            t: 'RoomState',
            map: {
              width: 1,
              height: 1,
              version: 1,
              moisture: 0,
              tiles: [
                {
                  terrain: TerrainType.Dirt,
                  water: WaterLayer.None,
                  grass: GrassLayer.None,
                  structure: Structure.None,
                  slime_intensity: 0,
                },
              ],
            },
            entities: [],
            params: {
              terrain: {
                [TerrainType.Dirt]: {
                  base_speed: 1,
                  hydration_cost: 1,
                  slime_weight: 1,
                },
              },
              moisture: {
                thresholds: { wet: 1, damp: 0.5, dry: 0.1 },
                sidewalk_dry_speed: 1,
                sidewalk_dry_hydration_cost: 1,
              },
              slime: {
                deposit_rate_per_step: 1,
                speed_bonus_max: 1,
                hydration_save_max: 1,
                decay_per_tick: {},
              },
              unit_worker: { carry_capacity: 1, hydration_max: 1 },
              colony: {
                build_cost: { biomass: 1, water: 1 },
                build_time_seconds: 1,
              },
              upkeep: {
                interval_seconds: 1,
                base: { water: 1, biomass: 1 },
                colony: { water: 1, biomass: 1 },
                aura: {
                  radius: 1,
                  slime_decay_multiplier: 1,
                  hydration_cost_hard_multiplier: 1,
                  speed_bonus: 1,
                  production_time_multiplier: 1,
                },
                dormant_collapse_seconds: 60,
              },
              goal: {
                type: 'Test',
                colonies_required: 1,
                sustain_minutes: 1,
                active_min_stock_any: 0,
              },
              simulation: { tick_rate_hz: 1, order: [] },
              resources: { biomass: 0, water: 0 },
            },
          };
          const state: StateSnapshotMessage = {
            t: 'State',
            entities: [],
          };
          socket.send(JSON.stringify(lobby));
          socket.send(JSON.stringify(room));
          socket.send(JSON.stringify(state));
        }, 5);
      }
    });

    await connectPromise;

    await waitFor(() => commands.some((command) => command.t === 'Join'));
    await waitFor(() => commands.some((command) => command.t === 'SetReady'));

    expect(lobbyDelivered).toBe(true);
    expect(lobbySpy).toHaveBeenCalled();

    const joinIndex = commands.findIndex((command) => command.t === 'Join');
    const readyIndex = commands.findIndex((command) => command.t === 'SetReady');
    expect(joinIndex).toBeGreaterThan(-1);
    expect(readyIndex).toBeGreaterThan(joinIndex);

    const readyCommand = commands[readyIndex];
    expect(readyCommand).toMatchObject({ t: 'SetReady', ready: true });

    await waitFor(() => commands.some((command) => command.t === 'Move'));
    expect(stateSpy).toHaveBeenCalled();

    const moveIndex = commands.findIndex((command) => command.t === 'Move');
    expect(moveIndex).toBeGreaterThan(readyIndex);
    expect(commands[moveIndex]).toMatchObject({ t: 'Move', dx: 1, dy: 0 });

    client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});

