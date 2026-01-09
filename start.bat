@echo off
cls

echo ===============================
echo  Shelly Dashboard - Start
echo ===============================
echo.

node -v >nul 2>&1
if errorlevel 1 (
  echo Node.js ist nicht installiert.
  echo https://nodejs.org herunterladen (LTS).
  pause
  exit /b
)

echo Node.js OK
echo.

echo Starte Backend...
start cmd /k "cd backend && npm install && npm start"

timeout /t 3 >nul

echo Starte Frontend...
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Fertig.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.

pause
