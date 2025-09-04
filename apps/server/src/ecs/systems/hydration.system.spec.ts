import { createWorld, addEntity, addComponent } from 'bitecs';
import { Hydration, Velocity } from '../components';
import { hydrationSystem } from './hydration.system';

describe('hydrationSystem', () => {
  function setup(hydration: number, dx: number, dy: number) {
    const world = createWorld();
    const eid = addEntity(world);
    addComponent(world, Hydration, eid);
    addComponent(world, Velocity, eid);
    Hydration.value[eid] = hydration;
    Velocity.dx[eid] = dx;
    Velocity.dy[eid] = dy;
    return { world, eid };
  }

  it('decreases hydration when entity moves', () => {
    const { world, eid } = setup(10, 1, 0);
    hydrationSystem(world);
    expect(Hydration.value[eid]).toBe(9);
  });

  it('keeps hydration when stationary', () => {
    const { world, eid } = setup(10, 0, 0);
    hydrationSystem(world);
    expect(Hydration.value[eid]).toBe(10);
  });

  it('does not drop hydration below zero', () => {
    const { world, eid } = setup(1, 1, 1);
    hydrationSystem(world);
    hydrationSystem(world);
    expect(Hydration.value[eid]).toBe(0);
  });
});

