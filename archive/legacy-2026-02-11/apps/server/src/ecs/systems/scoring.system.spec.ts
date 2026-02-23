import {
  createWorld,
  addEntity,
  addComponent,
  removeComponent,
} from 'bitecs';
import { Base, Upkeep, initBase, initUpkeep } from '../components';
import { scoringSystem, ScoreState } from './scoring.system';

describe('scoringSystem', () => {
  it('triggers victory after sustaining colonies', () => {
    const world = createWorld();
    const base = addEntity(world);
    addComponent(world, Base, base);
    addComponent(world, Upkeep, base);
    initBase(base);
    initUpkeep(base, 0);
    Base.biomass[base] = 10;

    const colony = addEntity(world);
    addComponent(world, Base, colony);
    addComponent(world, Upkeep, colony);
    initBase(colony);
    initUpkeep(colony, 0);
    Base.biomass[colony] = 10;

    const params = {
      colonies_required: 2,
      sustain_minutes: 1 / 60, // one second
      active_min_stock_any: 5,
      tick_rate_hz: 1,
      starting_base: base,
    };
    const state: ScoreState = {
      sustainTicks: 0,
      colonies: new Set(),
      activeColonies: 0,
    };

    scoringSystem(world, params, state);

    expect(state.result).toBe('Victory');
  });

  it('triggers defeat when a colony collapses', () => {
    const world = createWorld();
    const base = addEntity(world);
    addComponent(world, Base, base);
    addComponent(world, Upkeep, base);
    initBase(base);
    initUpkeep(base, 0);

    const colony = addEntity(world);
    addComponent(world, Base, colony);
    addComponent(world, Upkeep, colony);
    initBase(colony);
    initUpkeep(colony, 0);

    const params = {
      colonies_required: 1,
      sustain_minutes: 1,
      active_min_stock_any: 0,
      tick_rate_hz: 1,
      starting_base: base,
    };
    const state: ScoreState = {
      sustainTicks: 0,
      colonies: new Set(),
      activeColonies: 0,
    };

    // initial tick to register colonies
    scoringSystem(world, params, state);

    // remove colony to simulate collapse
    removeComponent(world, Base, colony);
    removeComponent(world, Upkeep, colony);

    scoringSystem(world, params, state);

    expect(state.result).toBe('Defeat');
  });
});

