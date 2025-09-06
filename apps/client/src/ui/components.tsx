import React from 'react';

type ButtonVariant = 'primary' | 'warning' | 'danger' | 'secondary' | 'ghost';

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-moss text-dew-dark hover:bg-moss/80 focus:ring-moss',
  warning: 'bg-amber text-soil-light hover:bg-amber/80 focus:ring-amber',
  danger: 'bg-glow text-soil-light hover:bg-glow/80 focus:ring-glow',
  secondary: 'bg-dew-dark text-soil-light hover:bg-dew-dark/80 focus:ring-dew-dark',
  ghost: 'bg-transparent text-dew-dark hover:bg-dew-dark/20 focus:ring-dew-dark',
};

export function Button({
  variant = 'secondary',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        'px-2 py-1 rounded transition-colors focus:outline-none',
        !disabled && 'focus:ring-2 focus:ring-offset-2',
        disabled ? 'opacity-50 cursor-not-allowed' : variantStyles[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

export const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = '',
}) => (
  <div className={`bg-white/80 backdrop-blur border rounded shadow-sm ${className}`}>
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

interface StarRatingProps {
  stars: number;
}

export function StarRating({ stars }: StarRatingProps) {
  return (
    <div>
      {Array.from({ length: stars }).map((_, i) => (
        <span key={i}>⭐</span>
      ))}
    </div>
  );
}

