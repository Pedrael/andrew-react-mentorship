export type Role = 'admin' | 'player';

export interface IdentifyMessage {
  type: 'identify';
  role: Role;
  name?: string;
}

export interface EventMessage<TPayload = unknown> {
  type: 'event';
  event: string;
  payload: TPayload;
}

export type SystemEvent = 'identified' | 'peer_joined' | 'peer_left' | 'error';

export interface SystemMessage {
  type: 'system';
  event: SystemEvent;
  role?: Role;
  message?: string;
}

export type ClientMessage = IdentifyMessage | EventMessage;
export type ServerMessage = EventMessage | SystemMessage;

export function isClientMessage(value: unknown): value is ClientMessage {
  if (!value || typeof value !== 'object') return false;
  const v = value as { type?: unknown };
  return v.type === 'identify' || v.type === 'event';
}
