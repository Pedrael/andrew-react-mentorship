#!/bin/bash
#
# One-click full reset for the Jeopardy stack (macOS / Linux).
# Double-click in Finder, or run `./mac-reset.command` from a terminal.
#
# It will:
#   1. Wipe the board (categories.json) and players (players.json) back to
#      a blank slate.
#   2. Restart the server so it serves the fresh, empty state.
#
# It does NOT touch users.json or sessions.json, so the admin stays logged in.
# After it finishes, refresh your Admin and Player browser tabs.

# Always run from the directory this script lives in.
cd "$(dirname "$0")" || exit 1

SERVER_URL="http://localhost:8080"
DATA_DIR="server/data"

echo "==> Jeopardy reset"

# 1. Wipe the board and players. Match the exact format the server writes so
#    the files stay clean/diff-friendly. users.json + sessions.json are left
#    alone, so logged-in admins are not kicked out.
mkdir -p "$DATA_DIR"
printf '[]\n' > "$DATA_DIR/players.json"
printf '{\n  "categories": []\n}\n' > "$DATA_DIR/categories.json"
echo "==> Cleared categories.json and players.json (kept admin login)"

# 2. Stop the running server. It runs as `tsx watch src/index.ts`; killing the
#    watcher frees port 8080 and prevents it from respawning the old process.
echo "==> Stopping the running server (if any)..."
pkill -f "tsx watch src/index.ts" 2>/dev/null

# Give the port a moment to free up, then force-kill any leftover listener.
for _ in $(seq 1 20); do
  lsof -ti tcp:8080 >/dev/null 2>&1 || break
  sleep 0.25
done
LEFTOVER=$(lsof -ti tcp:8080 2>/dev/null)
if [ -n "$LEFTOVER" ]; then
  kill -9 $LEFTOVER 2>/dev/null
fi

# 3. Make sure deps are present, then start a fresh server detached so it keeps
#    running after this window closes.
if [ ! -d server/node_modules ]; then
  echo "==> Installing server dependencies..."
  (cd server && npm install) || { echo "server npm install failed"; exit 1; }
fi

echo "==> Starting a fresh server (http/ws on :8080)..."
(cd server && nohup npm run dev > ../reset-server.log 2>&1 &)

# 4. Wait until it accepts connections again.
echo "==> Waiting for the server to be ready..."
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "$SERVER_URL"; then
    break
  fi
  sleep 0.5
done

echo ""
echo "==> Reset complete. The board and players are empty."
echo "==> Refresh your Admin and Player browser tabs to see the blank board."
