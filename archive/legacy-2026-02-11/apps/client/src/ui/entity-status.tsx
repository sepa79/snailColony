interface EntityStatusProps {
  x: number;
  y: number;
  hydration: number;
  slimeBonus: number;
}

export function EntityStatus({ x, y, hydration, slimeBonus }: EntityStatusProps) {
  const hydrationPct = Math.max(0, Math.min(100, hydration));
  const slimePct = Math.max(0, Math.min(100, slimeBonus));
  return (
    <div className="p-4 border rounded bg-white max-w-sm">
      <div className="mb-2">
        <span className="font-semibold">Position:</span> ({x.toFixed(2)}, {y.toFixed(2)})
      </div>
      <div className="mb-2" title="Current hydration level">
        <div className="flex justify-between mb-1 text-sm">
          <span className="font-semibold">Hydration</span>
          <span>
            {hydrationPct.toFixed(0)}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded h-2">
          <div
            className="bg-blue-500 h-2 rounded"
            style={{ width: `${hydrationPct}%` }}
          ></div>
        </div>
      </div>
      <div title="Speed bonus provided by slime trail">
        <div className="flex justify-between mb-1 text-sm">
          <span className="font-semibold">Slime Bonus</span>
          <span>{slimePct.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded h-2">
          <div
            className="bg-green-500 h-2 rounded"
            style={{ width: `${slimePct}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
