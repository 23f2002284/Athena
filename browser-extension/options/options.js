// Athena Browser Extension - Options Page
class AthenaOptionsPage {
  constructor() {
    this.settings = {};
    this.activities = [];
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
    this.loadStats();
    this.loadRecentActivity();
    this.checkWelcomeBanner();
  }

  setupEventListeners() {
    // Settings toggles
    document.getElementById('enabled').addEventListener('change', (e) => {
      this.updateSetting('enabled', e.target.checked);
    });

    document.getElementById('quickFactCheck').addEventListener('change', (e) => {
      this.updateSetting('quickFactCheck', e.target.checked);
    });

    document.getElementById('showTooltips').addEventListener('change', (e) => {
      this.updateSetting('showTooltips', e.target.checked);
    });

    document.getElementById('autoAnalyze').addEventListener('change', (e) => {
      this.updateSetting('autoAnalyze', e.target.checked);
    });

    // Range input
    const confidenceRange = document.getElementById('confidenceThreshold');
    const confidenceValue = document.querySelector('.range-value');

    confidenceRange.addEventListener('input', (e) => {
      const value = e.target.value;
      confidenceValue.textContent = `${value}%`;
      this.updateSetting('confidenceThreshold', parseInt(value));
    });

    // API endpoint
    document.getElementById('apiEndpoint').addEventListener('change', (e) => {
      this.updateSetting('apiEndpoint', e.target.value);
    });

    // Buttons
    document.getElementById('clearCache').addEventListener('click', () => {
      this.clearCache();
    });

    document.getElementById('testConnection').addEventListener('click', () => {
      this.testConnection();
    });

    document.getElementById('viewHistory').addEventListener('click', () => {
      this.viewHistory();
    });

    document.getElementById('clearHistory').addEventListener('click', () => {
      this.clearHistory();
    });

    document.getElementById('exportData').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('importData').addEventListener('click', () => {
      this.importData();
    });

    // Import file handler
    document.getElementById('importFile').addEventListener('change', (e) => {
      this.handleFileImport(e);
    });

    // Welcome banner
    document.getElementById('dismissWelcome').addEventListener('click', () => {
      this.dismissWelcome();
    });

    // Footer links
    document.getElementById('aboutLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openAbout();
    });

    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openHelp();
    });

    document.getElementById('privacyLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openPrivacy();
    });

    document.getElementById('githubLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openGitHub();
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get('athenaSettings');
      this.settings = result.athenaSettings || {
        enabled: true,
        quickFactCheck: true,
        showTooltips: true,
        apiEndpoint: 'http://localhost:8000',
        autoAnalyze: false,
        confidenceThreshold: 70
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showToast('Failed to load settings', 'error');
    }
  }

  updateUI() {
    // Update form elements with current settings
    document.getElementById('enabled').checked = this.settings.enabled;
    document.getElementById('quickFactCheck').checked = this.settings.quickFactCheck;
    document.getElementById('showTooltips').checked = this.settings.showTooltips;
    document.getElementById('autoAnalyze').checked = this.settings.autoAnalyze;
    document.getElementById('confidenceThreshold').value = this.settings.confidenceThreshold;
    document.getElementById('apiEndpoint').value = this.settings.apiEndpoint;

    // Update range display
    document.querySelector('.range-value').textContent = `${this.settings.confidenceThreshold}%`;

    // Update status indicator
    const statusIndicator = document.getElementById('statusIndicator');
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = statusIndicator.querySelector('.status-text');

    if (this.settings.enabled) {
      statusIndicator.style.background = '#dcfce7';
      statusIndicator.style.color = '#16a34a';
      statusText.textContent = 'Active';
    } else {
      statusIndicator.style.background = '#fef2f2';
      statusIndicator.style.color = '#dc2626';
      statusText.textContent = 'Disabled';
    }
  }

  async updateSetting(key, value) {
    this.settings[key] = value;

    try {
      await chrome.storage.sync.set({ athenaSettings: this.settings });
      this.updateUI();

      // Send message to background script
      chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: this.settings
      });

    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  async loadStats() {
    try {
      // Get cache size from background
      const cacheResponse = await chrome.runtime.sendMessage({ action: 'getCache' });
      const cacheSize = cacheResponse.cache ? cacheResponse.cache.length : 0;

      // Get activity data
      const activityResult = await chrome.storage.local.get('athenaActivity');
      const activities = activityResult.athenaActivity || [];

      // Calculate stats
      const today = new Date().toDateString();
      const todayChecks = activities.filter(activity => {
        return new Date(activity.timestamp).toDateString() === today;
      }).length;

      // Update UI
      document.getElementById('totalChecks').textContent = activities.length;
      document.getElementById('todayChecks').textContent = todayChecks;
      document.getElementById('cacheSize').textContent = cacheSize;

    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async loadRecentActivity() {
    try {
      const result = await chrome.storage.local.get('athenaActivity');
      this.activities = result.athenaActivity || [];

      const activityList = document.getElementById('activityList');
      const activityEmpty = document.getElementById('activityEmpty');

      if (this.activities.length === 0) {
        activityList.style.display = 'none';
        activityEmpty.style.display = 'block';
        return;
      }

      activityList.style.display = 'block';
      activityEmpty.style.display = 'none';

      // Show last 10 activities
      const recentActivities = this.activities.slice(0, 10);

      activityList.innerHTML = recentActivities.map(activity => {
        const isSupported = !activity.result?.is_fake;
        const timeAgo = this.formatTimeAgo(activity.timestamp);

        return `
          <div class="activity-item">
            <div class="activity-icon ${isSupported ? 'supported' : 'refuted'}">
              ${isSupported ? '✓' : '✗'}
            </div>
            <div class="activity-content">
              <div class="activity-text">${activity.text}</div>
              <div class="activity-meta">
                ${isSupported ? 'Supported' : 'Refuted'} •
                ${this.formatDomain(activity.url)}
              </div>
            </div>
            <div class="activity-time">${timeAgo}</div>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  }

  async clearCache() {
    try {
      await chrome.runtime.sendMessage({ action: 'clearCache' });
      this.showToast('Cache cleared successfully', 'success');
      this.loadStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      this.showToast('Failed to clear cache', 'error');
    }
  }

  async testConnection() {
    const testButton = document.getElementById('testConnection');
    const resultDiv = document.getElementById('connectionResult');

    testButton.disabled = true;
    testButton.textContent = 'Testing...';

    resultDiv.className = 'connection-result testing';
    resultDiv.textContent = 'Testing connection...';

    try {
      const response = await fetch(`${this.settings.apiEndpoint}/api/health`, {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        resultDiv.className = 'connection-result success';
        resultDiv.textContent = 'Connection successful';
        this.showToast('Connection test successful', 'success');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('Connection test failed:', error);
      resultDiv.className = 'connection-result error';
      resultDiv.textContent = 'Connection failed';
      this.showToast('Connection test failed', 'error');
    }

    testButton.disabled = false;
    testButton.textContent = 'Test Connection';
  }

  viewHistory() {
    // Create and show modal with full history
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    const historyContent = this.activities.map(activity => {
      const isSupported = !activity.result?.is_fake;
      const date = new Date(activity.timestamp).toLocaleString();

      return `
        <div style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 500; margin-bottom: 4px;">${activity.text}</div>
          <div style="font-size: 12px; color: #64748b;">
            ${isSupported ? '✓ Supported' : '✗ Refuted'} •
            ${this.formatDomain(activity.url)} •
            ${date}
          </div>
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; max-width: 600px; max-height: 80vh; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
        <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
          <h3>Activity History</h3>
          <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
          ${historyContent || '<p style="padding: 20px; text-align: center; color: #64748b;">No activity found</p>'}
        </div>
      </div>
    `;

    modal.className = 'modal';
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  async clearHistory() {
    if (confirm('Are you sure you want to clear all activity history? This cannot be undone.')) {
      try {
        await chrome.storage.local.remove('athenaActivity');
        this.activities = [];
        this.loadRecentActivity();
        this.loadStats();
        this.showToast('History cleared successfully', 'success');
      } catch (error) {
        console.error('Failed to clear history:', error);
        this.showToast('Failed to clear history', 'error');
      }
    }
  }

  exportData() {
    const data = {
      settings: this.settings,
      activities: this.activities,
      timestamp: Date.now(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `athena-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    this.showToast('Data exported successfully', 'success');
  }

  importData() {
    document.getElementById('importFile').click();
  }

  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.settings) {
        this.settings = { ...this.settings, ...data.settings };
        await chrome.storage.sync.set({ athenaSettings: this.settings });
        this.updateUI();
      }

      if (data.activities && Array.isArray(data.activities)) {
        await chrome.storage.local.set({ athenaActivity: data.activities });
        this.activities = data.activities;
        this.loadRecentActivity();
        this.loadStats();
      }

      this.showToast('Data imported successfully', 'success');

    } catch (error) {
      console.error('Import failed:', error);
      this.showToast('Failed to import data', 'error');
    }

    // Reset file input
    event.target.value = '';
  }

  checkWelcomeBanner() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('welcome') === 'true') {
      document.getElementById('welcomeBanner').classList.remove('hidden');
    }
  }

  dismissWelcome() {
    document.getElementById('welcomeBanner').classList.add('hidden');

    // Update URL
    const url = new URL(window.location);
    url.searchParams.delete('welcome');
    window.history.replaceState({}, '', url);
  }

  openAbout() {
    window.open('https://github.com/your-repo/athena#about', '_blank');
  }

  openHelp() {
    window.open('https://github.com/your-repo/athena#help', '_blank');
  }

  openPrivacy() {
    window.open('https://github.com/your-repo/athena/blob/main/PRIVACY.md', '_blank');
  }

  openGitHub() {
    window.open('https://github.com/your-repo/athena', '_blank');
  }

  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  formatDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'Unknown';
    }
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';

    toast.innerHTML = `
      <span style="font-size: 16px;">${icon}</span>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AthenaOptionsPage();
});