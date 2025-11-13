document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const tabKey = `tab_${tab.id}`;

    const updateButtonText = (isEnabled) => {
      const toggleButton = document.getElementById("toggle-monitoring");
      const btnText = toggleButton.querySelector(".btn-text");
      const btnIcon = toggleButton.querySelector(".btn-icon");

      if (btnText) {
        btnText.textContent = isEnabled
          ? "Stop Monitoring"
          : "Start Monitoring";
      }

      if (btnIcon) {
        btnIcon.textContent = isEnabled ? "⏹️" : "▶️";
      }

      // Klasy zamiast inline style'ów dla nowego designu
      if (isEnabled) {
        toggleButton.classList.add("active");
      } else {
        toggleButton.classList.remove("active");
      }
    };

    chrome.storage.local.get([tabKey], (result) => {
      const isEnabled = result[tabKey]?.enabled || false;
      const size = result[tabKey]?.size || "";
      updateButtonText(isEnabled);
      document.getElementById("size-input").value = size;
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes[tabKey]) {
        updateButtonText(changes[tabKey].newValue.enabled);
      }
    });

    const toggleButton = document.getElementById("toggle-monitoring");

    toggleButton.addEventListener("click", () => {
      const currentUrl = tab.url;

      if (!currentUrl.includes("zalando-lounge.pl")) {
        alert("Rozszerzenie działa tylko na zalando-lounge.pl");
        return;
      }

      chrome.storage.local.get([tabKey], (result) => {
        const isEnabled = result[tabKey]?.enabled || false;
        const newSize = document.getElementById("size-input").value.trim();

        if (!newSize || !/^[a-zA-Z0-9.]+$/.test(newSize)) {
          alert("Wprowadź prawidłowy rozmiar.");
          return;
        }

        const newValue = { enabled: !isEnabled, size: newSize };
        chrome.storage.local.set({ [tabKey]: newValue }, () => {
          updateButtonText(!isEnabled);
          // Animacja kliknięcia
          toggleButton.style.transform = "scale(0.95)";
          setTimeout(() => {
            toggleButton.style.transform = "scale(1)";
          }, 100);
        });
      });
    });

    chrome.storage.local.get(
      ["refreshRate", "soundUrl", "soldOutRefresh"],
      (result) => {
        const refreshRate = result.refreshRate || 2;
        const soundUrl = result.soundUrl || "https://i.nuuls.com/cN7Pk.mp3";
        const soldOutRefresh = result.soldOutRefresh ?? false;

        document.getElementById("refreshRate").value = refreshRate;
        document.getElementById("soundUrl").value = soundUrl;
        document.getElementById("soldOutRefresh1").checked = soldOutRefresh;
      }
    );
  });

  const manifestUrl =
    "https://raw.githubusercontent.com/adrianjankowicz/zalando-lounge-refresher/main/manifest.json";

  chrome.runtime.getManifest().version;

  fetch(manifestUrl)
    .then((response) => response.json())
    .then((remoteManifest) => {
      const localVersion = chrome.runtime.getManifest().version;
      const remoteVersion = remoteManifest.version;

      if (localVersion !== remoteVersion) {
        document.getElementById("update-container").style.display = "block";
        document.getElementById(
          "update-link"
        ).href = `https://github.com/adrianjankowicz/zalando-lounge-refresher`;
      }
    })
    .catch((err) => console.error("Error checking for updates:", err));
});

// document.getElementById('saveSettings').addEventListener('click', () => {
//   const refreshRate = document.getElementById('refreshRate').value;
//   const soundUrl = document.getElementById('soundUrl').value;
//   chrome.storage.local.set({ refreshRate: refreshRate, soundUrl: soundUrl });
// });

const modal = document.getElementById("settingsModal");
const showSettingsBtn = document.getElementById("showSettings");
const closeBtn = document.querySelector(".close-btn");
const modalOverlay = document.querySelector(".modal-overlay");

// Otwieranie ustawień
showSettingsBtn.addEventListener("click", () => {
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
});

// Zamykanie ustawień - kliknięcie X
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
  document.body.style.overflow = "auto";
});

// Zamykanie ustawień - kliknięcie poza modal'em
modalOverlay.addEventListener("click", () => {
  modal.style.display = "none";
  document.body.style.overflow = "auto";
});

// Zamykanie ustawień - klawisz ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.style.display === "block") {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }
});

document.getElementById("saveSettings").addEventListener("click", () => {
  const refreshRate = document.getElementById("refreshRate").value;
  const soundUrl = document.getElementById("soundUrl").value;
  const soldOutRefresh = document.getElementById("soldOutRefresh1").checked;

  chrome.storage.local.set(
    {
      refreshRate: refreshRate,
      soundUrl: soundUrl,
      soldOutRefresh: soldOutRefresh,
    },
    () => {
      modal.style.display = "none";
    }
  );
});
