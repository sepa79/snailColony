import { useState } from 'react';
import { EntityStatus } from './ui/entity-status';
import { LogConsole } from './ui/log-console';

type StateMessage = {
  t: 'State';
  entities: { id: number; x: number; y: number; hydration: number }[];
};

export function App() {
  const [url, setUrl] = useState('ws://localhost:3000');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [snapshot, setSnapshot] = useState<StateMessage | null>(null);
  const [inLogs, setInLogs] = useState<string[]>([]);
  const [outLogs, setOutLogs] = useState<string[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  const connect = () => {
    setSystemLogs((l) => [...l, `Connecting to ${url}`]);
    setOutLogs((l) => [...l, `WS connect ${url}`]);
    const ws = new WebSocket(url);
    ws.onopen = () => setSystemLogs((l) => [...l, 'WebSocket opened']);
    ws.onclose = () => setSystemLogs((l) => [...l, 'Connection closed']);
    ws.onerror = () => setSystemLogs((l) => [...l, 'WebSocket error']);
    ws.onmessage = (ev) => {
      setInLogs((l) => [...l, ev.data]);
      const msg = JSON.parse(ev.data) as StateMessage | { t: string };
      if (msg.t === 'State') {
        setSnapshot(msg);
      }
    };
    setSocket(ws);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">SnailColony</h1>
      <div className="mb-2">
        <input
          className="border p-1 mr-2"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-2" onClick={connect}>
          Connect
        </button>
      </div>
      {socket && <p className="text-green-700">Connected</p>}
      {snapshot && snapshot.entities[0] && (
        <div className="mt-4">
          <EntityStatus
            x={snapshot.entities[0].x}
            y={snapshot.entities[0].y}
            hydration={snapshot.entities[0].hydration}
          />
        </div>
      )}
      <LogConsole inLogs={inLogs} outLogs={outLogs} systemLogs={systemLogs} />
    </div>
  );
}
