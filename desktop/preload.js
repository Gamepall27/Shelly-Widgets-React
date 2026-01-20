const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
  startProcess: (name) => ipcRenderer.invoke("process-start", name),
  stopProcess: (name) => ipcRenderer.invoke("process-stop", name),
  getStatus: (name) => ipcRenderer.invoke("process-status", name),
  getLogs: (name) => ipcRenderer.invoke("logs-get", name),
  readEnv: () => ipcRenderer.invoke("env-read"),
  writeEnv: (devices) => ipcRenderer.invoke("env-write", devices),
  onProcessStatus: (callback) => ipcRenderer.on("process-status", (_, name, running) => callback(name, running))
});
