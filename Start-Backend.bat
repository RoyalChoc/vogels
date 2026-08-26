@echo off
setlocal

cd /d "%~dp0backend"

if not exist ".env" (
  echo .env niet gevonden. Kopieer .env.example naar .env en pas de waarden aan.
  copy ".env.example" ".env" >nul
  echo .env aangemaakt vanuit .env.example.
)

if not exist ".venv" (
  echo Eerste keer: virtuele omgeving aanmaken...
  python -m venv .venv
)

call .venv\Scripts\activate.bat

echo Dependencies installeren...
pip install -r requirements.txt --quiet

echo Backend starten op http://localhost:8000 ...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
