interface ColonyPanelProps {
  name: string;
  stars: number;
  onClose: () => void;
}

export function ColonyPanel({ name, stars, onClose }: ColonyPanelProps) {
  return (
    <div className="min-w-[200px] text-dew">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">{name}</h2>
        <button
          className="px-2 text-dew hover:text-amber"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="mb-4">
        {Array.from({ length: stars }).map((_, i) => (
          <span key={i}>⭐</span>
        ))}
      </div>
      <div className="flex gap-2">
        <button className="bg-moss text-soil px-2 py-1 rounded">Upgrade</button>
        <button className="bg-amber text-soil px-2 py-1 rounded">Abandon</button>
      </div>
    </div>
  );
}

