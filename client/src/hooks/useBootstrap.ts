import { useEffect, useState, type Dispatch } from 'react';
import { ApiService } from '../services/endpoints';
import type { ApiError } from '../services/apiClient';
import type { GameAction } from '../state/RootReducer';

type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'unauthorized' | 'error';

export type BootstrapState = {
  status: BootstrapStatus;
  error: string | null;
};

export function useBootstrap(
  dispatch: Dispatch<GameAction>,
  enabled: boolean,
): BootstrapState {
  const [status, setStatus] = useState<BootstrapStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setStatus('loading');
    setError(null);

    Promise.all([ApiService.getPlayers(), ApiService.getCategories()])
      .then(([players, categories]) => {
        if (cancelled) return;
        dispatch({ type: 'syncPlayers', payload: players });
        dispatch({ type: 'syncCategories', payload: categories });
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
