require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { WebSocketServer } = require("ws");

/* =======================
   Konfiguration
======================= */

const PORT = Number(process.env.PORT || 3000);
const WS_PATH = process.env.WS_PATH || "/ws";
const POLL_SEC = Number(process.env.STATUS_POLL_SEC || 3);

function parseShellyDevices(value) {
  if (!value) return [];
  return value
    .split(/[;,]\s*/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id, name, baseUrl] = entry.split("|");
      return {
        id: (id || "").trim(),
        name: (name || "").trim(),
        baseUrl: (baseUrl || "").trim()
      };
    })
    .filter((device) => device.id || device.name || device.baseUrl);
}

const SHELLY_DEVICES = parseShellyDevices(process.env.SHELLY_DEVICES);
const SHELLY_BASE = process.env.SHELLY_BASE_URL || SHELLY_DEVICES[0]?.baseUrl;

if (!SHELLY_BASE) {
  console.error("❌ SHELLY_BASE_URL fehlt in .env (oder SHELLY_DEVICES ist leer)");
  process.exit(1);
}

/* =======================
   App / Server
======================= */

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: WS_PATH });

/* =======================
   Globaler State
======================= */

const state = {
  connected: false,
  lastError: null,
  metrics: {
    output: null,
    apower: null,
    voltage: null,
    current: null,
    energyWh: null,
    temperatureC: null,
    lastUpdateTs: null
  }
};

/* =======================
   Shelly HTTP-RPC (Gen3)
======================= */

async function shellyRpc(method, params = {}) {
  const url = `${SHELLY_BASE}/rpc/${method}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} failed: ${res.status} ${text}`);
  }

  return res.json();
}

/* =======================
   Polling
======================= */

async function pollShelly() {
  try {
    const data = await shellyRpc("Shelly.GetStatus");

    const sw = data["switch:0"];

    if (sw) {
      state.metrics.output = sw.output ?? null;
      state.metrics.apower = sw.apower ?? null;
      state.metrics.voltage = sw.voltage ?? null;
      state.metrics.current = sw.current ?? null;
      state.metrics.energyWh = sw.aenergy?.total ?? null;
      state.metrics.temperatureC = sw.temperature?.tC ?? null;
    }

    state.metrics.lastUpdateTs = Date.now();
    state.connected = true;
    state.lastError = null;

    broadcast({
      type: "update",
      metrics: state.metrics
    });
  } catch (err) {
    state.connected = false;
    state.lastError = err.message;
    console.error("Shelly poll failed:", err.message);
  }
}

/* =======================
   WebSocket
======================= */

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(msg);
    }
  }
}

wss.on("connection", (ws) => {
  ws.send(
    JSON.stringify({
      type: "snapshot",
      state
    })
  );
});

/* =======================
   REST API
======================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    shelly: SHELLY_BASE,
    devices: SHELLY_DEVICES,
    state
  });
});

app.post("/api/switch", async (req, res) => {
  const on = Boolean(req.body?.on);

  try {
    await shellyRpc("Switch.Set", { id: 0, on });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/toggle", async (req, res) => {
  try {
    await shellyRpc("Switch.Toggle", { id: 0 });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* =======================
   Start
======================= */

server.listen(PORT, () => {
  console.log(`✅ Backend läuft auf http://localhost:${PORT}`);
  console.log(`🔁 Polling Shelly alle ${POLL_SEC}s → ${SHELLY_BASE}`);
});

setInterval(pollShelly, POLL_SEC * 1000);
pollShelly();
