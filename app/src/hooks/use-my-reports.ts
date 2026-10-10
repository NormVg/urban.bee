import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getMyReports } from '@/lib/api';
import { isClosed } from '@/lib/plain-words';
import { onReportsChanged } from '@/lib/report-events';
import type { ComplaintSummary } from '@/lib/types';

/** Status changes come from the city team, so check again now and then while visible. */
const POLL_MS = 30_000;

/**
 * The signed-in person's reports, split into live and completed. Refreshes
 * when the screen comes into view, right after a new report is sent, when the
 * app returns to the foreground, and every 30 s while the screen is open.
 */
export function useMyReports(enabled: boolean) {
  const [reports, setReports] = useState<ComplaintSummary[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);
  const focused = useRef(false);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    try {
      setReports(await getMyReports());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      if (!enabled) return;
      void load();
      const timer = setInterval(() => void load(), POLL_MS);
      return () => {
        focused.current = false;
        clearInterval(timer);
      };
    }, [enabled, load]),
  );

  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = onReportsChanged(() => void load());
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active' && focused.current) void load();
    });
    return () => {
      unsubscribe();
      appState.remove();
    };
  }, [enabled, load]);

  const { live, completed } = useMemo(
    () => ({
      live: reports?.filter((r) => !isClosed(r.status)) ?? null,
      completed: reports?.filter((r) => isClosed(r.status)) ?? null,
    }),
    [reports],
  );

  return { reports, live, completed, error, refreshing, refresh: () => load(true), retry: () => load() };
}
