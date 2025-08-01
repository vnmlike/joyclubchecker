document.addEventListener("DOMContentLoaded", () => {
  const entriesDiv = document.getElementById("entries");
  const resetBtn = document.getElementById("resetBtn");
  const clearListBtn = document.getElementById("clearListBtn");

  // -------------------------
  // Reset-Button
  // -------------------------
  resetBtn?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "resetMemory" }, (response) => {
      alert(response.message);
      entriesDiv.textContent = "Speicher zurückgesetzt.";
    });
  });

  // -------------------------
  // Liste leeren
  // -------------------------
  clearListBtn?.addEventListener("click", () => {
    chrome.storage.local.set({ lastEntries: [] }, () => {
      entriesDiv.textContent = "Liste geleert.";
    });
  });

  // -------------------------
  // Letzte Einträge laden
  // -------------------------
  chrome.storage.local.get(["lastEntries"], ({ lastEntries }) => {
    renderEntries(lastEntries || []);
  });

  // -------------------------
  // Live-Update vom Background
  // -------------------------
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "updatePopup" && Array.isArray(request.data)) {
      renderEntries(request.data);
    }
  });

  // -------------------------
  // Einträge im Popup anzeigen
  // -------------------------
  function renderEntries(entries) {
    entriesDiv.innerHTML = "";
    if (!entries || entries.length === 0) {
      entriesDiv.textContent = "Keine neuen Einträge.";
      return;
    }

    entries.forEach(({ user, headline, url }) => {
      const div = document.createElement("div");
      div.className = "entry";
      div.style.marginBottom = "8px";

      const link = document.createElement("a");
      link.href = "#";
      link.textContent = `${user} (${headline})`;
      link.style.color = "#0066ff";
      link.style.textDecoration = "none";
      link.style.cursor = "pointer";

      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (url) chrome.tabs.create({ url, active: true });
      });

      link.addEventListener("mouseover", () => (link.style.textDecoration = "underline"));
      link.addEventListener("mouseout", () => (link.style.textDecoration = "none"));

      div.appendChild(link);
      entriesDiv.appendChild(div);
    });
  }
});
