'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConversionHistoryItem } from '@/types';

const STORAGE_KEY = 'mediaconvert-history';
const MAX_HISTORY = 50;

export function useConversionHistory() {
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const saveHistory = useCallback((items: ConversionHistoryItem[]) => {
    const trimmed = items.slice(0, MAX_HISTORY);
    setHistory(trimmed);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {}
  }, []);

  const addItem = useCallback((item: ConversionHistoryItem) => {
    saveHistory([item, ...history]);
  }, [history, saveHistory]);

  const removeItem = useCallback((id: string) => {
    saveHistory(history.filter(item => item.id !== id));
  }, [history, saveHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { history, addItem, removeItem, clearHistory };
}
