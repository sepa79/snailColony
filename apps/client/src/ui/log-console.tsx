
interface LogConsoleProps {
  inLogs: string[];
  outLogs: string[];
  systemLogs: string[];
}

function LogColumn({ title, logs }: { title: string; logs: string[] }) {
  return (
    <div className="bg-white border rounded p-2 h-48 overflow-auto">
      <h3 className="font-semibold mb-1 text-sm">{title}</h3>
      <ul className="text-xs space-y-1">
        {logs.map((log, i) => (
          <li key={i}>{log}</li>
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

