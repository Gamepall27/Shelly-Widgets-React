/**
 * Fake Shelly + Fake Backend Bridge (für Offline-Entwicklung)
 *
 * Enthält:
 * 1) Fake Shelly Gen3 RPC:
 *    - POST /rpc/Shelly.GetStatus
 *    - POST /rpc/Switch.Set
 *    - POST /rpc/Switch.Toggle
 *
 * 2) OPTIONAL: Fake Backend API + WebSocket wie dein Node-Backend:
 *    - GET  /api/health
 *    - WS   /ws  (snapshot + update)
 *
 * Start:
 *   node fake-shelly.js
 *
 * Env:
 *   PORT=8081
 *   WS_PATH=/ws
 *   DEVICE_NAME=FakeShelly1PM
 *   MAC=34B7DA92C318
 *   STATUS_POLL_SEC=2          (wie oft WS Updates rausgehen)
 *
 * Nutzung:
 *   A) Dein echtes Backend pollt diesen Fake:
 *      SHELLY_BASE_URL=http://127.0.0.1:8081
 *
 *   B) Frontend direkt an Fake hängen (ohne Backend):
 *      in useShellyWs -> ws://localhost:8081/ws
 */

const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 8081);
const WS_PATH = process.env.WS_PATH || "/ws";
const DEVICE_NAME = process.env.DEVICE_NAME || "FakeShelly1PM";
const MAC = (process.env.MAC || "DEADBEEF0001").toUpperCase();
const POLL_SEC = Number(process.env.STATUS_POLL_SEC || 2);

let output = false;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

let energyWh = 7000 + rand(0, 50);
let lastMinuteTs = Math.floor(Date.now() / 1000);

// ---- Hilfs-State wie in deinem Backend: state.metrics ----
const state = {
  connected: true,
  lastError: null,
  metrics: {
    output: null,
    apower: null,
    voltage: null,
    current: null,
    energyWh: null,
    temperatureC: null,
    lastUpdateTs: null,
  },
};

function buildShellyStatus() {
  const apower = output ? rand(20, 180) : rand(0, 1.2);
  const voltage = rand(228, 241);
  const current = apower / voltage;
  const tempC = output ? rand(40, 70) : rand(25, 40);

  // Energie zählt hoch wenn output an
  const dtSec = 1;
  if (output) {
    energyWh += (apower * dtSec) / 3600;
  }

  const now = Date.now();
  const unixtime = Math.floor(now / 1000);
  const uptime = Math.floor(
    unixtime - (process._fakeStartTs || (process._fakeStartTs = unixtime)),
  );

  if (unixtime - lastMinuteTs >= 60) lastMinuteTs = unixtime;

  return {
    ble: {},
    cloud: { connected: false },
    mqtt: { connected: false },
    ws: { connected: false },

    "switch:0": {
      id: 0,
      source: "fake",
      output,
      apower: Number(apower.toFixed(1)),
      voltage: Number(voltage.toFixed(1)),
      freq: 49.9,
      current: Number(current.toFixed(3)),
      aenergy: {
        total: Number(energyWh.toFixed(3)),
        by_minute: [0, 0, 0],
        minute_ts: lastMinuteTs,
      },
      temperature: {
        tC: Number(tempC.toFixed(1)),
        tF: Number(((tempC * 9) / 5 + 32).toFixed(1)),
      },
    },

    sys: {
      mac: MAC,
      restart_required: false,
      time: new Date().toTimeString().slice(0, 5),
      unixtime,
      uptime,
      ram_size: 260000,
      ram_free: 150000,
      fs_size: 1048576,
      fs_free: 700000,
      cfg_rev: 1,
      kvs_rev: 1,
      schedule_rev: 0,
      webhook_rev: 0,
      available_updates: { stable: { version: "fake-1.0.0" } },
      reset_reason: 0,
    },

    wifi: {
      sta_ip: "127.0.0.1",
      status: "got ip",
      ssid: "FAKE",
      rssi: -40,
    },

    name: DEVICE_NAME,
  };
}

// Aus Shelly.GetStatus => state.metrics wie dein Backend
function updateMetricsFromShellyStatus(shellyStatus) {
  const sw = shellyStatus["switch:0"];
  state.metrics.output = sw?.output ?? null;
  state.metrics.apower = sw?.apower ?? null;
  state.metrics.voltage = sw?.voltage ?? null;
  state.metrics.current = sw?.current ?? null;
  state.metrics.energyWh = sw?.aenergy?.total ?? null;
  state.metrics.temperatureC = sw?.temperature?.tC ?? null;
  state.metrics.lastUpdateTs = Date.now();
}

// ---- Mini WebSocket Implementierung (ohne ws-lib) ----
// Für simples WS reicht das. (Browser kompatibel)
const wsClients = new Set();

function acceptWebSocket(req, socket) {
  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto
    .createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64");

  const headers =
    "HTTP/1.1 101 Switching Protocols\r\n" +
    "Upgrade: websocket\r\n" +
    "Connection: Upgrade\r\n" +
    `Sec-WebSocket-Accept: ${acceptKey}\r\n` +
    "\r\n";

  socket.write(headers);

  socket.on("close", () => wsClients.delete(socket));
  socket.on("end", () => wsClients.delete(socket));
  socket.on("error", () => wsClients.delete(socket));

  wsClients.add(socket);

  // snapshot wie dein Backend
  wsSend(socket, {
    type: "snapshot",
    state,
  });
}

function wsFrame(str) {
  const payload = Buffer.from(str);
  const len = payload.length;

  if (len < 126) {
    return Buffer.concat([Buffer.from([0x81, len]), payload]);
  }

  // genügt für unsere kleinen JSONs
  const b1 = 0x81;
  const b2 = 126;
  const lenBuf = Buffer.alloc(2);
  lenBuf.writeUInt16BE(len, 0);
  return Buffer.concat([Buffer.from([b1, b2]), lenBuf, payload]);
}

function wsSend(socket, obj) {
  try {
    const msg = JSON.stringify(obj);
    socket.write(wsFrame(msg));
  } catch {}
}

function wsBroadcast(obj) {
  for (const sock of wsClients) {
    wsSend(sock, obj);
  }
}

// ---- HTTP Utils ----
function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

// ---- Server ----
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.end();

  if (req.method === "GET" && req.url === "/") {
    return sendJson(res, 200, {
      ok: true,
      device: DEVICE_NAME,
      mac: MAC,
      rpc: true,
      fakeBackend: true,
      ws: WS_PATH,
    });
  }

  // ---- Fake Backend kompatibel ----
  if (req.method === "GET" && req.url === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      shelly: `http://127.0.0.1:${PORT}`,
      state,
    });
  }

  // ---- Fake Shelly RPC ----
  if (req.method === "POST" && req.url === "/rpc/Shelly.GetStatus") {
    const st = buildShellyStatus();
    updateMetricsFromShellyStatus(st);
    return sendJson(res, 200, st);
  }

  if (req.method === "POST" && req.url === "/rpc/Switch.Set") {
    try {
      const body = await readJson(req);
      output = Boolean(body.on);

      // Update + push
      const st = buildShellyStatus();
      updateMetricsFromShellyStatus(st);
      wsBroadcast({ type: "update", metrics: state.metrics });

      return sendJson(res, 200, { ok: true });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === "POST" && req.url === "/rpc/Switch.Toggle") {
    output = !output;

    const st = buildShellyStatus();
    updateMetricsFromShellyStatus(st);
    wsBroadcast({ type: "update", metrics: state.metrics });

    return sendJson(res, 200, { ok: true });
  }

  sendJson(res, 404, { ok: false, error: "Not found" });
});

// WS Upgrade
server.on("upgrade", (req, socket) => {
  if (req.url !== WS_PATH) {
    socket.destroy();
    return;
  }
  acceptWebSocket(req, socket);
});

// periodische WS Updates (damit Widgets “leben”)
setInterval(() => {
  try {
    const st = buildShellyStatus();
    updateMetricsFromShellyStatus(st);
    wsBroadcast({ type: "update", metrics: state.metrics });
  } catch {}
}, POLL_SEC * 1000);

server.listen(PORT, () => {
  console.log(`✅ Fake läuft: http://127.0.0.1:${PORT}`);
  console.log(`RPC: POST http://127.0.0.1:${PORT}/rpc/Shelly.GetStatus`);
  console.log(`WS:  ws://127.0.0.1:${PORT}${WS_PATH}`);
  console.log(`API: http://127.0.0.1:${PORT}/api/health`);
});
