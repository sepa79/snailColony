import { useEffect, useState } from 'react';
import { useLatency } from './net/use-latency';
import { EntityStatus } from './ui/entity-status';
import { LogConsole, LogEntry } from './ui/log-console';
import { MapView } from './ui/map-view';
import { Map3DView } from './ui/map-3d-view';
import { HUD } from './ui/hud';
import { ResourceBar, type Resources } from './ui/resource-bar';
import { ColonyPanel } from './ui/colony-panel';
import { SnailPanel } from './ui/snail-panel';
import { MapDef, ServerMessage, GameParams } from '@snail/protocol';

const LOG_LIMIT = 100;

export function App() {
  const [url, setUrl] = useState('localhost:3000');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
  const [inventory, setInventory] = useState<
    (Resources & { biomass?: number }) | null
  >(null);
  const [goalProgress, setGoalProgress] = useState<{
    active: number;
    required: number;
    sustain_seconds: number;
    sustain_required: number;
  } | null>(null);
  const latency = useLatency(socket);
  const [voxel, setVoxel] = useState(false);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState(() => {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('playerName') ?? '';
  });
  const [lobby, setLobby] = useState<{
    players: { name: string; ready: boolean }[];
    started: boolean;
  } | null>(null);
  type ActivePanel = { type: 'colony'; name: string; stars: number } | null;
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [selectedSnailId, setSelectedSnailId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(true);
  // Default to development mode unless explicitly disabled via VITE_DEV=false
  const isDev = import.meta.env.VITE_DEV !== 'false';

  const log = (
    setter: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  ) =>
    (msg: string) =>
      setter((l) => [...l.slice(-LOG_LIMIT + 1), { ts: Date.now(), msg }]);

  const logIn = log(setInLogs);
  const logOut = log(setOutLogs);
  const logSys = log(setSystemLogs);
  const logUpkeep = log(setUpkeepLogs);
  const logGoal = log(setGoalLogs);

  const clearInLogs = () => setInLogs([]);
  const clearOutLogs = () => setOutLogs([]);
  const clearSystemLogs = () => setSystemLogs([]);
  const clearUpkeepLogs = () => setUpkeepLogs([]);
  const clearGoalLogs = () => setGoalLogs([]);
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('playerName', name);
  }, [name]);

  const statusColors: Record<
    'disconnected' | 'connecting' | 'connected' | 'error',
    string
  > = {
    disconnected: 'bg-soil text-dew',
    connecting: 'bg-dew text-soil',
    connected: 'bg-moss text-dew',
    error: 'bg-amber text-soil',
  };
  const statusIcons: Record<
    'disconnected' | 'connecting' | 'connected' | 'error',
    string
  > = {
    disconnected: '🔌',
    connecting: '⏳',
    connected: '✅',
    error: '❌',
  };
  const statusText: Record<
    'disconnected' | 'connecting' | 'connected' | 'error',
    string
  > = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    connected: 'Connected',
    error: 'Error',
  };

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
    setConnectionStatus('connecting');
    setErrorMessage(null);
    const ws = new WebSocket(target);
    ws.onopen = () => {
      logSys('WebSocket opened');
      setConnectionStatus('connected');
      const join = { t: 'Join', name } as const;
      logOut(JSON.stringify(join));
      ws.send(JSON.stringify(join));
    };
    ws.onclose = () => {
      logSys('Connection closed');
      setConnectionStatus('disconnected');
      setSocket(null);
    };
    ws.onerror = () => {
      logSys('WebSocket error');
      setConnectionStatus('error');
      setErrorMessage('WebSocket error');
    };
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
        setInventory((msg.params.resources as Resources & { biomass?: number }) ?? null);
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
    setConnectionStatus('disconnected');
    setErrorMessage(null);
    setLobby(null);
    setMap(null);
    setSnapshot(null);
    setReady(false);
    setParams(null);
    setInventory(null);
    setGoalProgress(null);
    setUpkeepLogs([]);
    setGoalLogs([]);
    setSelectedSnailId(null);
  };

  const toggleReady = () => {
    if (!socket) return;
    const cmd = { t: 'SetReady', ready: !ready } as const;
    logOut(JSON.stringify(cmd));
    socket.send(JSON.stringify(cmd));
  };

  const sendCommand = (cmd: { t: 'Move'; dx: number; dy: number }) => {
    if (!socket) return;
    logOut(JSON.stringify(cmd));
    socket.send(JSON.stringify(cmd));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePanel(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(!map);
  }, [map]);

  return (
    <div className="relative w-screen h-screen bg-soil">
      {/* Map centered with accent border taking 90% of viewport */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[90vw] h-[90vh] border-4 border-glow">
          {map && (
            voxel ? (
              <Map3DView
                map={map}
                entities={snapshot?.entities ?? []}
                selectedId={selectedSnailId}
                onSelect={setSelectedSnailId}
                onCommand={sendCommand}
              />
            ) : (
              <MapView
                map={map}
                entities={snapshot?.entities ?? []}
                selectedId={selectedSnailId}
                onSelect={setSelectedSnailId}
                onCommand={sendCommand}
              />
            )
          )}
        </div>
      </div>

      {/* Resource bar and menu button */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <ResourceBar resources={inventory ?? {}} />
        <button
          className="absolute top-2 right-2 bg-stone-800/90 px-2 py-1 rounded text-dew"
          onClick={() => setMenuOpen((m) => !m)}
        >
          Menu
        </button>
      </div>

      {/* Overlays */}
      {map && <HUD inventory={inventory} goal={goalProgress} />}

      {activePanel && (
        <div className="absolute right-2 top-2 bg-stone-800/90 p-4 rounded shadow text-dew z-30">
          {activePanel.type === 'colony' && (
            <ColonyPanel
              name={activePanel.name}
              stars={activePanel.stars}
              onClose={() => setActivePanel(null)}
            />
          )}
        </div>
      )}

      {selectedSnailId !== null && (
        <div className="absolute right-2 top-2 bg-stone-800/90 p-4 rounded shadow text-dew z-30">
          <SnailPanel
            name={`Snail ${selectedSnailId}`}
            stars={0}
            onClose={() => setSelectedSnailId(null)}
          />
        </div>
      )}

      {menuOpen && (
        <div className="absolute top-16 left-2 bg-stone-800/90 p-4 rounded shadow text-dew z-30 space-y-2 max-w-md">
          <h1 className="text-xl font-bold mb-2 text-glow">SnailColony</h1>
          <div className={`p-1 text-center ${statusColors[connectionStatus]}`}>
            <span className="mr-1">{statusIcons[connectionStatus]}</span>
            {statusText[connectionStatus]}
            {connectionStatus === 'error' && errorMessage && (
              <span className="ml-1">{errorMessage}</span>
            )}
          </div>
          <div className="space-y-2">
            <div>
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
            </div>
            <div>
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
            {connectionStatus === 'connected' && latency !== null && (
              <p className="text-sm text-dew">Latency: {latency} ms</p>
            )}
            {!map && lobby && !lobby.started && (
              <div>
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
            {isDev && (
              <div>
                <button
                  className="bg-glow text-soil px-2 mr-2"
                  onClick={() =>
                    setActivePanel({ type: 'colony', name: 'Demo Colony', stars: 3 })
                  }
                >
                  Show Colony
                </button>
                <button
                  className="bg-glow text-soil px-2"
                  onClick={() => setSelectedSnailId(0)}
                >
                  Show Snail
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Position panel */}
      {snapshot && snapshot.entities[0] && (
        <div className="absolute bottom-2 right-2 z-30">
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
              return tile.slime_intensity * params.slime.speed_bonus_max * 100;
            })()}
          />
        </div>
      )}

      {/* Logs overlay */}
      <div className="absolute bottom-2 left-2 z-30 max-w-[90vw]">
        <LogConsole
          inLogs={inLogs}
          outLogs={outLogs}
          systemLogs={systemLogs}
          upkeepLogs={upkeepLogs}
          goalLogs={goalLogs}
          onClearIn={clearInLogs}
          onClearOut={clearOutLogs}
          onClearSystem={clearSystemLogs}
          onClearUpkeep={clearUpkeepLogs}
          onClearGoal={clearGoalLogs}
        />
      </div>
    </div>
  );
}
