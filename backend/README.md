# Backend

## Start
- npm install
- copy .env.example .env
- .env anpassen
- npm start

## API
- GET  /api/health
- GET  /api/state
- POST /api/poll      (RPC Shelly.GetStatus)
- POST /api/switch    body: { "on": true|false, "id": 0 }
- POST /api/toggle    body: { "id": 0 }

## WebSocket
- WS: ws://localhost:3000/ws
- Sendet "snapshot" bei Verbindung, danach "mqtt_message" und "mqtt_status"

## Device-Konfiguration
- `SHELLY_BASE_URL` (Fallback)
- `SHELLY_DEVICES` Format: `id|name|baseUrl;id2|name2|baseUrl2`
- Wenn `SHELLY_BASE_URL` leer ist, wird die erste Base URL aus `SHELLY_DEVICES` genutzt.
