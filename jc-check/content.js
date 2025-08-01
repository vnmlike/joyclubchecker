let bannedUsers = [];
let scanTimeout;

// ========================
// Ban-Liste laden
// ========================
fetch(chrome.runtime.getURL('banlist.txt'))
  .then(response => response.text())
  .then(text => {
    bannedUsers = text.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
    console.log("Ban-Liste geladen:", bannedUsers);
    setTimeout(scheduleNextScan, randomInt(2000, 5000)); // schneller Start
  });

// ========================
// Hilfsfunktionen
// ========================
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logDebug(message) {
  console.log("[JCPa Debug]", message);
}

// ========================
// Sichere Nachrichtensendung (Fehlerfrei)
// ========================
function safeSendMessage(msg) {
  if (!chrome.runtime || !chrome.runtime.id) {
    logDebug("Background nicht erreichbar – Nachricht verworfen");
    return;
  }
  try {
    // Keine Antwort erwartet
    chrome.runtime.sendMessage(msg, () => {
      // Falls ein lastError existiert → nur loggen, kein Fehler werfen
      if (chrome.runtime.lastError) {
        logDebug("SendMessage Hinweis: " + chrome.runtime.lastError.message);
      }
    });
  } catch (err) {
    logDebug("Extension context invalidated: " + err.message);
  }
}

// ========================
// Automatisches Scrollen mit Hoch/Runter
// ========================
async function deepScrollUntilEnd() {
  let lastHeight = 0;
  let sameHeightCount = 0;

  while (true) {
    const currentHeight = document.body.scrollHeight;

    if (currentHeight === lastHeight) {
      sameHeightCount++;
    } else {
      sameHeightCount = 0;
      lastHeight = currentHeight;
    }

    // 3x keine Änderung → Ende erreicht
    if (sameHeightCount >= 3) break;

    // Nach unten scrollen
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(randomInt(400, 900));

    // Kurz wieder nach oben scrollen, halbe Bildschirmhöhe
    window.scrollBy(0, -window.innerHeight / 2);
    await sleep(randomInt(300, 700));
  }
}

// ========================
// Hauptscan
// ========================
async function checkNewEntries() {
  try {
    logDebug("Starte Suche nach neuen Einträgen...");
    await deepScrollUntilEnd();

    const badges = Array.from(document.querySelectorAll(
      ".badge-ui.dates-partys-is-new, .badge-ui.is-new, .dates-partys-is-new"
    ));
    logDebug(`Gefundene Badges: ${badges.length}`);

    const cards = [...new Set(
      badges.map(b => b.closest(".card-list-ui-list-item") || b.closest("div"))
    )].filter(Boolean);

    logDebug(`Eindeutige Karten: ${cards.length}`);

    const allowedTypes = ["Date", "Event-Date"];
    const entries = cards.map((card) => {
      const typeBadge = Array.from(card.querySelectorAll(".badge-ui.dates-partys-type"))
        .find(el => allowedTypes.includes(el.innerText.trim()));
      const typeText = typeBadge?.innerText.trim() || "Unbekannt";

      if (!allowedTypes.includes(typeText)) return null;

      const user = card.querySelector(".event-card-clubname.ellipsis")?.innerText.trim();
      const profileLink = card.querySelector(".link_dating_profile")?.href
        || card.querySelector(".card-ui-link")?.href
        || "";

      if (!user || bannedUsers.includes(user)) return null;

      return { user, headline: typeText, url: profileLink };
    }).filter(Boolean);

    // Doppelte entfernen
    const uniqueEntries = [];
    const seen = new Set();
    for (const entry of entries) {
      if (!seen.has(entry.user)) {
        seen.add(entry.user);
        uniqueEntries.push(entry);
      }
    }

    logDebug(`Fertige Liste: ${uniqueEntries.length} eindeutige Einträge`);
    if (uniqueEntries.length > 0) {
      safeSendMessage({ action: "newEntries", data: uniqueEntries });
    }

  } catch (err) {
    console.error("Fehler beim Scan:", err);
  }
}

// ========================
// Scheduling
// ========================
function scheduleNextScan() {
  checkNewEntries();
  const nextInterval = randomInt(60000, 120000);
  logDebug(`Nächster Scan in ${(nextInterval / 1000).toFixed(0)} Sekunden...`);
  scanTimeout = setTimeout(scheduleNextScan, nextInterval);
}

// ========================
// Manuellen Scroll überwachen
// ========================
let lastScrollCheck = 0;
window.addEventListener("scroll", () => {
  const now = Date.now();
  if (now - lastScrollCheck > 5000) { // alle 5 Sekunden auf manuelles Scrollen reagieren
    lastScrollCheck = now;
    logDebug("Manuelles Scrollen erkannt → Trigger Scan");
    checkNewEntries();
  }
});
