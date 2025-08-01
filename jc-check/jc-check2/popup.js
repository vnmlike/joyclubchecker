// popup.js
// Steuert die Anzeige und Interaktion im Popup der Erweiterung.

document.addEventListener("DOMContentLoaded", () => {
  const entriesDiv   = document.getElementById("entries");
  const resetBtn     = document.getElementById("resetBtn");
  const clearListBtn = document.getElementById("clearListBtn");
  const statsDiv     = document.getElementById("stats");
  const searchInput  = document.getElementById("search");

  // Current state of displayed entries
  let currentEntries = [];

  // Reset storage
  resetBtn?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "resetMemory" }, (response) => {
      alert(response.message);
      // Update the list with a German message after resetting the storage
      entriesDiv.textContent = "Speicher zurückgesetzt.";
      renderStats();
    });
  });

  // Clear the last entries list
  clearListBtn?.addEventListener("click", () => {
    chrome.storage.local.set({ lastEntries: [] }, () => {
      currentEntries = [];
      renderEntries(currentEntries);
    });
  });

  // Search: filter the currently loaded entries
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      renderEntries(currentEntries);
    } else {
      const filtered = currentEntries.filter(({ user, headline }) =>
        user.toLowerCase().includes(query) || headline.toLowerCase().includes(query)
      );
      renderEntries(filtered);
    }
  });

  // Load statistics from storage and display them
  function renderStats() {
    chrome.storage.local.get([
      "todayTotal",
      "bannedUsers",
      "lastEntries",
      "lastScanTime"
    ], (data) => {
      const totalToday   = data.todayTotal || 0;
      const bannedCount  = Array.isArray(data.bannedUsers) ? data.bannedUsers.length : 0;
      const entriesCount = Array.isArray(data.lastEntries) ? data.lastEntries.length : 0;
      let lastScanStr    = "-";
      if (typeof data.lastScanTime === "number") {
        const d = new Date(data.lastScanTime);
        lastScanStr = d.toLocaleString();
      }
      // Display statistics in German. Umlauts must be saved in UTF‑8.
      statsDiv.innerHTML =
        `<strong>Gefunden heute:</strong> ${totalToday}<br>` +
        `<strong>Aktuelle Liste:</strong> ${entriesCount}<br>` +
        `<strong>Gebannt:</strong> ${bannedCount}<br>` +
        `<strong>Letzter Scan:</strong> ${lastScanStr}`;
    });
  }

  // Render entries in the popup
  function renderEntries(entries) {
    entriesDiv.innerHTML = "";
    if (!entries || entries.length === 0) {
      // Inform the user in German when there are no new entries
      entriesDiv.textContent = "Keine neuen Einträge.";
      return;
    }
    entries.forEach(({ user, headline, url }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "entry";

      const link = document.createElement("a");
      link.href = "#";
      link.textContent = `${user} (${headline})`;
      link.className = "entry-link";
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (url) chrome.tabs.create({ url, active: true });
      });

      // Ban button
      const banBtn = document.createElement("button");
      banBtn.textContent = "Ban";
      banBtn.className  = "ban-btn";
      banBtn.title      = "Add user to ban list";
      banBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        addUserToBan(user);
      });

      wrapper.appendChild(link);
      wrapper.appendChild(banBtn);
      entriesDiv.appendChild(wrapper);
    });
  }

  // Add a user to the ban list and update the display
  function addUserToBan(user) {
    if (!user) return;
    chrome.storage.local.get({ bannedUsers: [] }, (data) => {
      const list = Array.isArray(data.bannedUsers) ? data.bannedUsers : [];
      if (!list.includes(user)) {
        list.push(user);
        chrome.storage.local.set({ bannedUsers: list }, () => {
          // Remove the user from the current list
          currentEntries = currentEntries.filter(entry => entry.user !== user);
          renderEntries(currentEntries);
          renderStats();
        });
      }
    });
  }

  // Initial: load last entries
  function loadInitialEntries() {
    chrome.storage.local.get(["lastEntries"], ({ lastEntries }) => {
      currentEntries = Array.isArray(lastEntries) ? lastEntries : [];
      renderEntries(currentEntries);
    });
    renderStats();
  }

  // Receive live updates from the background
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "updatePopup" && Array.isArray(request.data)) {
      currentEntries = request.data;
      // Respect the filter if the search field is used
      const query = searchInput.value.trim().toLowerCase();
      let displayEntries = currentEntries;
      if (query) {
        displayEntries = currentEntries.filter(({ user, headline }) =>
          user.toLowerCase().includes(query) || headline.toLowerCase().includes(query)
        );
      }
      renderEntries(displayEntries);
      renderStats();
    }
  });

  loadInitialEntries();
});
