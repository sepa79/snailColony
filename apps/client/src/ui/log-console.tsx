
import { useEffect, useRef } from 'react';

export type LogEntry = { ts: number; msg: string };

interface LogConsoleProps {
  inLogs: LogEntry[];
  outLogs: LogEntry[];
  systemLogs: LogEntry[];
}

function LogColumn({ title, logs }: { title: string; logs: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div className="bg-white border rounded p-2 h-48 overflow-auto" ref={ref}>
      <h3 className="font-semibold mb-1 text-sm">{title}</h3>
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
  );
}

export function LogConsole({ inLogs, outLogs, systemLogs }: LogConsoleProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mt-4">
      <LogColumn title="IN" logs={inLogs} />
      <LogColumn title="OUT" logs={outLogs} />
      <LogColumn title="System" logs={systemLogs} />
    </div>
  );
}

