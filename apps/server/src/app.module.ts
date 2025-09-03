import { Module } from '@nestjs/common';
import { GatewayModule } from './ws/gateway.module';
import { HealthController } from './rest/health.controller';
import { LobbyController } from './rest/lobby.controller';

@Module({
  imports: [GatewayModule],
  controllers: [HealthController, LobbyController],
  providers: [],
})
export class AppModule {}
