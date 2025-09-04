export type ClientCommand =
  | { t: 'Ping'; nonce: number }
  | { t: 'Move'; dx: number; dy: number }
  | { t: 'RequestRoomState' };

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

export type ServerMessage =
  | { t: 'Pong'; nonce: number; rtt: number }
  | {
      t: 'RoomState';
      map: MapDef;
      entities: { id: number; x: number; y: number; hydration: number }[];
    }
  | {
      t: 'State';
      entities: { id: number; x: number; y: number; hydration: number }[];
    };
