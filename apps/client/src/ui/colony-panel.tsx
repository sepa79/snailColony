import { StarRating, Button } from './components';

interface ColonyPanelProps {
  name: string;
  stars: number;
  onClose: () => void;
  clearSelection: () => void;
}

export function ColonyPanel({ name, stars, onClose, clearSelection }: ColonyPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">{name}</h2>
        <Button
          variant="ghost"
          onClick={() => {
            clearSelection();
            onClose();
          }}
          aria-label="Close"
          className="hover:text-amber"
        >
          ✕
        </Button>
      </div>
      <div className="mb-4">
        <StarRating stars={stars} />
      </div>
      <div className="flex gap-2">
        <Button variant="primary">Upgrade</Button>
        <Button variant="warning">Abandon</Button>
      </div>
    </div>
  );
}

