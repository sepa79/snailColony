import { defineComponent, Types } from 'bitecs';

export const Position = defineComponent({ x: Types.f32, y: Types.f32 });
export const Velocity = defineComponent({ dx: Types.f32, dy: Types.f32 });
export const Hydration = defineComponent({ value: Types.f32 });

export type WorldComponents = {
  position: typeof Position;
  velocity: typeof Velocity;
  hydration: typeof Hydration;
};

