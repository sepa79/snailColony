import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
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
    return this.maps.load(roomId);
  }

  @Post(':roomId/generate')
  generateMap(
    @Param('roomId') roomId: string,
    @Query('w') w?: string,
    @Query('h') h?: string,
  ) {
    const room = this.rooms.getRoom(roomId);
    if (room?.started) {
      throw new BadRequestException('Game already started');
    }
    const width = w ? parseInt(w, 10) : undefined;
    const height = h ? parseInt(h, 10) : undefined;
    return this.maps.generate(roomId, width, height);
  }
}
