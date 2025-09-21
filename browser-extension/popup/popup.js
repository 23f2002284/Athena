// Athena Fact Checker Popup Script

class AthenaPopup {
    constructor() {
        this.apiEndpoint = 'http://localhost:8000';
        this.isFactChecking = false;
        this.currentTab = null;
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.checkConnection();
        this.getCurrentTab();
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['apiEndpoint']);
            if (result.apiEndpoint) {
                this.apiEndpoint = result.apiEndpoint;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;
        } catch (error) {
            console.error('Error getting current tab:', error);
        }
    }

    setupEventListeners() {
        // Fact check button
        document.getElementById('factCheckBtn').addEventListener('click', () => {
            this.handleFactCheck();
        });

        // Get selected text button
        document.getElementById('getSelectedBtn').addEventListener('click', () => {
            this.getSelectedText();
        });

        // Analyze page button
        document.getElementById('analyzePageBtn').addEventListener('click', () => {
            this.analyzePage();
        });

        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        // History button
        document.getElementById('historyBtn').addEventListener('click', () => {
            this.showHistory();
        });

        // Close results button
        document.getElementById('closeResults').addEventListener('click', () => {
            this.hideResults();
        });

        // Footer links
        document.getElementById('helpLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showHelp();
        });

        document.getElementById('aboutLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAbout();
        });

        // Text input enter key
        document.getElementById('textInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.handleFactCheck();
            }
        });
    }

    async handleFactCheck() {
        const textInput = document.getElementById('textInput');
        const text = textInput.value.trim();

        if (!text) {
            this.showError('Please enter some text to fact-check');
            return;
        }

        if (this.isFactChecking) {
            return;
        }

        this.isFactChecking = true;
        this.showLoading(true);
        this.updateStatus('Fact-checking...', 'loading');

        try {
            // Send fact-check request to backend
            const response = await fetch(`${this.apiEndpoint}/api/fact-check`, {
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

            const result = await response.json();
            console.log('Fact-check started:', result);

            // Start polling for results
            this.pollForResults();

            // Also send message to content script
            if (this.currentTab) {
                chrome.tabs.sendMessage(this.currentTab.id, {
                    action: 'factCheckText',
                    text: text
                }).catch(() => {
                    // Content script might not be loaded, that's okay
                });
            }

        } catch (error) {
            console.error('Error starting fact-check:', error);
            this.showError('Failed to start fact-check. Please check your connection.');
            this.isFactChecking = false;
            this.showLoading(false);
            this.updateStatus('Error', 'error');
        }
    }

    async pollForResults() {
        const maxAttempts = 30; // 30 attempts
        let attempts = 0;

        const poll = async () => {
            attempts++;

            try {
                const response = await fetch(`${this.apiEndpoint}/api/fact-check-result`);

                if (response.ok) {
                    const data = await response.json();

                    // Check if we have a real result (not processing)
                    if (data.verdict && data.verdict !== 'Processing' && data.response && !data.response.includes('processing')) {
                        this.displayResults(data);
                        this.isFactChecking = false;
                        this.showLoading(false);
                        this.updateStatus('Complete', 'connected');
                        return;
                    }
                }

                // Continue polling if we haven't reached max attempts
                if (attempts < maxAttempts) {
                    setTimeout(poll, 2000); // Poll every 2 seconds
                } else {
                    throw new Error('Timeout waiting for results');
                }

            } catch (error) {
                console.error('Error polling results:', error);
                this.showError('Timeout waiting for results. Please try again.');
                this.isFactChecking = false;
                this.showLoading(false);
                this.updateStatus('Error', 'error');
            }
        };

        // Start polling after a short delay
        setTimeout(poll, 1000);
    }

    displayResults(data) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsContent = document.getElementById('resultsContent');

        // Parse the result
        let verdict = data.verdict || 'Unknown';
        let confidence = data.confidence || 50;
        let explanation = data.detailed_explanation || '';

        // Extract verdict and confidence from response if not provided separately
        if (!data.verdict && data.response) {
            const lines = data.response.split('\n');
            if (lines[0]) verdict = lines[0].trim();

            const confidenceMatch = data.response.match(/Confidence:\s*(\d+)%/);
            if (confidenceMatch) confidence = parseInt(confidenceMatch[1]);

            const explanationStart = data.response.indexOf('\n\n');
            if (explanationStart > -1) {
                explanation = data.response.substring(explanationStart + 2).trim();
                explanation = explanation.replace(/\n\nSources verified:.*$/, '').trim();
            }
        }

        // Determine result type
        const isFactual = verdict.toLowerCase().includes('true') || verdict.toLowerCase().includes('supported');
        const isFalse = verdict.toLowerCase().includes('false') || verdict.toLowerCase().includes('refuted');
        const resultType = isFactual ? 'factual' : isFalse ? 'false' : 'insufficient';

        // Create result HTML
        let resultHTML = `
            <div class="result-item ${resultType}">
                <div class="result-verdict ${resultType}">${verdict}</div>
                <div class="result-confidence">Confidence: ${confidence}%</div>
                <div class="result-explanation">${explanation || 'Analysis complete.'}</div>
        `;

        // Add sources if available
        if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
            resultHTML += `
                <div class="result-sources">
                    <h4>Sources:</h4>
                    <div class="source-list">
            `;

            data.sources.forEach(source => {
                if (typeof source === 'object' && source.url && source.title) {
                    resultHTML += `<a href="${source.url}" class="source-link" target="_blank">${source.title}</a>`;
                } else if (typeof source === 'string' && source.startsWith('http')) {
                    resultHTML += `<a href="${source}" class="source-link" target="_blank">${source}</a>`;
                }
            });

            resultHTML += `
                    </div>
                </div>
            `;
        }

        resultHTML += '</div>';

        resultsContent.innerHTML = resultHTML;
        resultsSection.style.display = 'block';

        // Save to history
        this.saveToHistory({
            text: document.getElementById('textInput').value.trim(),
            verdict,
            confidence,
            explanation,
            sources: data.sources || [],
            timestamp: new Date().toISOString()
        });
    }

    async getSelectedText() {
        if (!this.currentTab) {
            this.showError('Unable to access current tab');
            return;
        }

        try {
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'getSelectedText'
            });

            if (response && response.selectedText) {
                document.getElementById('textInput').value = response.selectedText;
            } else {
                this.showError('No text selected on the page');
            }
        } catch (error) {
            console.error('Error getting selected text:', error);
            this.showError('Unable to get selected text. Make sure you have text selected on the page.');
        }
    }

    async analyzePage() {
        if (!this.currentTab) {
            this.showError('Unable to access current tab');
            return;
        }

        try {
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'getPageContent'
            });

            if (response && response.pageContent) {
                // Use the main content for fact-checking
                const content = response.pageContent.mainContent;
                if (content && content.length > 50) {
                    document.getElementById('textInput').value = content.substring(0, 1000) + '...';
                } else {
                    this.showError('Unable to extract meaningful content from this page');
                }
            } else {
                this.showError('Unable to analyze this page');
            }
        } catch (error) {
            console.error('Error analyzing page:', error);
            this.showError('Unable to analyze this page. The page may not support content extraction.');
        }
    }

    openSettings() {
        chrome.runtime.openOptionsPage();
    }

    async showHistory() {
        try {
            const result = await chrome.storage.local.get(['factCheckHistory']);
            const history = result.factCheckHistory || [];

            if (history.length === 0) {
                this.showError('No fact-check history found');
                return;
            }

            // Show recent history in results section
            const resultsSection = document.getElementById('resultsSection');
            const resultsContent = document.getElementById('resultsContent');

            let historyHTML = '<div class="history-list">';

            history.slice(-5).reverse().forEach((item, index) => {
                const date = new Date(item.timestamp).toLocaleDateString();
                const preview = item.text.substring(0, 100) + (item.text.length > 100 ? '...' : '');

                historyHTML += `
                    <div class="history-item" data-index="${index}">
                        <div class="history-preview">${preview}</div>
                        <div class="history-meta">
                            <span class="history-verdict ${item.verdict.toLowerCase().includes('true') ? 'factual' : item.verdict.toLowerCase().includes('false') ? 'false' : 'insufficient'}">${item.verdict}</span>
                            <span class="history-date">${date}</span>
                        </div>
                    </div>
                `;
            });

            historyHTML += '</div>';

            resultsContent.innerHTML = historyHTML;
            resultsSection.style.display = 'block';

            // Add click handlers for history items
            document.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.dataset.index);
                    const historyItem = history[history.length - 1 - index];
                    document.getElementById('textInput').value = historyItem.text;
                    this.hideResults();
                });
            });

        } catch (error) {
            console.error('Error loading history:', error);
            this.showError('Error loading history');
        }
    }

    async saveToHistory(item) {
        try {
            const result = await chrome.storage.local.get(['factCheckHistory']);
            const history = result.factCheckHistory || [];

            history.push(item);

            // Keep only last 50 items
            if (history.length > 50) {
                history.splice(0, history.length - 50);
            }

            await chrome.storage.local.set({ factCheckHistory: history });
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    }

    hideResults() {
        document.getElementById('resultsSection').style.display = 'none';
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        const button = document.getElementById('factCheckBtn');
        const spinner = button.querySelector('.btn-spinner');
        const text = button.querySelector('.btn-text');

        if (show) {
            overlay.style.display = 'flex';
            button.disabled = true;
            spinner.style.display = 'block';
            text.style.opacity = '0';
        } else {
            overlay.style.display = 'none';
            button.disabled = false;
            spinner.style.display = 'none';
            text.style.opacity = '1';
        }
    }

    showError(message) {
        // Simple alert for now - could be improved with a toast notification
        alert(message);
    }

    updateStatus(text, type = 'default') {
        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusDot');

        statusText.textContent = text;
        statusDot.className = `status-dot ${type}`;
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.apiEndpoint}/api/health`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                this.updateStatus('Connected', 'connected');
                document.getElementById('connectionStatus').textContent = this.apiEndpoint;
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            console.error('Connection check failed:', error);
            this.updateStatus('Disconnected', 'error');
            document.getElementById('connectionStatus').textContent = 'Connection failed';
        }
    }

    showHelp() {
        const helpText = `
Athena Fact Checker Help:

1. Enter text in the input field or select text on any webpage
2. Click "Get Selected" to import highlighted text from the page
3. Click "Fact Check" to analyze the information
4. Use "Analyze Page" to fact-check the main content of the current page
5. View your recent fact-checks in History

Keyboard Shortcuts:
- Ctrl+Shift+F: Fact-check selected text on any page
- Ctrl+Enter: Fact-check text in popup

For support, visit the extension settings.
        `;

        alert(helpText);
    }

    showAbout() {
        const aboutText = `
Athena Fact Checker v1.0.0

AI-powered fact-checking extension that helps you verify information across the web.

Features:
- Real-time fact-checking
- Website content analysis
- Source verification
- Fact-check history

Powered by advanced AI models and reliable source verification.

© 2024 Athena Fact Checker
        `;

        alert(aboutText);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AthenaPopup();
});