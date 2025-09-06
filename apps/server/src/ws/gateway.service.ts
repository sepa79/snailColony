import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { ClientCommand, ServerMessage } from '@snail/protocol';
import { MapService } from '../game/map.service';
import { RoomService } from '../game/room.service';
import params from '../config';

@WebSocketGateway({ path: '/ws' })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private interval?: NodeJS.Timer;
  private clientInfo = new Map<WebSocket, { playerId: string }>();
  private clients = new Set<WebSocket>();

  constructor(
    private readonly maps: MapService,
    private readonly rooms: RoomService,
  ) {}

  afterInit() {
    this.interval = setInterval(() => {
      const room = this.rooms.getRoom('lobby');
      if (!room || !room.started) return;
      room.world.tick();
      const state: ServerMessage = {
        t: 'State',
        entities: room.world.snapshot(),
      };
      const payload = JSON.stringify(state);
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });

      const progress = room.world.goalProgress();
      const progressMsg: ServerMessage = {
        t: 'GoalProgress',
        active: progress.active,
        required: progress.required,
        sustain_seconds: progress.sustain_seconds,
        sustain_required: progress.sustain_required,
      };
      const progressPayload = JSON.stringify(progressMsg);
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(progressPayload);
        }
      });

      const result = room.world.goalResult();
      if (result) {
        const resultMsg: ServerMessage = { t: 'GoalResult', result };
        const resultPayload = JSON.stringify(resultMsg);
        this.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(resultPayload);
          }
        });
      }
    }, 100);
  }

  broadcastLobby(target?: WebSocket) {
    const room = this.rooms.getRoom('lobby');
    if (!room) return;
    const lobby: ServerMessage = {
      t: 'LobbyState',
      players: [...room.players.entries()].map(([name, p]) => ({
        name,
        ready: p.ready,
      })),
      started: room.started,
    };
    const payload = JSON.stringify(lobby);
    if (target) {
      if (target.readyState === WebSocket.OPEN) target.send(payload);
    } else {
      this.server.clients.forEach((c) => {
        if (c.readyState === WebSocket.OPEN) c.send(payload);
      });
    }
  }

  broadcastRoomState() {
    const room = this.rooms.getRoom('lobby');
    if (!room) return;
    const map = this.maps.load('lobby');
    const init: ServerMessage = {
      t: 'RoomState',
      map,
      entities: room.world.snapshot(),
      params,
    };
    const payload = JSON.stringify(init);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });
  }

  handleConnection(client: WebSocket) {
    this.broadcastLobby(client);
    client.on('message', (raw) => {
      const text = raw.toString();
      this.server.clients.forEach((c) => {
        if (c.readyState === WebSocket.OPEN) {
          c.send(JSON.stringify({ t: 'Log', dir: 'IN', msg: text }));
        }
      });
      const cmd = JSON.parse(text) as ClientCommand;
      if (cmd.t === 'Ping') {
        const pong: ServerMessage = {
          t: 'Pong',
          nonce: cmd.nonce,
          rtt: Date.now() - cmd.nonce,
        };
        client.send(JSON.stringify(pong));
      } else if (cmd.t === 'Move') {
        const info = this.clientInfo.get(client);
        if (!info) return;
        const room = this.rooms.getRoom('lobby');
        if (!room || !room.started) return;
        room.world.setVelocity(cmd.dx, cmd.dy);
      } else if (cmd.t === 'Join') {
        if (!cmd.name) return;
        const room = this.rooms.joinRoom('lobby', cmd.name);
        this.clientInfo.set(client, { playerId: cmd.name });
        this.clients.add(client);
        this.broadcastLobby();
        if (room.started) {
          const map = this.maps.load('lobby');
          const init: ServerMessage = {
            t: 'RoomState',
            map,
            entities: room.world.snapshot(),
            params,
          };
          client.send(JSON.stringify(init));
        }
      } else if (cmd.t === 'SetReady') {
        const info = this.clientInfo.get(client);
        if (!info) return;
        this.rooms.setReady('lobby', info.playerId, cmd.ready);
        this.broadcastLobby();
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    const info = this.clientInfo.get(client);
    if (!info) return;
    this.rooms.leaveRoom('lobby', info.playerId);
    this.clientInfo.delete(client);
    this.clients.delete(client);
    this.broadcastLobby();
  }
}
