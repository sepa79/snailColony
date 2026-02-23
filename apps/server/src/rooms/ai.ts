import { terrainStats, type GameParams, type Terrain } from "@snail/shared";

export interface Point {
  x: number;
  y: number;
}

export interface TileLike {
  terrain: Terrain;
  slime: number;
  water: number;
  biomass: number;
}

export interface PathfindOptions {
  width: number;
  height: number;
  tiles: ArrayLike<TileLike | undefined>;
  start: Point;
  goal: Point;
  params: GameParams;
  k: number;
  slimePreference?: number;
}

function key(x: number, y: number): string {
  return `${x},${y}`;
}

function heuristic(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function inBounds(width: number, height: number, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < width && y < height;
}

function getTile(
  width: number,
  height: number,
  tiles: ArrayLike<TileLike | undefined>,
  x: number,
  y: number,
): TileLike | undefined {
  if (!inBounds(width, height, x, y)) {
    return undefined;
  }
  return tiles[y * width + x];
}

function stepCost(tile: TileLike, params: GameParams, k: number, slimePreference = 0): number {
  const stats = terrainStats(tile.terrain);
  const baseCost = 1 / Math.max(0.05, stats.baseSpeed);
  const hydrationPenalty =
    stats.hard ? Math.max(0, stats.hydrationCost - k * tile.slime) : 0;

  let cost = baseCost + hydrationPenalty;
  if (slimePreference > 0 && tile.slime > 0.3) {
    cost -= slimePreference * tile.slime;
  }
  return Math.max(0.05, cost);
}

export function findPath(options: PathfindOptions): Point[] {
  const { width, height, tiles, start, goal, params, k, slimePreference } = options;

  if (
    !inBounds(width, height, start.x, start.y) ||
    !inBounds(width, height, goal.x, goal.y)
  ) {
    return [];
  }

  interface Node {
    x: number;
    y: number;
    g: number;
    f: number;
  }

  const startKey = key(start.x, start.y);
  const open: Node[] = [
    { x: start.x, y: start.y, g: 0, f: heuristic(start, goal) },
  ];
  const cameFrom = new Map<string, Point>();
  const gScore = new Map<string, number>([[startKey, 0]]);
  const closed = new Set<string>();

  const dirs: Point[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (!current) {
      break;
    }

    const currentKey = key(current.x, current.y);
    if (current.x === goal.x && current.y === goal.y) {
      const path: Point[] = [{ x: current.x, y: current.y }];
      let cursor = currentKey;
      while (cameFrom.has(cursor)) {
        const prev = cameFrom.get(cursor);
        if (!prev) {
          break;
        }
        path.push({ x: prev.x, y: prev.y });
        cursor = key(prev.x, prev.y);
      }
      return path.reverse();
    }

    closed.add(currentKey);

    for (const dir of dirs) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const neighbor = getTile(width, height, tiles, nx, ny);
      if (!neighbor) {
        continue;
      }

      const neighborKey = key(nx, ny);
      if (closed.has(neighborKey)) {
        continue;
      }

      const tentativeG =
        current.g + stepCost(neighbor, params, k, slimePreference ?? 0);
      if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) {
        continue;
      }

      cameFrom.set(neighborKey, { x: current.x, y: current.y });
      gScore.set(neighborKey, tentativeG);

      const f = tentativeG + heuristic({ x: nx, y: ny }, goal);
      const existing = open.find((node) => node.x === nx && node.y === ny);
      if (existing) {
        existing.g = tentativeG;
        existing.f = f;
      } else {
        open.push({ x: nx, y: ny, g: tentativeG, f });
      }
    }
  }

  return [];
}

export function buildRoundTrip(path: Point[]): Point[] {
  if (path.length < 2) {
    return path.slice();
  }
  const back = path.slice(0, -1).reverse();
  return path.concat(back);
}

export function pathHasSlime(
  path: Point[],
  width: number,
  height: number,
  tiles: ArrayLike<TileLike | undefined>,
  threshold: number,
): boolean {
  for (const point of path) {
    const tile = getTile(width, height, tiles, point.x, point.y);
    if (tile && tile.slime >= threshold) {
      return true;
    }
  }
  return false;
}

export function mergePaths(first: Point[], second: Point[]): Point[] {
  if (first.length === 0) {
    return second.slice();
  }
  if (second.length === 0) {
    return first.slice();
  }
  const head = first.slice();
  const tail = second.slice(1);
  return head.concat(tail);
}
