// Athena Fact Checker Background Service Worker

class AthenaServiceWorker {
    constructor() {
        this.apiEndpoint = 'http://localhost:8000';
        this.activeFactChecks = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.setupContextMenu();
    }

    setupEventListeners() {
        // Extension installation/update
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstall(details);
        });

        // Message handling
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep the message channel open for async responses
        });

        // Context menu clicks
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });

        // Tab updates (for page analysis)
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });

        // Storage changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            this.handleStorageChange(changes, namespace);
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['apiEndpoint', 'autoFactCheck', 'highlightResults']);

            if (result.apiEndpoint) {
                this.apiEndpoint = result.apiEndpoint;
            }

            // Set default settings if not already set
            const defaultSettings = {
                apiEndpoint: 'http://localhost:8000',
                autoFactCheck: false,
                highlightResults: true,
                contextMenuEnabled: true
            };

            const settingsToSet = {};
            for (const [key, value] of Object.entries(defaultSettings)) {
                if (!(key in result)) {
                    settingsToSet[key] = value;
                }
            }

            if (Object.keys(settingsToSet).length > 0) {
                await chrome.storage.sync.set(settingsToSet);
            }

        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    setupContextMenu() {
        chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({
                id: 'athena-fact-check',
                title: 'Fact-check with Athena',
                contexts: ['selection']
            });

            chrome.contextMenus.create({
                id: 'athena-analyze-page',
                title: 'Analyze page with Athena',
                contexts: ['page']
            });

            chrome.contextMenus.create({
                id: 'athena-separator',
                type: 'separator',
                contexts: ['selection', 'page']
            });

            chrome.contextMenus.create({
                id: 'athena-open-popup',
                title: 'Open Athena',
                contexts: ['selection', 'page']
            });
        });
    }

    handleInstall(details) {
        console.log('Athena extension installed/updated:', details.reason);

        if (details.reason === 'install') {
            // Open welcome page or options page on first install
            chrome.tabs.create({
                url: chrome.runtime.getURL('options/options.html')
            });
        }

        // Set up badge
        chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'factCheck':
                    await this.handleFactCheckRequest(message, sender, sendResponse);
                    break;

                case 'getPageContent':
                    await this.handleGetPageContent(message, sender, sendResponse);
                    break;

                case 'updateSettings':
                    await this.handleUpdateSettings(message, sendResponse);
                    break;

                case 'getSettings':
                    await this.handleGetSettings(sendResponse);
                    break;

                case 'testConnection':
                    await this.handleTestConnection(sendResponse);
                    break;

                case 'getHistory':
                    await this.handleGetHistory(sendResponse);
                    break;

                case 'clearHistory':
                    await this.handleClearHistory(sendResponse);
                    break;

                default:
                    console.warn('Unknown message action:', message.action);
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }

    async handleFactCheckRequest(message, sender, sendResponse) {
        const { text, source, url, title } = message;
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        console.log('Starting fact-check:', { taskId, text: text.substring(0, 100), source });

        try {
            // Store the active fact-check
            this.activeFactChecks.set(taskId, {
                text,
                source,
                url: url || sender.tab?.url,
                title: title || sender.tab?.title,
                tabId: sender.tab?.id,
                startTime: Date.now()
            });

            // Update badge to show activity
            if (sender.tab?.id) {
                chrome.action.setBadgeText({ text: '...', tabId: sender.tab.id });
            }

            // Make API request
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
            console.log('Fact-check API response:', result);

            // Start polling for results
            this.pollForResults(taskId, result.task_id || taskId);

            sendResponse({
                success: true,
                taskId,
                message: 'Fact-check started successfully'
            });

        } catch (error) {
            console.error('Error starting fact-check:', error);

            // Clean up
            this.activeFactChecks.delete(taskId);
            if (sender.tab?.id) {
                chrome.action.setBadgeText({ text: '', tabId: sender.tab.id });
            }

            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    async pollForResults(taskId, apiTaskId) {
        const maxAttempts = 30;
        let attempts = 0;

        const poll = async () => {
            attempts++;

            try {
                const response = await fetch(`${this.apiEndpoint}/api/fact-check-result`);

                if (response.ok) {
                    const data = await response.json();

                    // Check if we have a real result
                    if (data.verdict && data.verdict !== 'Processing' && data.response && !data.response.includes('processing')) {
                        await this.handleFactCheckResult(taskId, data);
                        return;
                    }
                }

                // Continue polling if we haven't reached max attempts
                if (attempts < maxAttempts && this.activeFactChecks.has(taskId)) {
                    setTimeout(poll, 2000);
                } else {
                    throw new Error('Timeout or task cancelled');
                }

            } catch (error) {
                console.error('Error polling results:', error);
                await this.handleFactCheckError(taskId, error.message);
            }
        };

        // Start polling after a short delay
        setTimeout(poll, 1000);
    }

    async handleFactCheckResult(taskId, result) {
        const factCheck = this.activeFactChecks.get(taskId);
        if (!factCheck) return;

        console.log('Fact-check result received:', { taskId, result });

        try {
            // Store result in history
            await this.saveFactCheckToHistory({
                ...factCheck,
                result,
                completedTime: Date.now()
            });

            // Update badge
            if (factCheck.tabId) {
                const isFactual = result.verdict?.toLowerCase().includes('true') ||
                                 result.verdict?.toLowerCase().includes('supported');
                const isFalse = result.verdict?.toLowerCase().includes('false') ||
                               result.verdict?.toLowerCase().includes('refuted');

                const badgeText = isFactual ? '✓' : isFalse ? '✗' : '?';
                const badgeColor = isFactual ? '#38a169' : isFalse ? '#e53e3e' : '#d69e2e';

                chrome.action.setBadgeText({ text: badgeText, tabId: factCheck.tabId });
                chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: factCheck.tabId });

                // Clear badge after 10 seconds
                setTimeout(() => {
                    chrome.action.setBadgeText({ text: '', tabId: factCheck.tabId });
                }, 10000);
            }

            // Send result to content script if needed
            if (factCheck.tabId && factCheck.source === 'content_script') {
                chrome.tabs.sendMessage(factCheck.tabId, {
                    action: 'factCheckResult',
                    taskId,
                    result,
                    originalText: factCheck.text
                }).catch(() => {
                    // Content script might not be available, that's okay
                });
            }

            // Send result to popup if it's open
            chrome.runtime.sendMessage({
                action: 'factCheckComplete',
                taskId,
                result,
                originalText: factCheck.text
            }).catch(() => {
                // Popup might not be open, that's okay
            });

        } catch (error) {
            console.error('Error handling fact-check result:', error);
        } finally {
            // Clean up
            this.activeFactChecks.delete(taskId);
        }
    }

    async handleFactCheckError(taskId, error) {
        const factCheck = this.activeFactChecks.get(taskId);
        if (!factCheck) return;

        console.error('Fact-check error:', { taskId, error });

        // Update badge to show error
        if (factCheck.tabId) {
            chrome.action.setBadgeText({ text: '!', tabId: factCheck.tabId });
            chrome.action.setBadgeBackgroundColor({ color: '#e53e3e', tabId: factCheck.tabId });

            // Clear badge after 5 seconds
            setTimeout(() => {
                chrome.action.setBadgeText({ text: '', tabId: factCheck.tabId });
            }, 5000);
        }

        // Clean up
        this.activeFactChecks.delete(taskId);
    }

    async handleContextMenuClick(info, tab) {
        switch (info.menuItemId) {
            case 'athena-fact-check':
                if (info.selectionText) {
                    // Send fact-check request
                    await this.handleFactCheckRequest({
                        action: 'factCheck',
                        text: info.selectionText,
                        source: 'context_menu',
                        url: tab.url,
                        title: tab.title
                    }, { tab }, () => {});
                }
                break;

            case 'athena-analyze-page':
                // Send message to content script to analyze page
                chrome.tabs.sendMessage(tab.id, {
                    action: 'getPageContent'
                }).then(response => {
                    if (response && response.pageContent) {
                        this.handleFactCheckRequest({
                            action: 'factCheck',
                            text: response.pageContent.mainContent?.substring(0, 1000) || response.pageContent.title,
                            source: 'page_analysis',
                            url: tab.url,
                            title: tab.title
                        }, { tab }, () => {});
                    }
                }).catch(console.error);
                break;

            case 'athena-open-popup':
                // Open the popup (this will be handled by the browser)
                chrome.action.openPopup();
                break;
        }
    }

    handleTabUpdate(tabId, changeInfo, tab) {
        // Clear badge when navigating to a new page
        if (changeInfo.status === 'loading') {
            chrome.action.setBadgeText({ text: '', tabId });
        }
    }

    handleStorageChange(changes, namespace) {
        if (namespace === 'sync' && changes.apiEndpoint) {
            this.apiEndpoint = changes.apiEndpoint.newValue;
            console.log('API endpoint updated:', this.apiEndpoint);
        }
    }

    async saveFactCheckToHistory(factCheckData) {
        try {
            const result = await chrome.storage.local.get(['factCheckHistory']);
            const history = result.factCheckHistory || [];

            const historyItem = {
                id: `history-${Date.now()}`,
                text: factCheckData.text,
                url: factCheckData.url,
                title: factCheckData.title,
                verdict: factCheckData.result.verdict,
                confidence: factCheckData.result.confidence,
                explanation: factCheckData.result.detailed_explanation,
                sources: factCheckData.result.sources || [],
                timestamp: new Date().toISOString(),
                duration: factCheckData.completedTime - factCheckData.startTime
            };

            history.push(historyItem);

            // Keep only last 100 items
            if (history.length > 100) {
                history.splice(0, history.length - 100);
            }

            await chrome.storage.local.set({ factCheckHistory: history });

        } catch (error) {
            console.error('Error saving fact-check to history:', error);
        }
    }

    async handleGetPageContent(message, sender, sendResponse) {
        // This is typically handled by content script, but we can provide fallback
        sendResponse({ success: false, message: 'Use content script for page content extraction' });
    }

    async handleUpdateSettings(message, sendResponse) {
        try {
            await chrome.storage.sync.set(message.settings);

            // Update local values
            if (message.settings.apiEndpoint) {
                this.apiEndpoint = message.settings.apiEndpoint;
            }

            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleGetSettings(sendResponse) {
        try {
            const result = await chrome.storage.sync.get([
                'apiEndpoint',
                'autoFactCheck',
                'highlightResults',
                'contextMenuEnabled'
            ]);
            sendResponse({ success: true, settings: result });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleTestConnection(sendResponse) {
        try {
            const response = await fetch(`${this.apiEndpoint}/api/health`, {
                method: 'GET'
            });

            if (response.ok) {
                const data = await response.json();
                sendResponse({
                    success: true,
                    status: 'connected',
                    data
                });
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            sendResponse({
                success: false,
                status: 'error',
                error: error.message
            });
        }
    }

    async handleGetHistory(sendResponse) {
        try {
            const result = await chrome.storage.local.get(['factCheckHistory']);
            sendResponse({
                success: true,
                history: result.factCheckHistory || []
            });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleClearHistory(sendResponse) {
        try {
            await chrome.storage.local.remove(['factCheckHistory']);
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
}

// Initialize the service worker
const athenaServiceWorker = new AthenaServiceWorker();