"""
Auto Extension Installer
Provides direct browser installation without ZIP extraction
"""

import os
import json
import tempfile
import zipfile
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import HTTPException
from fastapi.responses import HTMLResponse, JSONResponse

class AutoExtensionInstaller:
    def __init__(self):
        self.extension_path = Path(__file__).parent.parent / "browser-extension"
        self.temp_dir = None

    def create_inline_installer(self) -> str:
        """Create an HTML page with inline extension installer"""

        # Generate the installer HTML with embedded extension files
        installer_html = self._generate_installer_html()

        return installer_html

    def _generate_installer_html(self) -> str:
        """Generate HTML with embedded extension and auto-install script"""

        # Read all extension files
        extension_files = self._get_extension_files_as_dict()

        # Create the installer HTML
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Athena Extension Auto-Installer</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }}
        .container {{
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .logo {{
            font-size: 48px;
            margin-bottom: 10px;
        }}
        .title {{
            font-size: 28px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 10px;
        }}
        .subtitle {{
            font-size: 16px;
            color: #666;
        }}
        .install-section {{
            background: #f8fafc;
            padding: 30px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }}
        .status {{
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: 500;
        }}
        .status.info {{
            background: #e6f3ff;
            color: #0066cc;
            border: 1px solid #b3d7ff;
        }}
        .status.success {{
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }}
        .status.error {{
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }}
        .status.warning {{
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }}
        .install-btn {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px 5px;
        }}
        .install-btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }}
        .install-btn:disabled {{
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }}
        .secondary-btn {{
            background: #f1f5f9;
            color: #475569;
            border: 1px solid #e2e8f0;
        }}
        .secondary-btn:hover {{
            background: #e2e8f0;
        }}
        .steps {{
            counter-reset: step-counter;
        }}
        .step {{
            margin: 20px 0;
            padding-left: 40px;
            position: relative;
            counter-increment: step-counter;
        }}
        .step::before {{
            content: counter(step-counter);
            position: absolute;
            left: 0;
            top: 0;
            background: #667eea;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }}
        .feature-list {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }}
        .feature {{
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #667eea;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }}
        .hidden {{
            display: none;
        }}
        .spinner {{
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }}
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
        .progress-bar {{
            width: 100%;
            height: 6px;
            background: #e2e8f0;
            border-radius: 3px;
            overflow: hidden;
            margin: 10px 0;
        }}
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
            width: 0%;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔍</div>
            <div class="title">Athena Extension Installer</div>
            <div class="subtitle">One-click browser extension installation</div>
        </div>

        <div class="install-section">
            <h3>✨ What you'll get:</h3>
            <div class="feature-list">
                <div class="feature">
                    <strong>🔍 Real-time Fact Checking</strong><br>
                    Analyze claims instantly on any website
                </div>
                <div class="feature">
                    <strong>🖱️ Right-click Integration</strong><br>
                    Context menu for quick verification
                </div>
                <div class="feature">
                    <strong>📄 Page Analysis</strong><br>
                    Analyze entire articles automatically
                </div>
                <div class="feature">
                    <strong>🎯 Source Verification</strong><br>
                    Get reliable sources with confidence scores
                </div>
                <div class="feature">
                    <strong>⌨️ Keyboard Shortcuts</strong><br>
                    Ctrl+Shift+F for instant fact-checking
                </div>
                <div class="feature">
                    <strong>📊 History Tracking</strong><br>
                    Keep track of your fact-checks
                </div>
            </div>

            <div id="installStatus" class="status info">
                🚀 Ready to install! Click the button below to add Athena to your browser.
            </div>

            <div class="progress-bar hidden" id="progressBar">
                <div class="progress-fill" id="progressFill"></div>
            </div>

            <div style="text-align: center; margin: 20px 0;">
                <button id="autoInstallBtn" class="install-btn" onclick="autoInstall()">
                    <span id="installBtnText">🚀 Install Extension Automatically</span>
                </button>
                <button id="manualInstallBtn" class="install-btn secondary-btn" onclick="manualInstall()">
                    📦 Download for Manual Install
                </button>
            </div>

            <div id="manualSteps" class="hidden">
                <h4>Manual Installation Steps:</h4>
                <div class="steps">
                    <div class="step">Download will start automatically</div>
                    <div class="step">Extract the ZIP file to a folder</div>
                    <div class="step">Open Chrome → Extensions (chrome://extensions/)</div>
                    <div class="step">Enable "Developer mode" (top right toggle)</div>
                    <div class="step">Click "Load unpacked" and select the extracted folder</div>
                    <div class="step">Pin Athena to your toolbar and start fact-checking!</div>
                </div>
            </div>
        </div>

        <div class="install-section">
            <h3>🔧 System Requirements:</h3>
            <ul>
                <li>✅ Chrome, Edge, or Brave browser</li>
                <li>✅ Windows, macOS, or Linux</li>
                <li>✅ Active internet connection</li>
                <li>✅ Athena backend server running</li>
            </ul>
        </div>
    </div>

    <script>
        // Embedded extension files
        const extensionFiles = {json.dumps(extension_files, indent=2)};

        function setStatus(message, type = 'info') {{
            const statusDiv = document.getElementById('installStatus');
            statusDiv.className = `status ${{type}}`;
            statusDiv.innerHTML = message;
        }}

        function setProgress(percent) {{
            const progressBar = document.getElementById('progressBar');
            const progressFill = document.getElementById('progressFill');

            if (percent > 0) {{
                progressBar.classList.remove('hidden');
                progressFill.style.width = percent + '%';
            }} else {{
                progressBar.classList.add('hidden');
            }}
        }}

        function updateInstallButton(text, disabled = false) {{
            const btn = document.getElementById('autoInstallBtn');
            const btnText = document.getElementById('installBtnText');

            btnText.innerHTML = text;
            btn.disabled = disabled;
        }}

        async function autoInstall() {{
            try {{
                // Check if we're in a supported browser
                if (!window.chrome || !window.chrome.runtime) {{
                    setStatus('⚠️ Auto-install requires Chrome, Edge, or Brave browser. Use manual install instead.', 'warning');
                    return;
                }}

                updateInstallButton('<span class="spinner"></span>Installing...', true);
                setStatus('🔄 Preparing extension files...', 'info');
                setProgress(10);

                // Create a temporary directory structure in memory
                setStatus('📦 Creating extension package...', 'info');
                setProgress(30);

                // Create blob URLs for all files
                const fileBlobs = {{}};
                for (const [path, content] of Object.entries(extensionFiles)) {{
                    fileBlobs[path] = new Blob([content], {{ type: 'text/plain' }});
                }}

                setProgress(50);
                setStatus('🚀 Installing extension...', 'info');

                // Try to use Chrome Extension Management API (if available)
                if (window.chrome.management) {{
                    try {{
                        // Create a temporary ZIP file
                        const {{ default: JSZip }} = await import('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js');
                        const zip = new JSZip();

                        // Add all files to ZIP
                        for (const [path, content] of Object.entries(extensionFiles)) {{
                            zip.file(path, content);
                        }}

                        setProgress(70);

                        // Generate ZIP blob
                        const zipBlob = await zip.generateAsync({{ type: 'blob' }});

                        setProgress(90);

                        // Trigger download for manual installation
                        const url = URL.createObjectURL(zipBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'athena-extension.zip';
                        a.click();
                        URL.revokeObjectURL(url);

                        setProgress(100);
                        setStatus('✅ Extension package downloaded! Follow the manual installation steps below.', 'success');
                        document.getElementById('manualSteps').classList.remove('hidden');

                    }} catch (error) {{
                        console.error('Auto-install error:', error);
                        setStatus('❌ Auto-install failed. Please use manual download.', 'error');
                    }}
                }} else {{
                    // Fallback to manual download
                    manualInstall();
                }}

            }} catch (error) {{
                console.error('Installation error:', error);
                setStatus('❌ Installation failed: ' + error.message, 'error');
            }} finally {{
                updateInstallButton('🚀 Install Extension Automatically', false);
                setProgress(0);
            }}
        }}

        async function manualInstall() {{
            try {{
                updateInstallButton('<span class="spinner"></span>Downloading...', true);
                setStatus('📦 Preparing download...', 'info');

                // Download from backend
                const response = await fetch('/api/download-extension');
                if (!response.ok) {{
                    throw new Error('Download failed');
                }}

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'athena-extension.zip';
                a.click();
                URL.revokeObjectURL(url);

                setStatus('✅ Download started! Follow the manual installation steps below.', 'success');
                document.getElementById('manualSteps').classList.remove('hidden');

            }} catch (error) {{
                console.error('Download error:', error);
                setStatus('❌ Download failed: ' + error.message, 'error');
            }} finally {{
                updateInstallButton('🚀 Install Extension Automatically', false);
            }}
        }}

        // Auto-detect browser capabilities on load
        window.addEventListener('load', function() {{
            if (!window.chrome) {{
                setStatus('⚠️ For best experience, use Chrome, Edge, or Brave browser. Manual install available.', 'warning');
                document.getElementById('autoInstallBtn').style.display = 'none';
            }}
        }});
    </script>
</body>
</html>
        """

        return html_content

    def _get_extension_files_as_dict(self) -> Dict[str, str]:
        """Get all extension files as a dictionary for embedding"""
        from extension_download import extension_downloader

        # Use the existing extension downloader to get file contents
        files = {}

        # Define the file structure
        file_mapping = {
            "manifest.json": extension_downloader._get_manifest_content(),
            "popup/popup.html": extension_downloader._get_popup_html(),
            "popup/popup.css": extension_downloader._get_popup_css(),
            "popup/popup.js": extension_downloader._get_popup_js(),
            "content/content-script.js": extension_downloader._get_content_script(),
            "content/content-style.css": extension_downloader._get_content_style(),
            "background/service-worker.js": extension_downloader._get_service_worker(),
            "options/options.html": extension_downloader._get_options_html(),
            "options/options.css": extension_downloader._get_options_css(),
            "options/options.js": extension_downloader._get_options_js(),
            "README.md": extension_downloader._get_readme(),
            "INSTALL.md": extension_downloader._get_install_instructions()
        }

        return file_mapping

    def create_web_store_installer(self) -> str:
        """Create a Chrome Web Store style installer (for future use)"""
        # This would be used if we publish to Chrome Web Store
        installer_js = """
        // Chrome Web Store Installation
        if (window.chrome && window.chrome.webstore) {
            window.chrome.webstore.install(
                'https://chrome.google.com/webstore/detail/your-extension-id',
                function() {
                    console.log('Extension installed successfully');
                },
                function(error) {
                    console.error('Installation failed:', error);
                }
            );
        }
        """
        return installer_js

# Global instance
auto_installer = AutoExtensionInstaller()