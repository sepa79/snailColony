import { Controller, Get, Post } from '@nestjs/common';
import { RoomService } from '../game/room.service';

@Controller('lobby')
export class LobbyController {
  constructor(private readonly rooms: RoomService) {}

  @Get('rooms')
  listRooms() {
    return { rooms: this.rooms.listRooms().map((r) => r.id) };
  }

  @Post('room')
  createRoom() {
    const id = Math.random().toString(36).slice(2);
    this.rooms.createRoom(id);
    return { roomId: id };
  }
}
