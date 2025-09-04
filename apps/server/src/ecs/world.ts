import { IWorld, addComponent, addEntity, createWorld } from 'bitecs';
import { Hydration, Position, Velocity } from './components';
import { movementSystem } from './systems/movement.system';
import { hydrationSystem } from './systems/hydration.system';

export class World {
  private world: IWorld;
  private snail: number;

  constructor() {
    this.world = createWorld();
    this.snail = addEntity(this.world);
    addComponent(this.world, Position, this.snail);
    addComponent(this.world, Velocity, this.snail);
    addComponent(this.world, Hydration, this.snail);
    Position.x[this.snail] = 0;
    Position.y[this.snail] = 0;
    Velocity.dx[this.snail] = 0;
    Velocity.dy[this.snail] = 0;
    Hydration.value[this.snail] = 100;
  }

  tick() {
    movementSystem(this.world);
    hydrationSystem(this.world);
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

