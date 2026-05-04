# server

WebSocket relay server for the Jeopardy admin/player split.

The server is a thin relay. Each client identifies itself as either an `admin`
or a `player`. Any `event` message a client sends is forwarded to **all clients
of the opposite role**:

- `admin` → all `player`s (e.g. "open this question")
- `player` → all `admin`s (e.g. "buzzed in", "answered")

The server itself stores no game state; it only routes traffic.

## Run

```bash
npm install
npm run dev      # tsx watch, restarts on changes
# or
npm run start    # one-shot
```

The default URL is `ws://localhost:8080`. Override with env vars:

```bash
PORT=9000 HOST=127.0.0.1 npm run dev
```

## Wire protocol

All messages are JSON.

### Client → Server

```ts
// 1. Required first message after the socket opens
{ "type": "identify", "role": "admin" | "player", "name": "optional" }

// 2. Anything else is an event that will be relayed to the opposite role
{ "type": "event", "event": "open_question", "payload": { ... } }
```

### Server → Client

```ts
// Acknowledgement of identify
{ "type": "system", "event": "identified", "role": "admin" }

// A peer of the opposite role just joined / left
{ "type": "system", "event": "peer_joined", "role": "player" }
{ "type": "system", "event": "peer_left",   "role": "player" }

// Protocol error (bad JSON, sending events before identify, etc.)
{ "type": "system", "event": "error", "message": "..." }

// A relayed event from a peer of the opposite role
{ "type": "event", "event": "open_question", "payload": { ... } }
```

The exact `event` strings (e.g. `open_question`, `close_question`,
`score_changed`, `buzz`) are an application-level concern — the server does
not validate them.
