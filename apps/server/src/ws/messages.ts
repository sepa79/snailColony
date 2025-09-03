export type ClientCommand = { t: 'Ping'; nonce: number };

export type ServerMessage = { t: 'Pong'; nonce: number; rtt: number };
