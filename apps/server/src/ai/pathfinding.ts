import { MapDef, GameParams } from '@snail/protocol';
import { terrainAt, tileAt } from '../game/terrain';

export interface Point { x: number; y: number }

export interface PathParams {
  terrain: GameParams['terrain'];
  k: number; // slime cost reduction factor
  slimePreference?: number; // additional cost reduction when slime_intensity > 0.3
}

function heuristic(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function stepCost(map: MapDef, x: number, y: number, params: PathParams) {
  const terrain = terrainAt(map, x, y);
  const tile = tileAt(map, x, y);
  const t = params.terrain?.[terrain ?? ''];
  const base = 1 + (t?.hydration_cost ?? 0);
  let cost = base;
  if ((t?.hydration_cost ?? 0) > 0) {
    cost = Math.max(0, base - params.k * (tile?.slime_intensity ?? 0));
  }
  if (params.slimePreference && (tile?.slime_intensity ?? 0) > 0.3) {
    cost -= params.slimePreference;
  }
  return Math.max(0, cost);
}

export function findPath(
  map: MapDef,
  start: Point,
  goal: Point,
  params: PathParams,
): Point[] {
  const key = (x: number, y: number) => `${x},${y}`;
  interface Node { x: number; y: number; g: number; f: number }
  const open: Node[] = [{ x: start.x, y: start.y, g: 0, f: heuristic(start, goal) }];
  const came = new Map<string, Point>();
  const gScore = new Map<string, number>([[key(start.x, start.y), 0]]);
  const closed = new Set<string>();

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const ck = key(current.x, current.y);
    if (current.x === goal.x && current.y === goal.y) {
      const path: Point[] = [{ x: current.x, y: current.y }];
      let k = ck;
      while (came.has(k)) {
        const p = came.get(k)!;
        path.push({ x: p.x, y: p.y });
        k = key(p.x, p.y);
      }
      return path.reverse();
    }
    closed.add(ck);
    const neighbors = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (!tileAt(map, nx, ny)) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;
      const step = stepCost(map, nx, ny, params);
      const tentative = current.g + step;
      if (tentative < (gScore.get(nk) ?? Infinity)) {
        came.set(nk, { x: current.x, y: current.y });
        gScore.set(nk, tentative);
        const f = tentative + heuristic({ x: nx, y: ny }, goal);
        const node = open.find((n) => n.x === nx && n.y === ny);
        if (node) {
          node.g = tentative;
          node.f = f;
        } else {
          open.push({ x: nx, y: ny, g: tentative, f });
        }
      }
    }
  }
  return [];
}
