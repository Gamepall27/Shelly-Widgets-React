# Shelly Dashboard Desktop Manager

Dieses kleine Electron-Tool startet und stoppt Backend/Frontend getrennt und bietet eine UI,
mit der die `SHELLY_DEVICES`-Konfiguration in `backend/.env` gepflegt werden kann.

## Start

```bash
cd desktop
npm install
npm start
```

## Hinweise
- Falls `backend/.env` noch nicht existiert, wird sie beim Speichern erstellt.
- Nach Änderungen an den Geräten sollte das Backend neu gestartet werden, damit es die
  aktualisierten Werte einliest.
