# Cloudflare Pages Deployment Guide

This document explains how to deploy the Athena Fact Checker API to Cloudflare Pages.

## Project Structure

```
/
├── functions/
│   ├── index.py              # Root endpoint handler
│   └── api/
│       ├── health.py         # Health check endpoint
│       ├── fact-check.py     # Fact checking endpoint
│       └── status.py         # API status endpoint
├── _routes.json              # Cloudflare Pages routing configuration
├── wrangler.toml            # Wrangler configuration (optional)
└── requirements.txt         # Python dependencies
```

## Deployment Steps

### Option 1: Direct GitHub Integration

1. **Connect Repository to Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Pages** in the sidebar
   - Click **Create a project**
   - Choose **Connect to Git**
   - Select your GitHub repository: `AbhijeetKumar1505/Athena`

2. **Configure Build Settings:**
   - **Framework preset:** None
   - **Build command:** `echo "No build required"`
   - **Build output directory:** `/`
   - **Root directory:** `/`

3. **Environment Variables:** (if needed)
   - Add any required environment variables in the Pages dashboard

### Option 2: Using Wrangler CLI

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Deploy from local:**
   ```bash
   wrangler pages project create athena-fact-checker
   wrangler pages deploy . --project-name=athena-fact-checker
   ```

## API Endpoints

Once deployed, your API will be available at:

- **Root:** `https://athena-fact-checker.pages.dev/`
- **Health Check:** `https://athena-fact-checker.pages.dev/api/health`
- **Fact Check:** `https://athena-fact-checker.pages.dev/api/fact-check` (POST)
- **Status:** `https://athena-fact-checker.pages.dev/api/status`

## Example API Usage

### Health Check
```bash
curl https://athena-fact-checker.pages.dev/api/health
```

### Fact Check
```bash
curl -X POST https://athena-fact-checker.pages.dev/api/fact-check \
  -H "Content-Type: application/json" \
  -d '{"text": "Sample text to fact-check", "source_url": "https://example.com"}'
```

## Configuration Files

- **`_routes.json`:** Defines which routes should be handled by Functions
- **`wrangler.toml`:** Optional Wrangler configuration for advanced deployment options
- **`functions/`:** Contains all serverless function handlers

## Notes

- Python runtime is automatically detected by Cloudflare Pages
- CORS headers are included in all responses
- Functions support Python 3.8+
- Each function file handles specific HTTP methods (GET, POST, OPTIONS)

## Troubleshooting

1. **Function not found:** Ensure the function file is in the correct directory structure
2. **CORS errors:** Check that CORS headers are properly set in function responses
3. **Build errors:** Verify that the build command is set to `echo "No build required"`