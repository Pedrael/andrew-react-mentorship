# andrew-react-mentorship

Two-package project: a React (Vite + TS) client and a Node WebSocket relay
server. Used to build a Jeopardy game where the **admin** opens questions
and **players** see them live in their own window.

```
.
├── client/   # React + Vite app (the original code, now nested here)
└── server/   # WebSocket relay (admin ↔ players)
```

## Prerequisites

- Node 20+
- npm 10+

## Run the stack

In two terminals:

```bash
# terminal 1 — relay server on ws://localhost:8080
cd server && npm install && npm run dev
```

```bash
# terminal 2 — Vite dev server on http://localhost:5173
cd client && npm install && npm run dev
```

The client reads `VITE_WS_URL` (see `client/.env.example`) and falls back to
`ws://localhost:8080` if it is unset.

## How the relay works

The server doesn't store any game state. Every connection identifies itself
as either an `admin` or a `player`, and any application event is forwarded
to all clients of the **opposite** role:

- admin → all players (e.g. `open_question`, `close_question`)
- player → all admins (e.g. `buzz`, `answer`)

See `server/README.md` for the full wire protocol.

## Where things live on the client

- `client/src/lib/websocket/` — protocol types + `useWebSocket` hook.
- `client/src/examples/WebSocketExample.tsx` — single-file example mounting
  both an admin sender and a player receiver. Render it from `App.tsx` (or
  on its own route) to see the relay end-to-end.
