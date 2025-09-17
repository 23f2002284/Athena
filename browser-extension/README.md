# Athena Fact Checker - Browser Extension

A powerful browser extension that brings AI-powered fact-checking to any website. Select text, right-click, or use the popup to verify information instantly.

## Features

### 🚀 Quick Fact-Checking
- **Text Selection**: Select any text on a webpage and get instant fact-check results
- **Right-Click Menu**: Context menu options for quick verification
- **Popup Interface**: Comprehensive fact-checking interface accessible from the toolbar

### 🎯 Smart Analysis
- **AI-Powered**: Connected to the Athena backend for accurate analysis
- **Multiple Sources**: Cross-references information across reliable sources
- **Confidence Scoring**: Get confidence percentages for each fact-check
- **Real-time Results**: Fast processing with live updates

### 🔧 Customizable Settings
- **Auto-Analysis**: Automatically analyze news articles when visiting pages
- **Confidence Thresholds**: Set minimum confidence levels for results
- **API Configuration**: Connect to custom Athena backend instances
- **Privacy Controls**: Manage data retention and export options

### 📊 Activity Tracking
- **History Management**: Keep track of all your fact-checks
- **Usage Statistics**: Monitor your verification activity
- **Data Export**: Export your settings and activity data

## Installation

### Prerequisites
1. Make sure your Athena backend is running (typically at `http://localhost:8000`)
2. Chrome or Chromium-based browser (Edge, Brave, etc.)

### Install from Source

1. **Clone/Download the Extension**
   ```bash
   # Navigate to the browser-extension directory
   cd browser-extension
   ```

2. **Generate Icons** (Required)
   - Open `icons/create-icons.html` in your browser
   - Click "Download All Icons" to generate the required PNG files
   - Save the downloaded files in the `icons/` folder

3. **Load in Browser**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `browser-extension` folder
   - The Athena extension should now appear in your extensions

## Usage Guide

### Text Selection Method
1. **Select Text**: Highlight any text on a webpage
2. **Tooltip Appears**: A small tooltip will appear near your selection
3. **Click "Fact Check"**: Click the button to verify the selected text
4. **View Results**: Results appear in a popup near the selection

### Right-Click Menu
1. **Select Text**: Highlight text you want to fact-check
2. **Right-Click**: Open the context menu
3. **Choose "Fact-check with Athena"**: Select the option
4. **View Results**: Results will be processed and displayed

### Extension Popup
1. **Click Extension Icon**: Click the Athena icon in your toolbar
2. **Enter Text/URL**: Type or paste content to fact-check
3. **Quick Actions**: Use buttons for selected text or current page
4. **View Detailed Results**: Get comprehensive analysis with sources

### Settings & Configuration
1. **Open Settings**: Right-click extension icon → "Options" or visit `chrome://extensions`
2. **Configure API**: Set your backend URL (default: `http://localhost:8000`)
3. **Adjust Preferences**: Enable/disable features, set thresholds
4. **Test Connection**: Verify your backend connection

## Configuration Options

### General Settings
- **Enable Extension**: Turn the extension on/off
- **Quick Fact Check**: Show tooltip when selecting text
- **Show Tooltips**: Display helpful hints and tips
- **Auto-Analyze Pages**: Automatically check news articles

### Performance Settings
- **Confidence Threshold**: Minimum confidence level (50-95%)
- **Cache Management**: Clear stored results for better performance

### API Settings
- **Backend URL**: Athena API endpoint (default: `http://localhost:8000`)
- **Connection Testing**: Verify backend connectivity

### Privacy Settings
- **Activity History**: Manage fact-check history
- **Data Export/Import**: Backup and restore your data

## API Integration

The extension connects to your Athena backend using these endpoints:

```javascript
// Fact-check request
POST /api/fact-check
{
  "text": "content to verify",
  "pipeline": "fact"
}

// Get results
GET /api/fact-check-result

// Health check
GET /api/health
```

### Backend Requirements
- Athena backend server running
- CORS enabled for browser requests
- Endpoints available at configured URL

## File Structure

```
browser-extension/
├── manifest.json              # Extension configuration
├── popup/
│   ├── popup.html            # Main popup interface
│   ├── popup.css             # Popup styles
│   └── popup.js              # Popup functionality
├── content/
│   ├── content-script.js     # Page interaction script
│   └── content-style.css     # Content script styles
├── background/
│   └── service-worker.js     # Background processing
├── options/
│   ├── options.html          # Settings page
│   ├── options.css           # Settings styles
│   └── options.js            # Settings functionality
├── icons/
│   ├── create-icons.html     # Icon generator
│   ├── icon16.png            # Toolbar icon
│   ├── icon32.png            # Windows taskbar
│   ├── icon48.png            # Extension management
│   └── icon128.png           # Chrome Web Store
└── README.md                 # This file
```

## Development

### Building from Source
1. Ensure all files are in place
2. Generate icons using the provided generator
3. Test in Chrome developer mode
4. Package for distribution if needed

### Testing
1. Load extension in developer mode
2. Test on various websites
3. Verify API connectivity
4. Check all feature functionality

### Debugging
- Use Chrome DevTools for popup debugging
- Check Background page for service worker logs
- Monitor Content script in page inspector
- Review Network tab for API calls

## Browser Compatibility

| Browser | Compatibility | Notes |
|---------|---------------|-------|
| Chrome | ✅ Full | Manifest V3 native support |
| Edge | ✅ Full | Chromium-based compatibility |
| Brave | ✅ Full | Chrome extension support |
| Firefox | ⚠️ Limited | Requires Manifest V2 conversion |
| Safari | ❌ No | Not supported |

## Permissions Explained

The extension requests these permissions:

- **activeTab**: Access current tab content for fact-checking
- **storage**: Save settings and cache results
- **contextMenus**: Add right-click menu options
- **scripting**: Inject content scripts for text selection
- **host_permissions**: Access websites for content analysis

## Troubleshooting

### Common Issues

**Extension doesn't load:**
- Check that all required files exist
- Ensure icons are properly generated
- Verify manifest.json syntax

**Can't connect to backend:**
- Confirm backend is running at correct URL
- Check CORS settings in backend
- Test API endpoint in browser

**Fact-checking not working:**
- Verify API configuration in settings
- Check browser console for errors
- Ensure text selection is working

**Popup not responding:**
- Check for JavaScript errors in DevTools
- Verify API endpoints are accessible
- Clear extension cache and reload

### Getting Help
1. Check the browser console for error messages
2. Verify your Athena backend is running
3. Test API endpoints manually
4. Review extension logs in Chrome DevTools

## Security & Privacy

- **Local Processing**: Text is only sent to your configured backend
- **No External Services**: No third-party tracking or analytics
- **Data Control**: Full control over your fact-checking history
- **Configurable Retention**: Choose what data to keep

## Contributing

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This extension is part of the Athena project. See the main project license for terms.

---

**Need Help?** Check our documentation or open an issue on GitHub.

**Version:** 1.0.0
**Last Updated:** $(date +%Y-%m-%d)