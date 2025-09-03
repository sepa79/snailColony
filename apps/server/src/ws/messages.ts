export type ClientCommand =
  | { t: 'Ping'; nonce: number }
  | { t: 'Move'; dx: number; dy: number };

export type ServerMessage =
  | { t: 'Pong'; nonce: number; rtt: number }
  | {
      t: 'State';
      entities: { id: number; x: number; y: number; hydration: number }[];
    };
