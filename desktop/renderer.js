const backendStatus = document.getElementById("backend-status");
const frontendStatus = document.getElementById("frontend-status");
const backendStart = document.getElementById("backend-start");
const backendStop = document.getElementById("backend-stop");
const frontendStart = document.getElementById("frontend-start");
const frontendStop = document.getElementById("frontend-stop");

const devicesTable = document.getElementById("devices-table");
const devicesBody = devicesTable.querySelector("tbody");
const devicesEmpty = document.getElementById("devices-empty");
const addDeviceBtn = document.getElementById("add-device");

const modal = document.getElementById("device-modal");
const modalTitle = document.getElementById("modal-title");
const modalForm = document.getElementById("device-form");
const modalCancel = document.getElementById("modal-cancel");
const modalSave = document.getElementById("modal-save");

let devices = [];
let editingIndex = null;

const idInput = modalForm.elements.namedItem("id");
const nameInput = modalForm.elements.namedItem("name");
const baseUrlInput = modalForm.elements.namedItem("baseUrl");

function setStatus(element, running) {
  element.textContent = running ? "Läuft" : "Gestoppt";
  element.classList.toggle("running", running);
  element.classList.toggle("stopped", !running);
}

function renderDevices() {
  devicesBody.innerHTML = "";

  if (devices.length === 0) {
    devicesTable.style.display = "none";
    devicesEmpty.style.display = "block";
    return;
  }

  devicesTable.style.display = "table";
  devicesEmpty.style.display = "none";

  devices.forEach((device, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${device.id}</td>
      <td>${device.name}</td>
      <td>${device.baseUrl}</td>
      <td>
        <button class="table-btn" data-action="edit" data-index="${index}">Bearbeiten</button>
        <button class="table-btn" data-action="delete" data-index="${index}">Löschen</button>
      </td>
    `;

    devicesBody.appendChild(row);
  });
}

function openModal(device = { id: "", name: "", baseUrl: "" }, index = null) {
    editingIndex = index;
    modalTitle.textContent = index === null ? "Device hinzufügen" : "Device bearbeiten";
    idInput.value = device.id;
    nameInput.value = device.name;
    baseUrlInput.value = device.baseUrl;
    modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  editingIndex = null;
}

async function persistDevices(nextDevices) {
  await window.electronAPI.saveDevices(nextDevices);
  devices = nextDevices;
  renderDevices();
}

async function init() {
  const status = await window.electronAPI.getStatus();
  setStatus(backendStatus, status.backendRunning);
  setStatus(frontendStatus, status.frontendRunning);

  const result = await window.electronAPI.loadDevices();
  devices = result.devices ?? [];
  renderDevices();
}

backendStart.addEventListener("click", () => window.electronAPI.startBackend());
backendStop.addEventListener("click", () => window.electronAPI.stopBackend());
frontendStart.addEventListener("click", () => window.electronAPI.startFrontend());
frontendStop.addEventListener("click", () => window.electronAPI.stopFrontend());

addDeviceBtn.addEventListener("click", () => openModal());
modalCancel.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

modalSave.addEventListener("click", async () => {
  if (!modalForm.reportValidity()) return;

  const payload = {
    id: idInput.value.trim(),
    name: nameInput.value.trim(),
    baseUrl: baseUrlInput.value.trim()
  };

  const nextDevices = [...devices];
  if (editingIndex === null) {
    nextDevices.push(payload);
  } else {
    nextDevices[editingIndex] = payload;
  }

  await persistDevices(nextDevices);
  closeModal();
});

devicesBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const action = target.dataset.action;
  const index = Number(target.dataset.index);

  if (Number.isNaN(index)) return;

  if (action === "edit") {
    openModal(devices[index], index);
  }

  if (action === "delete") {
    const nextDevices = devices.filter((_, idx) => idx !== index);
    persistDevices(nextDevices);
  }
});

window.electronAPI.onStatus((status) => {
  setStatus(backendStatus, status.backendRunning);
  setStatus(frontendStatus, status.frontendRunning);
});

init();
