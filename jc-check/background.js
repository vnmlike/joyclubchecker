let notifiedUsers = {};
let todayTotal = 0;
let popupOpen = false;

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
      sendResponse({ message: "Speicher wurde zurückgesetzt." });
      return true;
  }
});

// ========================
// Speicher laden & resetten
// ========================
chrome.storage.local.get(["notifiedUsers", "todayTotal"], data => {
  if (data.notifiedUsers) notifiedUsers = data.notifiedUsers;
  if (data.todayTotal) todayTotal = data.todayTotal;
  console.log("Background: Geladene Daten", notifiedUsers, todayTotal);
});

function resetMemory() {
  notifiedUsers = {};
  todayTotal = 0;
  chrome.storage.local.clear(() => {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Store: Speicher zurückgesetzt",
      message: "Alle gespeicherten Daten wurden gelöscht."
    });
  });
}

// ========================
// Verarbeitung neuer Einträge
// ========================
function handleNewEntries(entries) {
  const now = getNow();
  const twelveHours = 12 * 60 * 60 * 1000;
  let newCount = 0;
  let knownCount = 0;
  let newLines = [];

  entries.forEach(({ user, headline }) => {
    const lastTime = notifiedUsers[user] || 0;
    if (now - lastTime > twelveHours) {
      notifiedUsers[user] = now;
      todayTotal++;
      newCount++;
      newLines.push(`${new Date().toLocaleString()} | ${user} | ${headline}`);
    } else {
      knownCount++;
    }
  });

  const totalEntries = entries.length;

  chrome.storage.local.set({ 
    notifiedUsers, 
    todayTotal, 
    lastEntries: entries
  });

  if (popupOpen) {
    safeBroadcast({ action: "updatePopup", data: entries });
  }

  const message = totalEntries === 0
    ? "Es wurden keine Einträge gefunden."
    : `Insgesamt ${totalEntries} Einträge geprüft.\n${knownCount} bereits bekannt.\n${newCount} neu.`;

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: newCount > 0 ? "Store: Neue Einträge!" : "Store: Keine neuen Einträge",
    message: message
  });

  if (newCount > 0) {
    const textContent = newLines.join("\n");
    const base64 = btoa(unescape(encodeURIComponent(textContent)));
    const dataUrl = `data:text/plain;base64,${base64}`;
    const timestamp = getTimestamp();

    chrome.downloads.download({
      url: dataUrl,
      filename: `jcheck_${timestamp}.txt`,
      conflictAction: "uniquify"
    });
  }
}
