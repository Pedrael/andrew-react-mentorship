@echo off
REM One-click launcher for the Jeopardy stack (Windows).
REM Double-click in Explorer, or run `windows-start.bat` from a terminal.
REM
REM It will:
REM   1. Install npm packages for server + client if they are missing.
REM   2. Start the WebSocket/API server (port 8080).
REM   3. Start the Vite client dev server (port 5173).
REM   4. Open the Admin and Player views in your default browser.

setlocal
cd /d "%~dp0"

set CLIENT_PORT=5173
set CLIENT_URL=http://localhost:%CLIENT_PORT%

echo ==^> Jeopardy launcher

REM 1. Install dependencies only when node_modules is absent.
if not exist "server\node_modules" (
  echo ==^> Installing server dependencies...
  pushd server && call npm install && popd
)
if not exist "client\node_modules" (
  echo ==^> Installing client dependencies...
  pushd client && call npm install && popd
)

REM 2. Start the server first in its own window.
echo ==^> Starting server ^(http/ws on :8080^)...
start "Jeopardy Server" cmd /k "cd /d ""%~dp0server"" && npm run dev"

REM Wait until the server accepts connections, so the client never fires
REM auth/API requests before it is listening (that races the login page
REM into a refresh loop). Give up after ~30s.
echo ==^> Waiting for the server to be ready...
set /a TRIES=0
:waitserver
curl -s -o nul http://localhost:8080
if not errorlevel 1 goto serverready
set /a TRIES+=1
if %TRIES% geq 60 goto serverready
timeout /t 1 /nobreak >nul
goto waitserver
:serverready

REM 3. Start the client in its own window.
echo ==^> Starting client ^(vite on :%CLIENT_PORT%^)...
start "Jeopardy Client" cmd /k "cd /d ""%~dp0client"" && npm run dev -- --port %CLIENT_PORT% --strictPort"

REM 4. Give the client a moment to boot, then open the two views.
echo ==^> Waiting for the client to be ready...
timeout /t 6 /nobreak >nul

echo ==^> Opening Admin and Player views...
start "" "%CLIENT_URL%/admin"
start "" "%CLIENT_URL%/player"

echo ==^> Running. Close the two spawned windows to stop the servers.
endlocal
