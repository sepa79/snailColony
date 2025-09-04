import { defineComponent, Types } from 'bitecs';

export const Position = defineComponent({ x: Types.f32, y: Types.f32 });
export const Velocity = defineComponent({ dx: Types.f32, dy: Types.f32 });
export const Hydration = defineComponent({ value: Types.f32 });
export const Worker = defineComponent({
  carry: Types.f32,
  carry_capacity: Types.f32,
  hydration_max: Types.f32,
});
export const Dead = defineComponent();

export type WorldComponents = {
  position: typeof Position;
  velocity: typeof Velocity;
  hydration: typeof Hydration;
  worker: typeof Worker;
  dead: typeof Dead;
};

import params from '../config';

export function initWorker(eid: number) {
  Worker.carry[eid] = 0;
  Worker.carry_capacity[eid] = params.unit_worker.carry_capacity;
  Worker.hydration_max[eid] = params.unit_worker.hydration_max;
}

