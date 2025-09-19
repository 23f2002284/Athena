// Athena Browser Extension - Content Script
class AthenaContentScript {
  constructor() {
    this.isEnabled = true;
    this.selectedText = '';
    this.tooltip = null;
    this.init();
  }

  init() {
    this.setupTextSelection();
    this.setupContextMenu();
    this.setupMessageListener();
    this.injectStyles();
    console.log('Athena Content Script loaded');
  }

  setupTextSelection() {
    let selectionTimeout;

    document.addEventListener('mouseup', () => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        this.handleTextSelection();
      }, 150);
    });

    document.addEventListener('keyup', (event) => {
      // Handle keyboard text selection (Shift + Arrow keys, Ctrl+A, etc.)
      if (event.shiftKey || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(() => {
          this.handleTextSelection();
        }, 300);
      }
    });

    // Hide tooltip when clicking elsewhere
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.athena-tooltip')) {
        this.hideTooltip();
      }
    });
  }

  handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0 && selectedText.length <= 500) {
      this.selectedText = selectedText;
      this.showTooltip(selection);
    } else {
      this.hideTooltip();
      this.selectedText = '';
    }
  }

  showTooltip(selection) {
    this.hideTooltip();

    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'athena-tooltip';
    this.tooltip.innerHTML = `
      <div class="athena-tooltip-content">
        <button class="athena-fact-check-btn" id="athena-quick-check">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
          </svg>
          Fact Check
        </button>
        <div class="athena-tooltip-arrow"></div>
      </div>
    `;

    // Position tooltip
    const tooltipTop = rect.top + window.scrollY - 45;
    const tooltipLeft = rect.left + window.scrollX + (rect.width / 2) - 50;

    this.tooltip.style.cssText = `
      position: absolute;
      top: ${Math.max(10, tooltipTop)}px;
      left: ${Math.max(10, Math.min(window.innerWidth - 110, tooltipLeft))}px;
      z-index: 10000;
    `;

    document.body.appendChild(this.tooltip);

    // Add click handler
    const factCheckBtn = this.tooltip.querySelector('#athena-quick-check');
    factCheckBtn.addEventListener('click', () => {
      this.quickFactCheck();
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideTooltip();
    }, 5000);
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  async quickFactCheck() {
    if (!this.selectedText) return;

    this.hideTooltip();
    this.showQuickResult('Analyzing...', 'loading');

    try {
      // Send message to background script to perform fact-check
      const response = await chrome.runtime.sendMessage({
        action: 'factCheck',
        text: this.selectedText
      });

      if (response.success) {
        this.showQuickResult(response.result);
      } else {
        this.showQuickResult('Analysis failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Quick fact-check failed:', error);
      this.showQuickResult('Analysis failed. Please try again.', 'error');
    }
  }

  showQuickResult(result, type = 'result') {
    // Remove existing result
    const existingResult = document.querySelector('.athena-quick-result');
    if (existingResult) existingResult.remove();

    const resultDiv = document.createElement('div');
    resultDiv.className = 'athena-quick-result';

    if (type === 'loading') {
      resultDiv.innerHTML = `
        <div class="athena-result-content loading">
          <div class="athena-loading-spinner"></div>
          <span>${result}</span>
        </div>
      `;
    } else if (type === 'error') {
      resultDiv.innerHTML = `
        <div class="athena-result-content error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z"/>
          </svg>
          <span>${result}</span>
        </div>
      `;
    } else {
      const isSupported = !result.is_fake && result.verdict?.toLowerCase() !== 'false';
      const verdict = isSupported ? 'Supported' : 'Refuted';
      const confidence = result.confidence ? Math.round(result.confidence * 100) : 85;

      resultDiv.innerHTML = `
        <div class="athena-result-content ${isSupported ? 'supported' : 'refuted'}">
          <div class="athena-result-header">
            <span class="athena-verdict">${verdict}</span>
            <span class="athena-confidence">${confidence}%</span>
          </div>
          <div class="athena-result-text">${result.explanation || 'Analysis completed'}</div>
          <div class="athena-result-actions">
            <button class="athena-details-btn">View Details</button>
            <button class="athena-close-btn">×</button>
          </div>
        </div>
      `;
    }

    // Position result near the selected text
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      resultDiv.style.cssText = `
        position: fixed;
        top: ${Math.min(window.innerHeight - 200, rect.bottom + 10)}px;
        left: ${Math.max(10, Math.min(window.innerWidth - 320, rect.left))}px;
        z-index: 10001;
      `;
    }

    document.body.appendChild(resultDiv);

    // Add event listeners
    const detailsBtn = resultDiv.querySelector('.athena-details-btn');
    const closeBtn = resultDiv.querySelector('.athena-close-btn');

    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openPopup' });
        this.hideQuickResult();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideQuickResult();
      });
    }

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.hideQuickResult();
    }, 10000);
  }

  hideQuickResult() {
    const result = document.querySelector('.athena-quick-result');
    if (result) result.remove();
  }

  setupContextMenu() {
    document.addEventListener('contextmenu', (event) => {
      const selectedText = window.getSelection().toString().trim();
      if (selectedText) {
        // Store selected text for context menu action
        this.selectedText = selectedText;
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'getSelectedText':
          sendResponse({ selectedText: window.getSelection().toString() });
          break;

        case 'highlightText':
          this.highlightText(message.text);
          break;

        case 'toggle':
          this.isEnabled = !this.isEnabled;
          if (!this.isEnabled) {
            this.hideTooltip();
            this.hideQuickResult();
          }
          break;

        default:
          break;
      }
    });
  }

  highlightText(searchText) {
    if (!searchText) return;

    // Remove existing highlights
    this.removeHighlights();

    // Simple text highlighting
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;

    while (node = walker.nextNode()) {
      if (node.textContent.toLowerCase().includes(searchText.toLowerCase())) {
        textNodes.push(node);
      }
    }

    textNodes.forEach(textNode => {
      const parent = textNode.parentNode;
      if (parent && parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE') {
        const content = textNode.textContent;
        const regex = new RegExp(`(${this.escapeRegExp(searchText)})`, 'gi');
        const highlightedContent = content.replace(regex, '<mark class="athena-highlight">$1</mark>');

        if (highlightedContent !== content) {
          const wrapper = document.createElement('span');
          wrapper.innerHTML = highlightedContent;
          parent.replaceChild(wrapper, textNode);
        }
      }
    });
  }

  removeHighlights() {
    const highlights = document.querySelectorAll('.athena-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  injectStyles() {
    if (document.getElementById('athena-content-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'athena-content-styles';
    styles.textContent = `
      .athena-highlight {
        background-color: #fef3c7 !important;
        color: #92400e !important;
        padding: 2px 4px !important;
        border-radius: 3px !important;
      }

      .athena-tooltip {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        pointer-events: none !important;
      }

      .athena-tooltip-content {
        background: #1f2937 !important;
        border-radius: 8px !important;
        padding: 8px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        pointer-events: auto !important;
        position: relative !important;
      }

      .athena-fact-check-btn {
        background: #667eea !important;
        color: white !important;
        border: none !important;
        padding: 8px 12px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        transition: background-color 0.2s !important;
      }

      .athena-fact-check-btn:hover {
        background: #5a6fd8 !important;
      }

      .athena-tooltip-arrow {
        position: absolute !important;
        bottom: -6px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 0 !important;
        height: 0 !important;
        border-left: 6px solid transparent !important;
        border-right: 6px solid transparent !important;
        border-top: 6px solid #1f2937 !important;
      }

      .athena-quick-result {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        max-width: 300px !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        backdrop-filter: blur(10px) !important;
      }

      .athena-result-content {
        background: white !important;
        border: 1px solid #e5e7eb !important;
        padding: 16px !important;
        color: #1f2937 !important;
      }

      .athena-result-content.loading {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        color: #6b7280 !important;
      }

      .athena-result-content.error {
        background: #fef2f2 !important;
        border-color: #fecaca !important;
        color: #dc2626 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }

      .athena-result-content.supported {
        border-left: 4px solid #16a34a !important;
      }

      .athena-result-content.refuted {
        border-left: 4px solid #dc2626 !important;
      }

      .athena-loading-spinner {
        width: 16px !important;
        height: 16px !important;
        border: 2px solid #e5e7eb !important;
        border-top: 2px solid #667eea !important;
        border-radius: 50% !important;
        animation: athena-spin 1s linear infinite !important;
      }

      @keyframes athena-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .athena-result-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-bottom: 8px !important;
      }

      .athena-verdict {
        font-weight: 600 !important;
        font-size: 14px !important;
      }

      .athena-confidence {
        font-weight: 700 !important;
        color: #667eea !important;
      }

      .athena-result-text {
        font-size: 13px !important;
        line-height: 1.4 !important;
        margin-bottom: 12px !important;
        color: #4b5563 !important;
      }

      .athena-result-actions {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }

      .athena-details-btn {
        background: #667eea !important;
        color: white !important;
        border: none !important;
        padding: 6px 12px !important;
        border-radius: 4px !important;
        font-size: 12px !important;
        cursor: pointer !important;
        font-weight: 500 !important;
      }

      .athena-details-btn:hover {
        background: #5a6fd8 !important;
      }

      .athena-close-btn {
        background: none !important;
        border: none !important;
        font-size: 18px !important;
        color: #9ca3af !important;
        cursor: pointer !important;
        padding: 4px !important;
        line-height: 1 !important;
      }

      .athena-close-btn:hover {
        color: #6b7280 !important;
      }
    `;

    document.head.appendChild(styles);
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AthenaContentScript();
  });
} else {
  new AthenaContentScript();
}