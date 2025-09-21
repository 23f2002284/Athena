"""
Cloudflare Pages Function for status endpoint
"""

import json
from datetime import datetime

async def on_request_get(context):
    """
    Handle GET requests to /api/status
    """
    response_data = {
        "api_version": "1.0.0",
        "status": "running",
        "platform": "cloudflare-pages",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "health": "/api/health",
            "fact_check": "/api/fact-check",
            "status": "/api/status"
        },
        "deployment": {
            "environment": "production",
            "last_updated": datetime.now().isoformat()
        }
    }

    return Response(
        json.dumps(response_data),
        headers={
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    )

async def on_request_options(context):
    """
    Handle CORS preflight requests
    """
    return Response(
        "",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    )