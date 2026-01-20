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

## Desktop-Steuerung (Electron)
- cd desktop
- npm install
- npm start
- Oberfläche erlaubt Start/Stop von Backend & Frontend sowie Bearbeiten der SHELLY_DEVICES in backend/.env

## Fake-Daten senden (ohne Shelly)
Wenn du Mosquitto per Docker laufen hast (Container-Name: mosquitto):
- Subscriber:
  docker exec -it mosquitto sh -lc "mosquitto_sub -h 127.0.0.1 -p 1883 -t 'shellyTEST/#' -v"
- Publisher (einmalig):
  docker exec mosquitto sh -lc "mosquitto_pub -h 127.0.0.1 -p 1883 -t 'shellyTEST/status/pm1:0' -m '{\"apower\":42.7,\"voltage\":230.4,\"current\":0.185,\"aenergy\":{\"total\":1234},\"temperature\":{\"tC\":36.5}}'"

Hinweis:
- Backend .env: MQTT_PREFIX=shellyTEST
- Backend .env: MQTT_URL=mqtt://127.0.0.1:1883
