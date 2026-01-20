const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const kill = require("tree-kill");

const repoRoot = path.resolve(__dirname, "..");
const backendDir = path.join(repoRoot, "backend");
const frontendDir = path.join(repoRoot, "frontend");
const envPath = path.join(backendDir, ".env");

let mainWindow;
let backendProcess = null;
let frontendProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

function isRunning(proc) {
  return Boolean(proc && proc.pid && !proc.killed);
}

function getServiceStatus() {
  return {
    backend: {
      running: isRunning(backendProcess),
      pid: backendProcess?.pid ?? null,
    },
    frontend: {
      running: isRunning(frontendProcess),
      pid: frontendProcess?.pid ?? null,
    },
  };
}

function emitStatus() {
  if (!mainWindow) return;
  mainWindow.webContents.send("service-status", getServiceStatus());
}

function logLine(service, message) {
  if (!mainWindow) return;
  mainWindow.webContents.send("service-log", {
    service,
    message,
    timestamp: new Date().toISOString(),
  });
}

function spawnService(service) {
  if (service === "backend" && isRunning(backendProcess)) return;
  if (service === "frontend" && isRunning(frontendProcess)) return;

  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const cwd = service === "backend" ? backendDir : frontendDir;
  const args = service === "backend" ? ["start"] : ["run", "dev"];

  const child = spawn(command, args, {
    cwd,
    env: process.env,
    shell: false,
  });

  child.stdout.on("data", (data) => {
    logLine(service, data.toString());
  });

  child.stderr.on("data", (data) => {
    logLine(service, data.toString());
  });

  child.on("close", (code) => {
    logLine(service, `Process exited with code ${code}`);
    if (service === "backend") backendProcess = null;
    if (service === "frontend") frontendProcess = null;
    emitStatus();
  });

  if (service === "backend") backendProcess = child;
  if (service === "frontend") frontendProcess = child;

  emitStatus();
}

function stopService(service) {
  const child = service === "backend" ? backendProcess : frontendProcess;
  if (!isRunning(child)) return;

  kill(child.pid, "SIGTERM", () => {
    if (service === "backend") backendProcess = null;
    if (service === "frontend") frontendProcess = null;
    emitStatus();
  });
}

function parseDevices(raw) {
  if (!raw) return [];
  const items = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.map((entry) => {
    const parts = entry.split("|").map((p) => p.trim());
    if (parts.length !== 3) {
      throw new Error(
        `Ungültiger Eintrag: "${entry}". Erwartet: id|name|baseUrl`,
      );
    }
    const [id, name, baseUrl] = parts;
    if (!id || !baseUrl) {
      throw new Error(
        `Ungültiger Eintrag: "${entry}". id und baseUrl sind Pflicht.`,
      );
    }
    return { id, name, baseUrl };
  });
}

function serializeDevices(devices) {
  return devices
    .map((device) => {
      const id = device.id?.trim() ?? "";
      const name = device.name?.trim() ?? "";
      const baseUrl = device.baseUrl?.trim() ?? "";
      return [id, name, baseUrl].join("|");
    })
    .join(",");
}

function readEnvFile() {
  try {
    const content = fs.readFileSync(envPath, "utf8");
    return { content, exists: true };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { content: "", exists: false };
    }
    throw error;
  }
}

function upsertEnvKey(content, key, value) {
  const lines = content.split(/\r?\n/);
  let found = false;

  const updated = lines.map((line) => {
    if (new RegExp(`^\\s*${key}\\s*=`).test(line)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    updated.push(`${key}=${value}`);
  }

  return updated.filter((line) => line !== undefined).join("\n").replace(/\n?$/, "\n");
}

ipcMain.handle("service-status", () => getServiceStatus());

ipcMain.handle("service-start", (event, service) => {
  spawnService(service);
  return getServiceStatus();
});

ipcMain.handle("service-stop", (event, service) => {
  stopService(service);
  return getServiceStatus();
});

ipcMain.handle("devices-load", () => {
  const { content, exists } = readEnvFile();
  const match = content.match(/^\s*SHELLY_DEVICES\s*=\s*(.*)$/m);
  const raw = match ? match[1].trim() : "";

  try {
    const devices = parseDevices(raw);
    return {
      ok: true,
      devices,
      raw,
      envPath,
      exists,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      raw,
      envPath,
      exists,
    };
  }
});

ipcMain.handle("devices-save", (event, devices) => {
  const { content } = readEnvFile();
  const raw = serializeDevices(devices);
  const next = upsertEnvKey(content, "SHELLY_DEVICES", raw);
  fs.writeFileSync(envPath, next, "utf8");
  return { ok: true, raw, envPath };
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  if (isRunning(backendProcess)) stopService("backend");
  if (isRunning(frontendProcess)) stopService("frontend");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
