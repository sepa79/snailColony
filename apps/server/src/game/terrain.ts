import { MapDef, Tile } from '@snail/protocol';

export function tileAt(map: MapDef, x: number, y: number): Tile | undefined {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
    return undefined;
  }
  return map.tiles[y * map.width + x];
}

export function terrainAt(map: MapDef, x: number, y: number): string | undefined {
  return tileAt(map, x, y)?.terrain as unknown as string | undefined;
}

export function isWaterNode(map: MapDef, x: number, y: number): boolean {
  const tile = tileAt(map, x, y);
  return (tile?.resources?.water ?? 0) > 0;
}
