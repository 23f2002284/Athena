# Athena Fact Checker Browser Extension

🔍 AI-powered fact-checking extension for Chrome, Edge, and Brave browsers.

## Features

- **Real-time Fact-Checking**: Analyze claims and statements on any webpage
- **Text Selection**: Highlight text and fact-check instantly
- **Page Analysis**: Analyze entire articles or web pages
- **Source Verification**: Get reliable sources for fact-check results
- **Right-Click Integration**: Context menu for quick fact-checking
- **Confidence Scoring**: See how confident the AI is in its assessment
- **History Tracking**: Keep track of your fact-check history
- **Keyboard Shortcuts**: Use Ctrl+Shift+F for quick fact-checking

## Installation

### Method 1: Manual Installation (Recommended)

1. **Download**: Get the extension files from your Athena backend at `/api/download-extension`
2. **Extract**: Unzip the downloaded file to a folder on your computer
3. **Open Browser**: Launch Chrome, Edge, or Brave
4. **Extensions Page**: Navigate to `chrome://extensions/` (or `edge://extensions/`)
5. **Developer Mode**: Enable "Developer mode" toggle (top right corner)
6. **Load Extension**: Click "Load unpacked" and select the extracted folder
7. **Done**: The Athena extension icon should appear in your toolbar

### Method 2: Auto-Install Script

1. **Download Script**: Get the installer script from your Athena backend
2. **Run Script**: Execute the downloaded installer script
3. **Follow Prompts**: The script will download and install the extension automatically

## Setup

### 1. Configure API Connection

1. Click the Athena extension icon in your toolbar
2. Click the settings gear icon (⚙️)
3. Set your **API Endpoint** (default: `http://localhost:8000`)
4. Click **Test** to verify the connection
5. Save your settings

### 2. Start Your Backend

Make sure your Athena backend server is running:

```bash
# In your Athena project directory
cd backend
python main.py
```

The server should start on `http://localhost:8000` by default.

## Usage

### Basic Fact-Checking

1. **Text Selection**:
   - Highlight any text on a webpage
   - Right-click and select "Fact-check with Athena"
   - Or use keyboard shortcut `Ctrl+Shift+F`

2. **Extension Popup**:
   - Click the Athena icon in your toolbar
   - Type or paste text in the input field
   - Click "Fact Check" button

3. **Page Analysis**:
   - Click the Athena icon
   - Click "Analyze Page" to fact-check the main content

### Understanding Results

Results include:
- **Verdict**: Likely True, Likely False, or Insufficient Evidence
- **Confidence**: Percentage indicating AI confidence (0-100%)
- **Explanation**: Detailed reasoning for the verdict
- **Sources**: Reliable sources used for verification

Color coding:
- 🟢 **Green**: Likely True / Supported
- 🔴 **Red**: Likely False / Refuted
- 🟡 **Yellow**: Insufficient Evidence / Conflicting

### Keyboard Shortcuts

- `Ctrl+Shift+F`: Fact-check selected text
- `Ctrl+Enter`: Fact-check text in popup (when focused)

## Settings

Access settings by clicking the Athena icon → Settings (⚙️):

### Connection Settings
- **API Endpoint**: URL of your Athena backend server
- **Test Connection**: Verify your backend is reachable

### Behavior Settings
- **Highlight Results**: Show color-coded highlights on fact-checked text
- **Context Menu**: Enable right-click menu for quick fact-checking
- **Auto Fact-Check**: Automatically check claims as you browse (experimental)

### Data Management
- **Export History**: Download your fact-check history as CSV
- **Clear History**: Remove all stored fact-check data

## Troubleshooting

### Common Issues

**Extension not working**
- Refresh the webpage and try again
- Check that your backend server is running
- Verify the API endpoint in settings

**Connection failed**
- Ensure your Athena backend is running on the correct port
- Check firewall settings
- Try testing the connection in settings

**No results appearing**
- Check browser developer console for errors
- Verify the API endpoint URL is correct
- Make sure the backend is responding at `/api/health`

**Selected text not detected**
- Make sure text is properly highlighted
- Try copying and pasting into the extension popup instead
- Refresh the page and try again

### Browser Support

- ✅ **Chrome** 88+
- ✅ **Microsoft Edge** 88+
- ✅ **Brave Browser**
- ✅ **Chromium-based browsers**
- ❌ Firefox (different extension format required)
- ❌ Safari (different extension format required)

### Performance Notes

- First fact-check may take longer as the AI model initializes
- Large texts (>1000 characters) may take more time to process
- Results are cached locally to improve performance

## Privacy & Data

- **Local Storage**: All data is stored locally in your browser
- **No Tracking**: No analytics or tracking is performed
- **Data Control**: Export or clear your data anytime in settings
- **Secure Communication**: Uses HTTPS when available
- **No Data Sharing**: Data is only sent to your configured backend

## Development

### File Structure

```
browser-extension/
├── manifest.json          # Extension configuration
├── popup/                 # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/               # Content scripts
│   ├── content-script.js
│   └── content-style.css
├── background/            # Service worker
│   └── service-worker.js
├── options/              # Settings page
│   ├── options.html
│   ├── options.css
│   └── options.js
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── create-icons.html
└── README.md
```

### Building Icons

1. Open `icons/create-icons.html` in your browser
2. Click "Generate All Icons"
3. Download each size (16px, 32px, 48px, 128px)
4. Save as `icon16.png`, `icon32.png`, etc. in the `icons/` folder

## Support

- **Documentation**: Check the full documentation in your Athena project
- **Issues**: Report bugs or request features through your project's issue tracker
- **Settings**: Use the extension settings page for configuration help

## Version History

### v1.0.0
- Initial release
- Basic fact-checking functionality
- Text selection and page analysis
- Settings page and history tracking
- Context menu integration

---

**Happy fact-checking!** 🔍✨

For more information about the Athena project, check the main README in your project root.