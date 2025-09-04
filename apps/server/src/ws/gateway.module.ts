import { Module } from '@nestjs/common';
import { GameGateway } from './gateway.service';
import { MapService } from '../game/map.service';

@Module({
  providers: [GameGateway, MapService],
})
export class GatewayModule {}
