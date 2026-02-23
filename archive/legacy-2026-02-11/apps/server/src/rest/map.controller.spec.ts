import { MapController } from './map.controller';
import { MapService } from '../game/map.service';
import { RoomService } from '../game/room.service';
import { ConflictException } from '@nestjs/common';

describe('MapController', () => {
  it('updates world map dimensions when regenerated', () => {
    const maps = new MapService();
    const rooms = new RoomService();
    const controller = new MapController(maps, rooms);
    const map = controller.generateMap('lobby', '3', '4');
    expect(map.width).toBe(3);
    expect(map.height).toBe(4);
    const worldMap = rooms.getRoom('lobby')!.world.getMap();
    expect(worldMap.width).toBe(3);
    expect(worldMap.height).toBe(4);
  });

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
