interface SnailPanelProps {
  name: string;
  stars: number;
  onClose: () => void;
}

export function SnailPanel({ name, stars, onClose }: SnailPanelProps) {
  return (
    <div className="min-w-[200px] text-sage-100 bg-stone-800/90 p-4 rounded border border-stone-700 shadow">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">{name}</h2>
        <button
          className="px-2 text-sage-100 hover:text-brown-400"
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
        <button className="bg-sage-600 text-stone-100 px-2 py-1 rounded border border-stone-700 shadow">
          Feed
        </button>
        <button className="bg-sage-700 text-stone-100 px-2 py-1 rounded border border-stone-700 shadow">
          Explore
        </button>
      </div>
    </div>
  );
}

