const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const backendDir = path.join(repoRoot, "backend");
const frontendDir = path.join(repoRoot, "frontend");
const backendEnvPath = path.join(backendDir, ".env");
const backendEnvExamplePath = path.join(backendDir, ".env.example");

const processes = new Map();
const logs = {
  backend: [],
  frontend: []
};

function ensureEnvFile() {
  if (!fs.existsSync(backendEnvPath) && fs.existsSync(backendEnvExamplePath)) {
    fs.copyFileSync(backendEnvExamplePath, backendEnvPath);
  }
}

function parseDevices(line) {
  if (!line) return [];
  return line
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id = "", name = "", baseUrl = ""] = entry.split("|");
      return { id: id.trim(), name: name.trim(), baseUrl: baseUrl.trim() };
    })
    .filter((device) => device.id || device.name || device.baseUrl);
}

function buildDevicesLine(devices) {
  return devices
    .map((device) => [device.id, device.name, device.baseUrl].map((v) => v.trim()).join("|"))
    .join(",");
}

function readEnvFile() {
  ensureEnvFile();
  if (!fs.existsSync(backendEnvPath)) {
    return { raw: "", devices: [] };
  }
  const raw = fs.readFileSync(backendEnvPath, "utf8");
  const devicesLine = raw
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("SHELLY_DEVICES="));
  const value = devicesLine ? devicesLine.split("=").slice(1).join("=") : "";
  return { raw, devices: parseDevices(value) };
}

function writeEnvDevices(devices) {
  ensureEnvFile();
  const entry = `SHELLY_DEVICES=${buildDevicesLine(devices)}`;
  const content = fs.existsSync(backendEnvPath) ? fs.readFileSync(backendEnvPath, "utf8") : "";
  const lines = content ? content.split(/\r?\n/) : [];
  let updated = false;
  const nextLines = lines.map((line) => {
    if (line.trim().startsWith("SHELLY_DEVICES=")) {
      updated = true;
      return entry;
    }
    return line;
  });

  if (!updated) {
    if (nextLines.length && nextLines[nextLines.length - 1].trim() !== "") {
      nextLines.push("");
    }
    nextLines.push(entry);
  }

  fs.writeFileSync(backendEnvPath, nextLines.join("\n"), "utf8");
}

function appendLog(name, chunk) {
  const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
  logs[name].push(...lines);
  if (logs[name].length > 200) {
    logs[name] = logs[name].slice(-200);
  }
}

function startProcess(name, command, cwd, onExit) {
  if (processes.has(name)) {
    return { ok: false, error: `${name} läuft bereits.` };
  }

  const child = spawn(command, {
    cwd,
    shell: true,
    env: { ...process.env }
  });

  child.stdout.on("data", (chunk) => appendLog(name, chunk));
  child.stderr.on("data", (chunk) => appendLog(name, chunk));

  child.on("exit", (code) => {
    processes.delete(name);
    appendLog(name, `Process exited with code ${code}`);
    if (onExit) onExit();
  });

  processes.set(name, child);
  return { ok: true };
}

function stopProcess(name) {
  const child = processes.get(name);
  if (!child) return { ok: false, error: `${name} läuft nicht.` };
  child.kill();
  processes.delete(name);
  return { ok: true };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 820,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "index.html"));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  for (const name of processes.keys()) {
    stopProcess(name);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("process-start", (event, name) => {
  if (name === "backend") {
    return startProcess("backend", "npm start", backendDir, () => {
      event.sender.send("process-status", "backend", false);
    });
  }
  if (name === "frontend") {
    return startProcess("frontend", "npm run dev", frontendDir, () => {
      event.sender.send("process-status", "frontend", false);
    });
  }
  return { ok: false, error: "Unbekannter Prozess." };
});

ipcMain.handle("process-stop", (event, name) => {
  const result = stopProcess(name);
  if (result.ok) {
    event.sender.send("process-status", name, false);
  }
  return result;
});

ipcMain.handle("process-status", (event, name) => {
  return { running: processes.has(name) };
});

ipcMain.handle("logs-get", (event, name) => {
  return { lines: logs[name] ?? [] };
});

ipcMain.handle("env-read", () => {
  const { devices } = readEnvFile();
  return { devices };
});

ipcMain.handle("env-write", (event, devices) => {
  writeEnvDevices(devices);
  return { ok: true };
});
