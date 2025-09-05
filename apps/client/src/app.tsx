import { useEffect, useState } from 'react';
import { useLatency } from './net/use-latency';
import { EntityStatus } from './ui/entity-status';
import { LogConsole, LogEntry } from './ui/log-console';
import { MapView } from './ui/map-view';
import { Map3DView } from './ui/map-3d-view';
import { MapDef, ServerMessage } from '@snail/protocol';

export function App() {
  const [url, setUrl] = useState('localhost:3000');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [rooms, setRooms] = useState<{
    id: string;
    players: number;
    started: boolean;
  }[]>([]);
  const [room, setRoom] = useState('');
  const [snapshot, setSnapshot] = useState<{
    t: 'State';
    entities: { id: number; x: number; y: number; hydration: number }[];
  } | null>(null);
  const [map, setMap] = useState<MapDef | null>(null);
  const [inLogs, setInLogs] = useState<LogEntry[]>([]);
  const [outLogs, setOutLogs] = useState<LogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const latency = useLatency(socket);
  const [voxel, setVoxel] = useState(false);

  const log = (
    setter: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  ) =>
    (msg: string) =>
      setter((l) => [...l, { ts: Date.now(), msg }]);

  const logIn = log(setInLogs);
  const logOut = log(setOutLogs);
  const logSys = log(setSystemLogs);

  useEffect(() => {
    let target = url;
    if (!target.includes('://')) {
      target = `ws://${target}`;
    }
    if (!target.endsWith('/ws')) {
      target = target.replace(/\/?$/, '/ws');
    }
    logSys(`Connecting to ${target}`);
    logOut(`WS connect ${target}`);
    const ws = new WebSocket(target);
    ws.onopen = () => {
      logSys('WebSocket opened');
      const list = { t: 'ListRooms' } as const;
      logOut(JSON.stringify(list));
      ws.send(JSON.stringify(list));
    };
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
      } else if (msg.t === 'RoomsList') {
        setRooms(msg.rooms);
        if (msg.rooms.length && !room) setRoom(msg.rooms[0].id);
      }
    };
    setSocket(ws);
    return () => ws.close();
  }, [url]);

  const refreshRooms = () => {
    if (!socket) return;
    const list = { t: 'ListRooms' } as const;
    logOut(JSON.stringify(list));
    socket.send(JSON.stringify(list));
  };

  const join = () => {
    if (!socket) return;
    const joinMsg = { t: 'JoinRoom', roomId: room } as const;
    logOut(JSON.stringify(joinMsg));
    socket.send(JSON.stringify(joinMsg));
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
        {rooms.length > 0 && (
          <select
            className="border p-1 mr-2"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} ({r.players}{r.started ? '*' : ''})
              </option>
            ))}
          </select>
        )}
        <button
          className="bg-gray-300 px-2 mr-2"
          onClick={refreshRooms}
          disabled={!socket}
        >
          Refresh
        </button>
        <button
          className="bg-blue-500 text-white px-2"
          onClick={join}
          disabled={!room}
        >
          Join
        </button>
        {map && (
          <button
            className="bg-purple-500 text-white px-2 ml-2"
            onClick={() => setVoxel((v) => !v)}
          >
            {voxel ? '2D View' : '3D View'}
          </button>
        )}
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
            {voxel ? <Map3DView map={map} /> : <MapView map={map} />}
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
