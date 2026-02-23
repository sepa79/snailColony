export type Terrain =
  | "Dirt"
  | "Mud"
  | "Sand"
  | "Rock"
  | "Brush"
  | "Road";

export interface TileSeed {
  terrain: Terrain;
  water: number;
  biomass: number;
  slime: number;
}

export interface TerrainStats {
  baseSpeed: number;
  hydrationCost: number;
  slimeWeight: number;
  hard: boolean;
  colonyBuildable: boolean;
}

export interface GameParams {
  tickRate: number;
  worker: {
    hydrationMax: number;
    carryCapacity: number;
    spawnCost: { biomass: number; water: number };
  };
  moisture: {
    start: number;
    dropPerTick: number;
    thresholds: { wet: number; damp: number };
  };
  slime: {
    depositRate: number;
    speedBonusMax: number;
    hydrationSaveMax: number;
    decayPerTick: Record<"wet" | "damp" | "dry", Record<Terrain, number>>;
  };
  colony: {
    buildCost: { biomass: number; water: number };
    buildTimeSeconds: number;
  };
  upkeep: {
    intervalSeconds: number;
    base: { water: number; biomass: number };
    colony: { water: number; biomass: number };
    dormantCollapseSeconds: number;
    aura: {
      radius: number;
      speedBonus: number;
      hydrationHardMultiplier: number;
      slimeDecayMultiplier: number;
    };
  };
  goal: {
    coloniesRequired: number;
    sustainMinutes: number;
    activeMinStockAny: number;
  };
}

export const TERRAIN_STATS: Record<Terrain, TerrainStats> = {
  Dirt: {
    baseSpeed: 0.22,
    hydrationCost: 0,
    slimeWeight: 0.25,
    hard: false,
    colonyBuildable: true,
  },
  Mud: {
    baseSpeed: 0.2,
    hydrationCost: 0,
    slimeWeight: 0.2,
    hard: false,
    colonyBuildable: true,
  },
  Brush: {
    baseSpeed: 0.19,
    hydrationCost: 0,
    slimeWeight: 0.3,
    hard: false,
    colonyBuildable: true,
  },
  Sand: {
    baseSpeed: 0.17,
    hydrationCost: 0.05,
    slimeWeight: 0.35,
    hard: true,
    colonyBuildable: false,
  },
  Rock: {
    baseSpeed: 0.14,
    hydrationCost: 0.2,
    slimeWeight: 0.7,
    hard: true,
    colonyBuildable: false,
  },
  Road: {
    baseSpeed: 0.16,
    hydrationCost: 0.8,
    slimeWeight: 1,
    hard: true,
    colonyBuildable: false,
  },
};

export const DEFAULT_MAP = {
  width: 26,
  height: 18,
  seed: 1337,
};

export const DEFAULT_PARAMS: GameParams = {
  tickRate: 10,
  worker: {
    hydrationMax: 12,
    carryCapacity: 5,
    spawnCost: { biomass: 3, water: 2 },
  },
  moisture: {
    start: 60,
    dropPerTick: 0.03,
    thresholds: { wet: 60, damp: 30 },
  },
  slime: {
    depositRate: 0.09,
    speedBonusMax: 0.4,
    hydrationSaveMax: 0.5,
    decayPerTick: {
      wet: {
        Dirt: 0.004,
        Mud: 0.005,
        Sand: 0.006,
        Rock: 0.006,
        Brush: 0.004,
        Road: 0.008,
      },
      damp: {
        Dirt: 0.007,
        Mud: 0.008,
        Sand: 0.009,
        Rock: 0.01,
        Brush: 0.007,
        Road: 0.015,
      },
      dry: {
        Dirt: 0.012,
        Mud: 0.013,
        Sand: 0.016,
        Rock: 0.02,
        Brush: 0.012,
        Road: 0.03,
      },
    },
  },
  colony: {
    buildCost: { biomass: 30, water: 20 },
    buildTimeSeconds: 30,
  },
  upkeep: {
    intervalSeconds: 10,
    base: { water: 2, biomass: 1 },
    colony: { water: 1, biomass: 1 },
    dormantCollapseSeconds: 60,
    aura: {
      radius: 5,
      speedBonus: 0.1,
      hydrationHardMultiplier: 0.5,
      slimeDecayMultiplier: 0.5,
    },
  },
  goal: {
    coloniesRequired: 3,
    sustainMinutes: 5,
    activeMinStockAny: 10,
  },
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function tileIndex(width: number, x: number, y: number): number {
  return y * width + x;
}

export function isHardTerrain(terrain: Terrain): boolean {
  return TERRAIN_STATS[terrain].hard;
}

export function isColonyBuildTerrain(terrain: Terrain): boolean {
  return TERRAIN_STATS[terrain].colonyBuildable;
}

export function terrainStats(terrain: Terrain): TerrainStats {
  return TERRAIN_STATS[terrain];
}

export function moistureBand(
  moisture: number,
  thresholds: { wet: number; damp: number },
): "wet" | "damp" | "dry" {
  if (moisture >= thresholds.wet) {
    return "wet";
  }
  if (moisture >= thresholds.damp) {
    return "damp";
  }
  return "dry";
}

export function terrainColor(terrain: Terrain): number {
  switch (terrain) {
    case "Dirt":
      return 0x7f5539;
    case "Mud":
      return 0x5a3a22;
    case "Sand":
      return 0xc2a878;
    case "Rock":
      return 0x7a828d;
    case "Brush":
      return 0x477a4a;
    case "Road":
      return 0x67757f;
    default:
      return 0x33414c;
  }
}

export function distanceSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

export function createSeedMap(width: number, height: number, seed: number): TileSeed[] {
  const rand = lcg(seed);
  const tiles: TileSeed[] = [];

  const terrainPool: Terrain[] = [
    "Dirt",
    "Dirt",
    "Mud",
    "Brush",
    "Brush",
    "Sand",
    "Rock",
    "Road",
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const terrain = terrainPool[Math.floor(rand() * terrainPool.length)] ?? "Dirt";
      const stats = terrainStats(terrain);

      const nearStart = x <= 3 && y <= 3;
      const waterChance = stats.hard ? 0.05 : 0.11;
      const biomassChance = stats.hard ? 0.07 : 0.23;

      const water = nearStart ? 0 : rand() < waterChance ? 2 + Math.floor(rand() * 4) : 0;
      const biomass = nearStart ? 2 : rand() < biomassChance ? 2 + Math.floor(rand() * 5) : 0;

      tiles.push({
        terrain,
        water,
        biomass,
        slime: 0,
      });
    }
  }

  // Starting tile must be safe and buildable.
  tiles[0].terrain = "Dirt";
  tiles[0].water = 0;
  tiles[0].biomass = 1;

  return tiles;
}
