const backendStart = document.getElementById("backend-start");
const backendStop = document.getElementById("backend-stop");
const backendStatus = document.getElementById("backend-status");
const backendLogs = document.getElementById("backend-logs");

const frontendStart = document.getElementById("frontend-start");
const frontendStop = document.getElementById("frontend-stop");
const frontendStatus = document.getElementById("frontend-status");
const frontendLogs = document.getElementById("frontend-logs");

const deviceOpen = document.getElementById("device-open");
const deviceClose = document.getElementById("device-close");
const deviceSave = document.getElementById("device-save");
const deviceAdd = document.getElementById("device-add");
const deviceForm = document.getElementById("device-form");
const deviceList = document.getElementById("device-list");
const overlay = document.getElementById("overlay");

let devices = [];

function setStatus(element, running) {
  element.textContent = `Status: ${running ? "läuft" : "gestoppt"}`;
}

function renderDeviceList() {
  deviceList.innerHTML = "";
  if (!devices.length) {
    const empty = document.createElement("li");
    empty.textContent = "Noch keine Geräte hinterlegt.";
    deviceList.appendChild(empty);
    return;
  }
  devices.forEach((device) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${device.name || "Unbenannt"}</strong><br />ID: ${device.id}<br />${device.baseUrl}`;
    deviceList.appendChild(item);
  });
}

function renderDeviceForm() {
  deviceForm.innerHTML = "";
  devices.forEach((device, index) => {
    const row = document.createElement("div");
    row.className = "device-row";
    row.innerHTML = `
      <input type="text" placeholder="ID" value="${device.id}" data-field="id" data-index="${index}" />
      <input type="text" placeholder="Name" value="${device.name}" data-field="name" data-index="${index}" />
      <input type="text" placeholder="http://192.168.1.10" value="${device.baseUrl}" data-field="baseUrl" data-index="${index}" />
      <button type="button" data-remove="${index}">Entfernen</button>
    `;
    deviceForm.appendChild(row);
  });

  deviceForm.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", (event) => {
      const index = Number(event.target.dataset.index);
      const field = event.target.dataset.field;
      devices[index][field] = event.target.value;
      renderDeviceList();
    });
  });

  deviceForm.querySelectorAll("button[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.remove);
      devices.splice(index, 1);
      renderDeviceForm();
      renderDeviceList();
    });
  });
}

async function refreshLogs() {
  const backend = await window.desktopApi.getLogs("backend");
  backendLogs.textContent = backend.lines.join("\n");
  const frontend = await window.desktopApi.getLogs("frontend");
  frontendLogs.textContent = frontend.lines.join("\n");
}

async function refreshStatus() {
  const backend = await window.desktopApi.getStatus("backend");
  setStatus(backendStatus, backend.running);
  const frontend = await window.desktopApi.getStatus("frontend");
  setStatus(frontendStatus, frontend.running);
}

async function loadDevices() {
  const result = await window.desktopApi.readEnv();
  devices = result.devices ?? [];
  renderDeviceForm();
  renderDeviceList();
}

backendStart.addEventListener("click", async () => {
  await window.desktopApi.startProcess("backend");
  refreshStatus();
});

backendStop.addEventListener("click", async () => {
  await window.desktopApi.stopProcess("backend");
  refreshStatus();
});

frontendStart.addEventListener("click", async () => {
  await window.desktopApi.startProcess("frontend");
  refreshStatus();
});

frontendStop.addEventListener("click", async () => {
  await window.desktopApi.stopProcess("frontend");
  refreshStatus();
});

window.desktopApi.onProcessStatus((name, running) => {
  if (name === "backend") {
    setStatus(backendStatus, running);
  }
  if (name === "frontend") {
    setStatus(frontendStatus, running);
  }
});

deviceOpen.addEventListener("click", async () => {
  await loadDevices();
  overlay.classList.remove("hidden");
});

deviceClose.addEventListener("click", () => {
  overlay.classList.add("hidden");
});

deviceAdd.addEventListener("click", () => {
  devices.push({ id: "", name: "", baseUrl: "" });
  renderDeviceForm();
});

deviceSave.addEventListener("click", async () => {
  await window.desktopApi.writeEnv(devices);
  overlay.classList.add("hidden");
  renderDeviceList();
});

setInterval(refreshLogs, 1500);
refreshLogs();
refreshStatus();
loadDevices();
