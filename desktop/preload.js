const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getStatus: () => ipcRenderer.invoke("get-status"),
  startBackend: () => ipcRenderer.invoke("start-backend"),
  stopBackend: () => ipcRenderer.invoke("stop-backend"),
  startFrontend: () => ipcRenderer.invoke("start-frontend"),
  stopFrontend: () => ipcRenderer.invoke("stop-frontend"),
  loadDevices: () => ipcRenderer.invoke("load-devices"),
  saveDevices: (devices) => ipcRenderer.invoke("save-devices", devices),
  onStatus: (callback) => ipcRenderer.on("process-status", (_event, status) => callback(status))
});
