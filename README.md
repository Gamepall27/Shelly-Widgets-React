# Shelly Dashboard (MQTT -> Backend -> React)

## Überblick
- MQTT Broker: Mosquitto (lokal oder im Netzwerk)
- Backend: Node.js (Express + MQTT + WebSocket)
- Frontend: React (Vite), verbindet sich per WebSocket und zeigt Live-Daten

## Schnellstart (Dev)
1) MQTT Broker starten (z.B. Mosquitto auf 1883)
2) Backend:
   - cd backend
   - npm install
   - cp .env.example .env (Windows: copy .env.example .env)
   - .env anpassen (MQTT_URL, MQTT_PREFIX)
   - npm start
3) Frontend:
   - cd frontend
   - npm install
   - npm run dev
   - Browser: http://localhost:5173

## Fake-Daten senden (ohne Shelly)
Wenn du Mosquitto per Docker laufen hast (Container-Name: mosquitto):
- Subscriber:
  docker exec -it mosquitto sh -lc "mosquitto_sub -h 127.0.0.1 -p 1883 -t 'shellyTEST/#' -v"
- Publisher (einmalig):
  docker exec mosquitto sh -lc "mosquitto_pub -h 127.0.0.1 -p 1883 -t 'shellyTEST/status/pm1:0' -m '{\"apower\":42.7,\"voltage\":230.4,\"current\":0.185,\"aenergy\":{\"total\":1234},\"temperature\":{\"tC\":36.5}}'"

Hinweis:
- Backend .env: MQTT_PREFIX=shellyTEST
- Backend .env: MQTT_URL=mqtt://127.0.0.1:1883

## Desktop-Manager (Electron)

Ein kleines Electron-Programm, um Backend/Frontend zu starten und die Shelly-Geräte in `backend/.env` per Overlay zu bearbeiten.

### Start
1) In `desktop-app` wechseln
2) Abhängigkeiten installieren: `npm install`
3) App starten: `npm start`

### Hinweise
- Änderungen an den Geräten werden in `backend/.env` gespeichert.
- Das Backend muss nach Änderungen neu gestartet werden, damit neue Geräte geladen werden.
