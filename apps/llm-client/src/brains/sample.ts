import type {
  LLMGameBrain,
  MoveCommand,
  RoomStateMessage,
  StateSnapshotMessage,
} from '../client';

export interface ScriptedMove extends Omit<MoveCommand, 't'> {}

export interface ScriptedBrainOptions {
  /**
   * Sequence of moves issued after successive State messages.
   */
  moves?: ScriptedMove[];
  /**
   * Optional logger for tracing activity.
   */
  log?: (message: string) => void;
}

const DEFAULT_MOVES: ScriptedMove[] = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: -1 },
];

/**
 * Creates a deterministic brain that immediately readies up and cycles through a scripted move list.
 */
export function createScriptedBrain(
  options: ScriptedBrainOptions = {},
): LLMGameBrain {
  const moves = options.moves?.length ? options.moves : DEFAULT_MOVES;
  let index = 0;

  const nextMove = (): MoveCommand => {
    const move = moves[index % moves.length];
    index += 1;
    return { t: 'Move', ...move };
  };

  const log = options.log ?? (() => undefined);

  return {
    async onLobbyState(_state, ctx) {
      log('Received lobby state; setting ready=true');
      ctx.setReady(true);
    },
    async onRoomState(state: RoomStateMessage) {
      log(
        `Entered room with map ${state.map.width}x${state.map.height} and ${state.entities.length} entities`,
      );
    },
    async onState(_state: StateSnapshotMessage) {
      const move = nextMove();
      log(`Issuing move dx=${move.dx} dy=${move.dy}`);
      return move;
    },
  };
}

