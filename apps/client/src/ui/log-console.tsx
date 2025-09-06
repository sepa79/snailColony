
import React, { useEffect, useRef } from 'react';
import { Card } from './components';

export type LogEntry = { ts: number; msg: string };

interface LogConsoleProps {
  inLogs: LogEntry[];
  outLogs: LogEntry[];
  systemLogs: LogEntry[];
  upkeepLogs: LogEntry[];
  goalLogs: LogEntry[];
}

const LogColumn = React.memo(function LogColumn({
  title,
  logs,
}: {
  title: string;
  logs: LogEntry[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <Card className="h-48 flex flex-col">
      <h3 className="font-semibold mb-1 text-sm px-2 pt-2">{title}</h3>
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
}: LogConsoleProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-4">
      <LogColumn title="IN" logs={inLogs} />
      <LogColumn title="OUT" logs={outLogs} />
      <LogColumn title="System" logs={systemLogs} />
      <LogColumn title="Upkeep" logs={upkeepLogs} />
      <LogColumn title="Goal" logs={goalLogs} />
    </div>
  );
}

