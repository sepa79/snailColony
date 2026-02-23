import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS, type Terrain } from "@snail/shared";
import { buildRoundTrip, findPath } from "./ai.js";

interface TestTile {
  terrain: Terrain;
  slime: number;
  water: number;
  biomass: number;
}

function makeGrid(width: number, height: number, terrain: Terrain): TestTile[] {
  const out: TestTile[] = [];
  for (let i = 0; i < width * height; i++) {
    out.push({ terrain, slime: 0, water: 0, biomass: 0 });
  }
  return out;
}

function idx(width: number, x: number, y: number): number {
  return y * width + x;
}

describe("ai pathfinding", () => {
  it("builds a round-trip path that starts and ends in base", () => {
    const input = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ];
    const trip = buildRoundTrip(input);
    expect(trip[0]).toEqual({ x: 0, y: 0 });
    expect(trip[trip.length - 1]).toEqual({ x: 0, y: 0 });
    expect(trip.length).toBe(5);
  });

  it("prefers slimed hard tiles when k/slime preference is enabled", () => {
    const width = 3;
    const height = 3;
    const tiles = makeGrid(width, height, "Road");

    // Slimed route: down -> down -> right -> right (same step count as right-first route).
    tiles[idx(width, 0, 1)].slime = 1;
    tiles[idx(width, 0, 2)].slime = 1;
    tiles[idx(width, 1, 2)].slime = 1;
    tiles[idx(width, 2, 2)].slime = 1;

    const neutral = findPath({
      width,
      height,
      tiles,
      start: { x: 0, y: 0 },
      goal: { x: 2, y: 2 },
      params: DEFAULT_PARAMS,
      k: 0,
      slimePreference: 0,
    });
    const slimeAware = findPath({
      width,
      height,
      tiles,
      start: { x: 0, y: 0 },
      goal: { x: 2, y: 2 },
      params: DEFAULT_PARAMS,
      k: 1,
      slimePreference: 0.6,
    });

    const neutralUsesSlimedEntry = neutral.some((p) => p.x === 0 && p.y === 1);
    const slimeAwareUsesSlimedEntry = slimeAware.some((p) => p.x === 0 && p.y === 1);

    expect(neutralUsesSlimedEntry).toBe(false);
    expect(slimeAwareUsesSlimedEntry).toBe(true);
  });
});
