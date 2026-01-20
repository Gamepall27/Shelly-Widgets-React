const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(REPO_ROOT, "backend");
const FRONTEND_DIR = path.join(REPO_ROOT, "frontend");
const ENV_PATH = path.join(BACKEND_DIR, ".env");

let mainWindow;
let backendProcess = null;
let frontendProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

function parseEnv(content) {
  const lines = content.split(/\r?\n/);
  const data = {};
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }
    const idx = line.indexOf("=");
    if (idx === -1) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    data[key] = value;
  }
  return data;
}

function serializeEnv(data, existingContent) {
  const lines = existingContent.split(/\r?\n/);
  const seen = new Set();
  const nextLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return line;
    }
    const idx = line.indexOf("=");
    if (idx === -1) {
      return line;
    }
    const key = line.slice(0, idx).trim();
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      seen.add(key);
      return `${key}=${data[key]}`;
    }
    return line;
  });

  for (const [key, value] of Object.entries(data)) {
    if (!seen.has(key)) {
      nextLines.push(`${key}=${value}`);
    }
  }

  return nextLines.join("\n");
}

function parseDevices(raw) {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split("|").map((p) => p.trim());
      return {
        id: parts[0] || "",
        name: parts[1] || "",
        baseUrl: parts[2] || "",
      };
    });
}

function formatDevices(devices) {
  return devices
    .map((device) => {
      const id = device.id.trim();
      const name = device.name.trim();
      const baseUrl = device.baseUrl.trim().replace(/\/$/, "");
      return `${id}|${name}|${baseUrl}`;
    })
    .filter((entry) => entry && !entry.startsWith("|"))
    .join(",");
}

function ensureEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    fs.writeFileSync(
      ENV_PATH,
      "SHELLY_DEVICES=\nMQTT_URL=mqtt://127.0.0.1:1883\nMQTT_PREFIX=shelly\n",
      "utf-8",
    );
  }
}

function spawnProcess(command, args, cwd, tag) {
  const child = spawn(command, args, { cwd, shell: true, env: process.env });

  const relay = (data, type) => {
    if (mainWindow) {
      mainWindow.webContents.send("process-log", {
        tag,
        type,
        message: data.toString(),
      });
    }
  };

  child.stdout.on("data", (data) => relay(data, "stdout"));
  child.stderr.on("data", (data) => relay(data, "stderr"));
  child.on("close", (code) => {
    relay(`\n[${tag}] process exited with code ${code}\n`, "exit");
  });

  return child;
}

function stopProcess(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", child.pid, "/t", "/f"], { shell: true });
    return;
  }

  child.kill("SIGTERM");
}

ipcMain.handle("get-config", () => {
  ensureEnvFile();
  const content = fs.readFileSync(ENV_PATH, "utf-8");
  const env = parseEnv(content);
  return {
    envPath: ENV_PATH,
    devices: parseDevices(env.SHELLY_DEVICES || ""),
    backendRunning: Boolean(backendProcess && !backendProcess.killed),
    frontendRunning: Boolean(frontendProcess && !frontendProcess.killed),
  };
});

ipcMain.handle("save-devices", async (_event, devices) => {
  try {
    ensureEnvFile();
    const content = fs.readFileSync(ENV_PATH, "utf-8");
    const env = parseEnv(content);
    env.SHELLY_DEVICES = formatDevices(devices);
    const nextContent = serializeEnv(env, content);
    fs.writeFileSync(ENV_PATH, nextContent, "utf-8");
    return { ok: true };
  } catch (error) {
    dialog.showErrorBox("Fehler beim Speichern", error.message);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("start-backend", () => {
  if (backendProcess && !backendProcess.killed) {
    return { ok: true };
  }
  backendProcess = spawnProcess("npm", ["start"], BACKEND_DIR, "backend");
  return { ok: true };
});

ipcMain.handle("stop-backend", () => {
  stopProcess(backendProcess);
  backendProcess = null;
  return { ok: true };
});

ipcMain.handle("start-frontend", () => {
  if (frontendProcess && !frontendProcess.killed) {
    return { ok: true };
  }
  frontendProcess = spawnProcess("npm", ["run", "dev"], FRONTEND_DIR, "frontend");
  return { ok: true };
});

ipcMain.handle("stop-frontend", () => {
  stopProcess(frontendProcess);
  frontendProcess = null;
  return { ok: true };
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
