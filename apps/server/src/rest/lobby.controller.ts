import { Controller, Param, Post } from '@nestjs/common';

@Controller('lobby')
export class LobbyController {
  @Post('room')
  createRoom() {
    return { roomId: 'demo' };
  }

  @Post('room/:id/start')
  startRoom(@Param('id') id: string) {
    return { roomId: id, started: true };
  }

  @Post('room/:id/load')
  loadRoom(@Param('id') id: string) {
    return { roomId: id, loaded: true };
  }
}
