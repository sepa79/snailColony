import { useState } from 'react';
import { useLatency } from './net/use-latency';
import { EntityStatus } from './ui/entity-status';
import { LogConsole, LogEntry } from './ui/log-console';
import { MapView } from './ui/map-view';
import { MapDef, ServerMessage } from '@snail/protocol';

export function App() {
  const [url, setUrl] = useState('localhost:3000');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [snapshot, setSnapshot] = useState<{
    t: 'State';
    entities: { id: number; x: number; y: number; hydration: number }[];
  } | null>(null);
  const [map, setMap] = useState<MapDef | null>(null);
  const [inLogs, setInLogs] = useState<LogEntry[]>([]);
  const [outLogs, setOutLogs] = useState<LogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const latency = useLatency(socket);

  const log = (
    setter: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  ) =>
    (msg: string) =>
      setter((l) => [...l, { ts: Date.now(), msg }]);

  const logIn = log(setInLogs);
  const logOut = log(setOutLogs);
  const logSys = log(setSystemLogs);

  const connect = () => {
    let target = url;
    if (!target.includes('://')) {
      target = `ws://${target}`;
    }
    if (!target.endsWith('/ws')) {
      target = target.replace(/\/?$/, '/ws');
    }
    setUrl(target);
    logSys(`Connecting to ${target}`);
    logOut(`WS connect ${target}`);
    const ws = new WebSocket(target);
    ws.onopen = () => logSys('WebSocket opened');
    ws.onclose = () => logSys('Connection closed');
    ws.onerror = () => logSys('WebSocket error');
    ws.onmessage = (ev) => {
      logIn(ev.data);
      const msg = JSON.parse(ev.data) as ServerMessage;
      if (msg.t === 'RoomState') {
        setMap(msg.map);
        setSnapshot({ t: 'State', entities: msg.entities });
      } else if (msg.t === 'State') {
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
      {socket && (
        <div>
          <p className="text-green-700">Connected</p>
          {latency !== null && (
            <p className="text-sm text-gray-700">Latency: {latency} ms</p>
          )}
        </div>
      )}
      <div className="mt-4 flex">
        {map && (
          <div className="flex-1">
            <MapView map={map} />
          </div>
        )}
        <div className="ml-4 w-64">
          {snapshot && snapshot.entities[0] && (
            <div className="mb-4">
              <EntityStatus
                x={snapshot.entities[0].x}
                y={snapshot.entities[0].y}
                hydration={snapshot.entities[0].hydration}
              />
            </div>
          )}
          <LogConsole
            inLogs={inLogs}
            outLogs={outLogs}
            systemLogs={systemLogs}
          />
        </div>
      </div>
    </div>
  );
}
