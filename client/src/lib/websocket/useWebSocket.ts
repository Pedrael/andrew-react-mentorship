import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, EventMessage, Role, ServerMessage } from './messages';

export type ConnectionStatus = 'connecting' | 'open' | 'closed';

export interface UseWebSocketOptions {
  url: string;
  role: Role;
  name?: string;
  onMessage?: (msg: ServerMessage) => void;
  onEvent?: (event: string, payload: unknown) => void;
}

export interface UseWebSocketResult {
  status: ConnectionStatus;
  send: <TPayload>(event: string, payload: TPayload) => boolean;
}

/**
 * Connects to the relay server, identifies as `role`, and exposes a `send`
 * helper for application-level events. The server forwards events to clients
 * of the opposite role (admin ↔ player).
 */
export function useWebSocket({
  url,
  role,
  name,
  onMessage,
  onEvent,
}: UseWebSocketOptions): UseWebSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  const onMessageRef = useRef(onMessage);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const handleOpen = () => {
      setStatus('open');
      const identify: ClientMessage = { type: 'identify', role, name };
      ws.send(JSON.stringify(identify));
    };

    const handleClose = () => setStatus('closed');

    const handleMessage = (e: MessageEvent<string>) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(e.data) as ServerMessage;
      } catch {
        return;
      }
      onMessageRef.current?.(msg);
      if (msg.type === 'event') onEventRef.current?.(msg.event, msg.payload);
    };

    ws.addEventListener('open', handleOpen);
    ws.addEventListener('close', handleClose);
    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('close', handleClose);
      ws.removeEventListener('message', handleMessage);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [url, role, name]);

  const send = useCallback(<TPayload,>(event: string, payload: TPayload): boolean => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    const msg: EventMessage<TPayload> = { type: 'event', event, payload };
    ws.send(JSON.stringify(msg));
    return true;
  }, []);

  return { status, send };
}
