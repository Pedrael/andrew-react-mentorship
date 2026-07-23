#!/bin/bash
#
# One-click launcher for the Jeopardy stack (macOS / Linux).
# Double-click in Finder, or run `./mac-start.command` from a terminal.
#
# It will:
#   1. Install npm packages for server + client if they are missing.
#   2. Start the WebSocket/API server (port 8080).
#   3. Start the Vite client dev server (port 5173).
#   4. Open the Admin and Player views in your default browser.
#
# Press Ctrl+C (or close the window) to stop both processes.

# Always run from the directory this script lives in.
cd "$(dirname "$0")" || exit 1

CLIENT_PORT=5173
CLIENT_URL="http://localhost:${CLIENT_PORT}"
SERVER_URL="http://localhost:8080"

echo "==> Jeopardy launcher"

# 1. Install dependencies only when node_modules is absent.
if [ ! -d server/node_modules ]; then
  echo "==> Installing server dependencies..."
  (cd server && npm install) || { echo "server npm install failed"; exit 1; }
fi

if [ ! -d client/node_modules ]; then
  echo "==> Installing client dependencies..."
  (cd client && npm install) || { echo "client npm install failed"; exit 1; }
fi

# 2. Start the server first and wait until it accepts connections, so the
#    client never fires auth/API requests at a server that isn't listening yet
#    (that races the login page into a refresh loop).
echo "==> Starting server (http/ws on :8080)..."
(cd server && npm run dev) &
SERVER_PID=$!

echo "==> Waiting for the server to be ready..."
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "$SERVER_URL"; then
    break
  fi
  sleep 0.5
done

# 3. Start the client on a fixed port so the URLs are predictable.
echo "==> Starting client (vite on :${CLIENT_PORT})..."
(cd client && npm run dev -- --port "${CLIENT_PORT}" --strictPort) &
CLIENT_PID=$!

# Stop both child processes when this script exits.
cleanup() {
  echo ""
  echo "==> Shutting down..."
  kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

# 4. Wait for the client to answer, then open the two views.
echo "==> Waiting for the client to be ready..."
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "$CLIENT_URL"; then
    break
  fi
  sleep 0.5
done

echo "==> Opening Admin and Player views..."
if command -v open >/dev/null 2>&1; then
  open "${CLIENT_URL}/admin"
  open "${CLIENT_URL}/player"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "${CLIENT_URL}/admin"
  xdg-open "${CLIENT_URL}/player"
else
  echo "Open these URLs manually:"
  echo "  ${CLIENT_URL}/admin"
  echo "  ${CLIENT_URL}/player"
fi

echo "==> Running. Press Ctrl+C to stop."

# Keep the script alive until the dev servers exit.
wait
