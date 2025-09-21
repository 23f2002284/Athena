"""
Cloudflare Pages Function for fact-check endpoint
"""

import json
from datetime import datetime

async def on_request_post(context):
    """
    Handle POST requests to /api/fact-check
    """
    try:
        request = context.request

        # Parse request body
        body = await request.json()
        text = body.get("text", "")
        source_url = body.get("source_url")

        # Simple response for now
        response_data = {
            "status": "service_available",
            "result": {
                "message": "Fact-checking service is running on Cloudflare Pages",
                "text_received": text[:100] + "..." if len(text) > 100 else text,
                "source_url": source_url,
                "timestamp": datetime.now().isoformat(),
                "platform": "cloudflare-pages",
                "note": "This is a simplified version for deployment testing"
            },
            "task_id": f"cf-pages-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        }

        return Response(
            json.dumps(response_data),
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        )

    except Exception as e:
        return Response(
            json.dumps({"error": f"Internal server error: {str(e)}"}),
            status=500,
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
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
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    )