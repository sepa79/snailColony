import { Controller, Get, Param } from '@nestjs/common';
import { MapService } from '../game/map.service';

@Controller('map')
export class MapController {
  constructor(private readonly maps: MapService) {}

  @Get(':roomId')
  getMap(@Param('roomId') roomId: string) {
    return this.maps.load(roomId);
  }
}
