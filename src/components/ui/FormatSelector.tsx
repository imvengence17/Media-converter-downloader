'use client';

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface FormatSelectorProps {
  formats: readonly string[] | string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function FormatSelector({
  formats,
  value,
  onChange,
  label,
  className,
  disabled = false,
}: FormatSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-navy-900 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 pr-10 bg-white dark:bg-navy-900/50 border border-gray-200 dark:border-gray-700 rounded-xl',
            'text-navy-900 dark:text-white font-medium text-sm',
            'focus:outline-none focus:ring-2 focus:ring-pink-primary/50 focus:border-pink-primary',
            'appearance-none cursor-pointer transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {formats.map((format) => (
            <option key={format} value={format}>
              {format.toUpperCase()}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
