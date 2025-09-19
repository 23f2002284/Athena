// Athena Browser Extension - Popup Script
class AthenaPopup {
  constructor() {
    this.apiBaseUrl = 'http://localhost:8000';
    this.currentResults = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateCharCount();
    this.loadSelectedText();
    this.restoreState();
  }

  setupEventListeners() {
    // Input and controls
    const input = document.getElementById('factCheckInput');
    const pasteBtn = document.getElementById('pasteBtn');
    const clearBtn = document.getElementById('clearBtn');
    const factCheckBtn = document.getElementById('factCheckBtn');

    // Quick actions
    const selectedTextBtn = document.getElementById('selectedTextBtn');
    const pageUrlBtn = document.getElementById('pageUrlBtn');

    // Result actions
    const shareBtn = document.getElementById('shareBtn');
    const reportBtn = document.getElementById('reportBtn');
    const newCheckBtn = document.getElementById('newCheckBtn');

    // Footer buttons
    const settingsBtn = document.getElementById('settingsBtn');
    const helpBtn = document.getElementById('helpBtn');

    // Event listeners
    input.addEventListener('input', () => {
      this.updateCharCount();
      this.toggleFactCheckButton();
    });

    pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
    clearBtn.addEventListener('click', () => this.clearInput());
    factCheckBtn.addEventListener('click', () => this.performFactCheck());

    selectedTextBtn.addEventListener('click', () => this.checkSelectedText());
    pageUrlBtn.addEventListener('click', () => this.checkCurrentPage());

    shareBtn.addEventListener('click', () => this.shareResults());
    reportBtn.addEventListener('click', () => this.reportResults());
    newCheckBtn.addEventListener('click', () => this.newCheck());

    settingsBtn.addEventListener('click', () => this.openSettings());
    helpBtn.addEventListener('click', () => this.openHelp());
  }

  updateCharCount() {
    const input = document.getElementById('factCheckInput');
    const charCount = document.querySelector('.char-count');
    const count = input.value.length;
    charCount.textContent = `${count}/2000`;

    if (count > 1800) {
      charCount.style.color = '#dc2626';
    } else if (count > 1500) {
      charCount.style.color = '#d97706';
    } else {
      charCount.style.color = '#8892b0';
    }
  }

  toggleFactCheckButton() {
    const input = document.getElementById('factCheckInput');
    const factCheckBtn = document.getElementById('factCheckBtn');
    factCheckBtn.disabled = input.value.trim().length === 0;
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const input = document.getElementById('factCheckInput');
      input.value = text.substring(0, 2000);
      this.updateCharCount();
      this.toggleFactCheckButton();
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
      this.showNotification('Failed to paste from clipboard', 'error');
    }
  }

  clearInput() {
    const input = document.getElementById('factCheckInput');
    input.value = '';
    this.updateCharCount();
    this.toggleFactCheckButton();
    input.focus();
  }

  async loadSelectedText() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => window.getSelection().toString()
      });

      const selectedText = results[0]?.result?.trim();
      if (selectedText && selectedText.length > 0) {
        const selectedTextBtn = document.getElementById('selectedTextBtn');
        selectedTextBtn.style.background = '#e0e7ff';
        selectedTextBtn.style.borderColor = '#667eea';
        selectedTextBtn.style.color = '#667eea';

        // Store selected text for quick access
        this.selectedText = selectedText;
      }
    } catch (error) {
      console.error('Failed to get selected text:', error);
    }
  }

  async checkSelectedText() {
    if (this.selectedText) {
      const input = document.getElementById('factCheckInput');
      input.value = this.selectedText.substring(0, 2000);
      this.updateCharCount();
      this.toggleFactCheckButton();
      await this.performFactCheck();
    } else {
      this.showNotification('No text is currently selected on the page', 'info');
    }
  }

  async checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const input = document.getElementById('factCheckInput');
      input.value = tab.url;
      this.updateCharCount();
      this.toggleFactCheckButton();
      await this.performFactCheck();
    } catch (error) {
      console.error('Failed to get current page URL:', error);
      this.showNotification('Failed to get current page URL', 'error');
    }
  }

  async performFactCheck() {
    const input = document.getElementById('factCheckInput');
    const text = input.value.trim();

    if (!text) return;

    this.showLoading(true);
    this.hideResults();

    try {
      // Call Athena API
      const response = await fetch(`${this.apiBaseUrl}/api/fact-check`, {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const startResult = await response.json();
      console.log('Fact-check started:', startResult);

      // Poll for results
      await this.pollForResults();

    } catch (error) {
      console.error('Fact-check error:', error);
      this.showLoading(false);
      this.showNotification('Failed to perform fact-check. Please check your connection.', 'error');
    }
  }

  async pollForResults() {
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      try {
        attempts++;
        const response = await fetch(`${this.apiBaseUrl}/api/fact-check-result`);

        if (response.ok) {
          const data = await response.json();

          if (data.status === 'complete' && data.result) {
            this.showLoading(false);
            this.displayResults(data.result);
            this.saveState({ results: data.result });
            return;
          }
        }

        if (attempts >= maxAttempts) {
          throw new Error('Timeout: Analysis taking too long');
        }

        // Continue polling
        setTimeout(poll, 1000);

      } catch (error) {
        console.error('Polling error:', error);
        this.showLoading(false);
        this.showNotification('Analysis timed out. Please try again.', 'error');
      }
    };

    poll();
  }

  displayResults(result) {
    this.currentResults = result;

    // Determine verdict
    const isSupported = !result.is_fake && result.verdict?.toLowerCase() !== 'false';
    const verdictStatus = isSupported ? 'supported' : 'refuted';
    const confidence = result.confidence ? Math.round(result.confidence * 100) : 85;

    // Update verdict badge
    const verdictBadge = document.getElementById('verdictBadge');
    const verdictIcon = document.getElementById('verdictIcon');
    const verdictText = document.getElementById('verdictText');
    const confidenceScore = document.getElementById('confidenceScore');

    verdictBadge.className = `verdict-badge ${verdictStatus}`;
    verdictIcon.textContent = isSupported ? '✓' : '✗';
    verdictText.textContent = isSupported ? 'Supported' : 'Refuted';
    confidenceScore.textContent = `${confidence}%`;

    // Update explanation
    const explanation = document.getElementById('explanation');
    explanation.textContent = result.explanation || result.processed_answer || 'Analysis completed.';

    // Update sources
    this.displaySources(result.sources || []);

    this.showResults();
  }

  displaySources(sources) {
    const sourcesList = document.getElementById('sourcesList');
    sourcesList.innerHTML = '';

    if (!sources || sources.length === 0) {
      sourcesList.innerHTML = '<div style="color: #8892b0; font-style: italic;">No sources available</div>';
      return;
    }

    sources.slice(0, 3).forEach(source => {
      const sourceItem = document.createElement('div');
      sourceItem.className = 'source-item';

      const title = source.title || source.url || 'Source';
      const domain = source.domain || this.extractDomain(source.url) || '';
      const url = source.url || '#';

      sourceItem.innerHTML = `
        <svg class="source-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
        </svg>
        <a href="${url}" target="_blank" class="source-title">${title}</a>
        <span class="source-domain">${domain}</span>
      `;

      sourcesList.appendChild(sourceItem);
    });
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    loadingState.classList.toggle('hidden', !show);
  }

  showResults() {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.remove('hidden');
  }

  hideResults() {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.add('hidden');
  }

  async shareResults() {
    if (!this.currentResults) return;

    const text = `Fact-check result: ${this.currentResults.explanation || 'Analysis completed'} - Verified by Athena AI`;

    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Results copied to clipboard', 'success');
    } catch (error) {
      console.error('Failed to copy results:', error);
      this.showNotification('Failed to copy results', 'error');
    }
  }

  reportResults() {
    // Open feedback form or report mechanism
    chrome.tabs.create({
      url: 'https://github.com/your-repo/athena/issues/new?template=fact-check-feedback.md'
    });
  }

  newCheck() {
    this.clearInput();
    this.hideResults();
    this.currentResults = null;
    this.clearState();
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  openHelp() {
    chrome.tabs.create({
      url: 'https://github.com/your-repo/athena#browser-extension'
    });
  }

  showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#e0e7ff'};
      color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#1e40af'};
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // State management
  saveState(state) {
    chrome.storage.local.set({ athenaPopupState: state });
  }

  clearState() {
    chrome.storage.local.remove('athenaPopupState');
  }

  async restoreState() {
    try {
      const result = await chrome.storage.local.get('athenaPopupState');
      if (result.athenaPopupState?.results) {
        this.displayResults(result.athenaPopupState.results);
      }
    } catch (error) {
      console.error('Failed to restore state:', error);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AthenaPopup();
});