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

// Neu: mehrere Geräte
const SHELLY_DEVICES_RAW = process.env.SHELLY_DEVICES;

if (!SHELLY_DEVICES_RAW) {
  console.error("❌ SHELLY_DEVICES fehlt in .env");
  console.error(
    "Beispiel: SHELLY_DEVICES=shelly1|Wohnzimmer|http://192.168.178.181,shelly2|Boiler|http://192.168.178.182",
  );
  process.exit(1);
}

/**
 * Erwartetes Format:
 * id|name|baseUrl,id|name|baseUrl
 */
function parseDevices(raw) {
  const items = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const devices = items.map((entry) => {
    const parts = entry.split("|").map((p) => p.trim());
    if (parts.length !== 3) {
      throw new Error(
        `Invalid SHELLY_DEVICES entry: "${entry}". Expected: id|name|baseUrl`,
      );
    }
    const [id, name, baseUrl] = parts;
    if (!id || !baseUrl) {
      throw new Error(
        `Invalid SHELLY_DEVICES entry: "${entry}". id and baseUrl required.`,
      );
    }
    return { id, name, baseUrl: baseUrl.replace(/\/$/, "") };
  });

  // id unique check
  const seen = new Set();
  for (const d of devices) {
    if (seen.has(d.id)) {
      throw new Error(`Duplicate device id in SHELLY_DEVICES: "${d.id}"`);
    }
    seen.add(d.id);
  }

  return devices;
}

let DEVICES = [];
try {
  DEVICES = parseDevices(SHELLY_DEVICES_RAW);
} catch (e) {
  console.error("❌ SHELLY_DEVICES parse error:", e.message);
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
   Globaler State (pro Gerät)
======================= */

function makeEmptyMetrics() {
  return {
    output: null,
    apower: null,
    voltage: null,
    current: null,
    energyWh: null,
    temperatureC: null,
    lastUpdateTs: null,
  };
}

function makeDeviceState(device) {
  return {
    id: device.id,
    name: device.name,
    baseUrl: device.baseUrl,
    connected: false,
    lastError: null,
    metrics: makeEmptyMetrics(),
  };
}

const state = {
  pollSec: POLL_SEC,
  devices: Object.fromEntries(DEVICES.map((d) => [d.id, makeDeviceState(d)])),
};

/* =======================
   Shelly HTTP-RPC (Gen3)
======================= */

async function shellyRpc(baseUrl, method, params = {}) {
  const url = `${baseUrl}/rpc/${method}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} failed: ${res.status} ${text}`);
  }

  return res.json();
}

/* =======================
   Polling (alle Geräte)
======================= */

async function pollOneDevice(device) {
  const ds = state.devices[device.id];
  const startTs = Date.now();

  try {
    const data = await shellyRpc(device.baseUrl, "Shelly.GetStatus");
    const sw = data["switch:0"];

    if (sw) {
      ds.metrics.output = sw.output ?? null;
      ds.metrics.apower = sw.apower ?? null;
      ds.metrics.voltage = sw.voltage ?? null;
      ds.metrics.current = sw.current ?? null;
      ds.metrics.energyWh = sw.aenergy?.total ?? null;
      ds.metrics.temperatureC = sw.temperature?.tC ?? null;
    }

    ds.metrics.lastUpdateTs = Date.now();
    ds.connected = true;
    ds.lastError = null;

    // Log jedes erfolgreiche Polling
    const ms = Date.now() - startTs;
    console.log(
      `📥 polled ${device.id} (${device.name}) in ${ms}ms → apower=${ds.metrics.apower}W, temp=${ds.metrics.temperatureC}°C, output=${ds.metrics.output}`,
    );

    broadcast({
      type: "device_update",
      deviceId: device.id,
      deviceName: device.name,
      metrics: ds.metrics,
    });
  } catch (err) {
    ds.connected = false;
    ds.lastError = err.message;

    console.error(`❌ poll failed ${device.id} (${device.name}):`, err.message);

    broadcast({
      type: "device_error",
      deviceId: device.id,
      deviceName: device.name,
      error: ds.lastError,
    });
  }
}

async function pollAllShellys() {
  // parallel pollen, damit es schnell bleibt
  await Promise.allSettled(DEVICES.map((d) => pollOneDevice(d)));
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
      state,
    }),
  );
});

/* =======================
   REST API
======================= */

// Liste aller Geräte
app.get("/api/devices", (req, res) => {
  res.json({
    ok: true,
    pollSec: state.pollSec,
    devices: DEVICES.map((d) => ({
      id: d.id,
      name: d.name,
      baseUrl: d.baseUrl,
      state: state.devices[d.id],
    })),
  });
});

// Health pro Gerät
app.get("/api/device/:id/health", (req, res) => {
  const id = req.params.id;
  const ds = state.devices[id];
  if (!ds)
    return res.status(404).json({ ok: false, error: "unknown device id" });

  res.json({ ok: true, device: ds });
});

// Switch setzen pro Gerät
app.post("/api/device/:id/switch", async (req, res) => {
  const id = req.params.id;
  const ds = state.devices[id];
  if (!ds)
    return res.status(404).json({ ok: false, error: "unknown device id" });

  const on = Boolean(req.body?.on);

  try {
    await shellyRpc(ds.baseUrl, "Switch.Set", { id: 0, on });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Toggle pro Gerät
app.post("/api/device/:id/toggle", async (req, res) => {
  const id = req.params.id;
  const ds = state.devices[id];
  if (!ds)
    return res.status(404).json({ ok: false, error: "unknown device id" });

  try {
    await shellyRpc(ds.baseUrl, "Switch.Toggle", { id: 0 });
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
  console.log(`WS endpoint: ${WS_PATH}`);
  console.log(`🔁 Polling alle ${POLL_SEC}s`);
  console.log("📡 Geräte:");
  for (const d of DEVICES) {
    console.log(`  - ${d.id} (${d.name}) → ${d.baseUrl}`);
  }
});

setInterval(pollAllShellys, POLL_SEC * 1000);
pollAllShellys();
