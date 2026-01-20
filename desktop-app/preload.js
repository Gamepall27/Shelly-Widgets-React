const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveDevices: (devices) => ipcRenderer.invoke("save-devices", devices),
  startBackend: () => ipcRenderer.invoke("start-backend"),
  stopBackend: () => ipcRenderer.invoke("stop-backend"),
  startFrontend: () => ipcRenderer.invoke("start-frontend"),
  stopFrontend: () => ipcRenderer.invoke("stop-frontend"),
  onProcessLog: (callback) => ipcRenderer.on("process-log", (_event, payload) => callback(payload)),
});
