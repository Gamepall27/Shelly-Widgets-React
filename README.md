# Shelly Widgets Dashboard

Dashboard zur Anzeige und Steuerung von Shelly Gen3-Geräten. Das Backend pollt die Shelly HTTP-RPC API und streamt Live-Daten per WebSocket an das React-Frontend.

## Projektstruktur
- `backend/`: Node.js API + WebSocket, pollt Shelly-Geräte
- `frontend/`: React (Vite) Dashboard
- `desktop/`: Electron-Manager zum Starten von Backend/Frontend und Editieren der Geräte

## Schnellstart (Backend + Frontend)
1) Backend
   - `cd backend`
   - `npm install`
   - `.env.example` nach `.env` kopieren
   - `.env` anpassen (mind. `SHELLY_BASE_URL` oder `SHELLY_DEVICES`)
   - `npm start`
2) Frontend
   - `cd frontend`
   - `npm install`
   - `npm run dev`
   - Browser: `http://localhost:5173`

Das Frontend nutzt den Vite-Proxy:
- `/api` -> `http://localhost:3000`
- `/ws`  -> `ws://localhost:3000/ws`

## Desktop Manager
Optionaler Electron-Manager, der Backend/Frontend startet und die Geräte in `backend/.env` bearbeitet.

```bash
cd desktop
npm install
npm run start
```

## Konfiguration (`backend/.env`)
- `SHELLY_BASE_URL`: Basis-URL eines Shelly-Geräts, z.B. `http://192.168.1.50`
- `SHELLY_DEVICES`: Liste im Format `id|name|baseUrl`, getrennt mit `,` oder `;`
  - Beispiel: `1|Kueche|http://192.168.1.50;2|Bad|http://192.168.1.51`
- `PORT`: HTTP-Port des Backends (default `3000`)
- `WS_PATH`: WebSocket-Pfad (default `/ws`)
- `STATUS_POLL_SEC`: Polling-Intervall in Sekunden (default `3`)

Wenn `SHELLY_DEVICES` gesetzt ist, wird das erste Gerät als Standard verwendet.

## API und WebSocket
- `GET /api/health`
- `POST /api/switch` body: `{ "on": true|false }`
- `POST /api/toggle`

WebSocket:
- `ws://localhost:3000/ws`
- sendet `snapshot` bei Verbindung, danach `update`
