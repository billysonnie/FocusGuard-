/**
 * @file content.js
 * @description This content script runs on web pages to perform in-page actions.
 * It is responsible for:
 * - Detecting and dismissing cookie consent banners.
 * - Applying custom CSS rules to hide specific elements.
 * - Respecting the user's whitelist to avoid interfering with trusted sites.
 * - Using a MutationObserver to handle dynamically loaded content.
 */

const REJECT_KEYWORDS = [
  'reject all', 'decline all', 'necessary cookies only', 'reject', 'decline',
  'i refuse', 'refuse', 'necessary', 'essential only'
];

const BANNER_SELECTORS = [
  '[id*="cookie"]', '[class*="cookie"]', '[id*="consent"]', '[class*="consent"]',
  '[aria-label*="cookie"]', '[aria-label*="consent"]'
];

function findAndHandleCookieBanner() {
  const banner = document.querySelector(BANNER_SELECTORS.join(', '));
  if (!banner) {
    return;
  }

  console.log('FocusFlow: Cookie banner detected.', banner);

  let rejectButton = null;
  const buttons = banner.querySelectorAll('button, a');

  for (const button of buttons) {
    const buttonText = button.innerText.toLowerCase().trim();
    if (REJECT_KEYWORDS.some(keyword => buttonText.includes(keyword))) {
      rejectButton = button;
      break;
    }
  }

  if (rejectButton) {
    console.log('FocusFlow: Clicking reject button:', rejectButton.innerText);
    rejectButton.click();
    chrome.runtime.sendMessage({ action: 'cookieBannerHandled', method: 'click' });
  } else {
    console.log('FocusFlow: No reject button found. Hiding banner.');
    banner.style.display = 'none';
    chrome.runtime.sendMessage({ action: 'cookieBannerHandled', method: 'hide' });
  }
}

let appliedRules = new Set();

function applyCustomRules(rules) {
  const hostname = window.location.hostname;
  const applicableRules = rules.filter(rule => hostname.includes(rule.domain));

  for (const rule of applicableRules) {
    if (appliedRules.has(rule.selector)) continue;

    try {
      document.querySelectorAll(rule.selector).forEach(el => {
        el.style.display = 'none';
      });
      appliedRules.add(rule.selector);
    } catch (e) {
      console.error(`FocusFlow: Invalid selector: ${rule.selector}`, e);
    }
  }
}

function init() {
  chrome.storage.local.get(['cookieBlocking', 'whitelistedSites', 'customRules'], (result) => {
    const { cookieBlocking, whitelistedSites, customRules } = result;
    const hostname = window.location.hostname;

    // Apply custom rules regardless of other settings, unless site is whitelisted
    if (customRules && customRules.length > 0 && !(whitelistedSites && whitelistedSites.includes(hostname))) {
      applyCustomRules(customRules);
    }

    // If site is whitelisted or cookie blocking is disabled, do nothing more
    if (!cookieBlocking || (whitelistedSites && whitelistedSites.includes(hostname))) {
      if (whitelistedSites && whitelistedSites.includes(hostname)) {
        console.log('FocusFlow: Site is whitelisted. All blocking disabled.');
      }
      return;
    }

    console.log('FocusFlow: Cookie blocking is enabled.');

    // Initial check
    setTimeout(findAndHandleCookieBanner, 1000);

    // Observe DOM changes for dynamically loaded banners and custom rule elements
    const observer = new MutationObserver((mutations) => {
      findAndHandleCookieBanner();
      if (customRules && customRules.length > 0) {
        applyCustomRules(customRules);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

init();
