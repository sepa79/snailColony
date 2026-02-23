import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, Worker, Base, initWorker, initBase } from '../components';
import { harvestSystem } from './harvest.system';
import { TerrainType } from '@snail/protocol';
import type { MapDef, WaterLayer, GrassLayer, Structure } from '@snail/protocol';

describe('harvestSystem', () => {
  it('gathers resources and delivers to base', () => {
    const world = createWorld();
    const base = addEntity(world);
    addComponent(world, Base, base);
    addComponent(world, Position, base);
    initBase(base);
    Position.x[base] = 1;
    Position.y[base] = 0;

    const worker = addEntity(world);
    addComponent(world, Worker, worker);
    addComponent(world, Position, worker);
    initWorker(worker, base);
    Position.x[worker] = 0;
    Position.y[worker] = 0;

    const map: MapDef = {
      width: 2,
      height: 1,
      version: 1,
      moisture: 0,
      tiles: [
        {
          terrain: TerrainType.Dirt,
          water: 'None' as WaterLayer,
          grass: 'None' as GrassLayer,
          structure: 'None' as Structure,
          slime_intensity: 0,
          resources: { biomass: 3 },
        },
        {
          terrain: TerrainType.Dirt,
          water: 'None' as WaterLayer,
          grass: 'None' as GrassLayer,
          structure: 'None' as Structure,
          slime_intensity: 0,
        },
      ],
    } as unknown as MapDef;

    harvestSystem(world, map);
    expect(Worker.carry_biomass[worker]).toBe(3);
    expect(map.tiles[0].resources?.biomass).toBe(0);

    Position.x[worker] = 1;
    harvestSystem(world, map);
    expect(Worker.carry_biomass[worker]).toBe(0);
    expect(Base.biomass[base]).toBe(3);
  });
});
