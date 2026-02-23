import { Injectable } from '@nestjs/common';
import { MapDef, Tile } from '@snail/protocol';
import { readFileSync } from 'fs';
import { join } from 'path';
import params from '../config';
import { generateMap } from './map-generator';

@Injectable()
export class MapService {
  private cache?: MapDef;

  load(roomId: string): MapDef {
    void roomId;
    if (!this.cache) {
      const defaultMoisture = params.moisture?.thresholds?.wet ?? 0;
      const raw = readFileSync(join(__dirname, 'sample-map.json'), 'utf-8');
      const parsed = JSON.parse(raw) as MapDef;
      parsed.moisture = parsed.moisture ?? defaultMoisture;
      parsed.tiles = parsed.tiles.map((t) => ({
        ...t,
        slime_intensity: t.slime_intensity ?? 0,
        resources: {
          biomass: t.resources?.biomass ?? params.resources?.biomass ?? 0,
          water: t.resources?.water ?? params.resources?.water ?? 0,
        },
      }));
      validateMap(parsed);
      this.cache = parsed;
    }
    return this.cache;
  }

  generate(roomId: string, width = 5, height = 5): MapDef {
    void roomId;
    const map = generateMap(width, height, params);
    validateMap(map);
    this.cache = map;
    return map;
  }
}
export function validateMap(map: MapDef) {
  if (map.moisture < 0 || map.moisture > 100) {
    throw new Error('Invalid moisture value');
  }
  map.tiles.forEach((tile: Tile, i: number) => {
    try {
      validateTile(tile);
    } catch (err) {
      throw new Error(`tile ${i}: ${err instanceof Error ? err.message : err}`);
    }
  });
}

export function validateTile(tile: Tile) {
  if (tile.terrain === 'Cliff' && tile.structure !== 'None') {
    throw new Error('Cliff cannot have structures');
  }
  if (
    tile.structure === 'Colony' &&
    (tile.terrain === 'Rock' || tile.terrain === 'Cliff' || tile.water === 'Full')
  ) {
    throw new Error('Invalid colony placement');
  }
  if (tile.structure === 'Bridge' && tile.water !== 'Full') {
    throw new Error('Bridge must be on Water:Full');
  }
  if (tile.slime_intensity < 0) {
    throw new Error('Slime intensity cannot be negative');
  }
  if (tile.resources) {
    if (tile.resources.biomass !== undefined && tile.resources.biomass < 0) {
      throw new Error('Biomass cannot be negative');
    }
    if (tile.resources.water !== undefined && tile.resources.water < 0) {
      throw new Error('Water resource cannot be negative');
    }
  }
}
