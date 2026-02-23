import { ArraySchema, Schema, type } from "@colyseus/schema";
import type { Terrain } from "@snail/shared";

export class TileState extends Schema {
  @type("string") terrain: Terrain = "Dirt";
  @type("number") water = 0;
  @type("number") biomass = 0;
  @type("number") slime = 0;
}

export class WorkerState extends Schema {
  @type("number") id = 0;
  @type("string") owner = "";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") targetX = 0;
  @type("number") targetY = 0;
  @type("boolean") moving = false;
  @type("number") hydration = 12;
  @type("number") carryBiomass = 0;
  @type("number") carryWater = 0;
  @type("number") carryCapacity = 5;
  @type("number") baseId = 0;
  @type("boolean") alive = true;
  @type("string") task: "idle" | "manual" | "pioneer" | "convoy" | "maintenance" | "dead" =
    "idle";
}

export class ColonyState extends Schema {
  @type("number") id = 0;
  @type("string") type: "base" | "colony" = "base";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") water = 0;
  @type("number") biomass = 0;
  @type("boolean") active = false;
  @type("number") buildTicksRemaining = 0;
  @type("number") upkeepTicksRemaining = 0;
  @type("number") dormantTicks = 0;
}

export class GameState extends Schema {
  @type("number") width = 0;
  @type("number") height = 0;
  @type("number") moisture = 0;
  @type("number") tick = 0;

  @type([TileState]) tiles = new ArraySchema<TileState>();
  @type([WorkerState]) workers = new ArraySchema<WorkerState>();
  @type([ColonyState]) colonies = new ArraySchema<ColonyState>();

  @type("number") activeColonies = 0;
  @type("number") requiredColonies = 0;
  @type("number") sustainTicks = 0;
  @type("number") sustainRequiredTicks = 0;
  @type("string") result: "" | "Victory" | "Defeat" = "";
  @type("number") collapseCount = 0;
}
