#!/usr/bin/env python3
"""
Test script to demonstrate all 5 real-time components
"""

import asyncio
import websockets
import json
import aiohttp
from datetime import datetime

async def test_realtime_components():
    """Test all 5 real-time components"""
    uri = "ws://localhost:8000/ws"
    
    print("🔍 Testing Real-time Fact Checker Components")
    print("=" * 60)
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Trigger analysis
            data = {
                'text': 'Breaking: The Reserve Bank of India announced that all ₹500 notes without security thread will be invalid from next week.',
                'pipeline': 'fact'
            }
            
            print("🚀 Starting fact-check analysis...")
            async with aiohttp.ClientSession() as session:
                async with session.post('http://localhost:8000/api/start-analysis', json=data) as resp:
                    result = await resp.json()
                    print(f"   API Response: {result['status']}")
            
            print("\n📡 Real-time Data Stream:")
            print("-" * 60)
            
            # Track components received
            components_received = {
                'progress': False,
                'claims': False, 
                'result': False,
                'educational': False,
                'sources': False
            }
            
            message_count = 0
            
            async for message in websocket:
                try:
                    data = json.loads(message)
                    msg_type = data.get('type')
                    msg_data = data.get('data', {})
                    timestamp = data.get('timestamp', '')
                    
                    message_count += 1
                    time_str = timestamp[-8:] if len(timestamp) > 8 else timestamp
                    
                    print(f"\n[{message_count:02d}] 📡 {msg_type.upper()} ({time_str})")
                    
                    if msg_type == 'progress':
                        components_received['progress'] = True
                        current = msg_data.get('current_step', 0)
                        total = msg_data.get('total_steps', 0)
                        percentage = msg_data.get('progress_percentage', 0)
                        stage = msg_data.get('stage', '')
                        description = msg_data.get('description', '')
                        
                        print(f"   📊 PROGRESS BAR: {current}/{total} ({percentage:.1f}%)")
                        print(f"   🔄 Stage: {stage}")
                        print(f"   📝 Description: {description}")
                        
                    elif msg_type == 'claims':
                        components_received['claims'] = True
                        claims = msg_data.get('claims', [])
                        processing_stage = msg_data.get('processing_stage', '')
                        
                        print(f"   🎯 CLAIMS PROCESSING: {processing_stage.upper()}")
                        print(f"   📋 Claims Found: {len(claims)}")
                        
                        for i, claim in enumerate(claims, 1):
                            claim_text = claim.get('claim_text', 'N/A')
                            status = claim.get('status', 'unknown')
                            confidence = claim.get('confidence', 'N/A')
                            print(f"     {i}. [{status}] {claim_text[:60]}...")
                            if confidence != 'N/A':
                                print(f"        Confidence: {confidence}")
                        
                        # Show animation state
                        if processing_stage in ['splitting', 'disambiguation', 'selection']:
                            print(f"   🎬 ANIMATION STATE: {processing_stage}")
                            
                    elif msg_type == 'result':
                        components_received['result'] = True
                        verdict = msg_data.get('verdict', 'UNKNOWN')
                        confidence = msg_data.get('confidence', 0)
                        reasoning = msg_data.get('reasoning', 'N/A')
                        claims_breakdown = msg_data.get('claims_breakdown', [])
                        
                        print(f"   🎯 FINAL RESULT: {verdict}")
                        print(f"   📊 Confidence Score: {confidence:.2f}")
                        print(f"   💭 Reasoning: {reasoning[:80]}...")
                        
                        if claims_breakdown:
                            print(f"   📋 Claims Breakdown: {len(claims_breakdown)} claims")
                            
                    elif msg_type == 'educational':
                        components_received['educational'] = True
                        section_title = msg_data.get('section_title', 'N/A')
                        content = msg_data.get('content', 'N/A')
                        tips = msg_data.get('tips', [])
                        concepts = msg_data.get('related_concepts', [])
                        
                        print(f"   📖 EDUCATIONAL CONTENT: {section_title}")
                        print(f"   📚 Content: {content[:80]}...")
                        
                        if tips:
                            print(f"   💡 Tips ({len(tips)}):")
                            for tip in tips[:3]:
                                print(f"     • {tip}")
                                
                        if concepts:
                            print(f"   🧠 Related Concepts: {', '.join(concepts[:3])}")
                            
                    elif msg_type == 'sources':
                        components_received['sources'] = True
                        sources = msg_data.get('sources', [])
                        
                        print(f"   📚 SOURCE BLOCKS: {len(sources)} sources")
                        
                        for i, source in enumerate(sources, 1):
                            url = source.get('url', 'N/A')
                            title = source.get('title', 'N/A')
                            credibility = source.get('credibility_score', 0)
                            source_type = source.get('source_type', 'web')
                            snippet = source.get('snippet', '')
                            
                            print(f"     {i}. [{source_type.upper()}] {title}")
                            print(f"        🔗 URL: {url}")
                            print(f"        ⭐ Credibility: {credibility:.2f}")
                            if snippet:
                                print(f"        📄 Snippet: {snippet[:60]}...")
                                
                    elif msg_type == 'status':
                        status = msg_data.get('status', 'unknown')
                        pipeline = msg_data.get('pipeline', 'N/A')
                        progress = msg_data.get('progress_percentage', 0)
                        
                        print(f"   ⚡ STATUS: {status.upper()}")
                        print(f"   🔧 Pipeline: {pipeline}")
                        print(f"   📈 Overall Progress: {progress}%")
                        
                        if status == 'completed':
                            print("\n🎉 ANALYSIS COMPLETED!")
                            break
                            
                    elif msg_type == 'error':
                        error_msg = msg_data.get('message', 'Unknown error')
                        error_type = msg_data.get('error_type', 'general')
                        print(f"   ❌ ERROR ({error_type}): {error_msg}")
                    
                    print("-" * 60)
                    
                    # Safety break
                    if message_count > 30:
                        print("🛑 Message limit reached")
                        break
                        
                except json.JSONDecodeError:
                    print(f"❌ Invalid JSON: {message}")
                except Exception as e:
                    print(f"❌ Error processing message: {e}")
            
            # Summary of components received
            print("\n📋 COMPONENT SUMMARY:")
            print("=" * 60)
            for component, received in components_received.items():
                status = "✅ RECEIVED" if received else "❌ MISSING"
                print(f"{component.upper():15} : {status}")
                
            received_count = sum(components_received.values())
            print(f"\nTotal Components: {received_count}/5")
            
            if received_count == 5:
                print("🎉 ALL COMPONENTS SUCCESSFULLY RECEIVED!")
            else:
                print("⚠️  Some components missing - check pipeline integration")
                
    except Exception as conn_error:
        if "ConnectionRefused" in str(conn_error) or "refused" in str(conn_error).lower():
            print("❌ Could not connect to WebSocket. Is FastAPI server running on port 8000?")
        else:
            print(f"❌ Connection error: {conn_error}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_realtime_components())
