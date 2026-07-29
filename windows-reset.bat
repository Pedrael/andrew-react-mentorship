@echo off
REM One-click full reset for the Jeopardy stack (Windows).
REM Double-click in Explorer, or run `windows-reset.bat` from a terminal.
REM
REM It will:
REM   1. Wipe the board (categories.json) and players (players.json) back to
REM      a blank slate.
REM   2. Restart the server so it serves the fresh, empty state.
REM
REM It does NOT touch users.json or sessions.json, so the admin stays logged in.
REM After it finishes, refresh your Admin and Player browser tabs.

setlocal
cd /d "%~dp0"

set DATA_DIR=server\data

echo ==^> Jeopardy reset

REM 1. Wipe the board and players. users.json + sessions.json are left alone,
REM    so logged-in admins are not kicked out.
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
> "%DATA_DIR%\players.json" echo []
(
echo {
echo   "categories": []
echo }
) > "%DATA_DIR%\categories.json"
echo ==^> Cleared categories.json and players.json ^(kept admin login^)

REM 2. Stop the running server window (the launcher titles it "Jeopardy Server").
REM    /t kills the whole process tree so the tsx watcher can't respawn it.
echo ==^> Stopping the running server ^(if any^)...
taskkill /fi "WINDOWTITLE eq Jeopardy Server*" /t /f >nul 2>&1

REM Also kill anything still listening on 8080, just in case it was started
REM some other way.
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 " ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

REM 3. Make sure deps are present, then start a fresh server window.
if not exist "server\node_modules" (
  echo ==^> Installing server dependencies...
  pushd server && call npm install && popd
)

echo ==^> Starting a fresh server ^(http/ws on :8080^)...
start "Jeopardy Server" cmd /k "cd /d ""%~dp0server"" && npm run dev"

REM 4. Give the server a moment to boot.
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

echo.
echo ==^> Reset complete. The board and players are empty.
echo ==^> Refresh your Admin and Player browser tabs to see the blank board.
endlocal
