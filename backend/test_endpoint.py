#!/usr/bin/env python3

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from auto_installer import auto_installer

# Create a simple test app
app = FastAPI()

@app.get("/test-auto-install")
async def test_auto_install():
    """Test endpoint for auto-installer"""
    try:
        installer_html = auto_installer.create_inline_installer()
        return HTMLResponse(content=installer_html)
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("Testing auto-installer endpoint on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)