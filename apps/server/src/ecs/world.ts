import { IWorld, addComponent, addEntity, createWorld } from 'bitecs';
import { Hydration, Position, Velocity, Worker, initWorker } from './components';
import { movementSystem } from './systems/movement.system';
import { hydrationSystem } from './systems/hydration.system';
import { MapService } from '../game/map.service';
import { MapDef } from '@snail/protocol';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Params {
  terrain: Record<string, { base_speed: number; hydration_cost: number }>;
}

export class World {
  private world: IWorld;
  private snail: number;
  private map: MapDef;
  private params: Params;

  constructor() {
    this.world = createWorld();
    this.snail = addEntity(this.world);
    addComponent(this.world, Position, this.snail);
    addComponent(this.world, Velocity, this.snail);
    addComponent(this.world, Hydration, this.snail);
    addComponent(this.world, Worker, this.snail);
    initWorker(this.snail);
    Position.x[this.snail] = 0;
    Position.y[this.snail] = 0;
    Velocity.dx[this.snail] = 0;
    Velocity.dy[this.snail] = 0;
    Hydration.value[this.snail] = 100;
    const svc = new MapService();
    this.map = svc.load('test');
    this.params = JSON.parse(
      readFileSync(join(__dirname, '../../config/parameters.json'), 'utf-8')
    ) as Params;
  }

  tick() {
    movementSystem(this.world, this.map, this.params);
    hydrationSystem(this.world, this.map, this.params);
  }

  snapshot() {
    return [
      {
        id: this.snail,
        x: Position.x[this.snail],
        y: Position.y[this.snail],
        hydration: Hydration.value[this.snail],
      },
    ];
  }

  setVelocity(dx: number, dy: number) {
    Velocity.dx[this.snail] = dx;
    Velocity.dy[this.snail] = dy;
  }
}

