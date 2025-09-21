// Athena Fact Checker Options Script

class AthenaOptions {
    constructor() {
        this.defaultSettings = {
            apiEndpoint: 'http://localhost:8000',
            autoFactCheck: false,
            highlightResults: true,
            contextMenuEnabled: true
        };
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        await this.loadStats();
    }

    setupEventListeners() {
        // Save button
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Test connection button
        document.getElementById('testConnectionBtn').addEventListener('click', () => {
            this.testConnection();
        });

        // Data management buttons
        document.getElementById('exportHistoryBtn').addEventListener('click', () => {
            this.exportHistory();
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        // Support links
        document.getElementById('helpLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.openHelp();
        });

        document.getElementById('reportIssueLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.reportIssue();
        });

        document.getElementById('privacyLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.openPrivacy();
        });

        document.getElementById('sourceCodeLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.openSourceCode();
        });

        // Auto-save on settings change
        const settingInputs = document.querySelectorAll('#apiEndpoint, #autoFactCheck, #highlightResults, #contextMenuEnabled');
        settingInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.autoSave();
            });
        });

        // API endpoint validation
        document.getElementById('apiEndpoint').addEventListener('blur', () => {
            this.validateApiEndpoint();
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(Object.keys(this.defaultSettings));

            // Set values or defaults
            for (const [key, defaultValue] of Object.entries(this.defaultSettings)) {
                const value = result[key] !== undefined ? result[key] : defaultValue;
                this.setFormValue(key, value);
            }

        } catch (error) {
            console.error('Error loading settings:', error);
            this.showMessage('Error loading settings', 'error');
        }
    }

    setFormValue(key, value) {
        const element = document.getElementById(key);
        if (!element) return;

        if (element.type === 'checkbox') {
            element.checked = value;
        } else {
            element.value = value;
        }
    }

    getFormValue(key) {
        const element = document.getElementById(key);
        if (!element) return this.defaultSettings[key];

        if (element.type === 'checkbox') {
            return element.checked;
        } else {
            return element.value;
        }
    }

    async saveSettings() {
        const saveBtn = document.getElementById('saveBtn');
        const saveStatus = document.getElementById('saveStatus');

        // Show saving state
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        saveStatus.textContent = '';

        try {
            const settings = {};

            for (const key of Object.keys(this.defaultSettings)) {
                settings[key] = this.getFormValue(key);
            }

            // Validate API endpoint
            if (settings.apiEndpoint && !this.isValidUrl(settings.apiEndpoint)) {
                throw new Error('Invalid API endpoint URL');
            }

            await chrome.storage.sync.set(settings);

            // Show success
            saveBtn.textContent = 'Saved!';
            saveStatus.textContent = 'Settings saved successfully';
            saveStatus.className = 'save-status success';

            this.showMessage('Settings saved successfully', 'success');

            // Reset button after delay
            setTimeout(() => {
                saveBtn.textContent = 'Save Settings';
                saveBtn.disabled = false;
                saveStatus.textContent = '';
            }, 2000);

        } catch (error) {
            console.error('Error saving settings:', error);

            saveBtn.textContent = 'Save Settings';
            saveBtn.disabled = false;
            saveStatus.textContent = `Error: ${error.message}`;
            saveStatus.className = 'save-status error';

            this.showMessage(`Error saving settings: ${error.message}`, 'error');
        }
    }

    async autoSave() {
        // Debounced auto-save
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveSettings();
        }, 1000);
    }

    async testConnection() {
        const testBtn = document.getElementById('testConnectionBtn');
        const connectionStatus = document.getElementById('connectionStatus');
        const apiEndpoint = document.getElementById('apiEndpoint').value;

        if (!apiEndpoint) {
            this.showConnectionStatus('Please enter an API endpoint', 'error');
            return;
        }

        if (!this.isValidUrl(apiEndpoint)) {
            this.showConnectionStatus('Invalid URL format', 'error');
            return;
        }

        // Show testing state
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
        this.showConnectionStatus('Testing connection...', 'testing');

        try {
            const response = await fetch(`${apiEndpoint}/api/health`, {
                method: 'GET',
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                this.showConnectionStatus(
                    `✓ Connected successfully (${data.status})`,
                    'success'
                );
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            let errorMessage = 'Connection failed';

            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot reach server. Make sure the backend is running.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Connection timeout. Server may be slow or unreachable.';
            } else {
                errorMessage = `Connection failed: ${error.message}`;
            }

            this.showConnectionStatus(`✗ ${errorMessage}`, 'error');

        } finally {
            testBtn.disabled = false;
            testBtn.textContent = 'Test';
        }
    }

    showConnectionStatus(message, type) {
        const connectionStatus = document.getElementById('connectionStatus');
        connectionStatus.textContent = message;
        connectionStatus.className = `connection-status ${type}`;
    }

    validateApiEndpoint() {
        const apiEndpoint = document.getElementById('apiEndpoint').value;
        if (apiEndpoint && !this.isValidUrl(apiEndpoint)) {
            this.showConnectionStatus('Invalid URL format', 'error');
        } else {
            document.getElementById('connectionStatus').style.display = 'none';
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    async loadStats() {
        try {
            // Get history data
            const historyResult = await chrome.storage.local.get(['factCheckHistory']);
            const history = historyResult.factCheckHistory || [];

            // Update display
            document.getElementById('historyCount').textContent = history.length;
            document.getElementById('totalFactChecks').textContent = history.length;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async exportHistory() {
        try {
            const result = await chrome.storage.local.get(['factCheckHistory']);
            const history = result.factCheckHistory || [];

            if (history.length === 0) {
                this.showMessage('No history to export', 'info');
                return;
            }

            // Create CSV content
            const csvContent = this.formatHistoryAsCSV(history);

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `athena-fact-check-history-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showMessage('History exported successfully', 'success');

        } catch (error) {
            console.error('Error exporting history:', error);
            this.showMessage('Error exporting history', 'error');
        }
    }

    formatHistoryAsCSV(history) {
        const headers = ['Date', 'Text', 'Verdict', 'Confidence', 'URL', 'Duration (ms)'];
        const csvRows = [headers.join(',')];

        history.forEach(item => {
            const row = [
                `"${new Date(item.timestamp).toISOString()}"`,
                `"${(item.text || '').replace(/"/g, '""')}"`,
                `"${item.verdict || ''}"`,
                item.confidence || 0,
                `"${item.url || ''}"`,
                item.duration || 0
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    async clearHistory() {
        if (!confirm('Are you sure you want to clear all fact-check history? This action cannot be undone.')) {
            return;
        }

        try {
            await chrome.storage.local.remove(['factCheckHistory']);
            await this.loadStats();
            this.showMessage('History cleared successfully', 'success');

        } catch (error) {
            console.error('Error clearing history:', error);
            this.showMessage('Error clearing history', 'error');
        }
    }

    openHelp() {
        const helpContent = `
Athena Fact Checker Help

GETTING STARTED:
1. Set your API endpoint in the Connection Settings
2. Test the connection to ensure your backend is running
3. Configure your preferred behavior settings

USING THE EXTENSION:
• Click the Athena icon in your browser toolbar to open the popup
• Select text on any webpage and right-click to fact-check
• Use Ctrl+Shift+F to quickly fact-check selected text
• Click "Analyze Page" to fact-check the main content of a page

SETTINGS EXPLAINED:
• API Endpoint: URL of your Athena backend server
• Highlight Results: Show color-coded highlights on fact-checked text
• Context Menu: Enable right-click menu for quick fact-checking
• Auto Fact-Check: Automatically check claims as you browse (experimental)

TROUBLESHOOTING:
• Connection Failed: Ensure your backend server is running
• No Results: Check that your API endpoint is correct
• Extension Not Working: Try refreshing the page or restarting your browser

For more help, check the documentation or report an issue.
        `;

        alert(helpContent);
    }

    reportIssue() {
        const issueTemplate = `
Please describe the issue you're experiencing:

Steps to reproduce:
1.
2.
3.

Expected behavior:


Actual behavior:


Extension version: 1.0.0
Browser: ${navigator.userAgent}
API Endpoint: ${document.getElementById('apiEndpoint').value}

Additional information:

        `;

        // Open mailto with issue template
        const subject = encodeURIComponent('Athena Fact Checker - Issue Report');
        const body = encodeURIComponent(issueTemplate);
        window.open(`mailto:support@athena.com?subject=${subject}&body=${body}`);
    }

    openPrivacy() {
        const privacyContent = `
Athena Fact Checker Privacy Policy

DATA COLLECTION:
• We only collect fact-check queries and results for functionality
• No personal information is transmitted to external servers
• All data is stored locally in your browser

DATA USAGE:
• Fact-check history is stored locally for your convenience
• You can export or clear your data at any time
• No data is shared with third parties

API COMMUNICATION:
• Extension communicates only with your configured backend server
• Text you fact-check is sent to the API for analysis
• Results are returned and stored locally

YOUR RIGHTS:
• Full control over your data through extension settings
• Ability to export all your fact-check history
• Option to clear all stored data at any time

SECURITY:
• All communication uses secure protocols when available
• Local storage is encrypted by your browser
• No tracking or analytics are performed

For questions about privacy, contact: privacy@athena.com
Last updated: ${new Date().toISOString().split('T')[0]}
        `;

        alert(privacyContent);
    }

    openSourceCode() {
        // Open source code repository
        window.open('https://github.com/athena/fact-checker-extension', '_blank');
    }

    showMessage(text, type = 'info') {
        const container = document.getElementById('messageContainer');
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        container.appendChild(message);

        // Remove message after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AthenaOptions();
});