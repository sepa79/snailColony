import brainIcon from '../assets/icons/brain.svg';
import speedIcon from '../assets/icons/speed.svg';
import shellIcon from '../assets/icons/shell.svg';
import storageIcon from '../assets/icons/storage.svg';
import syncIcon from '../assets/icons/sync.svg';
import { Snail } from '../game/snail';
import { StarRating, Button } from './components';

interface SnailPanelProps {
  snail: Snail;
  onClose: () => void;
}

export function SnailPanel({ snail, onClose }: SnailPanelProps) {
  const stats = [
    { label: 'Brain', icon: brainIcon, value: snail.brain },
    { label: 'Speed', icon: speedIcon, value: snail.speed },
    { label: 'Shell', icon: shellIcon, value: snail.shell },
    { label: 'Storage', icon: storageIcon, value: snail.storage },
    { label: 'Sync', icon: syncIcon, value: snail.sync },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">{snail.name}</h2>
        <Button
          variant="ghost"
          onClick={onClose}
          aria-label="Close"
          className="hover:text-amber"
        >
          ✕
        </Button>
      </div>
      <div className="mb-4">
        <StarRating stars={snail.stars} />
      </div>
      <ul className="mb-4 space-y-1">
        {stats.map((s) => (
          <li key={s.label} className="flex items-center gap-1">
            <img src={s.icon} alt={s.label} className="w-4 h-4" />
            <span>
              {s.label}: {s.value}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button variant="secondary">Feed</Button>
        <Button variant="primary">Explore</Button>
      </div>
    </div>
  );
}
