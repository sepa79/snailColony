import { MapDef } from '@snail/protocol';
import { tileAt } from '../game/terrain';

export interface WorkerPos { id: number; x: number; y: number }
export interface Task { worker: number; target: { x: number; y: number } }

export function scheduleMaintenance(
  map: MapDef,
  critical: { x: number; y: number }[],
  workers: WorkerPos[],
): Task[] {
  const tasks: Task[] = [];
  for (const t of critical) {
    const tile = tileAt(map, t.x, t.y);
    if (!tile || tile.slime_intensity >= 0.2) continue;
    let best: WorkerPos | undefined;
    let bestDist = Infinity;
    for (const w of workers) {
      const dist = Math.abs(w.x - t.x) + Math.abs(w.y - t.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = w;
      }
    }
    if (best) {
      tasks.push({ worker: best.id, target: { x: t.x, y: t.y } });
    }
  }
  return tasks;
}
