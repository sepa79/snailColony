import { IWorld, addComponent, addEntity, createWorld } from 'bitecs';
import {
  Hydration,
  Position,
  Velocity,
  Destination,
  Worker,
  initWorker,
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
import { MapDef, GameParams } from '@snail/protocol';
import params from '../config';

export class World {
  private world: IWorld;
  private snail: number;
  private map: MapDef;
  private params: GameParams;
  private score: ScoreState;
  private aura?: {
    radius: number;
    speed_bonus: number;
    hydration_cost_hard_multiplier: number;
    slime_decay_multiplier: number;
    bases: { x: number; y: number }[];
  };
  private sidewalkDefaults: { base_speed: number; hydration_cost: number };
  private dispatch: Record<string, () => void>;

  constructor() {
    this.world = createWorld();
    this.snail = addEntity(this.world);
    addComponent(this.world, Position, this.snail);
    addComponent(this.world, Velocity, this.snail);
    addComponent(this.world, Destination, this.snail);
    addComponent(this.world, Hydration, this.snail);
    addComponent(this.world, Worker, this.snail);
    initWorker(this.snail);
    Position.x[this.snail] = 0;
    Position.y[this.snail] = 0;
    Velocity.dx[this.snail] = 0;
    Velocity.dy[this.snail] = 0;
    Destination.x[this.snail] = 0;
    Destination.y[this.snail] = 0;
    Destination.active[this.snail] = 0;
    Hydration.value[this.snail] = 100;
    const svc = new MapService();
    this.map = svc.load('test');
    this.params = params as GameParams;
    this.score = { sustainTicks: 0, colonies: new Set(), activeColonies: 0 };
    this.aura = undefined;
    this.sidewalkDefaults = {
      base_speed: this.params.terrain.sidewalk.base_speed,
      hydration_cost: this.params.terrain.sidewalk.hydration_cost,
    };
    this.dispatch = {
      update_moisture_and_auras: () => {
        this.aura = updateMoistureAndAurasSystem(
          this.world,
          this.map,
          this.params,
          this.sidewalkDefaults,
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
        });
      },
      check_goal: () => {
        scoringSystem(
          this.world,
          {
            colonies_required: this.params.goal.colonies_required,
            sustain_minutes: this.params.goal.sustain_minutes,
            active_min_stock_any: this.params.goal.active_min_stock_any,
            tick_rate_hz: this.params.simulation.tick_rate_hz,
            starting_base: undefined,
          },
          this.score,
        );
      },
    };
  }

  tick() {
    for (const step of this.params.simulation.order) {
      const fn = this.dispatch[step];
      if (fn) fn();
    }
  }

  snapshot() {
    return [
      {
        id: this.snail,
        x: Position.x[this.snail],
        y: Position.y[this.snail],
        hydration: Hydration.value[this.snail],
      },
    ];
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
}

