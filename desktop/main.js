const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

let mainWindow;
let backendProcess = null;
let frontendProcess = null;

const repoRoot = path.resolve(__dirname, "..");
const backendDir = path.join(repoRoot, "backend");
const frontendDir = path.join(repoRoot, "frontend");
const envFilePath = path.join(backendDir, ".env");
const envExamplePath = path.join(backendDir, ".env.example");

function getNpmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function sendStatus() {
  if (!mainWindow) return;
  mainWindow.webContents.send("process-status", {
    backendRunning: Boolean(backendProcess),
    frontendRunning: Boolean(frontendProcess)
  });
}

function spawnProcess(type) {
  if (type === "backend" && backendProcess) return;
  if (type === "frontend" && frontendProcess) return;

  const command = getNpmCommand();
  const args = type === "backend" ? ["start"] : ["run", "dev"];
  const cwd = type === "backend" ? backendDir : frontendDir;

  const child = spawn(command, args, {
    cwd,
    env: { ...process.env },
    stdio: "inherit"
  });

  child.on("exit", () => {
    if (type === "backend") {
      backendProcess = null;
    } else {
      frontendProcess = null;
    }
    sendStatus();
  });

  if (type === "backend") {
    backendProcess = child;
  } else {
    frontendProcess = child;
  }

  sendStatus();
}

function stopProcess(type) {
  const child = type === "backend" ? backendProcess : frontendProcess;
  if (!child) return;

  child.kill();

  if (type === "backend") {
    backendProcess = null;
  } else {
    frontendProcess = null;
  }

  sendStatus();
}

function ensureEnvFile() {
  if (fs.existsSync(envFilePath)) {
    return;
  }

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envFilePath);
    return;
  }

  fs.writeFileSync(envFilePath, "");
}

function readEnvFile() {
  ensureEnvFile();
  return fs.readFileSync(envFilePath, "utf-8").split(/\r?\n/);
}

function parseDevices() {
  const lines = readEnvFile();
  const target = lines.find((line) => line.startsWith("SHELLY_DEVICES="));
  if (!target) return [];

  const value = target.replace("SHELLY_DEVICES=", "").trim();
  if (!value) return [];

  return value.split(";").filter(Boolean).map((entry) => {
    const [id = "", name = "", baseUrl = ""] = entry.split("|");
    return { id, name, baseUrl };
  });
}

function saveDevices(devices) {
  const lines = readEnvFile();
  const serialized = devices
    .map(({ id, name, baseUrl }) => `${id}|${name}|${baseUrl}`)
    .join(";");
  const nextLine = `SHELLY_DEVICES=${serialized}`;

  const index = lines.findIndex((line) => line.startsWith("SHELLY_DEVICES="));
  if (index === -1) {
    lines.push(nextLine);
  } else {
    lines[index] = nextLine;
  }

  fs.writeFileSync(envFilePath, lines.join("\n"));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
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

app.on("window-all-closed", () => {
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("get-status", () => ({
  backendRunning: Boolean(backendProcess),
  frontendRunning: Boolean(frontendProcess)
}));

ipcMain.handle("start-backend", () => {
  spawnProcess("backend");
  return { ok: true };
});

ipcMain.handle("stop-backend", () => {
  stopProcess("backend");
  return { ok: true };
});

ipcMain.handle("start-frontend", () => {
  spawnProcess("frontend");
  return { ok: true };
});

ipcMain.handle("stop-frontend", () => {
  stopProcess("frontend");
  return { ok: true };
});

ipcMain.handle("load-devices", () => ({
  devices: parseDevices()
}));

ipcMain.handle("save-devices", (event, devices) => {
  saveDevices(devices);
  return { ok: true };
});
