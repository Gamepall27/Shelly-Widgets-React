const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getStatus: () => ipcRenderer.invoke("get-status"),
  startBackend: () => ipcRenderer.invoke("start-backend"),
  stopBackend: () => ipcRenderer.invoke("stop-backend"),
  startFrontend: () => ipcRenderer.invoke("start-frontend"),
  stopFrontend: () => ipcRenderer.invoke("stop-frontend"),
  openFrontend: () => ipcRenderer.invoke("open-frontend"),
  readDevices: () => ipcRenderer.invoke("read-devices"),
  saveDevices: (devices) => ipcRenderer.invoke("save-devices", devices),
  onProcessStatus: (handler) => ipcRenderer.on("process-status", handler),
  onProcessLog: (handler) => ipcRenderer.on("process-log", handler)
});
