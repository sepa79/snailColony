import { Controller, Get } from '@nestjs/common';
import { RoomService } from '../game/room.service';

@Controller('lobby')
export class LobbyController {
  constructor(private readonly rooms: RoomService) {}

  @Get('rooms')
  listRooms() {
    const room = this.rooms.listRooms()[0];
    return {
      id: room.id,
      players: [...room.players.keys()],
      started: room.started,
    };
  }
}
