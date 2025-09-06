import { MapController } from './map.controller';
import { MapService } from '../game/map.service';
import { RoomService } from '../game/room.service';
import { ConflictException } from '@nestjs/common';

describe('MapController', () => {
  it('throws when generating map after game start', () => {
    const maps = new MapService();
    const rooms = new RoomService();
    const controller = new MapController(maps, rooms);
    // simulate a player joining and readying up
    rooms.joinRoom('lobby', 'p1');
    rooms.setReady('lobby', 'p1', true);
    rooms.startGame('lobby');
    expect(() => controller.generateMap('lobby')).toThrow(ConflictException);
  });
});
