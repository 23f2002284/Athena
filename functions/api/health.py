"""
Cloudflare Pages Function for health check endpoint
"""

import json
from datetime import datetime

async def on_request_get(context):
    """
    Handle GET requests to /api/health
    """
    response_data = {
        "status": "healthy",
        "service": "athena-fact-checker",
        "platform": "cloudflare-pages",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
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