import { IWorld, addComponent, addEntity, createWorld } from 'bitecs';
import {
  Hydration,
  Position,
  Velocity,
  Worker,
  initWorker,
} from './components';
import { movementSystem } from './systems/movement.system';
import { hydrationSystem } from './systems/hydration.system';
import { slimeDepositSystem } from './systems/slime-deposit.system';
import { slimeDecaySystem } from './systems/slime-decay.system';
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

  constructor() {
    this.world = createWorld();
    this.snail = addEntity(this.world);
    addComponent(this.world, Position, this.snail);
    addComponent(this.world, Velocity, this.snail);
    addComponent(this.world, Hydration, this.snail);
    addComponent(this.world, Worker, this.snail);
    initWorker(this.snail);
    Position.x[this.snail] = 0;
    Position.y[this.snail] = 0;
    Velocity.dx[this.snail] = 0;
    Velocity.dy[this.snail] = 0;
    Hydration.value[this.snail] = 100;
    const svc = new MapService();
    this.map = svc.load('test');
    this.params = params as GameParams;
    this.score = { sustainTicks: 0, colonies: new Set(), activeColonies: 0 };
  }

  tick() {
    slimeDecaySystem(this.world, this.map, {
      slime: { decay_per_tick: this.params.slime.decay_per_tick },
      moisture: this.params.moisture,
    });
    movementSystem(this.world, this.map, this.params);
    hydrationSystem(this.world, this.map, this.params);
    slimeDepositSystem(this.world, this.map, {
      deposit_rate_per_step: this.params.slime.deposit_rate_per_step,
      terrain: this.params.terrain,
    });
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
    Velocity.dx[this.snail] = dx;
    Velocity.dy[this.snail] = dy;
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

