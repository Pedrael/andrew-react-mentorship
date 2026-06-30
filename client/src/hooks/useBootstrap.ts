import { useEffect, useState } from 'react';
import { ApiService } from '../services/endpoints';
import type { ApiError } from '../services/apiClient';
import { useAppDispatch } from '../state/hooks';
import { syncPlayers } from '../state/playerSlice';
import { syncCategories } from '../state/questionSlice';

type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'unauthorized' | 'error';

export type BootstrapState = {
  status: BootstrapStatus;
  error: string | null;
};

/**
 * Bootstraps the game state from the server.
 * @param enabled - Whether to enable the bootstrap.
 * @returns The bootstrap state.
 */
export function useBootstrap(enabled: boolean): BootstrapState {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<BootstrapStatus>(() => (enabled ? 'loading' : 'idle'));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    Promise.all([ApiService.getPlayers(), ApiService.getCategories()])
      .then(([players, categories]) => {
        if (cancelled) return;
        dispatch(syncPlayers(players));
        dispatch(syncCategories(categories));
        setStatus('ready');
      })
      .catch((err: ApiError) => {
        if (cancelled) return;
        if (err?.status === 401) {
          setStatus('unauthorized');
        } else {
          setStatus('error');
          setError(err?.message ?? 'Failed to load game state');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, dispatch]);

  return { status, error };
}
