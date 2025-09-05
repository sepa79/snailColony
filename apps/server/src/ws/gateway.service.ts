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
  private clientInfo = new Map<WebSocket, { roomId: string; playerId: string }>();
  private roomClients = new Map<string, Set<WebSocket>>();

  constructor(
    private readonly maps: MapService,
    private readonly rooms: RoomService,
  ) {
    this.map = this.maps.load('default');
  }

  afterInit() {
    this.interval = setInterval(() => {
      for (const room of this.rooms.listRooms()) {
        room.world.tick();
        const state: ServerMessage = {
          t: 'State',
          entities: room.world.snapshot(),
        };
        const payload = JSON.stringify(state);
        const clients = this.roomClients.get(room.id);
        clients?.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      }
    }, 100);
  }

  handleConnection(client: WebSocket) {
    client.on('message', (raw) => {
      const cmd = JSON.parse(raw.toString()) as ClientCommand;
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
        const room = this.rooms.getRoom(info.roomId);
        room?.world.setVelocity(cmd.dx, cmd.dy);
      } else if (cmd.t === 'JoinRoom') {
        const playerId = Math.random().toString(36).slice(2);
        const room = this.rooms.joinRoom(cmd.roomId, playerId);
        this.clientInfo.set(client, { roomId: cmd.roomId, playerId });
        if (!this.roomClients.has(cmd.roomId)) {
          this.roomClients.set(cmd.roomId, new Set());
        }
        this.roomClients.get(cmd.roomId)!.add(client);
        const init: ServerMessage = {
          t: 'RoomState',
          map: this.map,
          entities: room.world.snapshot(),
          params,
        };
        client.send(JSON.stringify(init));
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    const info = this.clientInfo.get(client);
    if (!info) return;
    this.rooms.leaveRoom(info.roomId, info.playerId);
    this.clientInfo.delete(client);
    const set = this.roomClients.get(info.roomId);
    set?.delete(client);
    if (set && set.size === 0) {
      this.roomClients.delete(info.roomId);
    }
  }
}
