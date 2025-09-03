import { Module } from '@nestjs/common';
import { GameGateway } from './gateway.service';

@Module({
  providers: [GameGateway],
})
export class GatewayModule {}
