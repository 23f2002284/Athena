#!/usr/bin/env python3
"""
Simple WebSocket client to test real-time fact checker updates
"""

import asyncio
import websockets
import json
import aiohttp
from datetime import datetime

async def websocket_client():
    """Connect to WebSocket and listen for messages"""
    uri = "ws://localhost:8000/ws"
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"✅ Connected to WebSocket at {uri}")
            print("🔄 Listening for real-time updates...")
            print("-" * 60)
            
            async for message in websocket:
                try:
                    data = json.loads(message)
                    timestamp = data.get('timestamp', datetime.now().isoformat())
                    msg_type = data.get('type', 'unknown')
                    msg_data = data.get('data', {})
                    
                    print(f"[{timestamp}] 📡 {msg_type.upper()}")
                    
                    if msg_type == 'progress':
                        current = msg_data.get('current_step', 0)
                        total = msg_data.get('total_steps', 0)
                        percentage = msg_data.get('progress_percentage', 0)
                        stage = msg_data.get('stage', 'unknown')
                        description = msg_data.get('description', '')
                        print(f"   Progress: {current}/{total} ({percentage:.1f}%) - {stage}")
                        print(f"   Description: {description}")
                        
                    elif msg_type == 'claims':
                        claims = msg_data.get('claims', [])
                        processing_stage = msg_data.get('processing_stage', 'unknown')
                        print(f"   Processing Stage: {processing_stage}")
                        print(f"   Claims Found: {len(claims)}")
                        for i, claim in enumerate(claims, 1):
                            print(f"     {i}. {claim.get('claim_text', 'N/A')[:100]}...")
                            
                    elif msg_type == 'result':
                        verdict = msg_data.get('verdict', 'UNKNOWN')
                        confidence = msg_data.get('confidence', 0)
                        reasoning = msg_data.get('reasoning', 'N/A')
                        print(f"   🎯 VERDICT: {verdict}")
                        print(f"   📊 Confidence: {confidence:.2f}")
                        print(f"   💭 Reasoning: {reasoning[:200]}...")
                        
                    elif msg_type == 'sources':
                        sources = msg_data.get('sources', [])
                        print(f"   📚 Sources Found: {len(sources)}")
                        for i, source in enumerate(sources, 1):
                            url = source.get('url', 'N/A')
                            title = source.get('title', 'N/A')
                            credibility = source.get('credibility_score', 0)
                            print(f"     {i}. {title} (Score: {credibility:.2f})")
                            print(f"        🔗 {url}")
                            
                    elif msg_type == 'educational':
                        section_title = msg_data.get('section_title', 'N/A')
                        content = msg_data.get('content', 'N/A')
                        tips = msg_data.get('tips', [])
                        print(f"   📖 {section_title}")
                        print(f"   Content: {content[:200]}...")
                        if tips:
                            print(f"   💡 Tips: {', '.join(tips)}")
                            
                    elif msg_type == 'status':
                        status = msg_data.get('status', 'unknown')
                        pipeline = msg_data.get('pipeline', 'N/A')
                        print(f"   Status: {status} | Pipeline: {pipeline}")
                        
                    elif msg_type == 'error':
                        error_msg = msg_data.get('message', 'Unknown error')
                        error_type = msg_data.get('error_type', 'general')
                        print(f"   ❌ ERROR ({error_type}): {error_msg}")
                        
                    else:
                        print(f"   Raw data: {json.dumps(msg_data, indent=2)}")
                    
                    print("-" * 60)
                    
                except json.JSONDecodeError:
                    print(f"❌ Invalid JSON received: {message}")
                except Exception as e:
                    print(f"❌ Error processing message: {e}")
                    
    except websockets.exceptions.ConnectionRefused:
        print("❌ Could not connect to WebSocket. Make sure FastAPI server is running on port 8000")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")

async def trigger_analysis():
    """Trigger analysis via API"""
    await asyncio.sleep(2)  # Give WebSocket time to connect
    
    print("🚀 Starting fact-check analysis...")
    
    data = {
        'text': 'Astronomical studies have indicated that the massive ring system around one of the outer planets is geologically youthful, with evidence pointing to formation only in the last few hundred million years.',
        'pipeline': 'fact'
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post('http://localhost:8000/api/start-analysis', json=data) as resp:
                result = await resp.json()
                print(f"✅ Analysis started: {result}")
    except Exception as e:
        print(f"❌ Failed to start analysis: {e}")

async def main():
    """Run WebSocket client and trigger analysis"""
    # Start both WebSocket client and analysis trigger
    await asyncio.gather(
        websocket_client(),
        trigger_analysis()
    )

if __name__ == "__main__":
    print("🔍 Athena Real-time Fact Checker WebSocket Client")
    print("=" * 60)
    asyncio.run(main())
