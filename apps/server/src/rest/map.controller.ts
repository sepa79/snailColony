import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MapService } from '../game/map.service';

@Controller('map')
export class MapController {
  constructor(private readonly maps: MapService) {}

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
    const width = w ? parseInt(w, 10) : undefined;
    const height = h ? parseInt(h, 10) : undefined;
    return this.maps.generate(roomId, width, height);
  }
}
