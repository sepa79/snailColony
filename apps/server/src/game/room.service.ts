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
  private lobby: RoomState = {
    id: 'lobby',
    players: new Map(),
    started: false,
    world: new World(),
  };

  getRoom(id: string): RoomState | undefined {
    return id === 'lobby' ? this.lobby : undefined;
  }

  listRooms(): RoomState[] {
    return [this.lobby];
  }

  joinRoom(roomId: string, playerId: string): RoomState {
    if (roomId !== 'lobby') {
      throw new Error('Invalid room');
    }
    this.lobby.players.set(playerId, { ready: false });
    return this.lobby;
  }

  leaveRoom(roomId: string, playerId: string): void {
    if (roomId !== 'lobby') return;
    this.lobby.players.delete(playerId);
    if (this.lobby.players.size === 0) {
      if (this.lobby.interval) {
        clearInterval(this.lobby.interval);
        this.lobby.interval = undefined;
      }
      this.lobby.started = false;
    }
  }

  setReady(roomId: string, playerId: string, ready: boolean): void {
    if (roomId !== 'lobby') {
      throw new Error('Room not found');
    }
    const player = this.lobby.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    player.ready = ready;
  }

  startGame(roomId: string): RoomState {
    if (roomId !== 'lobby') {
      throw new Error('Room not found');
    }
    if (this.lobby.started) return this.lobby;
    if (this.lobby.players.size === 0) {
      throw new Error('No players in lobby');
    }
    const allReady = [...this.lobby.players.values()].every((p) => p.ready);
    if (!allReady) {
      throw new Error('Not all players are ready');
    }
    this.lobby.started = true;
    this.lobby.interval = setInterval(() => this.lobby.world.tick(), 100);
    return this.lobby;
  }
}
