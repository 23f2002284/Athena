// Athena Fact Checker Content Script
console.log('Athena extension content script loaded');

class AthenaContentScript {
    constructor() {
        this.isHighlighting = false;
        this.selectedText = '';
        this.factCheckFloatingDiv = null;
        this.init();
    }

    init() {
        this.createFactCheckButton();
        this.setupEventListeners();
        this.setupMessageListener();
    }

    setupEventListeners() {
        // Listen for text selection
        document.addEventListener('mouseup', (event) => {
            setTimeout(() => {
                this.handleTextSelection(event);
            }, 10);
        });

        // Listen for keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+F for fact-check
            if (event.ctrlKey && event.shiftKey && event.key === 'F') {
                event.preventDefault();
                this.factCheckSelectedText();
            }
        });

        // Clean up when user clicks elsewhere
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.athena-fact-check-button')) {
                this.hideFactCheckButton();
            }
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'getSelectedText':
                    sendResponse({ selectedText: window.getSelection().toString().trim() });
                    break;

                case 'getPageContent':
                    sendResponse({
                        pageContent: this.extractPageContent(),
                        url: window.location.href,
                        title: document.title
                    });
                    break;

                case 'factCheckText':
                    this.factCheckText(message.text);
                    sendResponse({ success: true });
                    break;

                case 'highlightText':
                    this.highlightText(message.text, message.isFactual);
                    sendResponse({ success: true });
                    break;
            }
        });
    }

    handleTextSelection(event) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText.length > 10) {
            this.selectedText = selectedText;
            this.showFactCheckButton(event);
        } else {
            this.hideFactCheckButton();
        }
    }

    createFactCheckButton() {
        if (this.factCheckFloatingDiv) {
            this.factCheckFloatingDiv.remove();
        }

        this.factCheckFloatingDiv = document.createElement('div');
        this.factCheckFloatingDiv.className = 'athena-fact-check-button';
        this.factCheckFloatingDiv.innerHTML = `
            <div class="athena-button-content">
                <span class="athena-icon">🔍</span>
                <span class="athena-text">Fact Check with Athena</span>
            </div>
        `;

        this.factCheckFloatingDiv.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.factCheckSelectedText();
        });

        this.factCheckFloatingDiv.style.display = 'none';
        document.body.appendChild(this.factCheckFloatingDiv);
    }

    showFactCheckButton(event) {
        if (!this.factCheckFloatingDiv) return;

        const x = event.pageX;
        const y = event.pageY;

        this.factCheckFloatingDiv.style.left = `${x + 10}px`;
        this.factCheckFloatingDiv.style.top = `${y - 40}px`;
        this.factCheckFloatingDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideFactCheckButton();
        }, 5000);
    }

    hideFactCheckButton() {
        if (this.factCheckFloatingDiv) {
            this.factCheckFloatingDiv.style.display = 'none';
        }
    }

    factCheckSelectedText() {
        if (!this.selectedText) return;

        this.hideFactCheckButton();

        // Send to background script for processing
        chrome.runtime.sendMessage({
            action: 'factCheck',
            text: this.selectedText,
            source: 'content_script',
            url: window.location.href,
            title: document.title
        });

        this.showProcessingIndicator();
    }

    factCheckText(text) {
        // Highlight the text being fact-checked
        this.highlightText(text, null, 'processing');

        // Send to background for API call
        chrome.runtime.sendMessage({
            action: 'factCheck',
            text: text,
            source: 'popup',
            url: window.location.href,
            title: document.title
        });
    }

    highlightText(text, isFactual = null, status = 'result') {
        // Remove existing highlights for this text
        this.removeHighlights(text);

        // Find and highlight text
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue.includes(text)) {
                textNodes.push(node);
            }
        }

        textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return;

            const content = textNode.nodeValue;
            const index = content.indexOf(text);

            if (index !== -1) {
                const before = content.substring(0, index);
                const highlighted = content.substring(index, index + text.length);
                const after = content.substring(index + text.length);

                const beforeNode = document.createTextNode(before);
                const afterNode = document.createTextNode(after);

                const highlightSpan = document.createElement('span');
                highlightSpan.className = `athena-highlight athena-${status}`;
                if (isFactual !== null) {
                    highlightSpan.className += isFactual ? ' athena-factual' : ' athena-false';
                }
                highlightSpan.textContent = highlighted;
                highlightSpan.dataset.athenaText = text;

                parent.insertBefore(beforeNode, textNode);
                parent.insertBefore(highlightSpan, textNode);
                parent.insertBefore(afterNode, textNode);
                parent.removeChild(textNode);
            }
        });
    }

    removeHighlights(text = null) {
        const highlights = text
            ? document.querySelectorAll(`[data-athena-text="${text}"]`)
            : document.querySelectorAll('.athena-highlight');

        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.insertBefore(document.createTextNode(highlight.textContent), highlight);
            parent.removeChild(highlight);
            parent.normalize();
        });
    }

    showProcessingIndicator() {
        // Create or update processing indicator
        let indicator = document.querySelector('.athena-processing-indicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'athena-processing-indicator';
            indicator.innerHTML = `
                <div class="athena-processing-content">
                    <div class="athena-spinner"></div>
                    <span>Fact-checking with Athena...</span>
                </div>
            `;
            document.body.appendChild(indicator);
        }

        indicator.style.display = 'block';

        // Auto-hide after 30 seconds
        setTimeout(() => {
            this.hideProcessingIndicator();
        }, 30000);
    }

    hideProcessingIndicator() {
        const indicator = document.querySelector('.athena-processing-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    extractPageContent() {
        // Extract meaningful content from the page
        const content = {
            url: window.location.href,
            title: document.title,
            description: '',
            mainContent: '',
            headings: [],
            links: [],
            images: []
        };

        // Get meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            content.description = metaDesc.getAttribute('content');
        }

        // Extract headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        content.headings = Array.from(headings).map(h => ({
            level: h.tagName.toLowerCase(),
            text: h.textContent.trim()
        }));

        // Extract main content (try to find article or main content areas)
        const mainSelectors = ['article', 'main', '[role="main"]', '.content', '.post', '.article'];
        let mainElement = null;

        for (const selector of mainSelectors) {
            mainElement = document.querySelector(selector);
            if (mainElement) break;
        }

        if (!mainElement) {
            // Fallback to body content
            mainElement = document.body;
        }

        // Get text content, excluding script and style elements
        const clonedElement = mainElement.cloneNode(true);
        const scriptsAndStyles = clonedElement.querySelectorAll('script, style, nav, header, footer, aside');
        scriptsAndStyles.forEach(el => el.remove());

        content.mainContent = clonedElement.textContent
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000); // Limit to 5000 characters

        // Extract important links
        const links = document.querySelectorAll('a[href]');
        content.links = Array.from(links)
            .slice(0, 20) // Limit to 20 links
            .map(link => ({
                url: link.href,
                text: link.textContent.trim()
            }))
            .filter(link => link.text && link.url.startsWith('http'));

        return content;
    }
}

// Initialize the content script
const athenaContentScript = new AthenaContentScript();

// Listen for fact-check results
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'factCheckResult') {
        // Update highlights based on results
        if (message.result && message.originalText) {
            const isFactual = message.result.verdict === 'Likely True' ||
                             message.result.verdict === 'supported';

            athenaContentScript.highlightText(message.originalText, isFactual);
            athenaContentScript.hideProcessingIndicator();
        }
    }
});