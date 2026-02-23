import React from 'react';
import { Card, ProgressBar } from './components';

interface HUDProps {
  inventory?: { water?: number; biomass?: number } | null;
  goal?: {
    active: number;
    required: number;
    sustain_seconds: number;
    sustain_required: number;
  } | null;
}

export function HUD({ inventory, goal }: HUDProps) {
  if (!inventory && !goal) return null;
  const remaining = React.useMemo(
    () => (goal ? Math.max(0, goal.sustain_required - goal.sustain_seconds) : 0),
    [goal]
  );
  const goalProgress = goal ? goal.sustain_seconds / goal.sustain_required : 0;

  return (
    <Card
      className="fixed top-2 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-1rem)] sm:w-auto sm:min-w-[240px] md:min-w-[300px] px-2 sm:px-4 py-2 text-sm flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0"
    >
      {inventory && (
        <div className="flex items-center justify-around text-center sm:flex-1 sm:justify-center sm:gap-4">
          <div className="flex items-center space-x-1">
            <span className="font-semibold">💧</span>
            <span>{inventory.water ?? 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-semibold">🌿</span>
            <span>{inventory.biomass ?? 0}</span>
          </div>
        </div>
      )}
      {goal && (
        <div className="space-y-1 sm:flex-1">
          <div className="flex justify-between text-xs">
            <span>
              Colonies {goal.active}/{goal.required}
            </span>
            <span>{remaining.toFixed(1)}s</span>
          </div>
          <ProgressBar value={goalProgress} color="bg-indigo-500" />
        </div>
      )}
    </Card>
  );
}

