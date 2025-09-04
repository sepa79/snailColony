import { Module } from '@nestjs/common';
import { GatewayModule } from './ws/gateway.module';
import { HealthController } from './rest/health.controller';
import { LobbyController } from './rest/lobby.controller';
import { UiController } from './rest/ui.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/ui',
    }),
    GatewayModule,
  ],
  controllers: [HealthController, LobbyController, UiController],
  providers: [],
})
export class AppModule {}
