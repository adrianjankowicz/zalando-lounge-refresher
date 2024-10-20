function checkAndReload(size, tabKey) {
  const soundUrl = 'https://i.nuuls.com/cN7Pk.mp3';

  function playSound(url) {
    const audio = new Audio(url);
    audio.play().catch(error => console.error('Play sound error:', error));
  }

  let availableButtons = document.querySelectorAll(
    '.ArticleSizeButton-sc-1n1fwgw-0:not([disabled])'
  );

  for (let button of availableButtons) {
    let sizeSpan = button.querySelector(
      '.ArticleSizeItemTitle-sc-1n1fwgw-3'
    );

    if (sizeSpan && sizeSpan.textContent.trim() === size) {
      const tabId = parseInt(tabKey.replace('tab_', ''));
      
      // Ustawienie aria-checked na true
      button.setAttribute('aria-checked', 'true');
      
      chrome.storage.local.set({ [tabKey]: { enabled: false, size: size } });
      button.click();

      // Kliknij przycisk "Dodaj do koszyka" po wybraniu rozmiaru
      setTimeout(() => {
        let addToCartButton = document.querySelector(
          '.auto-tests-add-to-cart-button'
        );
        if (addToCartButton) {
          addToCartButton.click();
          chrome.runtime.sendMessage({ type: 'ITEM_ADDED_TO_CART' });
          playSound(soundUrl);
        } else {
          console.error('Add to cart button not found');
        }
      }, 500); // Dodaj krótki timeout, aby upewnić się, że rozmiar został wybrany

      return;
    }
  }

  // Przeładuj stronę, jeśli nie znaleziono odpowiedniego rozmiaru
  location.reload();
}

// Reszta kodu pozostaje bez zmian
chrome.alarms.onAlarm.addListener(alarm => {
  const tabId = parseInt(alarm.name.replace('tab_', ''));
  const tabKey = alarm.name;
  chrome.storage.local.get([tabKey], result => {
    if (result[tabKey]?.enabled) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: checkAndReload,
        args: [result[tabKey]?.size, tabKey],
      });
    }
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    Object.keys(changes).forEach(tabKey => {
      if (tabKey.startsWith('tab_')) {
        const tabId = parseInt(tabKey.replace('tab_', ''));
        chrome.storage.local.get('refreshRate', result => {
          const refreshRate = result.refreshRate || 2; 
          if (changes[tabKey]?.newValue?.enabled) {
            chrome.alarms.create(tabKey, { periodInMinutes: refreshRate / 60 });
            
            chrome.action.setBadgeBackgroundColor({
              color: '#FF0000',
              tabId: tabId,
            }); 
          } else {
            chrome.alarms.clear(tabKey);
          }
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ITEM_ADDED_TO_CART') {
    chrome.notifications.create('itemAdded', {
      type: 'basic',
      iconUrl: 'images/64.png',
      title: 'Item Added to Cart',
      message: 'Your desired item has been added to the cart.',
    });
  }
});
