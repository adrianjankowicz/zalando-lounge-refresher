function checkAndReload(size, tabKey) {
  const defaultSoundUrl = "https://i.nuuls.com/cN7Pk.mp3";

  function playSound(url) {
    const audio = new Audio(url);
    audio.play().catch((error) => {
      console.error("Play sound error:", error);
      if (url !== defaultSoundUrl) {
        console.log("Playing default sound due to error");
        playSound(defaultSoundUrl);
      }
    });
  }

  let availableButtons = document.querySelectorAll(
    ".ArticleSizeToggle-sc-1n1fwgw-0:not([disabled])"
  );

  let disabledButtons = document.querySelectorAll(
    ".ArticleSizeToggle-sc-1n1fwgw-0[disabled]"
  );

  const sizeSectionButtons = document.querySelectorAll(
    ".ArticleSizeToggle-sc-1n1fwgw-0"
  );

  if (sizeSectionButtons && sizeSectionButtons.length === 0) {
    const addToCartButton = document.querySelector(".auto-tests-add-to-cart-button");
    if (addToCartButton && !addToCartButton.disabled) {
      chrome.storage.local.set({ [tabKey]: { enabled: false, size: size } });
      addToCartButton.click();
      chrome.runtime.sendMessage({ type: "ITEM_ADDED_TO_CART", size: size });
      chrome.storage.local.get(["soundUrl", "soldOutRefresh"], (result) => {
        const soundUrl = result.soundUrl || defaultSoundUrl;
        soldOutRefresh = result.soldOutRefresh;
        playSound(soundUrl);
      });
    } else {
      console.error("Add to cart button not found or is disabled. Refreshing");
      location.reload();
    }
    return; 
  }

  for (let button of disabledButtons) {
    let statusSpan = button.querySelector(".StyledText-sc-1ubo0hy.fdsvXs span, .StyledText-sc-1ubo0hy.hlyEpQ span");
    let sizeSpan = button.querySelector(".ArticleSizeItemTitle-sc-1n1fwgw-2");
    
    chrome.storage.local.get(["soldOutRefresh"], (result) => {
      soldOutRefresh = result.soldOutRefresh;
      console.log('sold', soldOutRefresh)
      
      if (!soldOutRefresh) {
        if (statusSpan && sizeSpan && sizeSpan.textContent.trim().toLowerCase() === size.toLowerCase() && statusSpan.textContent.trim() === "Wyprzedane") {
          chrome.runtime.sendMessage({ type: "SIZE_SOLD_OUT" });
          chrome.storage.local.set({ [tabKey]: { enabled: false, size: size } });
          alert(`Produkt w rozmiarze ${size.toString().toUpperCase()} został wyprzedany\nOdświeżanie zostało zatrzymane`);
          return;
        }
      }
    });
  }

  for (let button of availableButtons) {
    let sizeSpan = button.querySelector(".ArticleSizeItemTitle-sc-1n1fwgw-2");

    if (
      sizeSpan &&
      sizeSpan.textContent.trim().toLowerCase() === size.toLowerCase()
    ) {
      parseInt(tabKey.replace("tab_", ""));

      const radioInput = button.querySelector("input[type='radio']");
      if (radioInput) {
        radioInput.setAttribute("aria-checked", "true");
        radioInput.checked = true;
      }

      chrome.storage.local.set({ [tabKey]: { enabled: false, size: size } });
      
      const radioInput2 = button.querySelector("input[type='radio']");
      if (radioInput2) {
        radioInput2.click();
        radioInput2.dispatchEvent(new Event("change", { bubbles: true }));
      }

      setTimeout(() => {
        let addToCartButton = document.querySelector(
          ".auto-tests-add-to-cart-button"
        );
        if (addToCartButton) {
          addToCartButton.click();
          chrome.runtime.sendMessage({ type: "ITEM_ADDED_TO_CART", size: size });
          chrome.storage.local.get(["soundUrl"], (result) => {
            const soundUrl = result.soundUrl || defaultSoundUrl;
            playSound(soundUrl);
          });
        } else {
          console.error("Add to cart button not found");
        }
      }, 500);

      return;
    }
  }

  location.reload();
}

chrome.alarms.onAlarm.addListener((alarm) => {
  const tabId = parseInt(alarm.name.replace("tab_", ""));
  const tabKey = alarm.name;
  chrome.storage.local.get([tabKey], (result) => {
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
  if (areaName === "local") {
    Object.keys(changes).forEach((tabKey) => {
      if (tabKey.startsWith("tab_")) {
        const tabId = parseInt(tabKey.replace("tab_", ""));
        chrome.storage.local.get("refreshRate", (result) => {
          const refreshRate = result.refreshRate || 2;
          if (changes[tabKey]?.newValue?.enabled) {
            chrome.alarms.create(tabKey, { periodInMinutes: refreshRate / 60 });

            chrome.action.setBadgeBackgroundColor({
              color: "#FF0000",
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
  if (message.type === "ITEM_ADDED_TO_CART") {
    chrome.notifications.create("itemAdded", {
      type: "basic",
      iconUrl: "images/64.png",
      title: "Przedmiot dodany do koszyka",
      message:
        "Twój wybrany przedmiot został dodany do koszyka. Masz 20 minut na dokonanie zakupu.",
    });
  }


  // if (message.type === "SIZE_SOLD_OUT") {
  //   console.log(message)
  //   chrome.notifications.create("itemSoldOut", {
  //     type: "basic",
  //     iconUrl: "images/64.png",
  //     title: "Rozmiar wyprzedany",
  //     message: `Rozmiar ${message.size} jest wyprzedany i odświeżanie zostało zakończone.`,
  //   });
  // }
});
