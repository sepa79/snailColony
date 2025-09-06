
import React, { useEffect, useRef } from 'react';
import { Card } from './components';

export type LogEntry = { ts: number; msg: string };

interface LogConsoleProps {
  inLogs: LogEntry[];
  outLogs: LogEntry[];
  systemLogs: LogEntry[];
  upkeepLogs: LogEntry[];
  goalLogs: LogEntry[];
  onClearIn?: () => void;
  onClearOut?: () => void;
  onClearSystem?: () => void;
  onClearUpkeep?: () => void;
  onClearGoal?: () => void;
}

const LogColumn = React.memo(function LogColumn({
  title,
  logs,
  onClear,
}: {
  title: string;
  logs: LogEntry[];
  onClear?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <Card className="h-48 flex flex-col">
      <div className="flex justify-between items-center mb-1 px-2 pt-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        {onClear && (
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>
      <div ref={ref} className="flex-1 overflow-auto px-2 pb-2">
        <ul className="text-xs space-y-1">
          {logs.map((log, i) => (
            <li key={i}>
              <span className="text-gray-500 mr-1">
                {new Date(log.ts).toLocaleTimeString()}
              </span>
              {log.msg}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
});

export function LogConsole({
  inLogs,
  outLogs,
  systemLogs,
  upkeepLogs,
  goalLogs,
  onClearIn,
  onClearOut,
  onClearSystem,
  onClearUpkeep,
  onClearGoal,
}: LogConsoleProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-4">
      <LogColumn title="IN" logs={inLogs} onClear={onClearIn} />
      <LogColumn title="OUT" logs={outLogs} onClear={onClearOut} />
      <LogColumn title="System" logs={systemLogs} onClear={onClearSystem} />
      <LogColumn title="Upkeep" logs={upkeepLogs} onClear={onClearUpkeep} />
      <LogColumn title="Goal" logs={goalLogs} onClear={onClearGoal} />
    </div>
  );
}

