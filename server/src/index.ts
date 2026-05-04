import { WebSocketServer, WebSocket } from 'ws';
import {
  isClientMessage,
  type ClientMessage,
  type Role,
  type ServerMessage,
} from './messages.js';

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '0.0.0.0';

interface Client {
  socket: WebSocket;
  role: Role;
  name?: string;
}

const clients = new Set<Client>();

function send(socket: WebSocket, msg: ServerMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg));
  }
}

function broadcastTo(role: Role, msg: ServerMessage, except?: WebSocket): void {
  for (const c of clients) {
    if (c.role === role && c.socket !== except) send(c.socket, msg);
  }
}

function counterpartRole(role: Role): Role {
  return role === 'admin' ? 'player' : 'admin';
}

function parseMessage(raw: unknown): ClientMessage | null {
  try {
    const text = typeof raw === 'string' ? raw : raw?.toString();
    if (!text) return null;
    const parsed = JSON.parse(text);
    return isClientMessage(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const wss = new WebSocketServer({ port: PORT, host: HOST });

wss.on('listening', () => {
  console.log(`[ws] listening on ws://${HOST}:${PORT}`);
});

wss.on('connection', (socket) => {
  let registered: Client | null = null;

  socket.on('message', (raw) => {
    const data = parseMessage(raw);
    if (!data) {
      send(socket, { type: 'system', event: 'error', message: 'Invalid message' });
      return;
    }

    if (data.type === 'identify') {
      if (registered) return;
      registered = { socket, role: data.role, name: data.name };
      clients.add(registered);
      send(socket, { type: 'system', event: 'identified', role: data.role });
      broadcastTo(counterpartRole(data.role), {
        type: 'system',
        event: 'peer_joined',
        role: data.role,
      });
      console.log(
        `[ws] + ${data.role}${data.name ? ` (${data.name})` : ''} connected (total=${clients.size})`,
      );
      return;
    }

    if (!registered) {
      send(socket, { type: 'system', event: 'error', message: 'identify first' });
      return;
    }

    broadcastTo(counterpartRole(registered.role), {
      type: 'event',
      event: data.event,
      payload: data.payload,
    });
  });

  socket.on('close', () => {
    if (!registered) return;
    clients.delete(registered);
    broadcastTo(counterpartRole(registered.role), {
      type: 'system',
      event: 'peer_left',
      role: registered.role,
    });
    console.log(
      `[ws] - ${registered.role}${registered.name ? ` (${registered.name})` : ''} disconnected (total=${clients.size})`,
    );
  });
});

function shutdown(): void {
  console.log('[ws] shutting down');
  for (const c of clients) c.socket.close();
  wss.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
