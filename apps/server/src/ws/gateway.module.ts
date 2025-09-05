import { Module } from '@nestjs/common';
import { GameGateway } from './gateway.service';
import { MapService } from '../game/map.service';
import { RoomService } from '../game/room.service';

@Module({
  providers: [GameGateway, MapService, RoomService],
  exports: [GameGateway, MapService, RoomService],
})
export class GatewayModule {}
