#!/usr/bin/env python3
"""
Test environment variable loading
"""

import os
from utils.settings import settings

print("🔧 Testing Environment Variable Loading")
print("=" * 50)

print(f"Current working directory: {os.getcwd()}")
print()

print("Environment variables:")
print(f"GOOGLE_API_KEY (env): {os.getenv('GOOGLE_API_KEY', 'NOT SET')}")
print(f"GCP_PROJECT (env): {os.getenv('GCP_PROJECT', 'NOT SET')}")
print(f"GCP_LOCATION (env): {os.getenv('GCP_LOCATION', 'NOT SET')}")
print()

print("Settings object:")
print(f"settings.gemini_api_key: {settings.gemini_api_key}")
print(f"settings.gcp_project: {settings.gcp_project}")
print(f"settings.gcp_location: {settings.gcp_location}")
print()

# Test loading config.env manually
print("Testing manual config.env loading:")
try:
    from dotenv import load_dotenv
    
    # Load config.env explicitly
    config_loaded = load_dotenv('config.env')
    print(f"config.env loaded: {config_loaded}")
    
    if config_loaded:
        print(f"GOOGLE_API_KEY after config.env: {os.getenv('GOOGLE_API_KEY', 'NOT SET')}")
        print(f"GCP_PROJECT after config.env: {os.getenv('GCP_PROJECT', 'NOT SET')}")
    
except ImportError:
    print("❌ python-dotenv not installed")

# Test LLM creation
print("\nTesting LLM creation:")
try:
    from utils.models import get_llm
    llm = get_llm()
    print("✅ LLM created successfully!")
    print(f"LLM type: {type(llm)}")
except Exception as e:
    print(f"❌ LLM creation failed: {e}")
