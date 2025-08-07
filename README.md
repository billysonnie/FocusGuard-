# FocusFlow: The Next-Generation Focus & Privacy Extension

FocusFlow is a Manifest V3 compliant Chrome extension designed to help you stay focused, protect your privacy, and create a cleaner, more productive browsing experience. It combines an ad blocker, a cookie consent skipper, and a powerful distraction blocker into one user-friendly package.

## Features

### Core Features
- **Ad Blocker**: Blocks banner ads, sidebar ads, and video pre-roll ads using a declarative ruleset for maximum performance.
- **Cookie Consent Skipper**: Automatically detects and handles cookie consent popups by clicking "Reject All" or hiding the banner.
- **Distraction Blocker**: Allows you to block specific websites during focus sessions. Blocked sites are redirected to a gentle, motivational page.
- **Focus Mode**: A simple toggle to activate and deactivate the distraction blocker.

### Advanced Control
- **Site Whitelist**: Exempt trusted domains (e.g., your bank, work tools) from all forms of blocking.
- **Custom Element Blocker**: Use CSS selectors to hide any unwanted element on a webpage, such as newsletter popups, social media feeds, or "related articles" sections.
- **Statistics Dashboard**: View your productivity stats, including the number of ads, cookie banners, and distractions blocked today, this week, and all time.

### User Interface
- **Toolbar Popup**: A simple and intuitive UI to toggle features, manage your blocklist, whitelist, and custom rules.
- **Real-time Notifications**: Get notified when a site is blocked or a cookie banner is handled.
- **Dashboard Access**: A direct link from the popup to your statistics dashboard.

## Privacy
Your privacy is paramount. **FocusFlow operates entirely on your local machine.**
- No data is ever sent to or stored on any external server.
- All settings, lists, and statistics are stored locally in your browser's storage.
- The extension is designed to be fully functional offline.

## Installation

To install FocusFlow manually:
1. Download this repository as a ZIP file and unzip it.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" using the toggle in the top-right corner.
4. Click the "Load unpacked" button.
5. Select the unzipped directory containing the extension's files.
6. The FocusFlow icon will appear in your Chrome toolbar.

## Permissions Explained

FocusFlow requires the following permissions to function:
- `activeTab`: To get the URL of the current tab for features like whitelisting and adding custom rules.
- `storage`: To save your settings, blocklists, and statistics locally on your device.
- `notifications`: To show you real-time alerts when content is blocked.
- `declarativeNetRequest` & `declarativeNetRequestWithHostAccess`: To use Chrome's modern, high-performance ad-blocking engine.
- `host_permissions: ["<all_urls>"]`: To enable the content scripts to run on all websites for blocking ads, cookie banners, and custom elements.

## A Note on Icons & Testing

- **Icons**: The icons included in the `/icons` directory are placeholders. You will need to replace `icon16.png`, `icon48.png`, and `icon128.png` with your own custom icon designs.
- **Unit Tests**: A `tests` directory has been created with a sample test for a pure function (`tests/pure_logic.spec.js`). To build a comprehensive test suite for a Chrome extension, you would typically use a framework like [Jest](https://jestjs.io/) along with a library for mocking Chrome APIs, such as [jest-chrome](https://github.com/extend-chrome/jest-chrome). This allows for testing the interaction with the browser APIs in a Node.js environment.

---
*This extension was built by an AI software engineer.*
