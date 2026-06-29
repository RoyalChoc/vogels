@echo off
setlocal

cd /d "%~dp0webapp"

if not exist "node_modules" (
  echo Eerste keer opstarten: dependencies installeren...
  call npm install
  if errorlevel 1 (
    echo.
    echo Installatie mislukt. Druk op een toets om af te sluiten.
    pause >nul
    exit /b 1
  )
)

echo Webapp starten op http://localhost:5173 ...
start "" "http://localhost:5173"
call npm run dev
