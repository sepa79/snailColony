import React from 'react';

export const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = '',
}) => (
  <div
    className={`bg-stone-800/80 backdrop-blur border border-stone-700 rounded shadow ${className}`}
  >
    {children}
  </div>
);

interface ProgressBarProps {
  value: number; // 0..1
  color?: string;
}

export function ProgressBar({ value, color = 'bg-green-500' }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
      <div className={`${color} h-2 transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

