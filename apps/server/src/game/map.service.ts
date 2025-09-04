import { Injectable } from '@nestjs/common';
import { MapDef, Tile } from '@snail/protocol';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MapService {
  private cache?: MapDef;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  load(roomId: string): MapDef {
    if (!this.cache) {
      const raw = readFileSync(join(__dirname, 'sample-map.json'), 'utf-8');
      const parsed = JSON.parse(raw) as MapDef;
      validateMap(parsed);
      this.cache = parsed;
    }
    return this.cache;
  }
}

export function validateMap(map: MapDef) {
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
}
