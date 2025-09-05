export type ClientCommand =
  | { t: 'Ping'; nonce: number }
  | { t: 'Move'; dx: number; dy: number }
  | { t: 'Join'; name: string }
  | { t: 'SetReady'; ready: boolean };

export enum TerrainType {
  Dirt = 'Dirt',
  Mud = 'Mud',
  Sand = 'Sand',
  Rock = 'Rock',
  Brush = 'Brush',
  Cliff = 'Cliff',
  ShallowWaterBed = 'ShallowWaterBed',
  Road = 'Road',
}

export enum WaterLayer {
  None = 'None',
  Puddle = 'Puddle',
  Stream = 'Stream',
  Full = 'Full',
}

export enum GrassLayer {
  None = 'None',
  Sparse = 'Sparse',
  Normal = 'Normal',
  Dense = 'Dense',
}

export enum Structure {
  None = 'None',
  Colony = 'Colony',
  Bridge = 'Bridge',
}

export interface Tile {
  terrain: TerrainType;
  water: WaterLayer;
  grass: GrassLayer;
  structure: Structure;
  slime_intensity: number;
  resources?: {
    biomass?: number;
    water?: number;
  };
}

export interface MapDef {
  width: number;
  height: number;
  tiles: Tile[];
  version: number;
  moisture: number;
}

export interface GameParams {
  terrain: Record<
    string,
    { base_speed: number; hydration_cost: number; slime_weight: number }
  >;
  moisture: {
    thresholds: { wet: number; damp: number; dry: number };
    sidewalk_dry_speed: number;
    sidewalk_dry_hydration_cost: number;
  };
  slime: {
    deposit_rate_per_step: number;
    speed_bonus_max: number;
    hydration_save_max: number;
    decay_per_tick: Record<string, Record<string, number>>;
  };
  unit_worker: { carry_capacity: number; hydration_max: number };
  colony: {
    build_cost: { biomass: number; water: number };
    build_time_seconds: number;
  };
  upkeep: {
    interval_seconds: number;
    base: { water: number; biomass: number };
    colony: { water: number; biomass: number };
    aura: {
      radius: number;
      slime_decay_multiplier: number;
      hydration_cost_hard_multiplier: number;
      speed_bonus: number;
      production_time_multiplier: number;
    };
    dormant_collapse_seconds: number;
  };
  goal: {
    type: string;
    colonies_required: number;
    sustain_minutes: number;
    active_min_stock_any: number;
  };
  simulation: { tick_rate_hz: number; order: string[] };
  resources?: { biomass?: number; water?: number };
}

export type ServerMessage =
  | { t: 'Pong'; nonce: number; rtt: number }
  | {
      t: 'LobbyState';
      players: { name: string; ready: boolean }[];
      started: boolean;
    }
  | {
      t: 'RoomState';
      map: MapDef;
      entities: { id: number; x: number; y: number; hydration: number }[];
      params: GameParams;
    }
  | {
      t: 'State';
      entities: { id: number; x: number; y: number; hydration: number }[];
    }
  | {
      t: 'GoalProgress';
      active: number;
      required: number;
      sustain_seconds: number;
      sustain_required: number;
    }
  | { t: 'GoalResult'; result: 'Victory' | 'Defeat' };
