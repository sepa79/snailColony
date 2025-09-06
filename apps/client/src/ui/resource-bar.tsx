import waterIcon from '../assets/water.svg';
import soilIcon from '../assets/soil.svg';
import leavesIcon from '../assets/leaves.svg';
import rocksIcon from '../assets/rocks.svg';

export interface Resources {
  water?: number;
  soil?: number;
  leaves?: number;
  rocks?: number;
}

export function ResourceBar({ resources }: { resources: Resources }) {
  const items = [
    { key: 'water', icon: waterIcon, alt: 'Water' },
    { key: 'soil', icon: soilIcon, alt: 'Soil' },
    { key: 'leaves', icon: leavesIcon, alt: 'Leaves' },
    { key: 'rocks', icon: rocksIcon, alt: 'Rocks' },
  ] as const;

  return (
    <div className="flex gap-4 bg-soil text-dew p-2">
      {items.map(({ key, icon, alt }) => (
        <div key={key} className="flex items-center gap-1">
          <img src={icon} alt={alt} className="w-4 h-4" />
          <span>{resources[key] ?? 0}</span>
        </div>
      ))}
    </div>
  );
}
