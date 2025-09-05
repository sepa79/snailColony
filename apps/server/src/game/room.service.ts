import { Injectable } from '@nestjs/common';
import { World } from '../ecs/world';

interface PlayerState {
  ready: boolean;
}

interface RoomState {
  id: string;
  players: Map<string, PlayerState>;
  started: boolean;
  world: World;
  interval?: NodeJS.Timeout;
}

@Injectable()
export class RoomService {
  private rooms = new Map<string, RoomState>();

  createRoom(id: string): RoomState {
    if (this.rooms.has(id)) {
      throw new Error('Room already exists');
    }
    const room: RoomState = {
      id,
      players: new Map(),
      started: false,
      world: new World(),
    };
    this.rooms.set(id, room);
    return room;
  }

  getRoom(id: string): RoomState | undefined {
    return this.rooms.get(id);
  }

  joinRoom(roomId: string, playerId: string): RoomState {
    const room = this.rooms.get(roomId) ?? this.createRoom(roomId);
    room.players.set(playerId, { ready: false });
    return room;
  }

  leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.players.delete(playerId);
    if (room.players.size === 0) {
      if (room.interval) {
        clearInterval(room.interval);
      }
      this.rooms.delete(roomId);
    }
  }

  setReady(roomId: string, playerId: string, ready: boolean): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    const player = room.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    player.ready = ready;
  }

  startGame(roomId: string): RoomState {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.started) return room;
    const allReady = [...room.players.values()].every((p) => p.ready);
    if (!allReady) {
      throw new Error('Not all players are ready');
    }
    room.started = true;
    room.interval = setInterval(() => room.world.tick(), 100);
    return room;
  }
}
