import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { ClientCommand, ServerMessage, MapDef } from '@snail/protocol';
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
  private map: MapDef;
  private clientInfo = new Map<WebSocket, { playerId: string }>();
  private clients = new Set<WebSocket>();

  constructor(
    private readonly maps: MapService,
    private readonly rooms: RoomService,
  ) {
    this.map = this.maps.load('default');
  }

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
    }, 100);
  }

  handleConnection(client: WebSocket) {
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
        room?.world.setVelocity(cmd.dx, cmd.dy);
      } else if (cmd.t === 'Join') {
        const playerId = Math.random().toString(36).slice(2);
        const room = this.rooms.joinRoom('lobby', playerId);
        this.clientInfo.set(client, { playerId });
        this.clients.add(client);
        const init: ServerMessage = {
          t: 'RoomState',
          map: this.map,
          entities: room.world.snapshot(),
          params,
        };
        client.send(JSON.stringify(init));
      } else if (cmd.t === 'SetReady') {
        const info = this.clientInfo.get(client);
        if (!info) return;
        this.rooms.setReady('lobby', info.playerId, cmd.ready);
        const room = this.rooms.getRoom('lobby');
        if (
          room &&
          !room.started &&
          room.players.size > 0 &&
          [...room.players.values()].every((p) => p.ready)
        ) {
          this.rooms.startGame('lobby');
        }
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    const info = this.clientInfo.get(client);
    if (!info) return;
    this.rooms.leaveRoom('lobby', info.playerId);
    this.clientInfo.delete(client);
    this.clients.delete(client);
  }
}
