const statusEls = {
  backend: document.querySelector('[data-status="backend"]'),
  frontend: document.querySelector('[data-status="frontend"]')
};
const logEls = {
  backend: document.getElementById("backend-log"),
  frontend: document.getElementById("frontend-log")
};
const devicePreview = document.getElementById("device-preview");
const modal = document.getElementById("device-modal");
const deviceList = document.getElementById("device-list");

const actions = {
  startBackend: document.getElementById("start-backend"),
  stopBackend: document.getElementById("stop-backend"),
  startFrontend: document.getElementById("start-frontend"),
  stopFrontend: document.getElementById("stop-frontend"),
  openFrontend: document.getElementById("open-frontend"),
  editDevices: document.getElementById("edit-devices"),
  closeModal: document.getElementById("close-modal"),
  cancelDevices: document.getElementById("cancel-devices"),
  saveDevices: document.getElementById("save-devices"),
  addDevice: document.getElementById("add-device")
};

let currentDevices = [];

function setStatus(name, status) {
  const el = statusEls[name];
  if (!el) return;
  el.textContent = status === "running" ? "läuft" : "gestoppt";
  el.dataset.state = status;
}

function appendLog(name, line) {
  const el = logEls[name];
  if (!el) return;
  el.textContent += line;
  el.scrollTop = el.scrollHeight;
}

function renderPreview(devices) {
  devicePreview.innerHTML = "";
  if (!devices.length) {
    const empty = document.createElement("span");
    empty.textContent = "Keine Geräte erfasst.";
    devicePreview.appendChild(empty);
    return;
  }

  devices.forEach((device) => {
    const item = document.createElement("span");
    item.textContent = `${device.id || "–"} | ${device.name || "–"} | ${device.baseUrl || "–"}`;
    devicePreview.appendChild(item);
  });
}

function createDeviceRow(device = {}) {
  const row = document.createElement("div");
  row.className = "device-row";

  const idInput = document.createElement("input");
  idInput.placeholder = "ID";
  idInput.value = device.id || "";

  const nameInput = document.createElement("input");
  nameInput.placeholder = "Name";
  nameInput.value = device.name || "";

  const urlInput = document.createElement("input");
  urlInput.placeholder = "Base URL";
  urlInput.value = device.baseUrl || "";

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-icon";
  removeBtn.type = "button";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", () => row.remove());

  row.append(idInput, nameInput, urlInput, removeBtn);
  return row;
}

function readDevicesFromModal() {
  const rows = Array.from(deviceList.querySelectorAll(".device-row"));
  return rows.map((row) => {
    const inputs = row.querySelectorAll("input");
    return {
      id: inputs[0].value.trim(),
      name: inputs[1].value.trim(),
      baseUrl: inputs[2].value.trim()
    };
  }).filter((device) => device.id || device.name || device.baseUrl);
}

function openModal(devices) {
  deviceList.innerHTML = "";
  devices.forEach((device) => deviceList.appendChild(createDeviceRow(device)));
  if (!devices.length) {
    deviceList.appendChild(createDeviceRow());
  }
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

async function refreshDevices() {
  const result = await window.api.readDevices();
  currentDevices = result.devices || [];
  renderPreview(currentDevices);
}

async function initialize() {
  const status = await window.api.getStatus();
  setStatus("backend", status.backend);
  setStatus("frontend", status.frontend);
  await refreshDevices();
}

window.api.onProcessStatus((event, payload) => {
  setStatus(payload.name, payload.status);
});

window.api.onProcessLog((event, payload) => {
  appendLog(payload.name, payload.line);
});

actions.startBackend.addEventListener("click", async () => {
  const result = await window.api.startBackend();
  if (!result.ok) {
    appendLog("backend", `${result.message}\n`);
  }
});

actions.stopBackend.addEventListener("click", async () => {
  const result = await window.api.stopBackend();
  if (!result.ok) {
    appendLog("backend", `${result.message}\n`);
  }
});

actions.startFrontend.addEventListener("click", async () => {
  const result = await window.api.startFrontend();
  if (!result.ok) {
    appendLog("frontend", `${result.message}\n`);
  }
});

actions.stopFrontend.addEventListener("click", async () => {
  const result = await window.api.stopFrontend();
  if (!result.ok) {
    appendLog("frontend", `${result.message}\n`);
  }
});

actions.openFrontend.addEventListener("click", async () => {
  await window.api.openFrontend();
});

actions.editDevices.addEventListener("click", () => {
  openModal(currentDevices);
});

actions.closeModal.addEventListener("click", closeModal);
actions.cancelDevices.addEventListener("click", closeModal);

actions.addDevice.addEventListener("click", () => {
  deviceList.appendChild(createDeviceRow());
});

actions.saveDevices.addEventListener("click", async () => {
  const devices = readDevicesFromModal();
  await window.api.saveDevices(devices);
  currentDevices = devices;
  renderPreview(currentDevices);
  closeModal();
});

initialize();
