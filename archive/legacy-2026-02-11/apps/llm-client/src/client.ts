import NodeWebSocket, { RawData } from 'ws';
import type { ClientCommand, ServerMessage } from '@snail/protocol';

export type LobbyStateMessage = Extract<ServerMessage, { t: 'LobbyState' }>;
export type RoomStateMessage = Extract<ServerMessage, { t: 'RoomState' }>;
export type StateSnapshotMessage = Extract<ServerMessage, { t: 'State' }>;
export type MoveCommand = Extract<ClientCommand, { t: 'Move' }>;

export type Awaitable<T> = T | Promise<T>;

export interface BrainContext {
  setReady: (ready: boolean) => void;
  sendCommand: (command: ClientCommand) => void;
}

export interface LLMGameBrain {
  onLobbyState?: (
    state: LobbyStateMessage,
    context: BrainContext,
  ) => Awaitable<void | boolean | { ready: boolean }>;
  onRoomState?: (
    state: RoomStateMessage,
    context: BrainContext,
  ) => Awaitable<void>;
  onState?: (
    state: StateSnapshotMessage,
    context: BrainContext,
  ) => Awaitable<void | MoveCommand | MoveCommand[]>;
}

export interface LLMGameClientOptions {
  /**
   * WebSocket endpoint. If the protocol is omitted, `ws://` is assumed and `/ws` is only appended when no path is provided.
   */
  url: string;
  /**
   * Player name announced during the initial Join command.
   */
  name: string;
  /**
   * Optional LLM brain implementation that reacts to server messages.
   */
  brain?: LLMGameBrain;
  /**
   * Optional WebSocket implementation, useful for testing.
   */
  WebSocketImpl?: typeof NodeWebSocket;
  /**
   * Invoked after a successful connection and Join.
   */
  onOpen?: () => void;
  /**
   * Invoked when the underlying WebSocket closes.
   */
  onClose?: (code: number, reason: Buffer) => void;
  /**
   * Invoked when the underlying WebSocket emits an error.
   */
  onError?: (error: Error) => void;
  /**
   * Optional logging hook.
   */
  logger?: {
    info?: (message: string) => void;
    error?: (message: string, error: unknown) => void;
  };
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const target = new URL(hasProtocol ? trimmed : `ws://${trimmed}`);

  if (!target.protocol) {
    target.protocol = 'ws:';
  }

  if (target.pathname === '' || target.pathname === '/') {
    target.pathname = '/ws';
  }

  return target.toString();
}

export class LLMGameClient {
  private readonly WebSocketImpl: typeof NodeWebSocket;
  private socket: NodeWebSocket | null = null;
  private readonly lobbyHandlers = new Set<
    (state: LobbyStateMessage) => Awaitable<void>
  >();
  private readonly roomHandlers = new Set<
    (state: RoomStateMessage) => Awaitable<void>
  >();
  private readonly stateHandlers = new Set<
    (state: StateSnapshotMessage) => Awaitable<void>
  >();
  private readonly options: LLMGameClientOptions;
  private readonly brainContext: BrainContext;
  private hasJoined = false;
  private lastReadySent: boolean | null = null;
  private lastLobbyState: LobbyStateMessage | null = null;
  private lastRoomState: RoomStateMessage | null = null;
  private lastState: StateSnapshotMessage | null = null;

  constructor(options: LLMGameClientOptions) {
    this.options = options;
    this.WebSocketImpl = options.WebSocketImpl ?? NodeWebSocket;
    this.brainContext = {
      setReady: (ready: boolean) => this.setReady(ready),
      sendCommand: (command: ClientCommand) => this.sendCommand(command),
    };
  }

  /**
   * Establishes the WebSocket connection and sends the initial Join command.
   */
  async connect(): Promise<void> {
    if (this.socket) {
      throw new Error('LLMGameClient is already connected.');
    }

    const target = normalizeUrl(this.options.url);
    const socket = new this.WebSocketImpl(target);
    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      const handleOpen = () => {
        socket.off('error', handleError);
        socket.on('message', this.handleMessage);
        socket.on('close', this.handleClose);
        socket.on('error', this.handleError);
        try {
          this.sendCommand({ t: 'Join', name: this.options.name });
          this.hasJoined = true;
        } catch (error) {
          reject(error as Error);
          return;
        }
        this.options.logger?.info?.(
          `Connected to ${target} as ${this.options.name}`,
        );
        this.options.onOpen?.();
        resolve();
      };

      const handleError = (error: Error) => {
        socket.off('open', handleOpen);
        socket.off('message', this.handleMessage);
        socket.off('close', this.handleClose);
        this.socket = null;
        reject(error);
      };

      socket.once('open', handleOpen);
      socket.once('error', handleError);
    });
  }

  /**
   * Gracefully closes the WebSocket connection.
   */
  close(): void {
    if (!this.socket) return;
    this.socket.off('message', this.handleMessage);
    this.socket.off('close', this.handleClose);
    this.socket.off('error', this.handleError);
    this.socket.close();
    this.socket = null;
    this.hasJoined = false;
    this.lastReadySent = null;
  }

  /**
   * Registers a handler for LobbyState messages.
   */
  onLobbyState(handler: (state: LobbyStateMessage) => Awaitable<void>): () => void {
    this.lobbyHandlers.add(handler);
    return () => this.lobbyHandlers.delete(handler);
  }

  /**
   * Registers a handler for RoomState messages.
   */
  onRoomState(handler: (state: RoomStateMessage) => Awaitable<void>): () => void {
    this.roomHandlers.add(handler);
    return () => this.roomHandlers.delete(handler);
  }

  /**
   * Registers a handler for State snapshots.
   */
  onState(
    handler: (state: StateSnapshotMessage) => Awaitable<void>,
  ): () => void {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  /**
   * Sends an arbitrary command to the server.
   */
  sendCommand(command: ClientCommand): void {
    if (!this.socket) {
      throw new Error('Cannot send command before connecting.');
    }
    if (this.socket.readyState !== this.WebSocketImpl.OPEN) {
      throw new Error('WebSocket is not open.');
    }

    if (command.t === 'SetReady') {
      if (this.lastReadySent === command.ready) {
        return;
      }
      this.lastReadySent = command.ready;
    }

    if (command.t === 'Join') {
      if (this.hasJoined) {
        throw new Error('Join command has already been sent.');
      }
      this.hasJoined = true;
    }

    this.socket.send(JSON.stringify(command));
  }

  /**
   * Convenience helper for toggling ready state.
   */
  setReady(ready: boolean): void {
    if (this.lastReadySent === ready) {
      return;
    }
    this.sendCommand({ t: 'SetReady', ready });
  }

  /**
   * Last received lobby state, if any.
   */
  get lobbyState(): LobbyStateMessage | null {
    return this.lastLobbyState;
  }

  /**
   * Last received room state, if any.
   */
  get roomState(): RoomStateMessage | null {
    return this.lastRoomState;
  }

  /**
   * Last received simulation snapshot, if any.
   */
  get state(): StateSnapshotMessage | null {
    return this.lastState;
  }

  private readonly handleMessage = async (data: RawData) => {
    try {
      const json = typeof data === 'string' ? data : data.toString();
      const message = JSON.parse(json) as ServerMessage;
      await this.dispatchMessage(message);
    } catch (error) {
      this.options.logger?.error?.('Failed to process server message', error);
    }
  };

  private readonly handleClose = (code: number, reason: Buffer) => {
    if (this.socket) {
      this.socket.off('message', this.handleMessage);
      this.socket.off('error', this.handleError);
      this.socket.off('close', this.handleClose);
      this.socket = null;
    }
    this.hasJoined = false;
    this.lastReadySent = null;
    this.options.onClose?.(code, reason);
  };

  private readonly handleError = (error: Error) => {
    this.options.logger?.error?.('WebSocket error', error);
    this.options.onError?.(error);
  };

  private async dispatchMessage(message: ServerMessage): Promise<void> {
    switch (message.t) {
      case 'LobbyState':
        this.lastLobbyState = message;
        await this.notifyHandlers(this.lobbyHandlers, message);
        await this.invokeLobbyBrain(message);
        break;
      case 'RoomState':
        this.lastRoomState = message;
        await this.notifyHandlers(this.roomHandlers, message);
        await this.invokeBrain('onRoomState', message);
        break;
      case 'State':
        this.lastState = message;
        await this.notifyHandlers(this.stateHandlers, message);
        await this.invokeStateBrain(message);
        break;
      default:
        break;
    }
  }

  private async notifyHandlers<
    TMessage,
    THandler extends (message: TMessage) => Awaitable<void>,
  >(handlers: Set<THandler>, message: TMessage): Promise<void> {
    for (const handler of handlers) {
      await handler(message);
    }
  }

  private async invokeLobbyBrain(message: LobbyStateMessage): Promise<void> {
    const { brain } = this.options;
    if (!brain?.onLobbyState) return;
    try {
      const result = await brain.onLobbyState(message, this.brainContext);
      if (typeof result === 'boolean') {
        this.setReady(result);
      } else if (result && typeof result === 'object' && 'ready' in result) {
        const { ready } = result as { ready: unknown };
        if (typeof ready === 'boolean') {
          this.setReady(ready);
        }
      }
    } catch (error) {
      this.options.logger?.error?.('Brain onLobbyState failed', error);
    }
  }

  private async invokeBrain<T extends keyof LLMGameBrain>(
    key: T,
    message: Parameters<NonNullable<LLMGameBrain[T]>>[0],
  ): Promise<void> {
    const brain = this.options.brain;
    const handler = brain?.[key];
    if (!handler) return;
    try {
      await (handler as (
        state: typeof message,
        context: BrainContext,
      ) => Awaitable<void>)(message, this.brainContext);
    } catch (error) {
      this.options.logger?.error?.(`Brain ${String(key)} failed`, error);
    }
  }

  private async invokeStateBrain(
    message: StateSnapshotMessage,
  ): Promise<void> {
    const brain = this.options.brain;
    if (!brain?.onState) return;
    try {
      const result = await brain.onState(message, this.brainContext);
      if (!result) return;
      const commands = Array.isArray(result) ? result : [result];
      for (const command of commands) {
        this.sendCommand(command);
      }
    } catch (error) {
      this.options.logger?.error?.('Brain onState failed', error);
    }
  }
}

