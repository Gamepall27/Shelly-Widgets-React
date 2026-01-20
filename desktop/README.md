# Shelly Widgets Desktop Manager

Dieses Electron-Tool startet Backend und Frontend und ermöglicht das Bearbeiten der Shelly-Geräte in `backend/.env`.

## Start

```bash
npm install
npm run start
```

## Funktionen

- Backend/Frontend separat starten und stoppen.
- Logs der Prozesse sehen.
- Shelly-Geräte im Format `id|name|baseUrl` bearbeiten.

Die Geräte werden unter `SHELLY_DEVICES` in der Datei `backend/.env` gespeichert.
