// content.js
// This file contains the main logic on the monitored page and reports new entries
// to the background script. Settings and lists are loaded from local storage.

// ========================
// Global variables
// ========================

// Set of banned users for fast lookups
let bannedUsers = new Set();
// Allowed types (e.g. "Date", "Event-Date"), also stored as a Set
let allowedTypes = new Set();

// Scan interval in milliseconds (configurable via the options page)
let scanIntervalMin = 60 * 1000; // Default: 60 seconds
let scanIntervalMax = 120 * 1000; // Default: 120 seconds

// Timer to schedule the next scan
let scanTimeout;
// Timeout for throttling the DOM observer
let domThrottleTimeout;
// Last time manual scrolling triggered a scan
let lastScrollCheck = 0;

// MutationObserver to monitor dynamic DOM changes
let observer;

// ========================
// Helper functions
// ========================

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logDebug(message) {
  console.debug("[JCPa Debug]", message);
}

// Safe message sending to the background script
function safeSendMessage(msg) {
  if (!chrome.runtime || !chrome.runtime.id) {
    logDebug("Background not reachable - message discarded");
    return;
  }
  try {
    chrome.runtime.sendMessage(msg, () => {
      if (chrome.runtime.lastError) {
        logDebug("SendMessage hint: " + chrome.runtime.lastError.message);
      }
    });
  } catch (err) {
    logDebug("Extension context invalidated: " + err.message);
  }
}

// Load the current configuration from storage.
// If no data exists, the banList will be loaded from the file banlist.txt as a fallback and stored.
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([
      "bannedUsers",
      "allowedTypes",
      "scanIntervalMin",
      "scanIntervalMax"
    ], async (data) => {
      // Banned users
      if (Array.isArray(data.bannedUsers) && data.bannedUsers.length > 0) {
        bannedUsers = new Set(data.bannedUsers);
      } else {
        // Fallback: read banlist.txt if no list exists yet
        try {
          const response = await fetch(chrome.runtime.getURL("banlist.txt"));
          const text     = await response.text();
          const initialList = text
            .split(/\r?\n/)
            .map(name => name.trim())
            .filter(Boolean);
          bannedUsers = new Set(initialList);
          chrome.storage.local.set({ bannedUsers: initialList });
        } catch (err) {
          logDebug("Could not load banlist.txt: " + err.message);
          bannedUsers = new Set();
        }
      }

      // Allowed types
      if (Array.isArray(data.allowedTypes) && data.allowedTypes.length > 0) {
        allowedTypes = new Set(data.allowedTypes.map(t => t.trim()).filter(Boolean));
      } else {
        allowedTypes = new Set(["Date", "Event-Date"]);
      }

      // Scan intervals
      const min = parseInt(data.scanIntervalMin, 10);
      const max = parseInt(data.scanIntervalMax, 10);
      scanIntervalMin = !isNaN(min) && min >= 10 ? min * 1 : 60 * 1000;
      scanIntervalMax = !isNaN(max) && max >= 10 ? max * 1 : 120 * 1000;
      if (scanIntervalMin < 1000) scanIntervalMin *= 1000;
      if (scanIntervalMax < 1000) scanIntervalMax *= 1000;

      resolve();
    });
  });
}

// Remove duplicate entries by username.
function uniqueByUser(entries) {
  const seen   = new Set();
  const result = [];
  for (const entry of entries) {
    if (!seen.has(entry.user)) {
      seen.add(entry.user);
      result.push(entry);
    }
  }
  return result;
}

// Scroll down to load the page fully until no new content is loaded.
async function deepScrollUntilEnd() {
  // Start by scrolling briefly to the top. Some sites only load new cards
  // when the user scrolls up before going down again.
  window.scrollTo(0, 0);
  await sleep(200);
  let lastHeight      = 0;
  let sameHeightCount = 0;
  while (true) {
    const currentHeight = document.body.scrollHeight;
    if (currentHeight === lastHeight) {
      sameHeightCount++;
    } else {
      sameHeightCount = 0;
      lastHeight      = currentHeight;
    }
    if (sameHeightCount >= 3) break;
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(randomInt(300, 600));
  }
}

// Check the DOM for new entries and send them to the background script.
async function checkNewEntries() {
  try {
    logDebug("Start scanning for new entries...");

    await deepScrollUntilEnd();

    const badges = Array.from(document.querySelectorAll(
      ".badge-ui.dates-partys-is-new, .badge-ui.is-new, .dates-partys-is-new"
    ));
    logDebug("Found badges: " + badges.length);

    const cards = [...new Set(
      badges.map(b => b.closest(".card-list-ui-list-item") || b.closest("div"))
    )].filter(Boolean);
    logDebug("Unique cards: " + cards.length);

    const entries = cards.map(card => {
      const typeBadge = Array.from(card.querySelectorAll(".badge-ui.dates-partys-type"))
        .find(el => allowedTypes.has(el.innerText.trim()));
      const typeText = typeBadge ? typeBadge.innerText.trim() : "Unknown";
      if (!allowedTypes.has(typeText)) return null;

      const user = card.querySelector(".event-card-clubname.ellipsis")?.innerText.trim();
      const link = card.querySelector(".link_dating_profile")?.href ||
                   card.querySelector(".card-ui-link")?.href || "";
      if (!user || bannedUsers.has(user)) return null;
      return { user, headline: typeText, url: link };
    }).filter(Boolean);

    const uniqueEntries = uniqueByUser(entries);
    logDebug("Final list: " + uniqueEntries.length + " unique entries");
    if (uniqueEntries.length > 0) {
      safeSendMessage({ action: "newEntries", data: uniqueEntries });
    }
  } catch (err) {
    console.error("Error while scanning:", err);
  }
}

// Schedule the next scan according to the configured intervals
function scheduleNextScan() {
  if (scanTimeout) clearTimeout(scanTimeout);
  checkNewEntries();
  const nextInterval = randomInt(scanIntervalMin, scanIntervalMax);
  logDebug("Next scan in " + (nextInterval / 1000).toFixed(0) + " seconds...");
  scanTimeout = setTimeout(scheduleNextScan, nextInterval);
}

// Handler for DOM mutations – triggered by the MutationObserver
function handleDomMutations() {
  if (!domThrottleTimeout) {
    domThrottleTimeout = setTimeout(() => {
      checkNewEntries();
      domThrottleTimeout = null;
    }, 3000);
  }
}

// Set up MutationObserver and event listeners
function initObservers() {
  observer = new MutationObserver(handleDomMutations);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("scroll", () => {
    const now = Date.now();
    if (now - lastScrollCheck > 5000) {
      lastScrollCheck = now;
      logDebug("Manual scroll detected -> trigger scan");
      handleDomMutations();
    }
  });
}

// Listen for changes to the stored settings and update variables at runtime.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.bannedUsers) {
    const list = changes.bannedUsers.newValue || [];
    bannedUsers = new Set(Array.isArray(list) ? list : []);
    logDebug("Updated ban list: " + Array.from(bannedUsers).join(", "));
  }
  if (changes.allowedTypes) {
    const list = changes.allowedTypes.newValue || [];
    allowedTypes = new Set(Array.isArray(list) ? list.map(t => t.trim()).filter(Boolean) : []);
    logDebug("Updated allowed types: " + Array.from(allowedTypes).join(", "));
  }
  if (changes.scanIntervalMin || changes.scanIntervalMax) {
    if (changes.scanIntervalMin) {
      const val = parseInt(changes.scanIntervalMin.newValue, 10);
      scanIntervalMin = (!isNaN(val) && val >= 10 ? val : 60) * (val < 1000 ? 1000 : 1);
    }
    if (changes.scanIntervalMax) {
      const val = parseInt(changes.scanIntervalMax.newValue, 10);
      scanIntervalMax = (!isNaN(val) && val >= 10 ? val : 120) * (val < 1000 ? 1000 : 1);
    }
    scheduleNextScan();
  }
});

// Initialization: load settings, start the observers and schedule the first scan
loadSettings().then(() => {
  initObservers();
  scheduleNextScan();
});
