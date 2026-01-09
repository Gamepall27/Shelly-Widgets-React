@echo off
title Shelly Backend Starter
echo ======================================
echo  Shelly Backend - Setup & Start
echo ======================================
echo.

REM --- Node.js Check ---
node -v >nul 2>&1
IF ERRORLEVEL 1 (
  echo ❌ Node.js ist nicht installiert!
  echo 👉 https://nodejs.org herunterladen (LTS)
  pause
  exit /b
)

echo ✔ Node.js gefunden
echo.

REM --- .env anlegen falls fehlt ---
IF NOT EXIST ".env" (
  echo ⚠ .env nicht gefunden - wird erstellt...
  copy ".env.example" ".env" >nul
  echo ✔ .env erstellt
  echo.
  echo ❗ BITTE .env JETZT ANPASSEN:
  echo    SHELLY_BASE_URL=http://192.168.xxx.xxx
  echo.
  pause
)

REM --- Dependencies installieren ---
echo 📦 Installiere Backend-Abhaengigkeiten...
npm install
IF ERRORLEVEL 1 (
  echo ❌ npm install fehlgeschlagen
  pause
  exit /b
)

echo ✔ Abhaengigkeiten installiert
echo.

REM --- Backend starten ---
echo 🚀 Starte Backend...
echo.
npm start

pause
