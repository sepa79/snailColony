import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { World } from '../ecs/world';
import { ClientCommand, ServerMessage } from './messages';

@WebSocketGateway({ path: '/ws' })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private world = new World();
  private interval?: NodeJS.Timer;

  afterInit() {
    this.interval = setInterval(() => {
      this.world.tick();
      const state: ServerMessage = {
        t: 'State',
        entities: this.world.snapshot(),
      };
      const payload = JSON.stringify(state);
      this.server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
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
        this.world.setVelocity(cmd.dx, cmd.dy);
      }
    });
  }

  handleDisconnect() {}
}
