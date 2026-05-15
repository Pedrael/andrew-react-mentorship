# server

HTTP API (JSON file persistence) plus WebSocket relay for the Jeopardy admin/player split.

- **HTTP** serves REST under `/api` on the same port as WebSocket (default `8080`).
- **WebSocket** still only relays messages; it does not persist game data.

## Run

```bash
npm install
npm run dev      # tsx watch, restarts on changes
# or
npm run start    # one-shot
```

Default base URL:

- `http://localhost:8080` — REST (`/api/...`)
- `ws://localhost:8080` — WebSocket (upgrade on the same server)

Override with env vars:

```bash
PORT=9000 HOST=127.0.0.1 npm run dev
```

| Variable      | Default        | Purpose |
|---------------|----------------|---------|
| `PORT`        | `8080`         | HTTP + WebSocket |
| `HOST`        | `0.0.0.0`      | Bind address |
| `DATA_DIR`    | `server/data`  | Directory for JSON stores |
| `CORS_ORIGIN` | `*`          | `Access-Control-Allow-Origin` for browser clients |

## Data files

Created on first run under `DATA_DIR`:

| File              | Contents |
|-------------------|----------|
| `players.json`    | JSON array of player objects |
| `categories.json` | `{ "categories": Category[] }` |

Types mirror the client (`Player`, `Category`, `Question` in `src/types.ts`).

---

## HTTP API

All API responses use `Content-Type: application/json` unless noted.

Errors typically return `{ "error": "message" }` with status `400`, `404`, or `500`.

`OPTIONS` is supported on `/api` routes for CORS preflight.

### Health

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/api/health` | `200` — `{ "ok": true }` |

### Players

| Method | Path | Description |
|--------|------|---------------|
| `GET` | `/api/players` | List all players |
| `GET` | `/api/players/:id` | Get one player |
| `POST` | `/api/players` | Create player |
| `PUT` | `/api/players/:id` | Replace player |
| `PATCH` | `/api/players/:id` | Partial update |
| `DELETE` | `/api/players/:id` | Delete player (`204` No Content) |

**Player body shape**

```json
{
  "id": "string",
  "name": "string",
  "score": 0,
  "isSelected": false
}
```

**`POST /api/players`** — JSON body:

- `name` (required, non-empty string)
- `score` (optional number, default `0`)
- `isSelected` (optional boolean, default `false`)
- `id` (optional string; if omitted, server generates a UUID)

Returns `201` with the created player.

**`PATCH /api/players/:id`** — any subset of `name`, `score`, `isSelected`.

### Categories

Categories are addressed by **zero-based array index** in the stored `categories` list (aligned with the client’s `categoryIndex`).

| Method | Path | Description |
|--------|------|---------------|
| `GET` | `/api/categories` | List all categories (array) |
| `GET` | `/api/categories/:index` | Get one category |
| `POST` | `/api/categories` | Append category |
| `PUT` | `/api/categories/:index` | Replace category (full body) |
| `PATCH` | `/api/categories/:index` | Patch `title` and/or `questions` |
| `DELETE` | `/api/categories/:index` | Remove category; returns removed category `200` |
| `PATCH` | `/api/categories/:index/questions/:price` | Patch or insert one question by `price` |

**Category / question shapes**

```json
{
  "title": "string",
  "questions": [
    {
      "price": 100,
      "question": "string",
      "answer": "string",
      "image": "optional string",
      "isAnswered": false
    }
  ]
}
```

**`POST /api/categories`** — optional body:

- `title` — if omitted, server uses `Category <n>` based on current length
- `questions` — if omitted, server fills five default clues with prices `100`–`500`, empty text, `isAnswered: false`

**`PUT /api/categories/:index`** — body must be a complete `Category` (all questions must satisfy validation).

**`PATCH /api/categories/:index/questions/:price`** — JSON object; any of `question`, `answer`, `image` (string or `null` to clear), `isAnswered`. If no question exists for `price`, one is added.

---

## WebSocket wire protocol

Thin relay. Each client identifies as `admin` or `player`. Any `event` message is forwarded to **all clients of the opposite role**:

- `admin` → all `player`s (e.g. “open this question”)
- `player` → all `admin`s (e.g. “buzzed in”, “answered”)

The WebSocket layer does not read or write the JSON files; only HTTP `/api` does.

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
