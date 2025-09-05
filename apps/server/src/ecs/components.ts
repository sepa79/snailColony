import { defineComponent, Types } from 'bitecs';

export const Position = defineComponent({ x: Types.f32, y: Types.f32 });
export const Velocity = defineComponent({ dx: Types.f32, dy: Types.f32 });
export const Hydration = defineComponent({ value: Types.f32 });
export const Worker = defineComponent({
  carry_biomass: Types.f32,
  carry_water: Types.f32,
  carry_capacity: Types.f32,
  hydration_max: Types.f32,
  base: Types.eid,
});
export const Dead = defineComponent();
export const Base = defineComponent({
  biomass: Types.f32,
  water: Types.f32,
});
export const BuildTimer = defineComponent({ remaining: Types.f32 });

export type WorldComponents = {
  position: typeof Position;
  velocity: typeof Velocity;
  hydration: typeof Hydration;
  worker: typeof Worker;
  dead: typeof Dead;
  base: typeof Base;
  buildTimer: typeof BuildTimer;
};

import params from '../config';

export function initWorker(eid: number, baseEid = 0) {
  Worker.carry_biomass[eid] = 0;
  Worker.carry_water[eid] = 0;
  Worker.carry_capacity[eid] = params.unit_worker.carry_capacity;
  Worker.hydration_max[eid] = params.unit_worker.hydration_max;
  Worker.base[eid] = baseEid;
}

export function initBase(eid: number) {
  Base.biomass[eid] = 0;
  Base.water[eid] = 0;
}

