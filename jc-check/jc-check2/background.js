// Map der Benutzer, die bereits benachrichtigt wurden, mit Zeitstempeln
let notifiedUsers = new Map();
let todayTotal = 0;
let popupOpen = false;
// How long should a user be considered "known" (in hours)?
// This value can be configured via the options page (scanMemoryHours).
let memoryIntervalHours = 12;

// ========================
// Hilfsfunktionen
// ========================
function getNow() { return Date.now(); }

function getTimestamp() {
  const d = new Date();
  const pad = n => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function safeBroadcast(msg) {
  if (!chrome.runtime?.id) return;
  try {
    chrome.runtime.sendMessage(msg, () => {
      if (chrome.runtime.lastError) {
        console.warn("Kein aktiver Listener:", chrome.runtime.lastError.message);
      }
    });
  } catch (err) {
    console.warn("SendMessage Exception:", err.message);
  }
}

// ========================
// Popup-Status
// ========================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "popupOpened":
      popupOpen = true;
      sendResponse({ status: "ok" });
      return true;

    case "popupClosed":
      popupOpen = false;
      sendResponse({ status: "ok" });
      return true;

    case "newEntries":
      if (Array.isArray(request.data)) {
        handleNewEntries(request.data);
      }
      return true;

    case "resetMemory":
      resetMemory();
      // Respond with a German message so that the popup shows German text
      sendResponse({ message: "Der Speicher wurde zurückgesetzt." });
      return true;
  }
});

// ========================
// Speicher laden & resetten
// ========================
chrome.storage.local.get(["notifiedUsers", "todayTotal", "scanMemoryHours"], data => {
  if (data.notifiedUsers) {
    notifiedUsers = new Map(Object.entries(data.notifiedUsers));
  }
  if (typeof data.todayTotal === "number") todayTotal = data.todayTotal;
  if (typeof data.scanMemoryHours === "number") memoryIntervalHours = data.scanMemoryHours;
  console.log("Background: Geladene Daten", Object.fromEntries(notifiedUsers), todayTotal, memoryIntervalHours);
});

function resetMemory() {
  notifiedUsers.clear();
  todayTotal = 0;
  chrome.storage.local.clear(() => {
    // Send a notification to inform the user that the storage was reset.
    // The title and message use German characters and must be saved in UTF‑8.
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Speicher zurückgesetzt",
      message: "Alle gespeicherten Daten wurden gelöscht."
    });
  });
}

// ========================
// Processing new entries
// ========================
function handleNewEntries(entries) {
  const now = getNow();
  const memoryMs = memoryIntervalHours * 60 * 60 * 1000;
  let newCount   = 0;
  let knownCount = 0;
  const newLines = [];

  entries.forEach(({ user, headline }) => {
    const lastTime = notifiedUsers.get(user) || 0;
    if (now - lastTime > memoryMs) {
      notifiedUsers.set(user, now);
      todayTotal++;
      newCount++;
      newLines.push(`${new Date().toLocaleString()} | ${user} | ${headline}`);
    } else {
      knownCount++;
    }
  });

  const totalEntries = entries.length;

  // Persist current data
  chrome.storage.local.set({
    notifiedUsers: Object.fromEntries(notifiedUsers),
    todayTotal,
    lastEntries: entries,
    lastScanTime: now
  });

  // Update popup live
  if (popupOpen) {
    safeBroadcast({ action: "updatePopup", data: entries });
  }

  const message = totalEntries === 0
    ? "Keine Einträge gefunden."
    : `Insgesamt ${totalEntries} Einträge geprüft.\n${knownCount} bereits bekannt.\n${newCount} neu.`;

  // Create a banner notification using German text. The file must be saved in UTF‑8.
  chrome.notifications.create({
    type:  "basic",
    iconUrl: "icon.png",
    title: newCount > 0 ? "Neue Einträge!" : "Keine neuen Einträge",
    message
  });

  // Automatically download the list as a text file when there are new entries
  if (newCount > 0) {
    const textContent = newLines.join("\n");
    const base64     = btoa(unescape(encodeURIComponent(textContent)));
    const dataUrl    = `data:text/plain;base64,${base64}`;
    const timestamp  = getTimestamp();
    chrome.downloads.download({
      url: dataUrl,
      filename: `jcheck_${timestamp}.txt`,
      conflictAction: "uniquify"
    });
  }
}

// ========================
// Monitor settings
// ========================
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.scanMemoryHours) {
    const val = parseInt(changes.scanMemoryHours.newValue, 10);
    if (!isNaN(val) && val > 0) {
      memoryIntervalHours = val;
      console.log("Background: update memoryIntervalHours to", val);
    }
  }
});
