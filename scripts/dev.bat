@echo off
setlocal EnableDelayedExpansion

echo Starting Django Toolbox...

:: Clear VIRTUAL_ENV if it exists from another project
if defined VIRTUAL_ENV (
    set "VIRTUAL_ENV="
    echo [dev.bat] Cleared existing VIRTUAL_ENV
)

:: Sync dependencies
uv sync
if errorlevel 1 (
    echo [dev.bat] uv sync failed
    exit /b 1
)

:: Run migrations
uv run python manage.py migrate
if errorlevel 1 (
    echo [dev.bat] migrate failed
    exit /b 1
)

:: Find first free port in 8000-8099 using PowerShell
echo [dev.bat] Scanning for free port 8000-8099...
for /f "usebackq tokens=*" %%p in (`powershell -NoProfile -Command "$port = 8000; while ($port -le 8099) { try { $tcp = New-Object System.Net.Sockets.TcpClient('127.0.0.1', $port); $tcp.Close(); $port++ } catch { break } }; $port"`) do (
    set "PORT=%%p"
)

echo [dev.bat] Starting server on 127.0.0.1:!PORT!

:: Start dev server
uv run python manage.py runserver 127.0.0.1:!PORT!