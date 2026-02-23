import { IWorld, defineQuery } from 'bitecs';
import { Base, Upkeep } from '../components';

interface Params {
  colonies_required: number;
  sustain_minutes: number;
  active_min_stock_any: number;
  tick_rate_hz: number;
  /** entity id of the starting base */
  starting_base?: number;
}

export interface ScoreState {
  /** number of consecutive ticks meeting the sustain condition */
  sustainTicks: number;
  /** track known colonies to detect collapses */
  colonies: Set<number>;
  /** last counted active colonies */
  activeColonies: number;
  /** result once game is over */
  result?: 'Victory' | 'Defeat';
}

const colonyQuery = defineQuery([Base, Upkeep]);

export function scoringSystem(world: IWorld, params: Params, state: ScoreState) {
  const eids = colonyQuery(world);

  // count active colonies and ensure they have enough resources
  let active = 0;
  for (const eid of eids) {
    if (
      Upkeep.active[eid] === 1 &&
      (Base.biomass[eid] >= params.active_min_stock_any ||
        Base.water[eid] >= params.active_min_stock_any)
    ) {
      active += 1;
    }
  }

  // sustain timer management
  if (active >= params.colonies_required) {
    state.sustainTicks += 1;
  } else {
    state.sustainTicks = 0;
  }

  // detect colony collapse
  const newSet = new Set<number>(eids);
  for (const id of state.colonies) {
    if (!newSet.has(id) && id !== params.starting_base) {
      state.result = 'Defeat';
      break;
    }
  }
  state.colonies = newSet;

  // victory condition
  const requiredTicks = params.sustain_minutes * 60 * params.tick_rate_hz;
  if (state.sustainTicks >= requiredTicks) {
    state.result = 'Victory';
  }

  state.activeColonies = active;
  return state;
}

