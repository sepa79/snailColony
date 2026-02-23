import { MapDef } from '@snail/protocol';
import { findPath, PathParams, Point } from './pathfinding';

export function convoyPath(
  map: MapDef,
  start: Point,
  goal: Point,
  params: PathParams,
): Point[] {
  return findPath(map, start, goal, { ...params, slimePreference: 0.5 });
}
