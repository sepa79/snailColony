import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, LogLevel } from '@nestjs/common';
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
  private readonly logger = new Logger(GameGateway.name);

  constructor() {
    const level = process.env.LOG_LEVEL as LogLevel | undefined;
    if (level) {
      const levels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
      const index = levels.indexOf(level);
      if (index !== -1) {
        Logger.overrideLogger(levels.slice(0, index + 1));
      }
    }
  }

  afterInit() {
    this.interval = setInterval(() => {
      this.world.tick();
      const state: ServerMessage = {
        t: 'State',
        entities: this.world.snapshot(),
      };
      const payload = JSON.stringify(state);
      const first = state.entities[0];
      this.logger.debug(
        `Broadcasting state: ${state.entities.length} entities; first at (${first?.x}, ${first?.y})`,
      );
      this.server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }, 100);
  }

  handleConnection(client: WebSocket) {
    this.logger.log('Client connected');
    client.on('message', (raw) => {
      const cmd = JSON.parse(raw.toString()) as ClientCommand;
      this.logger.debug(`Processing command: ${cmd.t} ${JSON.stringify(cmd)}`);
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

  handleDisconnect() {
    this.logger.log('Client disconnected');
  }
}
