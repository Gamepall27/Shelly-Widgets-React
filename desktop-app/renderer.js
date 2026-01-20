const backendStatus = document.getElementById("backend-status");
const frontendStatus = document.getElementById("frontend-status");
const deviceTable = document.getElementById("device-table");
const envPathLabel = document.getElementById("env-path");
const logOutput = document.getElementById("log-output");

const overlay = document.getElementById("overlay");
const deviceEditor = document.getElementById("device-editor");

const startBackendButton = document.getElementById("start-backend");
const stopBackendButton = document.getElementById("stop-backend");
const startFrontendButton = document.getElementById("start-frontend");
const stopFrontendButton = document.getElementById("stop-frontend");
const editDevicesButton = document.getElementById("edit-devices");
const addDeviceButton = document.getElementById("add-device");
const saveDevicesButton = document.getElementById("save-devices");
const cancelDevicesButton = document.getElementById("cancel-devices");
const closeOverlayButton = document.getElementById("close-overlay");

let devices = [];

function setStatus(element, running) {
  element.textContent = running ? "läuft" : "gestoppt";
  element.classList.toggle("running", running);
}

function renderDeviceTable() {
  deviceTable.innerHTML = "";

  if (devices.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"3\" class=\"muted\">Noch keine Geräte.</td>";
    deviceTable.appendChild(row);
    return;
  }

  devices.forEach((device) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${device.id}</td>
      <td>${device.name}</td>
      <td>${device.baseUrl}</td>
    `;
    deviceTable.appendChild(row);
  });
}

function renderEditor() {
  deviceEditor.innerHTML = "";

  devices.forEach((device, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input data-field=\"id\" data-index=\"${index}\" value=\"${device.id}\" /></td>
      <td><input data-field=\"name\" data-index=\"${index}\" value=\"${device.name}\" /></td>
      <td><input data-field=\"baseUrl\" data-index=\"${index}\" value=\"${device.baseUrl}\" /></td>
      <td><button class=\"secondary\" data-remove=\"${index}\">Entfernen</button></td>
    `;
    deviceEditor.appendChild(row);
  });

  if (devices.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"4\" class=\"muted\">Noch keine Geräte.</td>";
    deviceEditor.appendChild(row);
  }
}

function openOverlay() {
  renderEditor();
  overlay.classList.remove("hidden");
}

function closeOverlay() {
  overlay.classList.add("hidden");
}

function updateDeviceFromInput(event) {
  const index = Number(event.target.dataset.index);
  const field = event.target.dataset.field;
  if (Number.isNaN(index) || !field) {
    return;
  }
  devices[index][field] = event.target.value;
}

function removeDevice(index) {
  devices.splice(index, 1);
  renderEditor();
}

function appendLog({ tag, type, message }) {
  const line = `[${tag}/${type}] ${message}`;
  logOutput.textContent += line;
  logOutput.scrollTop = logOutput.scrollHeight;
}

async function loadConfig() {
  const config = await window.api.getConfig();
  devices = config.devices;
  envPathLabel.textContent = config.envPath;
  setStatus(backendStatus, config.backendRunning);
  setStatus(frontendStatus, config.frontendRunning);
  renderDeviceTable();
}

startBackendButton.addEventListener("click", async () => {
  await window.api.startBackend();
  setStatus(backendStatus, true);
});

stopBackendButton.addEventListener("click", async () => {
  await window.api.stopBackend();
  setStatus(backendStatus, false);
});

startFrontendButton.addEventListener("click", async () => {
  await window.api.startFrontend();
  setStatus(frontendStatus, true);
});

stopFrontendButton.addEventListener("click", async () => {
  await window.api.stopFrontend();
  setStatus(frontendStatus, false);
});

editDevicesButton.addEventListener("click", openOverlay);
closeOverlayButton.addEventListener("click", closeOverlay);
cancelDevicesButton.addEventListener("click", () => {
  closeOverlay();
  loadConfig();
});

addDeviceButton.addEventListener("click", () => {
  devices.push({ id: "", name: "", baseUrl: "" });
  renderEditor();
});

deviceEditor.addEventListener("input", updateDeviceFromInput);

deviceEditor.addEventListener("click", (event) => {
  if (event.target.matches("button[data-remove]")) {
    const index = Number(event.target.dataset.remove);
    if (!Number.isNaN(index)) {
      removeDevice(index);
    }
  }
});

saveDevicesButton.addEventListener("click", async () => {
  await window.api.saveDevices(devices);
  closeOverlay();
  renderDeviceTable();
});

window.api.onProcessLog(appendLog);

loadConfig();
