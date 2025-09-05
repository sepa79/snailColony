import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { MapService } from '../game/map.service';
import { RoomService } from '../game/room.service';

@Controller('map')
export class MapController {
  constructor(
    private readonly maps: MapService,
    private readonly rooms: RoomService,
  ) {}

  @Get(':roomId')
  getMap(@Param('roomId') roomId: string) {
    const room = this.rooms.getRoom(roomId);
    if (!room) {
      throw new BadRequestException('Room not found');
    }
    return this.maps.load(roomId);
  }
}
