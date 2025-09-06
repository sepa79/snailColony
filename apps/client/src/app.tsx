import { useState } from 'react';
import { useLatency } from './net/use-latency';
import { EntityStatus } from './ui/entity-status';
import { LogConsole, LogEntry } from './ui/log-console';
import { MapView } from './ui/map-view';
import { Map3DView } from './ui/map-3d-view';
import { HUD } from './ui/hud';
import { MapDef, ServerMessage, GameParams } from '@snail/protocol';

export function App() {
  const [url, setUrl] = useState('localhost:3000');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [snapshot, setSnapshot] = useState<{
    t: 'State';
    entities: { id: number; x: number; y: number; hydration: number }[];
  } | null>(null);
  const [map, setMap] = useState<MapDef | null>(null);
  const [params, setParams] = useState<GameParams | null>(null);
  const [inLogs, setInLogs] = useState<LogEntry[]>([]);
  const [outLogs, setOutLogs] = useState<LogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [upkeepLogs, setUpkeepLogs] = useState<LogEntry[]>([]);
  const [goalLogs, setGoalLogs] = useState<LogEntry[]>([]);
  const [inventory, setInventory] = useState<{ water?: number; biomass?: number } | null>(
    null,
  );
  const [goalProgress, setGoalProgress] = useState<{
    active: number;
    required: number;
    sustain_seconds: number;
    sustain_required: number;
  } | null>(null);
  const latency = useLatency(socket);
  const [voxel, setVoxel] = useState(false);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [lobby, setLobby] = useState<{
    players: { name: string; ready: boolean }[];
    started: boolean;
  } | null>(null);

  const log = (
    setter: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  ) =>
    (msg: string) =>
      setter((l) => [...l, { ts: Date.now(), msg }]);

  const logIn = log(setInLogs);
  const logOut = log(setOutLogs);
  const logSys = log(setSystemLogs);
  const logUpkeep = log(setUpkeepLogs);
  const logGoal = log(setGoalLogs);

  const connect = () => {
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
      const join = { t: 'Join', name } as const;
      logOut(JSON.stringify(join));
      ws.send(JSON.stringify(join));
    };
    ws.onclose = () => logSys('Connection closed');
    ws.onerror = () => logSys('WebSocket error');
    ws.onmessage = (ev) => {
      logIn(ev.data);
      const msg = JSON.parse(ev.data) as ServerMessage;
      if (msg.t === 'LobbyState') {
        setLobby(msg);
        const me = msg.players.find((p) => p.name === name);
        setReady(me?.ready ?? false);
      } else if (msg.t === 'RoomState') {
        setMap(msg.map);
        setSnapshot({ t: 'State', entities: msg.entities });
        setParams(msg.params);
        setInventory(msg.params.resources ?? null);
        logUpkeep(
          `Base W:${msg.params.resources?.water ?? 0} B:${
            msg.params.resources?.biomass ?? 0
          }`,
        );
      } else if (msg.t === 'State') {
        setSnapshot(msg);
      } else if (msg.t === 'GoalProgress') {
        setGoalProgress(msg);
        logGoal(
          `Active ${msg.active}/${msg.required} sustain ${msg.sustain_seconds.toFixed(
            1,
          )}/${msg.sustain_required}s`,
        );
      } else if (msg.t === 'GoalResult') {
        logGoal(`Result: ${msg.result}`);
      }
    };
    setSocket(ws);
  };

  const disconnect = () => {
    socket?.close();
    setSocket(null);
    setLobby(null);
    setMap(null);
    setSnapshot(null);
    setReady(false);
    setParams(null);
    setInventory(null);
    setGoalProgress(null);
    setUpkeepLogs([]);
    setGoalLogs([]);
  };

  const toggleReady = () => {
    if (!socket) return;
    const cmd = { t: 'SetReady', ready: !ready } as const;
    logOut(JSON.stringify(cmd));
    socket.send(JSON.stringify(cmd));
  };

  return (
    <div className="p-4 min-h-screen">
      <h1 className="text-xl font-bold mb-2 text-glow">SnailColony</h1>
      {map && <HUD inventory={inventory} goal={goalProgress} />}
      <div className="mb-2">
        <input
          className="border border-dew bg-soil p-1 mr-2"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="border border-dew bg-soil p-1 mr-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="bg-glow text-soil px-2 mr-2"
          onClick={connect}
          disabled={!!socket || !name}
        >
          Connect
        </button>
        <button
          className="bg-amber text-soil px-2 mr-2"
          onClick={disconnect}
          disabled={!socket}
        >
          Disconnect
        </button>
        <button
          className="bg-moss text-dew px-2 mr-2"
          onClick={toggleReady}
          disabled={!socket || !lobby || lobby.started}
        >
          {ready ? 'Unready' : 'Ready'}
        </button>
        {map && (
          <button
            className="bg-dew text-soil px-2 ml-2"
            onClick={() => setVoxel((v) => !v)}
          >
            {voxel ? '2D View' : '3D View'}
          </button>
        )}
      </div>
      {socket && (
        <div>
          <p className="text-glow">Connected</p>
          {latency !== null && (
            <p className="text-sm text-dew">Latency: {latency} ms</p>
          )}
        </div>
      )}
      {!map && lobby && !lobby.started && (
        <div className="mt-4">
          <h2 className="font-bold">Lobby</h2>
          <ul className="list-disc ml-5">
            {lobby.players.map((p) => (
              <li key={p.name}>
                {p.name} {p.ready ? '(ready)' : ''}
              </li>
            ))}
          </ul>
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
                slimeBonus={(() => {
                  if (!map || !params) return 0;
                  const sx = Math.floor(snapshot.entities[0].x);
                  const sy = Math.floor(snapshot.entities[0].y);
                  const tile = map.tiles[sy * map.width + sx];
                  if (!tile) return 0;
                  return (
                    tile.slime_intensity * params.slime.speed_bonus_max * 100
                  );
                })()}
              />
            </div>
          )}
          <LogConsole
            inLogs={inLogs}
            outLogs={outLogs}
            systemLogs={systemLogs}
            upkeepLogs={upkeepLogs}
            goalLogs={goalLogs}
          />
        </div>
      </div>
    </div>
  );
}
