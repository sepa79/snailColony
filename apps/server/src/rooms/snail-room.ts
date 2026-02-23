import { createRequire } from "node:module";
import type { Client } from "colyseus";
import {
  clamp,
  createSeedMap,
  DEFAULT_MAP,
  DEFAULT_PARAMS,
  distanceSq,
  isColonyBuildTerrain,
  isHardTerrain,
  moistureBand,
  terrainStats,
  tileIndex,
} from "@snail/shared";
import { ColonyState, GameState, TileState, WorkerState } from "../state.js";
import {
  buildRoundTrip,
  findPath,
  mergePaths,
  pathHasSlime,
  type Point,
} from "./ai.js";

const require = createRequire(import.meta.url);
const { Room } = require("colyseus") as typeof import("colyseus");

interface MoveWorkerMessage {
  workerId: number;
  x: number;
  y: number;
}

interface BuildColonyMessage {
  workerId: number;
}

interface AutoModeMessage {
  enabled: boolean;
}

type WorkerTask = "pioneer" | "convoy" | "maintenance";

interface WorkerOrder {
  kind: WorkerTask;
  baseId: number;
  waypoints: Point[];
  loopWaypoints?: Point[];
}

export class SnailRoom extends Room<GameState> {
  private readonly params = DEFAULT_PARAMS;
  private nextWorkerId = 1;
  private nextColonyId = 1;
  private startingBaseId = 0;
  private readonly workerOrders = new Map<number, WorkerOrder>();
  private readonly criticalPathsByBase = new Map<number, Point[]>();
  private readonly autoModeByOwner = new Map<string, boolean>();
  private aiTickCounter = 0;
  private readonly aiIntervalTicks = Math.max(1, Math.floor(DEFAULT_PARAMS.tickRate / 2));

  onCreate(): void {
    this.setState(new GameState());
    this.maxClients = 8;

    this.state.width = DEFAULT_MAP.width;
    this.state.height = DEFAULT_MAP.height;
    this.state.moisture = this.params.moisture.start;
    this.state.requiredColonies = this.params.goal.coloniesRequired;
    this.state.sustainRequiredTicks =
      this.params.goal.sustainMinutes * 60 * this.params.tickRate;

    const seedMap = createSeedMap(
      DEFAULT_MAP.width,
      DEFAULT_MAP.height,
      DEFAULT_MAP.seed,
    );
    for (const tile of seedMap) {
      const entry = new TileState();
      entry.terrain = tile.terrain;
      entry.water = tile.water;
      entry.biomass = tile.biomass;
      entry.slime = tile.slime;
      this.state.tiles.push(entry);
    }

    const base = this.addColony("base", 0, 0, true);
    base.water = 80;
    base.biomass = 80;
    this.startingBaseId = base.id;

    this.onMessage("move_worker", (client, msg: MoveWorkerMessage) => {
      const worker = this.getWorkerById(msg.workerId);
      if (!worker || worker.owner !== client.sessionId || !worker.alive) {
        return;
      }
      this.clearWorkerOrder(worker.id);
      worker.task = "manual";
      worker.targetX = clamp(Math.floor(msg.x), 0, this.state.width - 1);
      worker.targetY = clamp(Math.floor(msg.y), 0, this.state.height - 1);
      worker.moving = true;
    });

    this.onMessage("spawn_worker", (client) => {
      const baseColony = this.getColonyById(this.startingBaseId);
      if (
        !baseColony ||
        !baseColony.active ||
        baseColony.buildTicksRemaining > 0
      ) {
        return;
      }

      const { biomass, water } = this.params.worker.spawnCost;
      if (baseColony.biomass < biomass || baseColony.water < water) {
        return;
      }

      baseColony.biomass -= biomass;
      baseColony.water -= water;
      this.addWorker(client.sessionId, baseColony.x, baseColony.y, baseColony.id);
    });

    this.onMessage("build_colony", (client, msg: BuildColonyMessage) => {
      const worker = this.getWorkerById(msg.workerId);
      if (!worker || worker.owner !== client.sessionId || !worker.alive) {
        return;
      }

      const x = Math.floor(worker.x);
      const y = Math.floor(worker.y);
      const tile = this.getTile(x, y);
      if (!tile || !isColonyBuildTerrain(tile.terrain)) {
        return;
      }

      if (this.colonyAt(x, y)) {
        return;
      }

      const sourceBase =
        this.getColonyById(worker.baseId) ?? this.getColonyById(this.startingBaseId);
      if (!sourceBase) {
        return;
      }

      const cost = this.params.colony.buildCost;
      if (sourceBase.biomass < cost.biomass || sourceBase.water < cost.water) {
        return;
      }

      sourceBase.biomass -= cost.biomass;
      sourceBase.water -= cost.water;

      const colony = this.addColony("colony", x, y, false);
      colony.buildTicksRemaining =
        this.params.colony.buildTimeSeconds * this.params.tickRate;
      colony.active = false;
      worker.baseId = colony.id;
      this.criticalPathsByBase.delete(colony.id);
    });

    this.onMessage("set_auto_mode", (client, msg: AutoModeMessage) => {
      this.autoModeByOwner.set(client.sessionId, msg.enabled !== false);
      for (const worker of this.state.workers) {
        if (worker.owner !== client.sessionId) {
          continue;
        }
        if (!this.autoModeByOwner.get(client.sessionId)) {
          this.clearWorkerOrder(worker.id);
          if (worker.alive) {
            worker.task = "manual";
          }
        } else if (worker.alive && worker.task === "manual" && !worker.moving) {
          worker.task = "idle";
        }
      }
    });

    this.setSimulationInterval(
      () => this.simulationTick(),
      1000 / this.params.tickRate,
    );
  }

  onJoin(client: Client): void {
    const existing = this.state.workers.find((w) => w.owner === client.sessionId);
    if (!existing) {
      const base = this.getColonyById(this.startingBaseId);
      if (base) {
        this.addWorker(client.sessionId, base.x, base.y, base.id);
      }
    }
    this.autoModeByOwner.set(client.sessionId, true);
    console.log(`[room:${this.roomId}] ${client.sessionId} joined`);
  }

  onLeave(client: Client): void {
    for (let i = this.state.workers.length - 1; i >= 0; i--) {
      const worker = this.state.workers[i];
      if (!worker) {
        continue;
      }
      if (worker.owner === client.sessionId) {
        this.clearWorkerOrder(worker.id);
        this.state.workers.splice(i, 1);
      }
    }
    this.autoModeByOwner.delete(client.sessionId);
    console.log(`[room:${this.roomId}] ${client.sessionId} left`);
  }

  private simulationTick(): void {
    this.state.tick += 1;
    this.aiTickCounter += 1;

    this.updateMoisture();
    this.updateColonyConstruction();
    this.decaySlime();
    this.runAutomation();
    this.driveWorkerOrders();
    this.moveWorkers();
    this.harvestAndDeliver();
    this.applyUpkeep();
    this.updateGoal();
    this.cleanupOrders();
  }

  private updateMoisture(): void {
    this.state.moisture = clamp(
      this.state.moisture - this.params.moisture.dropPerTick,
      0,
      100,
    );
  }

  private updateColonyConstruction(): void {
    const upkeepTicks = this.params.upkeep.intervalSeconds * this.params.tickRate;

    for (const colony of this.state.colonies) {
      if (colony.buildTicksRemaining <= 0) {
        continue;
      }
      colony.buildTicksRemaining = Math.max(0, colony.buildTicksRemaining - 1);
      if (colony.buildTicksRemaining === 0) {
        colony.active = true;
        colony.upkeepTicksRemaining = upkeepTicks;
        colony.dormantTicks = 0;
      }
    }
  }

  private decaySlime(): void {
    const band = moistureBand(this.state.moisture, this.params.moisture.thresholds);
    const auraRadiusSq = this.params.upkeep.aura.radius * this.params.upkeep.aura.radius;

    for (let i = 0; i < this.state.tiles.length; i++) {
      const tile = this.state.tiles[i];
      if (!tile) {
        continue;
      }
      const x = i % this.state.width;
      const y = Math.floor(i / this.state.width);

      let decay = this.params.slime.decayPerTick[band][tile.terrain] ?? 0;
      if (this.isInsideActiveAura(x, y, auraRadiusSq)) {
        decay *= this.params.upkeep.aura.slimeDecayMultiplier;
      }

      tile.slime = Math.max(0, tile.slime - decay);
    }
  }

  private runAutomation(): void {
    if (this.aiTickCounter % this.aiIntervalTicks !== 0) {
      return;
    }

    const workersByOwner = new Map<string, WorkerState[]>();
    for (const worker of this.state.workers) {
      if (!worker.alive) {
        continue;
      }
      if (!this.autoModeByOwner.get(worker.owner)) {
        continue;
      }
      const group = workersByOwner.get(worker.owner);
      if (group) {
        group.push(worker);
      } else {
        workersByOwner.set(worker.owner, [worker]);
      }
    }

    for (const workers of workersByOwner.values()) {
      this.assignAutomationForOwner(workers);
    }
  }

  private assignAutomationForOwner(ownerWorkers: WorkerState[]): void {
    const byBase = new Map<number, WorkerState[]>();
    for (const worker of ownerWorkers) {
      const group = byBase.get(worker.baseId);
      if (group) {
        group.push(worker);
      } else {
        byBase.set(worker.baseId, [worker]);
      }
    }

    for (const [baseId, workers] of byBase.entries()) {
      const base = this.getColonyById(baseId) ?? this.getColonyById(this.startingBaseId);
      if (!base || base.buildTicksRemaining > 0 || !base.active) {
        continue;
      }

      const target = this.findNearestResource(base.x, base.y);
      if (!target) {
        continue;
      }

      const convoyPath = findPath({
        width: this.state.width,
        height: this.state.height,
        tiles: this.state.tiles,
        start: { x: base.x, y: base.y },
        goal: target,
        params: this.params,
        k: 0.9,
        slimePreference: 0.5,
      });
      if (convoyPath.length < 2) {
        continue;
      }

      this.criticalPathsByBase.set(base.id, convoyPath);

      const hasTrail = pathHasSlime(
        convoyPath,
        this.state.width,
        this.state.height,
        this.state.tiles,
        0.3,
      );

      const hasPioneer = workers.some(
        (worker) => this.workerOrders.get(worker.id)?.kind === "pioneer",
      );

      if (!hasTrail && !hasPioneer) {
        const pioneer = this.pickFreeWorker(workers);
        if (pioneer) {
          const lowSlimePath = findPath({
            width: this.state.width,
            height: this.state.height,
            tiles: this.state.tiles,
            start: { x: Math.floor(pioneer.x), y: Math.floor(pioneer.y) },
            goal: target,
            params: this.params,
            k: 0,
          });
          if (lowSlimePath.length > 1) {
            const route = buildRoundTrip(lowSlimePath).slice(1);
            this.assignOrder(pioneer, {
              kind: "pioneer",
              baseId: base.id,
              waypoints: route,
            });
          }
        }
      }

      const criticalPath = this.criticalPathsByBase.get(base.id) ?? convoyPath;
      this.scheduleMaintenance(workers, base, criticalPath);
      this.scheduleConvoy(workers, base, target, convoyPath);
    }
  }

  private scheduleConvoy(
    workers: WorkerState[],
    base: ColonyState,
    target: Point,
    basePath: Point[],
  ): void {
    const hasConvoy = workers.some(
      (worker) => this.workerOrders.get(worker.id)?.kind === "convoy",
    );
    const maxConvoy = Math.max(1, workers.length - 1);
    let currentConvoy = workers.filter(
      (worker) => this.workerOrders.get(worker.id)?.kind === "convoy",
    ).length;

    if (hasConvoy && currentConvoy >= maxConvoy) {
      return;
    }

    for (const worker of workers) {
      if (currentConvoy >= maxConvoy) {
        break;
      }
      if (!worker.alive) {
        continue;
      }
      if (this.workerOrders.has(worker.id)) {
        continue;
      }

      const toResource = findPath({
        width: this.state.width,
        height: this.state.height,
        tiles: this.state.tiles,
        start: { x: Math.floor(worker.x), y: Math.floor(worker.y) },
        goal: target,
        params: this.params,
        k: 0.9,
        slimePreference: 0.5,
      });
      if (toResource.length < 2) {
        continue;
      }
      const backToBase = findPath({
        width: this.state.width,
        height: this.state.height,
        tiles: this.state.tiles,
        start: target,
        goal: { x: base.x, y: base.y },
        params: this.params,
        k: 0.9,
        slimePreference: 0.5,
      });
      if (backToBase.length < 2) {
        continue;
      }

      const loopPath = mergePaths(toResource, backToBase).slice(1);
      const fallbackLoop = buildRoundTrip(basePath).slice(1);
      const waypoints = loopPath.length > 0 ? loopPath : fallbackLoop;
      if (waypoints.length === 0) {
        continue;
      }

      this.assignOrder(worker, {
        kind: "convoy",
        baseId: base.id,
        waypoints: waypoints.slice(),
        loopWaypoints: waypoints.slice(),
      });
      currentConvoy += 1;
    }
  }

  private scheduleMaintenance(
    workers: WorkerState[],
    base: ColonyState,
    criticalPath: Point[],
  ): void {
    const hasMaintenance = workers.some(
      (worker) => this.workerOrders.get(worker.id)?.kind === "maintenance",
    );
    if (hasMaintenance) {
      return;
    }

    const weak = criticalPath.find((point) => {
      if (point.x === base.x && point.y === base.y) {
        return false;
      }
      const tile = this.getTile(point.x, point.y);
      return Boolean(tile && tile.slime < 0.2);
    });
    if (!weak) {
      return;
    }

    const worker = this.pickNearestFreeWorker(workers, weak);
    if (!worker) {
      return;
    }

    const toWeak = findPath({
      width: this.state.width,
      height: this.state.height,
      tiles: this.state.tiles,
      start: { x: Math.floor(worker.x), y: Math.floor(worker.y) },
      goal: weak,
      params: this.params,
      k: 0.6,
      slimePreference: 0.25,
    });
    const backToBase = findPath({
      width: this.state.width,
      height: this.state.height,
      tiles: this.state.tiles,
      start: weak,
      goal: { x: base.x, y: base.y },
      params: this.params,
      k: 0.6,
      slimePreference: 0.25,
    });
    const route = mergePaths(toWeak, backToBase).slice(1);
    if (route.length === 0) {
      return;
    }

    this.assignOrder(worker, {
      kind: "maintenance",
      baseId: base.id,
      waypoints: route,
    });
  }

  private driveWorkerOrders(): void {
    for (const worker of this.state.workers) {
      if (!worker.alive) {
        continue;
      }

      const order = this.workerOrders.get(worker.id);
      if (!order) {
        if (!worker.moving && worker.task !== "manual") {
          worker.task = "idle";
        }
        continue;
      }

      while (order.waypoints.length > 0) {
        const next = order.waypoints[0];
        if (!next) {
          break;
        }
        const close =
          Math.abs(worker.x - next.x) < 0.08 && Math.abs(worker.y - next.y) < 0.08;
        if (!close) {
          break;
        }
        order.waypoints.shift();
      }

      if (order.waypoints.length === 0) {
        if (order.loopWaypoints && order.loopWaypoints.length > 0) {
          order.waypoints = order.loopWaypoints.map((point) => ({
            x: point.x,
            y: point.y,
          }));
        } else {
          this.workerOrders.delete(worker.id);
          if (!worker.moving) {
            worker.task = "idle";
          }
          continue;
        }
      }

      if (!worker.moving) {
        const next = order.waypoints[0];
        if (!next) {
          continue;
        }
        worker.targetX = next.x;
        worker.targetY = next.y;
        worker.moving = true;
      }
    }
  }

  private moveWorkers(): void {
    const auraRadiusSq = this.params.upkeep.aura.radius * this.params.upkeep.aura.radius;

    for (const worker of this.state.workers) {
      if (!worker.alive) {
        continue;
      }

      const currentTile = this.getTile(Math.floor(worker.x), Math.floor(worker.y));
      if (!currentTile) {
        worker.moving = false;
        continue;
      }

      const baseStats = terrainStats(currentTile.terrain);
      let speed =
        baseStats.baseSpeed + currentTile.slime * this.params.slime.speedBonusMax;

      const auraActive = this.isInsideActiveAura(worker.x, worker.y, auraRadiusSq);
      if (auraActive) {
        speed *= 1 + this.params.upkeep.aura.speedBonus;
      }

      if (worker.moving) {
        const dx = worker.targetX - worker.x;
        const dy = worker.targetY - worker.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 0.0001) {
          worker.x = worker.targetX;
          worker.y = worker.targetY;
          worker.moving = false;
        } else {
          const step = Math.min(dist, speed);
          worker.x += (dx / dist) * step;
          worker.y += (dy / dist) * step;

          currentTile.slime = clamp(
            currentTile.slime +
              this.params.slime.depositRate * terrainStats(currentTile.terrain).slimeWeight,
            0,
            1,
          );

          if (
            Math.abs(worker.targetX - worker.x) < 0.05 &&
            Math.abs(worker.targetY - worker.y) < 0.05
          ) {
            worker.x = worker.targetX;
            worker.y = worker.targetY;
            worker.moving = false;
            if (worker.task === "manual") {
              worker.task = "idle";
            }
          }
        }
      }

      const nowX = Math.floor(worker.x);
      const nowY = Math.floor(worker.y);
      const nowTile = this.getTile(nowX, nowY);
      if (!nowTile) {
        continue;
      }

      if (isHardTerrain(nowTile.terrain)) {
        const stats = terrainStats(nowTile.terrain);
        const save = nowTile.slime * this.params.slime.hydrationSaveMax;
        let cost = stats.hydrationCost * (1 - save);
        if (auraActive) {
          cost *= this.params.upkeep.aura.hydrationHardMultiplier;
        }
        worker.hydration = Math.max(0, worker.hydration - cost);
      }

      if (nowTile.water > 0 || this.colonyAt(nowX, nowY)) {
        worker.hydration = this.params.worker.hydrationMax;
      }

      if (worker.hydration <= 0 && isHardTerrain(nowTile.terrain)) {
        worker.alive = false;
        worker.moving = false;
        worker.task = "dead";
        this.clearWorkerOrder(worker.id);
      }
    }
  }

  private harvestAndDeliver(): void {
    for (const worker of this.state.workers) {
      if (!worker.alive) {
        continue;
      }

      const x = Math.floor(worker.x);
      const y = Math.floor(worker.y);
      const tile = this.getTile(x, y);
      if (!tile) {
        continue;
      }

      const assignedBase =
        this.getColonyById(worker.baseId) ?? this.getColonyById(this.startingBaseId);

      if (assignedBase && x === assignedBase.x && y === assignedBase.y) {
        assignedBase.biomass += worker.carryBiomass;
        assignedBase.water += worker.carryWater;
        worker.carryBiomass = 0;
        worker.carryWater = 0;
        worker.hydration = this.params.worker.hydrationMax;
        continue;
      }

      const carried = worker.carryBiomass + worker.carryWater;
      const free = Math.max(0, worker.carryCapacity - carried);
      if (free <= 0) {
        continue;
      }

      if (tile.biomass > 0) {
        const amount = Math.min(free, tile.biomass);
        tile.biomass -= amount;
        worker.carryBiomass += amount;
        continue;
      }

      if (tile.water > 0) {
        const amount = Math.min(free, tile.water);
        tile.water -= amount;
        worker.carryWater += amount;
      }
    }
  }

  private applyUpkeep(): void {
    const upkeepTicks = this.params.upkeep.intervalSeconds * this.params.tickRate;
    const collapseTicks =
      this.params.upkeep.dormantCollapseSeconds * this.params.tickRate;

    for (const colony of this.state.colonies) {
      if (colony.buildTicksRemaining > 0) {
        colony.active = false;
        continue;
      }

      colony.upkeepTicksRemaining -= 1;
      if (colony.upkeepTicksRemaining <= 0) {
        colony.upkeepTicksRemaining = upkeepTicks;
        const cost =
          colony.type === "base"
            ? this.params.upkeep.base
            : this.params.upkeep.colony;

        if (colony.water >= cost.water && colony.biomass >= cost.biomass) {
          colony.water -= cost.water;
          colony.biomass -= cost.biomass;
          colony.active = true;
          colony.dormantTicks = 0;
        } else {
          colony.active = false;
        }
      }

      if (!colony.active) {
        colony.dormantTicks += 1;
      }
    }

    for (let i = this.state.colonies.length - 1; i >= 0; i--) {
      const colony = this.state.colonies[i];
      if (!colony) {
        continue;
      }
      if (colony.type !== "colony") {
        continue;
      }
      if (colony.buildTicksRemaining > 0 || colony.active) {
        continue;
      }
      if (colony.dormantTicks < collapseTicks) {
        continue;
      }

      for (const worker of this.state.workers) {
        if (worker.baseId === colony.id) {
          worker.baseId = this.startingBaseId;
        }
      }

      this.criticalPathsByBase.delete(colony.id);
      this.state.colonies.splice(i, 1);
      this.state.collapseCount += 1;
      if (!this.state.result) {
        this.state.result = "Defeat";
      }
    }
  }

  private updateGoal(): void {
    const activeColonies = this.state.colonies.filter(
      (c) =>
        c.type === "colony" &&
        c.buildTicksRemaining <= 0 &&
        c.active &&
        (c.water >= this.params.goal.activeMinStockAny ||
          c.biomass >= this.params.goal.activeMinStockAny),
    ).length;

    this.state.activeColonies = activeColonies;

    if (activeColonies >= this.state.requiredColonies) {
      this.state.sustainTicks += 1;
    } else {
      this.state.sustainTicks = 0;
    }

    if (!this.state.result && this.state.sustainTicks >= this.state.sustainRequiredTicks) {
      this.state.result = "Victory";
    }
  }

  private addWorker(owner: string, x: number, y: number, baseId: number): WorkerState {
    const worker = new WorkerState();
    worker.id = this.nextWorkerId++;
    worker.owner = owner;
    worker.x = x;
    worker.y = y;
    worker.targetX = x;
    worker.targetY = y;
    worker.hydration = this.params.worker.hydrationMax;
    worker.carryCapacity = this.params.worker.carryCapacity;
    worker.baseId = baseId;
    worker.alive = true;
    worker.task = "idle";
    this.state.workers.push(worker);
    return worker;
  }

  private addColony(
    type: "base" | "colony",
    x: number,
    y: number,
    active: boolean,
  ): ColonyState {
    const colony = new ColonyState();
    colony.id = this.nextColonyId++;
    colony.type = type;
    colony.x = x;
    colony.y = y;
    colony.active = active;
    colony.water = type === "base" ? 20 : 0;
    colony.biomass = type === "base" ? 20 : 0;
    colony.buildTicksRemaining = 0;
    colony.upkeepTicksRemaining = this.params.upkeep.intervalSeconds * this.params.tickRate;
    colony.dormantTicks = 0;
    this.state.colonies.push(colony);
    return colony;
  }

  private findNearestResource(fromX: number, fromY: number): Point | null {
    let best: Point | null = null;
    let bestDist = Infinity;

    for (let y = 0; y < this.state.height; y++) {
      for (let x = 0; x < this.state.width; x++) {
        const tile = this.getTile(x, y);
        if (!tile) {
          continue;
        }
        if (tile.biomass <= 0 && tile.water <= 0) {
          continue;
        }
        const dist = Math.abs(fromX - x) + Math.abs(fromY - y);
        if (dist < bestDist) {
          bestDist = dist;
          best = { x, y };
        }
      }
    }

    return best;
  }

  private pickFreeWorker(workers: WorkerState[]): WorkerState | null {
    for (const worker of workers) {
      if (!worker.alive) {
        continue;
      }
      if (this.workerOrders.has(worker.id)) {
        continue;
      }
      if (worker.moving) {
        continue;
      }
      return worker;
    }
    return null;
  }

  private pickNearestFreeWorker(workers: WorkerState[], point: Point): WorkerState | null {
    let best: WorkerState | null = null;
    let bestDist = Infinity;

    for (const worker of workers) {
      if (!worker.alive) {
        continue;
      }
      if (this.workerOrders.has(worker.id)) {
        continue;
      }
      const dist = distanceSq(worker.x, worker.y, point.x, point.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = worker;
      }
    }
    return best;
  }

  private assignOrder(worker: WorkerState, order: WorkerOrder): void {
    this.workerOrders.set(worker.id, order);
    worker.task = order.kind;
    if (!worker.moving && order.waypoints.length > 0) {
      const next = order.waypoints[0];
      if (next) {
        worker.targetX = next.x;
        worker.targetY = next.y;
        worker.moving = true;
      }
    }
  }

  private clearWorkerOrder(workerId: number): void {
    this.workerOrders.delete(workerId);
  }

  private cleanupOrders(): void {
    for (const [workerId] of this.workerOrders) {
      const worker = this.getWorkerById(workerId);
      if (!worker || !worker.alive) {
        this.workerOrders.delete(workerId);
      }
    }
  }

  private getTile(x: number, y: number): TileState | undefined {
    if (x < 0 || y < 0 || x >= this.state.width || y >= this.state.height) {
      return undefined;
    }
    return this.state.tiles[tileIndex(this.state.width, x, y)];
  }

  private getWorkerById(id: number): WorkerState | undefined {
    return this.state.workers.find((worker) => worker.id === id);
  }

  private getColonyById(id: number): ColonyState | undefined {
    return this.state.colonies.find((colony) => colony.id === id);
  }

  private colonyAt(x: number, y: number): ColonyState | undefined {
    return this.state.colonies.find((colony) => colony.x === x && colony.y === y);
  }

  private isInsideActiveAura(x: number, y: number, radiusSq: number): boolean {
    for (const colony of this.state.colonies) {
      if (!colony.active || colony.buildTicksRemaining > 0) {
        continue;
      }
      if (distanceSq(x, y, colony.x, colony.y) <= radiusSq) {
        return true;
      }
    }
    return false;
  }
}
