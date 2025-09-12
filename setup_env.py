#!/usr/bin/env python3
"""
Setup environment variables for Athena Fact Checker
Run this script to configure your API keys
"""

import os
import sys

def setup_environment():
    """Setup environment variables for the fact checker"""
    
    print("🔧 Athena Fact Checker Environment Setup")
    print("=" * 50)
    
    # Check if .env file exists
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    
    print(f"Looking for .env file at: {env_file}")
    
    if os.path.exists(env_file):
        print("✅ .env file found")
        
        # Read existing .env
        with open(env_file, 'r') as f:
            content = f.read()
            
        print("\nCurrent .env content:")
        print("-" * 30)
        print(content)
        print("-" * 30)
        
    else:
        print("❌ .env file not found")
        
        # Create .env file
        print("\n🔨 Creating .env file...")
        
        api_key = input("\nEnter your Google Gemini API Key (or press Enter to skip): ").strip()
        
        env_content = "# Athena Fact Checker Configuration\n\n"
        
        if api_key:
            env_content += f"GOOGLE_API_KEY={api_key}\n\n"
            print("✅ GOOGLE_API_KEY configured")
        else:
            env_content += "# GOOGLE_API_KEY=your_gemini_api_key_here\n\n"
            print("⚠️  GOOGLE_API_KEY not configured - you'll need to add it later")
        
        env_content += "# Alternative: Google Cloud Platform (Vertex AI)\n"
        env_content += "# GCP_PROJECT=your_gcp_project_id\n"
        env_content += "# GCP_LOCATION=us-central1\n\n"
        env_content += "# FastAPI Configuration\n"
        env_content += "FASTAPI_HOST=0.0.0.0\n"
        env_content += "FASTAPI_PORT=8000\n"
        
        try:
            with open(env_file, 'w') as f:
                f.write(env_content)
            print(f"✅ Created .env file at: {env_file}")
        except Exception as e:
            print(f"❌ Failed to create .env file: {e}")
            return False
    
    # Test environment loading
    print("\n🧪 Testing environment loading...")
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        google_api_key = os.getenv('GOOGLE_API_KEY')
        gcp_project = os.getenv('GCP_PROJECT')
        
        if google_api_key:
            print("✅ GOOGLE_API_KEY loaded successfully")
        elif gcp_project:
            print("✅ GCP_PROJECT loaded successfully")
        else:
            print("⚠️  No LLM configuration found")
            print("   Please set either GOOGLE_API_KEY or GCP_PROJECT/GCP_LOCATION")
            return False
            
    except ImportError:
        print("❌ python-dotenv not installed")
        print("   Run: pip install python-dotenv")
        return False
    
    print("\n🎉 Environment setup complete!")
    return True

def get_api_key_instructions():
    """Print instructions for getting API keys"""
    
    print("\n📋 How to get API keys:")
    print("=" * 50)
    
    print("\n🔑 Google Gemini API Key:")
    print("1. Go to https://makersuite.google.com/app/apikey")
    print("2. Sign in with your Google account")
    print("3. Click 'Create API Key'")
    print("4. Copy the generated key")
    print("5. Add it to your .env file as: GOOGLE_API_KEY=your_key_here")
    
    print("\n🔑 Google Cloud Platform (Alternative):")
    print("1. Go to https://console.cloud.google.com/")
    print("2. Create a new project or select existing")
    print("3. Enable Vertex AI API")
    print("4. Set up authentication (service account)")
    print("5. Add to .env: GCP_PROJECT=your_project_id")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        get_api_key_instructions()
    else:
        success = setup_environment()
        
        if not success:
            print("\n❌ Setup incomplete. Run with --help for API key instructions.")
            get_api_key_instructions()
        else:
            print("\n🚀 Ready to run Athena Fact Checker!")
            print("   Start the server: python backend/realtime_api.py")
            print("   Open frontend: frontend_test.html")
