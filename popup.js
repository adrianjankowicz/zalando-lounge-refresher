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

          if (!newSize || !/^[a-zA-Z0-9.]+$/.test(newSize)) {
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

  const manifestUrl =
    'https://raw.githubusercontent.com/adrianjankowicz/zalando-lounge-refresher/main/manifest.json';

  chrome.runtime.getManifest().version;

  fetch(manifestUrl)
    .then(response => response.json())
    .then(remoteManifest => {
      const localVersion = chrome.runtime.getManifest().version;
      const remoteVersion = remoteManifest.version;

      if (localVersion !== remoteVersion) {
        document.getElementById('update-container').style.display = 'block';
        document.getElementById(
          'update-link'
        ).href = `https://github.com/adrianjankowicz/zalando-lounge-refresher/releases`;
      }
    })
    .catch(err => console.error('Error checking for updates:', err));
});

document.getElementById('saveSettings').addEventListener('click', () => {
  const refreshRate = document.getElementById('refreshRate').value;
  const soundUrl = document.getElementById('soundUrl').value;
  chrome.storage.local.set({ refreshRate: refreshRate, soundUrl: soundUrl });
});

const modal = document.getElementById('settingsModal');

const btn = document.getElementById('showSettings');

const span = document.getElementsByClassName('close')[0];

btn.onclick = function () {
  modal.style.display = 'block';
};

span.onclick = function () {
  modal.style.display = 'none';
};

window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

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
