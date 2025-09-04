import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, Velocity } from '../components';
import { movementSystem } from './movement.system';

describe('movementSystem', () => {
  function setup(x: number, y: number, dx: number, dy: number) {
    const world = createWorld();
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    Position.x[eid] = x;
    Position.y[eid] = y;
    Velocity.dx[eid] = dx;
    Velocity.dy[eid] = dy;
    return { world, eid };
  }

  it('updates position with positive velocity', () => {
    const { world, eid } = setup(0, 0, 2, 3);
    movementSystem(world);
    expect(Position.x[eid]).toBe(2);
    expect(Position.y[eid]).toBe(3);
  });

  it('handles negative velocities crossing boundaries', () => {
    const { world, eid } = setup(1, 1, -2, -4);
    movementSystem(world);
    expect(Position.x[eid]).toBe(-1);
    expect(Position.y[eid]).toBe(-3);
  });

  it('does not move when velocity is zero', () => {
    const { world, eid } = setup(5, 5, 0, 0);
    movementSystem(world);
    expect(Position.x[eid]).toBe(5);
    expect(Position.y[eid]).toBe(5);
  });
});

