"""
Athena Browser Extension Download Service
Generates and serves the browser extension as a downloadable ZIP file
"""

import os
import zipfile
import tempfile
import shutil
from pathlib import Path
from fastapi import HTTPException
from fastapi.responses import FileResponse

class ExtensionDownloader:
    def __init__(self):
        self.extension_path = Path(__file__).parent.parent / "browser-extension"

    def create_extension_zip(self):
        """Create a ZIP file containing all extension files"""
        try:
            # Create temporary directory for the ZIP file
            temp_dir = tempfile.mkdtemp()
            zip_path = os.path.join(temp_dir, "athena-extension.zip")

            # Create ZIP file
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                # Add all extension files
                self._add_files_to_zip(zipf)

            return zip_path

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create extension package: {str(e)}")

    def _add_files_to_zip(self, zipf):
        """Add all extension files to the ZIP"""

        # Define the file structure and content
        files_to_add = {
            "manifest.json": self._get_manifest_content(),
            "popup/popup.html": self._get_popup_html(),
            "popup/popup.css": self._get_popup_css(),
            "popup/popup.js": self._get_popup_js(),
            "content/content-script.js": self._get_content_script(),
            "content/content-style.css": self._get_content_style(),
            "background/service-worker.js": self._get_service_worker(),
            "options/options.html": self._get_options_html(),
            "options/options.css": self._get_options_css(),
            "options/options.js": self._get_options_js(),
            "icons/create-icons.html": self._get_icon_generator(),
            "README.md": self._get_readme(),
            "INSTALL.md": self._get_install_instructions()
        }

        # Add files to ZIP
        for file_path, content in files_to_add.items():
            zipf.writestr(file_path, content)

    def _get_manifest_content(self):
        """Get manifest.json content"""
        return """{
  "manifest_version": 3,
  "name": "Athena Fact Checker",
  "version": "1.0.0",
  "description": "AI-powered fact-checking extension to verify information on any website",

  "permissions": [
    "activeTab",
    "storage",
    "contextMenus",
    "scripting"
  ],

  "host_permissions": [
    "http://localhost:8000/*",
    "https://*/*",
    "http://*/*"
  ],

  "background": {
    "service_worker": "background/service-worker.js"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content-script.js"],
      "css": ["content/content-style.css"],
      "run_at": "document_idle"
    }
  ],

  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "Athena Fact Checker",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "options_page": "options/options.html",

  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },

  "web_accessible_resources": [
    {
      "resources": ["icons/*", "popup/*"],
      "matches": ["<all_urls>"]
    }
  ]
}"""

    def _read_extension_file(self, file_path):
        """Read content from extension file"""
        try:
            full_path = self.extension_path / file_path
            if full_path.exists():
                return full_path.read_text(encoding='utf-8')
            return ""
        except Exception:
            return ""

    def _get_popup_html(self):
        """Get popup HTML content"""
        return self._read_extension_file("popup/popup.html") or self._get_default_popup_html()

    def _get_popup_css(self):
        """Get popup CSS content"""
        return self._read_extension_file("popup/popup.css") or self._get_default_popup_css()

    def _get_popup_js(self):
        """Get popup JS content"""
        return self._read_extension_file("popup/popup.js") or self._get_default_popup_js()

    def _get_content_script(self):
        """Get content script content"""
        return self._read_extension_file("content/content-script.js") or self._get_default_content_script()

    def _get_content_style(self):
        """Get content style content"""
        return self._read_extension_file("content/content-style.css") or self._get_default_content_style()

    def _get_service_worker(self):
        """Get service worker content"""
        return self._read_extension_file("background/service-worker.js") or self._get_default_service_worker()

    def _get_options_html(self):
        """Get options HTML content"""
        return self._read_extension_file("options/options.html") or self._get_default_options_html()

    def _get_options_css(self):
        """Get options CSS content"""
        return self._read_extension_file("options/options.css") or self._get_default_options_css()

    def _get_options_js(self):
        """Get options JS content"""
        return self._read_extension_file("options/options.js") or self._get_default_options_js()

    def _get_icon_generator(self):
        """Get icon generator content"""
        return self._read_extension_file("icons/create-icons.html") or self._get_default_icon_generator()

    def _get_readme(self):
        """Get README content"""
        return self._read_extension_file("README.md") or self._get_default_readme()

    def _get_install_instructions(self):
        """Get installation instructions"""
        return """# Athena Extension Installation Guide

## Quick Start

1. **Download Complete**: You now have the Athena browser extension files
2. **Extract ZIP**: Unzip the downloaded file to a folder on your computer
3. **Open Chrome**: Launch Chrome, Edge, or Brave browser
4. **Extensions Page**: Navigate to `chrome://extensions/`
5. **Developer Mode**: Enable "Developer mode" toggle (top right)
6. **Load Extension**: Click "Load unpacked" and select the extracted folder
7. **Start Using**: The Athena extension is now active!

## Features

- **Text Selection**: Highlight text on any webpage to fact-check
- **Right-Click Menu**: Context menu for quick verification
- **Extension Popup**: Full interface from toolbar icon
- **Settings Page**: Customize behavior and API connection

## Configuration

1. Click the Athena extension icon
2. Go to Settings (gear icon)
3. Verify API endpoint (default: http://localhost:8000)
4. Test connection to ensure backend is running

## Troubleshooting

- **Extension not working**: Ensure your Athena backend is running
- **Connection failed**: Check API endpoint in settings
- **No results**: Verify backend is accessible at configured URL

## Support

Need help? Check our documentation or contact support.

Happy fact-checking! 🔍✨
"""

    def _get_default_popup_html(self):
        """Default popup HTML if file doesn't exist"""
        return """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Athena Fact Checker</title>
    <link rel="stylesheet" href="popup.css">
</head>
<body>
    <div class="container">
        <h1>Athena Fact Checker</h1>
        <p>Your AI-powered fact-checking assistant</p>
        <textarea id="textInput" placeholder="Enter text to fact-check..."></textarea>
        <button id="checkBtn">Fact Check</button>
        <div id="results"></div>
    </div>
    <script src="popup.js"></script>
</body>
</html>"""

    def _get_default_popup_css(self):
        """Default popup CSS"""
        return """body { width: 300px; padding: 16px; font-family: Arial, sans-serif; }
.container { display: flex; flex-direction: column; gap: 12px; }
textarea { min-height: 80px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
button { padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; }
button:hover { background: #5a6fd8; }"""

    def _get_default_popup_js(self):
        """Default popup JS"""
        return """document.getElementById('checkBtn').addEventListener('click', async () => {
    const text = document.getElementById('textInput').value;
    const resultsDiv = document.getElementById('results');

    if (!text.trim()) return;

    resultsDiv.innerHTML = 'Analyzing...';

    try {
        const response = await fetch('http://localhost:8000/api/fact-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, pipeline: 'fact' })
        });

        if (response.ok) {
            resultsDiv.innerHTML = 'Analysis started! Check results in a moment.';
        } else {
            resultsDiv.innerHTML = 'Error: Could not start analysis';
        }
    } catch (error) {
        resultsDiv.innerHTML = 'Error: Could not connect to server';
    }
});"""

    def _get_default_content_script(self):
        """Default content script"""
        return """console.log('Athena extension content script loaded');

document.addEventListener('mouseup', () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText && selectedText.length > 0) {
        console.log('Text selected:', selectedText);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getSelectedText') {
        sendResponse({ selectedText: window.getSelection().toString() });
    }
});"""

    def _get_default_content_style(self):
        """Default content style"""
        return """.athena-highlight { background-color: yellow !important; }"""

    def _get_default_service_worker(self):
        """Default service worker"""
        return """chrome.runtime.onInstalled.addListener(() => {
    console.log('Athena extension installed');

    chrome.contextMenus.create({
        id: 'athena-fact-check',
        title: 'Fact-check with Athena',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'athena-fact-check' && info.selectionText) {
        console.log('Fact-checking:', info.selectionText);
    }
});"""

    def _get_default_options_html(self):
        """Default options HTML"""
        return """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Athena Settings</title>
    <link rel="stylesheet" href="options.css">
</head>
<body>
    <h1>Athena Extension Settings</h1>
    <div class="setting">
        <label>API Endpoint:</label>
        <input type="url" id="apiEndpoint" value="http://localhost:8000" />
    </div>
    <button id="saveBtn">Save Settings</button>
    <script src="options.js"></script>
</body>
</html>"""

    def _get_default_options_css(self):
        """Default options CSS"""
        return """body { font-family: Arial, sans-serif; padding: 20px; }
.setting { margin: 16px 0; }
label { display: block; margin-bottom: 4px; }
input { width: 300px; padding: 8px; }
button { padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; }"""

    def _get_default_options_js(self):
        """Default options JS"""
        return """document.getElementById('saveBtn').addEventListener('click', () => {
    const apiEndpoint = document.getElementById('apiEndpoint').value;
    chrome.storage.sync.set({ apiEndpoint }, () => {
        alert('Settings saved!');
    });
});

chrome.storage.sync.get(['apiEndpoint'], (result) => {
    if (result.apiEndpoint) {
        document.getElementById('apiEndpoint').value = result.apiEndpoint;
    }
});"""

    def _get_default_icon_generator(self):
        """Default icon generator"""
        return """<!DOCTYPE html>
<html>
<head><title>Generate Icons</title></head>
<body>
    <h1>Icon Generator</h1>
    <p>Create PNG icons with sizes: 16x16, 32x32, 48x48, 128x128</p>
    <p>Save them as icon16.png, icon32.png, icon48.png, icon128.png in the icons/ folder</p>
</body>
</html>"""

    def _get_default_readme(self):
        """Default README"""
        return """# Athena Browser Extension

AI-powered fact-checking extension for Chrome, Edge, and Brave browsers.

## Installation

1. Extract this ZIP file
2. Open Chrome and go to chrome://extensions/
3. Enable Developer mode
4. Click "Load unpacked" and select the extracted folder

## Usage

- Select text on any webpage to fact-check
- Right-click for context menu options
- Click extension icon for full interface

## Configuration

- Click extension icon → Settings
- Set API endpoint (default: http://localhost:8000)
- Ensure your Athena backend is running

Enjoy fact-checking! 🔍
"""

# Global instance
extension_downloader = ExtensionDownloader()