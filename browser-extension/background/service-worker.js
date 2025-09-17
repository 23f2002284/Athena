// Athena Browser Extension - Background Service Worker
class AthenaBackgroundService {
  constructor() {
    this.apiBaseUrl = 'http://localhost:8000';
    this.factCheckCache = new Map();
    this.activeFactChecks = new Map();
    this.init();
  }

  init() {
    this.setupContextMenus();
    this.setupMessageHandlers();
    this.setupInstallHandler();
    console.log('Athena Background Service Worker initialized');
  }

  setupInstallHandler() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        // Set default settings
        chrome.storage.sync.set({
          athenaSettings: {
            enabled: true,
            quickFactCheck: true,
            showTooltips: true,
            apiEndpoint: this.apiBaseUrl,
            autoAnalyze: false,
            confidenceThreshold: 70
          }
        });

        // Open welcome page
        chrome.tabs.create({
          url: chrome.runtime.getURL('options/options.html?welcome=true')
        });
      }
    });
  }

  setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'athena-fact-check-selection',
        title: 'Fact-check with Athena',
        contexts: ['selection'],
        documentUrlPatterns: ['http://*/*', 'https://*/*']
      });

      chrome.contextMenus.create({
        id: 'athena-fact-check-page',
        title: 'Fact-check this page',
        contexts: ['page'],
        documentUrlPatterns: ['http://*/*', 'https://*/*']
      });

      chrome.contextMenus.create({
        id: 'athena-separator',
        type: 'separator',
        contexts: ['selection', 'page']
      });

      chrome.contextMenus.create({
        id: 'athena-settings',
        title: 'Athena Settings',
        contexts: ['action']
      });
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'athena-fact-check-selection':
        if (info.selectionText) {
          await this.performFactCheck(info.selectionText, tab);
        }
        break;

      case 'athena-fact-check-page':
        await this.performFactCheck(tab.url, tab);
        break;

      case 'athena-settings':
        chrome.runtime.openOptionsPage();
        break;
    }
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'factCheck':
          const result = await this.performFactCheck(message.text, sender.tab);
          sendResponse({ success: true, result });
          break;

        case 'getSettings':
          const settings = await this.getSettings();
          sendResponse({ settings });
          break;

        case 'updateSettings':
          await this.updateSettings(message.settings);
          sendResponse({ success: true });
          break;

        case 'clearCache':
          this.factCheckCache.clear();
          sendResponse({ success: true });
          break;

        case 'getCache':
          const cacheData = Array.from(this.factCheckCache.entries());
          sendResponse({ cache: cacheData });
          break;

        case 'openPopup':
          // Focus extension popup
          chrome.action.openPopup();
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async performFactCheck(text, tab) {
    if (!text || text.length === 0) {
      throw new Error('No text provided for fact-checking');
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(text);
    if (this.factCheckCache.has(cacheKey)) {
      console.log('Returning cached result');
      return this.factCheckCache.get(cacheKey);
    }

    // Check if already processing this text
    if (this.activeFactChecks.has(cacheKey)) {
      return this.activeFactChecks.get(cacheKey);
    }

    const settings = await this.getSettings();

    try {
      // Start fact-check process
      const factCheckPromise = this.callFactCheckAPI(text, settings);
      this.activeFactChecks.set(cacheKey, factCheckPromise);

      const result = await factCheckPromise;

      // Cache result
      this.factCheckCache.set(cacheKey, result);

      // Clean up active check
      this.activeFactChecks.delete(cacheKey);

      // Log activity
      await this.logActivity({
        text: text.substring(0, 100),
        result,
        timestamp: Date.now(),
        url: tab?.url || 'unknown'
      });

      return result;

    } catch (error) {
      this.activeFactChecks.delete(cacheKey);
      throw error;
    }
  }

  async callFactCheckAPI(text, settings) {
    const apiUrl = settings.apiEndpoint || this.apiBaseUrl;

    // Start fact-check request
    const response = await fetch(`${apiUrl}/api/fact-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        pipeline: 'fact'
      })
    });

    if (!response.ok) {
      throw new Error(`Fact-check API error: ${response.status}`);
    }

    const startResult = await response.json();
    console.log('Fact-check started:', startResult);

    // Poll for results
    return await this.pollForResults(apiUrl, 30);
  }

  async pollForResults(apiUrl, maxAttempts = 30) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${apiUrl}/api/fact-check-result`);

        if (response.ok) {
          const data = await response.json();

          if (data.status === 'complete' && data.result) {
            return data.result;
          }
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error('Polling error:', error);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error('Fact-check timed out');
  }

  generateCacheKey(text) {
    // Simple hash function for cache keys
    let hash = 0;
    if (text.length === 0) return hash;

    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString();
  }

  async getSettings() {
    const result = await chrome.storage.sync.get('athenaSettings');
    return result.athenaSettings || {
      enabled: true,
      quickFactCheck: true,
      showTooltips: true,
      apiEndpoint: this.apiBaseUrl,
      autoAnalyze: false,
      confidenceThreshold: 70
    };
  }

  async updateSettings(newSettings) {
    await chrome.storage.sync.set({ athenaSettings: newSettings });

    // Update API endpoint if changed
    if (newSettings.apiEndpoint) {
      this.apiBaseUrl = newSettings.apiEndpoint;
    }

    // Clear cache if API endpoint changed
    this.factCheckCache.clear();
  }

  async logActivity(activity) {
    try {
      const result = await chrome.storage.local.get('athenaActivity');
      const activities = result.athenaActivity || [];

      activities.unshift(activity);

      // Keep only last 100 activities
      if (activities.length > 100) {
        activities.splice(100);
      }

      await chrome.storage.local.set({ athenaActivity: activities });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  async getBadgeText() {
    const activities = await this.getRecentActivities();
    const recentCount = activities.filter(a =>
      Date.now() - a.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    ).length;

    return recentCount > 0 ? recentCount.toString() : '';
  }

  async getRecentActivities() {
    const result = await chrome.storage.local.get('athenaActivity');
    return result.athenaActivity || [];
  }

  // Cleanup old cache entries periodically
  startCacheCleanup() {
    setInterval(() => {
      if (this.factCheckCache.size > 100) {
        // Remove oldest entries
        const entries = Array.from(this.factCheckCache.entries());
        const keepCount = 50;
        const toRemove = entries.slice(0, entries.length - keepCount);

        toRemove.forEach(([key]) => {
          this.factCheckCache.delete(key);
        });

        console.log(`Cleaned up ${toRemove.length} cache entries`);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }
}

// Initialize the background service
const athenaBackground = new AthenaBackgroundService();
athenaBackground.startCacheCleanup();

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This is handled by the popup, but we can add fallback behavior here
  console.log('Extension icon clicked');
});

// Handle browser startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Athena extension started with browser');
});

// Handle tab updates for potential auto-analysis
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const settings = await athenaBackground.getSettings();

    if (settings.autoAnalyze && tab.url.startsWith('http')) {
      // Auto-analyze page if enabled
      console.log('Auto-analyzing page:', tab.url);
      // Could implement automatic page analysis here
    }
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AthenaBackgroundService;
}