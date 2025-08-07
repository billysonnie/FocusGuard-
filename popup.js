/**
 * @file popup.js
 * @description This script handles the logic for the extension's popup UI.
 * It is responsible for:
 * - Loading and displaying current settings and lists (blocked sites, whitelist, custom rules).
 * - Handling user interactions with the UI controls (toggles, buttons, inputs).
 * - Saving changes to settings and lists back to chrome.storage.local.
 * - Opening the dashboard page.
 */

document.addEventListener('DOMContentLoaded', () => {
  const adBlockToggle = document.getElementById('ad-block-toggle');
  const cookieBlockToggle = document.getElementById('cookie-block-toggle');
  const focusModeButton = document.getElementById('focus-mode-button');
  const blockSiteButton = document.getElementById('block-site-button');
  const blockSiteInput = document.getElementById('block-site-input');
  const blockedSitesList = document.getElementById('blocked-sites-list');
  const whitelistCurrentSiteButton = document.getElementById('whitelist-current-site-button');
  const whitelistedSitesList = document.getElementById('whitelisted-sites-list');
  const customRuleSelectorInput = document.getElementById('custom-rule-selector-input');
  const customRuleDomainInput = document.getElementById('custom-rule-domain-input');
  const addCustomRuleButton = document.getElementById('add-custom-rule-button');
  const customRulesList = document.getElementById('custom-rules-list');
  let currentHostname = '';

  // Function to render the custom rules list
  const renderCustomRules = (rules) => {
    customRulesList.innerHTML = '';
    if (rules && rules.length > 0) {
      rules.forEach((rule, index) => {
        const li = document.createElement('li');
        li.textContent = `${rule.selector} on ${rule.domain}`;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
          const updatedRules = rules.filter((_, i) => i !== index);
          chrome.storage.local.set({ customRules: updatedRules });
        });
        li.appendChild(removeButton);
        customRulesList.appendChild(li);
      });
    } else {
      customRulesList.innerHTML = '<li>No custom rules defined.</li>';
    }
  };

  // Function to render the whitelisted sites list
  const renderWhitelistedSites = (sites) => {
    whitelistedSitesList.innerHTML = '';
    if (sites && sites.length > 0) {
      sites.forEach(site => {
        const li = document.createElement('li');
        li.textContent = site;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
          const updatedSites = sites.filter(s => s !== site);
          chrome.storage.local.set({ whitelistedSites: updatedSites });
        });
        li.appendChild(removeButton);
        whitelistedSitesList.appendChild(li);
      });
    } else {
      whitelistedSitesList.innerHTML = '<li>No sites whitelisted.</li>';
    }
  };

  // Function to render the blocked sites list
  const renderBlockedSites = (sites) => {
    blockedSitesList.innerHTML = '';
    if (sites && sites.length > 0) {
      sites.forEach(site => {
        const li = document.createElement('li');
        li.textContent = site;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
          const updatedSites = sites.filter(s => s !== site);
          chrome.storage.local.set({ blockedSites: updatedSites }, () => {
            renderBlockedSites(updatedSites);
          });
        });
        li.appendChild(removeButton);
        blockedSitesList.appendChild(li);
      });
    } else {
      blockedSitesList.innerHTML = '<li>No sites blocked.</li>';
    }
  };

  // Function to update the Focus Mode button text
  const updateFocusButtonText = (isBlocking) => {
    focusModeButton.textContent = isBlocking ? 'Stop Focus' : 'Start Focus';
  };

  // Load saved settings and lists
  chrome.storage.local.get(['adBlocking', 'cookieBlocking', 'distractionBlocking', 'blockedSites', 'whitelistedSites', 'customRules'], (result) => {
    adBlockToggle.checked = result.adBlocking !== false;
    cookieBlockToggle.checked = result.cookieBlocking !== false;
    updateFocusButtonText(result.distractionBlocking);
    renderBlockedSites(result.blockedSites);
    renderWhitelistedSites(result.whitelistedSites);
    renderCustomRules(result.customRules);
  });

  // Get current tab URL to enable/disable whitelist button and pre-fill domain
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      const url = new URL(tabs[0].url);
      currentHostname = url.hostname;
      whitelistCurrentSiteButton.disabled = !currentHostname;
      customRuleDomainInput.value = currentHostname;
    } else {
      whitelistCurrentSiteButton.disabled = true;
    }
  });

  // Listen for storage changes to keep the lists updated
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.blockedSites) {
      renderBlockedSites(changes.blockedSites.newValue);
    }
    if (changes.whitelistedSites) {
      renderWhitelistedSites(changes.whitelistedSites.newValue);
    }
    if (changes.customRules) {
      renderCustomRules(changes.customRules.newValue);
    }
  });

  addCustomRuleButton.addEventListener('click', () => {
    const selector = customRuleSelectorInput.value.trim();
    const domain = customRuleDomainInput.value.trim();
    if (selector && domain) {
      const newRule = { selector, domain };
      chrome.storage.local.get({ customRules: [] }, (result) => {
        const updatedRules = [...(result.customRules || []), newRule];
        chrome.storage.local.set({ customRules: updatedRules }, () => {
          customRuleSelectorInput.value = '';
        });
      });
    }
  });

  whitelistCurrentSiteButton.addEventListener('click', () => {
    if (currentHostname) {
      chrome.storage.local.get({ whitelistedSites: [] }, (result) => {
        const whitelistedSites = result.whitelistedSites || [];
        if (!whitelistedSites.includes(currentHostname)) {
          const updatedSites = [...whitelistedSites, currentHostname];
          chrome.storage.local.set({ whitelistedSites: updatedSites });
        }
      });
    }
  });

  adBlockToggle.addEventListener('change', (event) => {
    chrome.storage.local.set({ adBlocking: event.target.checked });
  });

  cookieBlockToggle.addEventListener('change', (event) => {
    chrome.storage.local.set({ cookieBlocking: event.target.checked });
  });

  focusModeButton.addEventListener('click', () => {
    chrome.storage.local.get('distractionBlocking', (result) => {
      const isBlocking = !result.distractionBlocking;
      chrome.storage.local.set({ distractionBlocking: isBlocking }, () => {
        updateFocusButtonText(isBlocking);
      });
    });
  });

  blockSiteButton.addEventListener('click', () => {
    const siteToBlock = blockSiteInput.value.trim();
    if (siteToBlock) {
      chrome.storage.local.get({ blockedSites: [] }, (result) => {
        const blockedSites = result.blockedSites || [];
        if (!blockedSites.includes(siteToBlock)) {
          const updatedSites = [...blockedSites, siteToBlock];
          chrome.storage.local.set({ blockedSites: updatedSites }, () => {
            blockSiteInput.value = '';
            // The storage listener will automatically re-render the list
          });
        }
      });
    }
  });
});
