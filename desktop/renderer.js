const statusBadge = (element, running, pid) => {
  element.classList.toggle("running", running);
  element.classList.toggle("stopped", !running);
  element.textContent = running ? `Running (PID ${pid})` : "Stopped";
};

const logOutput = document.getElementById("log-output");
const deviceTable = document.getElementById("device-table");
const envPath = document.getElementById("env-path");
const deviceMessage = document.getElementById("device-message");

const state = {
  devices: [],
};

const renderDevices = () => {
  deviceTable.innerHTML = "";
  state.devices.forEach((device, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input data-field="id" data-index="${index}" value="${device.id ?? ""}" /></td>
      <td><input data-field="name" data-index="${index}" value="${device.name ?? ""}" /></td>
      <td><input data-field="baseUrl" data-index="${index}" value="${device.baseUrl ?? ""}" /></td>
      <td><button class="danger" data-remove="${index}">Entfernen</button></td>
    `;
    deviceTable.appendChild(row);
  });
};

const syncDeviceState = () => {
  document.querySelectorAll("input[data-field]").forEach((input) => {
    const index = Number(input.dataset.index);
    const field = input.dataset.field;
    state.devices[index][field] = input.value;
  });
};

const addDeviceRow = () => {
  state.devices.push({ id: "", name: "", baseUrl: "" });
  renderDevices();
};

const loadDevices = async () => {
  const result = await window.shellyDesktop.loadDevices();
  if (result.ok) {
    state.devices = result.devices.length ? result.devices : [{ id: "", name: "", baseUrl: "" }];
    deviceMessage.textContent = result.exists
      ? ""
      : "Hinweis: .env wurde noch nicht gefunden und wird beim Speichern erstellt.";
  } else {
    state.devices = [{ id: "", name: "", baseUrl: "" }];
    deviceMessage.textContent = `Fehler beim Parsen: ${result.error}`;
  }
  envPath.textContent = `Backend .env: ${result.envPath}`;
  renderDevices();
};

const saveDevices = async () => {
  syncDeviceState();
  const filtered = state.devices.filter((device) => device.id || device.name || device.baseUrl);
  const result = await window.shellyDesktop.saveDevices(filtered);
  deviceMessage.textContent = result.ok
    ? "Geräte gespeichert. Bitte Backend neu starten, um Änderungen zu laden."
    : `Speichern fehlgeschlagen: ${result.error}`;
};

const appendLog = ({ service, message, timestamp }) => {
  const line = document.createElement("div");
  line.textContent = `[${timestamp}] ${service}: ${message.trimEnd()}`;
  logOutput.appendChild(line);
  logOutput.scrollTop = logOutput.scrollHeight;
};

const updateStatus = (status) => {
  statusBadge(
    document.getElementById("backend-status"),
    status.backend.running,
    status.backend.pid,
  );
  statusBadge(
    document.getElementById("frontend-status"),
    status.frontend.running,
    status.frontend.pid,
  );

  document.getElementById("backend-start").disabled = status.backend.running;
  document.getElementById("backend-stop").disabled = !status.backend.running;
  document.getElementById("frontend-start").disabled = status.frontend.running;
  document.getElementById("frontend-stop").disabled = !status.frontend.running;
};

window.shellyDesktop.onStatus(updateStatus);
window.shellyDesktop.onLog(appendLog);

window.shellyDesktop.getStatus().then(updateStatus);
loadDevices();

logOutput.textContent = "Logs werden hier angezeigt.";

logOutput.addEventListener("click", () => {
  logOutput.textContent = "";
});

window.addEventListener("click", (event) => {
  const removeIndex = event.target.dataset.remove;
  if (removeIndex !== undefined) {
    state.devices.splice(Number(removeIndex), 1);
    renderDevices();
  }
});

window.addEventListener("input", (event) => {
  if (event.target.matches("input[data-field]")) {
    const index = Number(event.target.dataset.index);
    const field = event.target.dataset.field;
    state.devices[index][field] = event.target.value;
  }
});

document.getElementById("add-device").addEventListener("click", addDeviceRow);
document.getElementById("save-devices").addEventListener("click", saveDevices);

document.getElementById("backend-start").addEventListener("click", () => {
  window.shellyDesktop.startService("backend");
});

document.getElementById("backend-stop").addEventListener("click", () => {
  window.shellyDesktop.stopService("backend");
});

document.getElementById("frontend-start").addEventListener("click", () => {
  window.shellyDesktop.startService("frontend");
});

document.getElementById("frontend-stop").addEventListener("click", () => {
  window.shellyDesktop.stopService("frontend");
});
