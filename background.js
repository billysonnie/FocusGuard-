/**
 * @file background.js
 * @description This is the service worker for the FocusFlow extension.
 * It handles all core background tasks, including:
 * - Extension installation and setup
 * - Ad blocking rules management
 * - Distraction blocking and redirection
 * - Whitelist and custom rule enforcement
 * - Statistics tracking
 * - Handling messages from other parts of the extension
 */

// Listener for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('FocusFlow extension installed.');
  // Set default values for settings
  chrome.storage.local.set({
    adBlocking: true,
    cookieBlocking: true,
    distractionBlocking: true,
    blockedSites: [],
    whitelistedSites: [],
    customRules: [],
    stats: {
      adsBlocked: { total: 0, today: 0, currentWeek: 0 },
      cookiesSkipped: { total: 0, today: 0, currentWeek: 0 },
      distractionsBlocked: { total: 0, today: 0, currentWeek: 0 },
      lastUpdatedDate: new Date().toISOString().split('T')[0],
      weekStartDate: getWeekStartDate().toISOString().split('T')[0]
    }
  });
});

function getWeekStartDate() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(today.setDate(diff));
}

async function updateStats(type, count = 1) {
  let stats = (await chrome.storage.local.get('stats')).stats;
  const todayStr = new Date().toISOString().split('T')[0];
  const weekStartStr = getWeekStartDate().toISOString().split('T')[0];

  // Reset daily counts if it's a new day
  if (stats.lastUpdatedDate !== todayStr) {
    stats.adsBlocked.today = 0;
    stats.cookiesSkipped.today = 0;
    stats.distractionsBlocked.today = 0;
    stats.lastUpdatedDate = todayStr;
  }

  // Reset weekly counts if it's a new week
  if (stats.weekStartDate !== weekStartStr) {
    stats.adsBlocked.currentWeek = 0;
    stats.cookiesSkipped.currentWeek = 0;
    stats.distractionsBlocked.currentWeek = 0;
    stats.weekStartDate = weekStartStr;
  }

  if (stats[type]) {
    stats[type].total += count;
    stats[type].today += count;
    stats[type].currentWeek += count;
  }

  await chrome.storage.local.set({ stats });
}

// Ad blocking logic using declarativeNetRequest
const updateAdBlocking = (enabled) => {
  if (enabled) {
    chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ["ruleset_1"] });
    console.log('Ad blocking enabled.');
  } else {
    chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: ["ruleset_1"] });
    console.log('Ad blocking disabled.');
  }
};

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.adBlocking) {
    updateAdBlocking(changes.adBlocking.newValue);
  }
});

// Listener for ad blocking stats
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  // We only care about top-level frame completions
  if (changeInfo.status === 'complete') {
    try {
      const matchedRules = await chrome.declarativeNetRequest.getMatchedRules({ tabId: tabId });
      const adRules = matchedRules.rules.filter(rule => rule.rulesetId === 'ruleset_1');
      if (adRules.length > 0) {
        updateStats('adsBlocked', adRules.length);
      }
    } catch (error) {
      // This can happen if the tab is closed before we get the rules, so we can ignore it.
      // console.error("Could not get matched rules:", error);
    }
  }
});

// Initialize ad blocking state on startup
chrome.storage.local.get('adBlocking', (result) => {
  updateAdBlocking(result.adBlocking !== false);
});

// Listener for messages from other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'cookieBannerHandled') {
    updateStats('cookiesSkipped');
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Cookie Banner Handled',
      message: `A cookie banner was automatically ${request.method === 'click' ? 'rejected' : 'hidden'}.`
    });
  }
});

// Handle ad-blocking on whitelisted sites
// updateEnabledRulesets is global-only; per-tab exemption needs a session-scoped allow rule
const whitelistRuleIds = new Map(); // tabId -> session rule id
let nextSessionRuleId = 1000;

const handleWhitelistingForTab = (tabId, url) => {
  chrome.storage.local.get('whitelistedSites', (result) => {
    const whitelistedSites = result.whitelistedSites || [];
    const hostname = new URL(url).hostname;
    const existing = whitelistRuleIds.get(tabId);

    if (whitelistedSites.includes(hostname)) {
      if (existing) return; // already exempt
      const ruleId = nextSessionRuleId++;
      whitelistRuleIds.set(tabId, ruleId);
      chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [ruleId],
        addRules: [{
          id: ruleId,
          priority: 1,
          action: { type: 'allowAllRequests', resourceTypes: ['main_frame'] },
          condition: { tabIds: [tabId] }
        }]
      });
    } else if (existing) {
      whitelistRuleIds.delete(tabId);
      chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [existing] });
    }
  });
};

chrome.tabs.onRemoved.addListener((tabId) => {
  whitelistRuleIds.delete(tabId);
});

// Distraction blocking logic
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    handleWhitelistingForTab(tabId, changeInfo.url);

    chrome.storage.local.get(['distractionBlocking', 'blockedSites', 'whitelistedSites'], (result) => {
      const { distractionBlocking, blockedSites, whitelistedSites } = result;
      const url = new URL(changeInfo.url);

      // If site is whitelisted, do nothing for distraction blocking
      if (whitelistedSites && whitelistedSites.includes(url.hostname)) {
        return;
      }

      if (distractionBlocking && blockedSites && blockedSites.length > 0) {
        const isBlocked = blockedSites.some(blockedSite => url.hostname.includes(blockedSite));

        if (isBlocked) {
          // Check if the URL is not already our blocked page to prevent redirect loops
          if (url.href !== chrome.runtime.getURL('blocked.html')) {
            updateStats('distractionsBlocked');
            chrome.tabs.update(tabId, { url: chrome.runtime.getURL('blocked.html') });
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon128.png',
              title: 'Site Blocked',
              message: `${url.hostname} was blocked to help you stay focused.`
            });
          }
        }
      }
    });
  }
});
