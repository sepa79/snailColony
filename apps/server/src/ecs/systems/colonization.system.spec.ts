import { createWorld, addEntity, addComponent, defineQuery, hasComponent } from 'bitecs';
import { Base, Position, BuildTimer, initBase } from '../components';
import { colonizationSystem } from './colonization.system';
import type { MapDef, TerrainType, WaterLayer, GrassLayer, Structure } from '@snail/protocol';
import baseParams from '../../config';

describe('colonizationSystem', () => {
  it('consumes resources and spawns colony after build time', () => {
    const params = JSON.parse(JSON.stringify(baseParams));
    params.colony.build_time_seconds = 2;

    const map: MapDef = {
      width: 2,
      height: 1,
      version: 1,
      moisture: 0,
      tiles: [
        {
          terrain: 'Dirt' as unknown as TerrainType,
          water: 'None' as WaterLayer,
          grass: 'None' as GrassLayer,
          structure: 'None' as Structure,
          slime_intensity: 0,
        },
        {
          terrain: 'Dirt' as unknown as TerrainType,
          water: 'None' as WaterLayer,
          grass: 'None' as GrassLayer,
          structure: 'None' as Structure,
          slime_intensity: 0,
        },
      ],
    } as unknown as MapDef;

    const world = createWorld();
    const base = addEntity(world);
    addComponent(world, Base, base);
    addComponent(world, Position, base);
    initBase(base);
    Position.x[base] = 0;
    Position.y[base] = 0;
    Base.biomass[base] = params.colony.build_cost.biomass;
    Base.water[base] = params.colony.build_cost.water;

    colonizationSystem(world, map, params, [{ base, x: 1, y: 0 }]);
    expect(Base.biomass[base]).toBe(0);
    expect(Base.water[base]).toBe(0);

    const buildQuery = defineQuery([BuildTimer, Position]);
    const builds = buildQuery(world);
    expect(builds.length).toBe(1);
    const colony = builds[0];

    colonizationSystem(world, map, params);
    colonizationSystem(world, map, params);

    expect(map.tiles[1].structure).toBe('Colony');
    expect(hasComponent(world, Base, colony)).toBe(true);
    expect(hasComponent(world, BuildTimer, colony)).toBe(false);
  });

  it('ignores build requests outside map bounds', () => {
    const params = JSON.parse(JSON.stringify(baseParams));
    const map: MapDef = {
      width: 1,
      height: 1,
      version: 1,
      moisture: 0,
      tiles: [
        {
          terrain: 'Dirt' as unknown as TerrainType,
          water: 'None' as WaterLayer,
          grass: 'None' as GrassLayer,
          structure: 'None' as Structure,
          slime_intensity: 0,
        },
      ],
    } as unknown as MapDef;
    const world = createWorld();
    const base = addEntity(world);
    addComponent(world, Base, base);
    addComponent(world, Position, base);
    initBase(base);
    Position.x[base] = 0;
    Position.y[base] = 0;
    Base.biomass[base] = params.colony.build_cost.biomass;
    Base.water[base] = params.colony.build_cost.water;
    colonizationSystem(world, map, params, [{ base, x: 5, y: 0 }]);
    const buildQuery = defineQuery([BuildTimer, Position]);
    expect(buildQuery(world).length).toBe(0);
  });
});
