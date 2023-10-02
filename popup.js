document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    const tabKey = `tab_${tab.id}`;

    const updateButtonText = isEnabled => {
      const toggleButton = document.getElementById('toggle-monitoring');

      toggleButton.textContent = isEnabled
        ? 'Stop Monitoring'
        : 'Start Monitoring';

      if (isEnabled) {
        toggleButton.style.boxShadow = 'inset 200px 0 0 0 #54b3d6';
        toggleButton.style.color = 'white';
      } else {
        toggleButton.style.boxShadow = 'inset 0 0 0 0 #54b3d6';
        toggleButton.style.color = '#54b3d6';
      }
    };

    chrome.storage.local.get([tabKey], result => {
      const isEnabled = result[tabKey]?.enabled || false;
      const size = result[tabKey]?.size || '';
      updateButtonText(isEnabled);
      document.getElementById('size-input').value = size;
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[tabKey]) {
        updateButtonText(changes[tabKey].newValue.enabled);
      }
    });

    document
      .getElementById('toggle-monitoring')
      .addEventListener('click', () => {
        const currentUrl = tab.url;

        if (!currentUrl.includes('zalando-lounge.pl')) {
          alert('Rozszerzenie działa tylko na zalando-lounge.pl');
          return;
        }

        chrome.storage.local.get([tabKey], result => {
          const isEnabled = result[tabKey]?.enabled || false;
          const newSize = document.getElementById('size-input').value.trim();

          if (!newSize || !/^[a-zA-Z0-9]+$/.test(newSize)) {
            alert('Wprowadź prawidłowy rozmiar.');
            return;
          }

          const newValue = { enabled: !isEnabled, size: newSize };
          chrome.storage.local.set({ [tabKey]: newValue }, () => {
            updateButtonText(!isEnabled);
          });
        });
      });

    chrome.storage.local.get(['refreshRate', 'soundUrl'], result => {
      const refreshRate = result.refreshRate || 2;
      const soundUrl = result.soundUrl || 'https://i.nuuls.com/cN7Pk.mp3';

      document.getElementById('refreshRate').value = refreshRate;
      document.getElementById('soundUrl').value = soundUrl;
    });
  });
  // URL do pliku manifestu na GitHubie.
  const manifestUrl =
    'https://raw.githubusercontent.com/adrianjankowicz/zalando-lounge-refresher/main/manifest.json';

  // Pobierz lokalną wersję manifestu.
  chrome.runtime.getManifest().version;

  // Pobierz zdalny manifest i porównaj wersje.
  fetch(manifestUrl)
    .then(response => response.json())
    .then(remoteManifest => {
      const localVersion = chrome.runtime.getManifest().version;
      const remoteVersion = remoteManifest.version;

      if (localVersion !== remoteVersion) {
        // Jeśli wersje są różne, wyświetl komunikat o aktualizacji.
        document.getElementById('update-container').style.display = 'block';
        document.getElementById(
          'update-link'
        ).href = `https://github.com/adrianjankowicz/zalando-lounge-refresher/releases/tag/${remoteVersion}`;
      }
    })
    .catch(err => console.error('Error checking for updates:', err));
});

document.getElementById('saveSettings').addEventListener('click', () => {
  const refreshRate = document.getElementById('refreshRate').value;
  const soundUrl = document.getElementById('soundUrl').value;
  chrome.storage.local.set({ refreshRate: refreshRate, soundUrl: soundUrl });
});

// Get the modal
const modal = document.getElementById('settingsModal');

// Get the button that opens the modal
const btn = document.getElementById('showSettings');

// Get the <span> element that closes the modal
const span = document.getElementsByClassName('close')[0];

// When the user clicks the button, open the modal
btn.onclick = function () {
  modal.style.display = 'block';
};

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = 'none';
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

// Save settings and close modal when save button is clicked
document.getElementById('saveSettings').addEventListener('click', () => {
  const refreshRate = document.getElementById('refreshRate').value;
  const soundUrl = document.getElementById('soundUrl').value;
  chrome.storage.local.set(
    { refreshRate: refreshRate, soundUrl: soundUrl },
    () => {
      modal.style.display = 'none';
    }
  );
});
