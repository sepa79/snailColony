import { Controller, Post } from '@nestjs/common';

@Controller('lobby')
export class LobbyController {
  @Post('room')
  createRoom() {
    return { roomId: 'demo' };
  }
}
