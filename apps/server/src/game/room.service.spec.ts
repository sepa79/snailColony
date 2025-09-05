import { RoomService } from './room.service';

describe('RoomService', () => {
  it('initializes with a lobby room', () => {
    const svc = new RoomService();
    svc.onModuleInit();
    const rooms = svc.listRooms().map((r) => r.id);
    expect(rooms).toContain('lobby');
  });

  it('creates rooms and tracks join/leave', () => {
    const svc = new RoomService();
    const room = svc.createRoom('r1');
    expect(room.id).toBe('r1');
    svc.joinRoom('r1', 'p1');
    expect(svc.getRoom('r1')?.players.has('p1')).toBe(true);
    svc.leaveRoom('r1', 'p1');
    expect(svc.getRoom('r1')).toBeUndefined();
  });

  it('lists existing rooms', () => {
    const svc = new RoomService();
    svc.createRoom('a');
    svc.createRoom('b');
    expect(svc.listRooms().map((r) => r.id).sort()).toEqual(['a', 'b']);
  });

  it('starts game when all players ready', () => {
    jest.useFakeTimers();
    const svc = new RoomService();
    svc.createRoom('r1');
    svc.joinRoom('r1', 'a');
    svc.joinRoom('r1', 'b');
    svc.setReady('r1', 'a', true);
    expect(() => svc.startGame('r1')).toThrow();
    svc.setReady('r1', 'b', true);
    const room = svc.startGame('r1');
    expect(room.started).toBe(true);
    const tickSpy = jest.spyOn(room.world, 'tick');
    jest.advanceTimersByTime(100);
    expect(tickSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
