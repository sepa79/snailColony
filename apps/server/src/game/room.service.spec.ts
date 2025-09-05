import { RoomService } from './room.service';

describe('RoomService (single lobby)', () => {
  let svc: RoomService;

  beforeEach(() => {
    svc = new RoomService();
  });

  it('exposes a persistent lobby', () => {
    const rooms = svc.listRooms().map((r) => r.id);
    expect(rooms).toEqual(['lobby']);
  });

  it('tracks players and resets when empty', () => {
    const room = svc.joinRoom('lobby', 'p1');
    expect(room.players.has('p1')).toBe(true);
    svc.setReady('lobby', 'p1', true);
    svc.startGame('lobby');
    expect(room.started).toBe(true);
    svc.leaveRoom('lobby', 'p1');
    expect(room.started).toBe(false);
    expect(svc.listRooms().map((r) => r.id)).toEqual(['lobby']);
  });

  it('starts only when all players ready and at least one player exists', () => {
    expect(() => svc.startGame('lobby')).toThrow();
    svc.joinRoom('lobby', 'a');
    expect(() => svc.startGame('lobby')).toThrow();
    svc.setReady('lobby', 'a', true);
    const room = svc.startGame('lobby');
    expect(room.started).toBe(true);
  });
});
