import { describe, expect, test, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import type WebSocket from 'ws';
import type { AddressInfo } from 'node:net';
import {
  GrassLayer,
  Structure,
  TerrainType,
  WaterLayer,
  type ClientCommand,
  type GameParams,
} from '@snail/protocol';
import {
  LLMGameClient,
  type LobbyStateMessage,
  type RoomStateMessage,
  type StateSnapshotMessage,
  type LLMGameBrain,
} from './client';
import { World } from '../../server/src/ecs/world';

async function waitFor(predicate: () => boolean, timeout = 2000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() - start >= timeout) {
        reject(new Error('Timed out waiting for condition.'));
        return;
      }
      setTimeout(check, 5);
    };
    check();
  });
}

describe('LLMGameClient integration', () => {
  test('relays lobby, room, and state updates and reacts to brain moves', async () => {
    const server = new WebSocketServer({ port: 0 });
    const address = server.address() as AddressInfo;
    const url = `ws://127.0.0.1:${address.port}`;

    const world = new World();
    const map: RoomStateMessage['map'] = {
      width: 3,
      height: 1,
      version: 1,
      moisture: 42,
      tiles: [
        {
          terrain: TerrainType.Dirt,
          water: WaterLayer.None,
          grass: GrassLayer.None,
          structure: Structure.None,
          slime_intensity: 0,
          resources: { biomass: 0, water: 0 },
        },
        {
          terrain: TerrainType.Dirt,
          water: WaterLayer.None,
          grass: GrassLayer.None,
          structure: Structure.None,
          slime_intensity: 0,
          resources: { biomass: 0, water: 0 },
        },
        {
          terrain: TerrainType.Dirt,
          water: WaterLayer.None,
          grass: GrassLayer.None,
          structure: Structure.None,
          slime_intensity: 0,
          resources: { biomass: 0, water: 0 },
        },
      ],
    };
    world.setMap(map);

    const initialEntities = world
      .snapshot()
      .map((entity) => ({ ...entity }));
    const initialEntity = { ...initialEntities[0] };

    const mapForClient: RoomStateMessage['map'] = {
      ...map,
      tiles: map.tiles.map((tile) => ({
        ...tile,
        resources: tile.resources ? { ...tile.resources } : undefined,
      })),
    };

    const lobbyState: LobbyStateMessage = {
      t: 'LobbyState',
      players: [{ name: 'IntegrationBot', ready: false }],
      started: false,
    };

    const params: GameParams = {
      terrain: {
        [TerrainType.Dirt]: {
          base_speed: 1,
          hydration_cost: 0.5,
          slime_weight: 1,
        },
      },
      moisture: {
        thresholds: { wet: 1, damp: 0.5, dry: 0.1 },
        sidewalk_dry_speed: 0.5,
        sidewalk_dry_hydration_cost: 1,
      },
      slime: {
        deposit_rate_per_step: 1,
        speed_bonus_max: 0.2,
        hydration_save_max: 0.1,
        decay_per_tick: {},
      },
      unit_worker: { carry_capacity: 1, hydration_max: 10 },
      colony: {
        build_cost: { biomass: 1, water: 1 },
        build_time_seconds: 1,
      },
      upkeep: {
        interval_seconds: 1,
        base: { water: 0, biomass: 0 },
        colony: { water: 0, biomass: 0 },
        aura: {
          radius: 1,
          slime_decay_multiplier: 1,
          hydration_cost_hard_multiplier: 1,
          speed_bonus: 0,
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
      simulation: {
        tick_rate_hz: 1,
        order: [
          'update_moisture_and_auras',
          'slime_decay',
          'unit_movement_and_slime_deposit',
          'gather_and_deliver',
          'upkeep_tick_if_due',
          'check_goal',
        ],
      },
      resources: { biomass: 0, water: 0 },
    };

    const roomState: RoomStateMessage = {
      t: 'RoomState',
      map: mapForClient,
      entities: initialEntities.map((entity) => ({ ...entity })),
      params,
    };

    const initialState: StateSnapshotMessage = {
      t: 'State',
      entities: initialEntities.map((entity) => ({ ...entity })),
    };

    const forwarded = {
      lobby: [] as LobbyStateMessage[],
      room: [] as RoomStateMessage[],
      state: [] as StateSnapshotMessage[],
    };

    const brainEvents = {
      lobby: [] as LobbyStateMessage[],
      room: [] as RoomStateMessage[],
      state: [] as StateSnapshotMessage[],
    };

    let moveIssued = false;
    const brain: LLMGameBrain = {
      onLobbyState: vi.fn(async (state, ctx) => {
        brainEvents.lobby.push(state);
        ctx.setReady(true);
      }),
      onRoomState: vi.fn(async (state) => {
        brainEvents.room.push(state);
      }),
      onState: vi.fn(async (state) => {
        brainEvents.state.push(state);
        if (!moveIssued) {
          moveIssued = true;
          return { t: 'Move', dx: 1, dy: 0 } as const;
        }
        return undefined;
      }),
    };

    const client = new LLMGameClient({ url, name: 'IntegrationBot', brain });

    client.onLobbyState((state) => {
      forwarded.lobby.push(state);
    });
    client.onRoomState((state) => {
      forwarded.room.push(state);
    });
    client.onState((state) => {
      forwarded.state.push(state);
    });

    const connectionPromise = new Promise<WebSocket>((resolve) => {
      server.once('connection', (socket) => resolve(socket));
    });

    const receivedCommands: ClientCommand[] = [];
    let socket: WebSocket | null = null;

    try {
      const connectPromise = client.connect();
      socket = await connectionPromise;

      socket.on('message', (raw) => {
        const command = JSON.parse(raw.toString()) as ClientCommand;
        receivedCommands.push(command);

        if (command.t === 'Join') {
          socket?.send(JSON.stringify(lobbyState));
          socket?.send(JSON.stringify(roomState));
          socket?.send(JSON.stringify(initialState));
        } else if (command.t === 'Move') {
          world.setVelocity(command.dx, command.dy);
          world.tick();
          const [moved] = world.snapshot();
          const updatedState: StateSnapshotMessage = {
            t: 'State',
            entities: [{ ...moved }],
          };
          socket?.send(JSON.stringify(updatedState));
        }
      });

      await connectPromise;

      await waitFor(() => forwarded.state.length >= 2);

      const joinCommand = receivedCommands.find((command) => command.t === 'Join');
      expect(joinCommand).toMatchObject({ t: 'Join', name: 'IntegrationBot' });
      expect(receivedCommands.some((command) => command.t === 'SetReady')).toBe(
        true,
      );
      expect(receivedCommands.find((command) => command.t === 'Move')).toMatchObject({
        t: 'Move',
        dx: 1,
        dy: 0,
      });

      await waitFor(() => brainEvents.state.length >= 2);
      await waitFor(
        () =>
          forwarded.lobby.length > 0 &&
          forwarded.room.length > 0 &&
          brainEvents.lobby.length > 0 &&
          brainEvents.room.length > 0,
      );

      expect(brainEvents.lobby[0]).toEqual(lobbyState);
      expect(brainEvents.room[0]).toEqual(roomState);
      expect(forwarded.lobby[0]).toEqual(lobbyState);
      expect(forwarded.room[0]).toEqual(roomState);

      expect(client.lobbyState).toEqual(lobbyState);
      expect(client.roomState).toEqual(roomState);

      const [initialFromClient, updatedFromClient] = forwarded.state;
      expect(initialFromClient.entities[0]).toEqual(initialEntity);
      expect(updatedFromClient.entities[0].x).not.toBe(initialEntity.x);
      expect(client.state).toEqual(updatedFromClient);
    } finally {
      client.close();
      socket?.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
