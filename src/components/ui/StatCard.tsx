import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon | React.ReactNode;
  label?: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  iconColor?: string;
  iconBgColor?: string;
  title?: string;
  variant?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  change,
  changeLabel,
  iconColor = 'text-primary',
  iconBgColor = 'bg-blue-100',
  title,
  trend,
  variant,
  className,
}: StatCardProps) {
  const displayLabel = label || title;
  const changeValue = change ?? trend?.value;
  const isPositive = trend ? trend.positive : changeValue !== undefined && changeValue >= 0;

  // Handle icon rendering - support both component and React element
  const renderIcon = () => {
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="w-6 h-6" />;
    }
    return icon;
  };

  return (
    <div className={cn('stat-card', className)}>
      <div className={cn('stat-icon', iconBgColor)}>
        <div className={iconColor}>{renderIcon()}</div>
      </div>
      <div className="flex-1">
        <p className="stat-label">{displayLabel}</p>
        <p className="stat-value mt-1">{value}</p>
        {changeValue !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {Math.abs(changeValue).toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-sm text-gray-400">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}