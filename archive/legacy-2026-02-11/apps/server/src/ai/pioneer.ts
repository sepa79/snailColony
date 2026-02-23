import { MapDef } from '@snail/protocol';
import { tileAt } from '../game/terrain';
import { findPath, PathParams, Point } from './pathfinding';

/**
 * Pioneer behavior: if no slime path exists between start and goal,
 * return a round-trip path that paints slime along the way.
 */
export function pioneer(
  map: MapDef,
  start: Point,
  goal: Point,
  params: PathParams,
): Point[] {
  const path = findPath(map, start, goal, params);
  const hasSlime = path.some((p) => (tileAt(map, p.x, p.y)?.slime_intensity ?? 0) > 0);
  if (hasSlime || path.length === 0) {
    return [];
  }
  const pioneerPath = findPath(map, start, goal, { ...params, k: 0 });
  for (const p of pioneerPath) {
    const tile = tileAt(map, p.x, p.y);
    if (tile) {
      tile.slime_intensity = Math.max(tile.slime_intensity, 1);
    }
  }
  const back = [...pioneerPath].reverse().slice(1);
  return pioneerPath.concat(back);
}
