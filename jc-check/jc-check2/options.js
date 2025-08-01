// options.js
// Lädt gespeicherte Einstellungen und ermöglicht das Speichern neuer Werte.

document.addEventListener("DOMContentLoaded", () => {
  // Defaultwerte, falls noch keine Konfiguration gespeichert wurde.
  const defaultConfig = {
    scanIntervalMin: 60,   // Sekunden
    scanIntervalMax: 120,  // Sekunden
    allowedTypes: ["Date", "Event-Date"],
    bannedUsers: [],
    scanMemoryHours: 12
  };

  const intervalMinInput  = document.getElementById("intervalMin");
  const intervalMaxInput  = document.getElementById("intervalMax");
  const allowedTypesInput = document.getElementById("allowedTypes");
  const banListTextarea   = document.getElementById("banlist");
  const memoryHoursInput  = document.getElementById("memoryHours");
  const saveButton        = document.getElementById("save");

  // Lädt aktuelle Einstellungen aus dem Speicher und füllt die Felder.
  chrome.storage.local.get(defaultConfig, (data) => {
    intervalMinInput.value   = data.scanIntervalMin;
    intervalMaxInput.value   = data.scanIntervalMax;
    allowedTypesInput.value  = Array.isArray(data.allowedTypes) ? data.allowedTypes.join(", ") : "";
    banListTextarea.value    = Array.isArray(data.bannedUsers) ? data.bannedUsers.join("\n") : "";
    if (typeof data.scanMemoryHours === "number") {
      memoryHoursInput.value = data.scanMemoryHours;
    } else {
      memoryHoursInput.value = 12;
    }
  });

  // Speichert die aktuellen Einstellungen.
  saveButton.addEventListener("click", () => {
    const minValue  = parseInt(intervalMinInput.value, 10);
    const maxValue  = parseInt(intervalMaxInput.value, 10);
    let allowedList = allowedTypesInput.value
      .split(/[,;]+/)
      .map(t => t.trim())
      .filter(Boolean);
    if (allowedList.length === 0) {
      allowedList = defaultConfig.allowedTypes;
    }
    const banned = banListTextarea.value
      .split(/\r?\n/)
      .map(n => n.trim())
      .filter(Boolean);
    const memoryHoursVal = parseInt(memoryHoursInput.value, 10);

    chrome.storage.local.set({
      scanIntervalMin: isNaN(minValue)  || minValue < 10  ? defaultConfig.scanIntervalMin : minValue,
      scanIntervalMax: isNaN(maxValue)  || maxValue < 10  ? defaultConfig.scanIntervalMax : maxValue,
      allowedTypes:    allowedList,
      bannedUsers:     banned,
      scanMemoryHours: isNaN(memoryHoursVal) || memoryHoursVal < 1 ? 12 : memoryHoursVal
    }, () => {
      alert("Einstellungen wurden gespeichert.");
    });
  });
});
