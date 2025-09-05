import {
  BadRequestException,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { RoomService } from '../game/room.service';
import { GameGateway } from '../ws/gateway.service';

@Controller('lobby')
export class LobbyController {
  constructor(
    private readonly rooms: RoomService,
    private readonly gateway: GameGateway,
  ) {}

  @Get('rooms')
  listRooms() {
    const room = this.rooms.listRooms()[0];
    return {
      id: room.id,
      players: [...room.players.entries()].map(([name, p]) => ({
        name,
        ready: p.ready,
      })),
      started: room.started,
    };
  }

  @Post('start')
  startGame() {
    try {
      this.rooms.startGame('lobby');
      this.gateway.broadcastLobby();
      this.gateway.broadcastRoomState();
      return { ok: true };
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
