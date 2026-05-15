import { createServer } from 'node:http';
import { handleHttpApi } from './httpApi.js';
import { attachWebSocket } from './websocket.js';
import { ensureStoreInitialized } from './store.js';

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '0.0.0.0';

await ensureStoreInitialized();

const server = createServer(async (req, res) => {
  try {
    const handled = await handleHttpApi(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not found');
    }
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Internal Server Error');
    }
  }
});

const wss = attachWebSocket(server);

server.listen(PORT, HOST, () => {
  console.log(`[http] http://${HOST}:${PORT}`);
  console.log(`[http] API prefix /api (see httpApi.ts for routes)`);
  console.log(`[ws]   ws://${HOST}:${PORT} (same port — WebSocket upgrade)`);
});

function shutdown(): void {
  console.log('[server] shutting down');
  wss.clients.forEach((socket) => socket.close());
  wss.close(() => {
    server.close(() => process.exit(0));
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
