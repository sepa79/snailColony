import { IWorld, addComponent, addEntity, createWorld, removeComponent } from 'bitecs';
import {
  Hydration,
  Position,
  Velocity,
  Destination,
  Worker,
  initWorker,
  Base,
  Upkeep,
  initBase,
  initUpkeep,
} from './components';
import { movementSystem } from './systems/movement.system';
import { hydrationSystem } from './systems/hydration.system';
import { slimeDepositSystem } from './systems/slime-deposit.system';
import { slimeDecaySystem } from './systems/slime-decay.system';
import { harvestSystem } from './systems/harvest.system';
import { upkeepSystem } from './systems/upkeep.system';
import { updateMoistureAndAurasSystem } from './systems/update-moisture-and-auras.system';
import { scoringSystem, ScoreState } from './systems/scoring.system';
import { MapService } from '../game/map.service';
import { MapDef, GameParams, TerrainType, Structure } from '@snail/protocol';
import params from '../config';

type UnitSnapshot = { id: number; x: number; y: number; hydration: number };
type BaseSnapshot = {
  id: number;
  x: number;
  y: number;
  biomass: number;
  water: number;
  active: boolean;
};
type WorldSnapshot = UnitSnapshot[] & {
  bases: BaseSnapshot[];
  startingBase?: number;
};

export class World {
  private world: IWorld;
  private snail: number;
  private map!: MapDef;
  private params: GameParams;
  private score: ScoreState;
  private bases: number[];
  private startingBase?: number;
  private activeColonies: number[];
  private aura?: {
    radius: number;
    speed_bonus: number;
    hydration_cost_hard_multiplier: number;
    slime_decay_multiplier: number;
    bases: { x: number; y: number }[];
  };
  private roadDefaults: { base_speed: number; hydration_cost: number };
  private dispatch: Record<string, () => void>;

  constructor() {
    this.world = createWorld();
    this.params = params as GameParams;
    this.bases = [];
    this.startingBase = undefined;
    this.activeColonies = [];
    this.snail = addEntity(this.world);
    addComponent(this.world, Position, this.snail);
    addComponent(this.world, Velocity, this.snail);
    addComponent(this.world, Destination, this.snail);
    addComponent(this.world, Hydration, this.snail);
    addComponent(this.world, Worker, this.snail);
    Position.x[this.snail] = 0;
    Position.y[this.snail] = 0;
    Velocity.dx[this.snail] = 0;
    Velocity.dy[this.snail] = 0;
    Destination.x[this.snail] = 0;
    Destination.y[this.snail] = 0;
    Destination.active[this.snail] = 0;
    Hydration.value[this.snail] = 100;
    this.score = { sustainTicks: 0, colonies: new Set(), activeColonies: 0 };
    const svc = new MapService();
    this.setMap(svc.load('test'));
    initWorker(this.snail, this.startingBase ?? -1);
    this.aura = undefined;
    const roadParams = this.params.terrain[TerrainType.Road] ?? {
      base_speed: 0.6,
      hydration_cost: 0.8,
    };
    this.roadDefaults = {
      base_speed: roadParams.base_speed,
      hydration_cost: roadParams.hydration_cost,
    };
    this.dispatch = {
      update_moisture_and_auras: () => {
        this.aura = updateMoistureAndAurasSystem(
          this.world,
          this.map,
          this.params,
          this.roadDefaults,
          this.activeColonies,
        );
      },
      slime_decay: () => {
        slimeDecaySystem(this.world, this.map, {
          slime: { decay_per_tick: this.params.slime.decay_per_tick },
          moisture: this.params.moisture,
          aura: this.aura,
        });
      },
      unit_movement_and_slime_deposit: () => {
        movementSystem(this.world, this.map, {
          terrain: this.params.terrain,
          slime: { speed_bonus_max: this.params.slime.speed_bonus_max },
          aura: this.aura,
        });
        hydrationSystem(this.world, this.map, {
          terrain: this.params.terrain,
          slime: { hydration_save_max: this.params.slime.hydration_save_max },
          aura: this.aura,
        });
        slimeDepositSystem(this.world, this.map, {
          deposit_rate_per_step: this.params.slime.deposit_rate_per_step,
          terrain: this.params.terrain,
        });
      },
      gather_and_deliver: () => {
        harvestSystem(this.world, this.map);
      },
      upkeep_tick_if_due: () => {
        upkeepSystem(this.world, this.map, {
          interval_seconds: this.params.upkeep.interval_seconds,
          base: this.params.upkeep.base,
          colony: this.params.upkeep.colony,
          dormant_collapse_seconds: this.params.upkeep.dormant_collapse_seconds,
        }, this.activeColonies);
      },
      check_goal: () => {
        scoringSystem(
          this.world,
          {
            colonies_required: this.params.goal.colonies_required,
            sustain_minutes: this.params.goal.sustain_minutes,
            active_min_stock_any: this.params.goal.active_min_stock_any,
            tick_rate_hz: this.params.simulation.tick_rate_hz,
            starting_base: this.startingBase,
          },
          this.score,
        );
        this.activeColonies = Array.from(this.score.colonies);
      },
    };
  }

  tick() {
    for (const step of this.params.simulation.order) {
      const fn = this.dispatch[step];
      if (fn) fn();
    }
  }

  snapshot(): WorldSnapshot {
    const units = [
      {
        id: this.snail,
        x: Position.x[this.snail],
        y: Position.y[this.snail],
        hydration: Hydration.value[this.snail],
      },
    ];
    const snapshot = units as unknown as WorldSnapshot;
    snapshot.bases = this.bases.map((eid) => ({
      id: eid,
      x: Position.x[eid],
      y: Position.y[eid],
      biomass: Base.biomass[eid],
      water: Base.water[eid],
      active: Upkeep.active[eid] === 1,
    }));
    snapshot.startingBase = this.startingBase;
    return snapshot;
  }

  setVelocity(dx: number, dy: number) {
    Destination.x[this.snail] = Position.x[this.snail] + dx;
    Destination.y[this.snail] = Position.y[this.snail] + dy;
    Destination.active[this.snail] = 1;
    Velocity.dx[this.snail] = 0;
    Velocity.dy[this.snail] = 0;
  }

  goalProgress() {
    return {
      active: this.score.activeColonies,
      required: this.params.goal.colonies_required,
      sustain_seconds: this.score.sustainTicks / this.params.simulation.tick_rate_hz,
      sustain_required: this.params.goal.sustain_minutes * 60,
    };
  }

  goalResult() {
    return this.score.result;
  }

  getMap(): MapDef {
    return this.map;
  }

  setMap(map: MapDef) {
    this.map = map;
    this.seedBasesFromMap();
    const maxX = map.width - 1;
    const maxY = map.height - 1;
    Position.x[this.snail] = Math.max(0, Math.min(Position.x[this.snail], maxX));
    Position.y[this.snail] = Math.max(0, Math.min(Position.y[this.snail], maxY));
    Destination.x[this.snail] = Math.max(0, Math.min(Destination.x[this.snail], maxX));
    Destination.y[this.snail] = Math.max(0, Math.min(Destination.y[this.snail], maxY));
    if (this.startingBase !== undefined) {
      Worker.base[this.snail] = this.startingBase;
    } else {
      Worker.base[this.snail] = -1;
    }
  }

  private seedBasesFromMap() {
    for (const eid of this.bases) {
      removeComponent(this.world, Position, eid);
      removeComponent(this.world, Base, eid);
      removeComponent(this.world, Upkeep, eid);
    }
    const newBases: number[] = [];
    this.startingBase = undefined;
    this.map.tiles.forEach((tile, index) => {
      if (tile.structure !== Structure.Colony) {
        return;
      }
      const eid = addEntity(this.world);
      addComponent(this.world, Position, eid);
      addComponent(this.world, Base, eid);
      addComponent(this.world, Upkeep, eid);
      const x = index % this.map.width;
      const y = Math.floor(index / this.map.width);
      Position.x[eid] = Math.max(0, Math.min(x, this.map.width - 1));
      Position.y[eid] = Math.max(0, Math.min(y, this.map.height - 1));
      initBase(eid);
      initUpkeep(eid, this.params.upkeep.interval_seconds);
      newBases.push(eid);
      if (this.startingBase === undefined) {
        this.startingBase = eid;
      }
    });
    this.bases = newBases;
    this.activeColonies = [...this.bases];
    this.score.colonies = new Set(this.bases);
  }
}

