const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const treeKill = require("tree-kill");

const repoRoot = path.resolve(__dirname, "..");
const backendDir = path.join(repoRoot, "backend");
const frontendDir = path.join(repoRoot, "frontend");
const envPath = path.join(backendDir, ".env");
const envExamplePath = path.join(backendDir, ".env.example");

const processes = {
  backend: null,
  frontend: null
};

function getNpmLaunch() {
  if (process.platform === "win32") {
    return {
      command: process.env.comspec || "cmd.exe",
      args: ["/d", "/s", "/c", "npm"]
    };
  }

  return { command: "npm", args: [] };
}

function emitStatus(name, status) {
  const window = BrowserWindow.getAllWindows()[0];
  if (window) {
    window.webContents.send("process-status", { name, status });
  }
}

function emitLog(name, line) {
  const window = BrowserWindow.getAllWindows()[0];
  if (window) {
    window.webContents.send("process-log", { name, line });
  }
}

function startProcess(name, options) {
  if (processes[name]) {
    return { ok: false, message: `${name} läuft bereits.` };
  }

  if (!options || !options.command || !Array.isArray(options.args)) {
    return { ok: false, message: "Ungueltige Prozessoptionen." };
  }

  if (!options.cwd || !fs.existsSync(options.cwd)) {
    return { ok: false, message: `Arbeitsverzeichnis nicht gefunden: ${options.cwd}` };
  }

  let child;
  try {
    child = spawn(options.command, options.args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32"
    });
  } catch (error) {
    return { ok: false, message: `Start fehlgeschlagen: ${error.message}` };
  }

  processes[name] = child;
  emitStatus(name, "running");

  child.stdout.on("data", (data) => {
    emitLog(name, data.toString());
  });

  child.stderr.on("data", (data) => {
    emitLog(name, data.toString());
  });

  child.on("error", (error) => {
    processes[name] = null;
    emitStatus(name, "stopped");
    emitLog(name, `Start fehlgeschlagen: ${error.message}\n`);
  });

  child.on("exit", (code) => {
    processes[name] = null;
    emitStatus(name, "stopped");
    emitLog(name, `Prozess beendet (Code ${code ?? "?"}).\n`);
  });

  return { ok: true };
}

function stopProcess(name) {
  const child = processes[name];
  if (!child) {
    return { ok: false, message: `${name} läuft nicht.` };
  }

  return new Promise((resolve) => {
    treeKill(child.pid, "SIGTERM", () => {
      processes[name] = null;
      emitStatus(name, "stopped");
      resolve({ ok: true });
    });
  });
}

function ensureEnvFile() {
  if (fs.existsSync(envPath)) {
    return;
  }

  let seed = "";
  if (fs.existsSync(envExamplePath)) {
    seed = fs.readFileSync(envExamplePath, "utf8");
  }

  const trimmed = seed.trimEnd();
  const suffix = trimmed.length ? "\n" : "";
  fs.writeFileSync(envPath, `${trimmed}${suffix}SHELLY_DEVICES=\n`, "utf8");
}

function parseDeviceLine(line) {
  if (!line) {
    return [];
  }

  const raw = line.split("=").slice(1).join("=").trim();
  const unquoted = raw.replace(/^['"]|['"]$/g, "");
  if (!unquoted) {
    return [];
  }

  return unquoted
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

function serializeDevices(devices) {
  return devices
    .map((device) => [device.id, device.name, device.baseUrl].map((value) => value?.trim() ?? "").join("|"))
    .join(";");
}

function readDevices() {
  ensureEnvFile();
  const content = fs.readFileSync(envPath, "utf8");
  const line = content.split(/\r?\n/).find((row) => row.startsWith("SHELLY_DEVICES="));
  return parseDeviceLine(line);
}

function writeDevices(devices) {
  ensureEnvFile();
  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);
  const serialized = serializeDevices(devices);
  let handled = false;
  const updated = lines.map((row) => {
    if (row.startsWith("SHELLY_DEVICES=")) {
      handled = true;
      return `SHELLY_DEVICES=${serialized}`;
    }
    return row;
  });

  if (!handled) {
    updated.push(`SHELLY_DEVICES=${serialized}`);
  }

  fs.writeFileSync(envPath, updated.join("\n"), "utf8");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 900,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

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

ipcMain.handle("get-status", () => ({
  backend: processes.backend ? "running" : "stopped",
  frontend: processes.frontend ? "running" : "stopped"
}));

ipcMain.handle("start-backend", () => {
  const npm = getNpmLaunch();
  return startProcess("backend", {
    command: npm.command,
    args: [...npm.args, "start"],
    cwd: backendDir
  });
});

ipcMain.handle("stop-backend", async () => stopProcess("backend"));

ipcMain.handle("start-frontend", () => {
  const npm = getNpmLaunch();
  return startProcess("frontend", {
    command: npm.command,
    args: [...npm.args, "run", "dev", "--", "--host"],
    cwd: frontendDir
  });
});

ipcMain.handle("stop-frontend", async () => stopProcess("frontend"));

ipcMain.handle("open-frontend", async () => {
  await shell.openExternal("http://localhost:5173");
  return { ok: true };
});

ipcMain.handle("read-devices", () => ({
  devices: readDevices()
}));

ipcMain.handle("save-devices", (event, devices) => {
  writeDevices(devices);
  return { ok: true };
});
