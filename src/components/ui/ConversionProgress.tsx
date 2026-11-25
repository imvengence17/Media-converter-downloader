'use client';

import { motion } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversionProgressProps {
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  message?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

export default function ConversionProgress({
  progress,
  status,
  message,
  onCancel,
  onRetry,
  className,
}: ConversionProgressProps) {
  const isActive = status === 'uploading' || status === 'processing';
  const isCompleted = status === 'completed';
  const isError = status === 'error' || status === 'cancelled';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isActive && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-5 h-5 text-pink-primary" />
            </motion.div>
          )}
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
            >
              <Check className="w-3.5 h-3.5 text-white" />
            </motion.div>
          )}
          {isError && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </motion.div>
          )}
          <div>
            <p className="text-sm font-semibold text-navy-900 dark:text-white">
              {status === 'uploading' && 'Uploading...'}
              {status === 'processing' && 'Converting...'}
              {status === 'completed' && 'Conversion Complete!'}
              {status === 'error' && 'Conversion Failed'}
              {status === 'cancelled' && 'Conversion Cancelled'}
            </p>
            {message && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <span className="text-sm font-mono font-semibold text-pink-primary">
              {Math.round(progress)}%
            </span>
          )}
          {isActive && onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors text-xs"
            >
              Cancel
            </button>
          )}
          {isError && onRetry && (
            <button onClick={onRetry} className="btn-primary text-xs px-3 py-1.5">
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2.5 bg-gray-200 dark:bg-navy-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            isCompleted && 'bg-green-500',
            isError && 'bg-red-500',
            isActive && 'bg-gradient-to-r from-pink-primary to-pink-400',
          )}
        />
        {isActive && (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-white/30"
            style={{ width: `${progress}%` }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}
