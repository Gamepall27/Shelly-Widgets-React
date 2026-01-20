const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("shellyDesktop", {
  getStatus: () => ipcRenderer.invoke("service-status"),
  startService: (service) => ipcRenderer.invoke("service-start", service),
  stopService: (service) => ipcRenderer.invoke("service-stop", service),
  loadDevices: () => ipcRenderer.invoke("devices-load"),
  saveDevices: (devices) => ipcRenderer.invoke("devices-save", devices),
  onStatus: (callback) => ipcRenderer.on("service-status", (_event, payload) => callback(payload)),
  onLog: (callback) => ipcRenderer.on("service-log", (_event, payload) => callback(payload)),
});
