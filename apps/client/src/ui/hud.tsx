import React from 'react';

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
  const remaining = goal
    ? Math.max(0, goal.sustain_required - goal.sustain_seconds)
    : 0;
  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 bg-white bg-opacity-80 border rounded p-2 text-sm space-y-1">
      {inventory && (
        <div>
          <span className="font-semibold mr-1">Base:</span>
          <span className="mr-2">Water {inventory.water ?? 0}</span>
          <span>Biomass {inventory.biomass ?? 0}</span>
        </div>
      )}
      {goal && (
        <div>
          <span className="mr-2">Colonies {goal.active}/{goal.required}</span>
          <span>Goal in {remaining.toFixed(1)}s</span>
        </div>
      )}
    </div>
  );
}

