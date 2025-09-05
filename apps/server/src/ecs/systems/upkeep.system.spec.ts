import { createWorld, addEntity, addComponent, hasComponent } from 'bitecs';
import { Base, Position, Upkeep, initBase, initUpkeep } from '../components';
import { upkeepSystem } from './upkeep.system';
import type { MapDef, WaterLayer, GrassLayer, Structure, TerrainType } from '@snail/protocol';
import baseParams from '../../config';
const params = JSON.parse(JSON.stringify(baseParams));

function makeMap(structure: Structure = 'Colony' as Structure): MapDef {
  return {
    width: 1,
    height: 1,
    version: 1,
    moisture: 0,
    tiles: [
      {
        terrain: 'grass' as unknown as TerrainType,
        water: 'None' as WaterLayer,
        grass: 'None' as GrassLayer,
        structure,
        slime_intensity: 0,
      },
    ],
  } as unknown as MapDef;
}

describe('upkeepSystem', () => {
  it('deducts cost and stays active when paid', () => {
    const world = createWorld();
    const map = makeMap('None' as Structure);
    const eid = addEntity(world);
    addComponent(world, Base, eid);
    addComponent(world, Position, eid);
    addComponent(world, Upkeep, eid);
    initBase(eid);
    Base.water[eid] = params.upkeep.base.water;
    Base.biomass[eid] = params.upkeep.base.biomass;
    Position.x[eid] = 0;
    Position.y[eid] = 0;
    initUpkeep(eid, 1);
    upkeepSystem(world, map, params.upkeep);
    expect(Base.water[eid]).toBeCloseTo(0);
    expect(Upkeep.active[eid]).toBe(1);
  });

  it('becomes dormant and collapses after time', () => {
    const world = createWorld();
    const map = makeMap();
    const eid = addEntity(world);
    addComponent(world, Base, eid);
    addComponent(world, Position, eid);
    addComponent(world, Upkeep, eid);
    initBase(eid);
    Base.water[eid] = 0;
    Base.biomass[eid] = 0;
    Position.x[eid] = 0;
    Position.y[eid] = 0;
    initUpkeep(eid, 1);
    upkeepSystem(world, map, params.upkeep);
    expect(Upkeep.active[eid]).toBe(0);
    for (let i = 0; i < params.upkeep.dormant_collapse_seconds; i++) {
      upkeepSystem(world, map, params.upkeep);
    }
    expect(hasComponent(world, Base, eid)).toBe(false);
  });
});
