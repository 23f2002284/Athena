#!/usr/bin/env python3
"""
Direct environment variable loader that sets OS environment variables
"""

import os
from pathlib import Path

def load_environment():
    """Load environment variables from config.env directly into os.environ"""
    
    config_file = Path(__file__).parent / "config.env"
    
    if not config_file.exists():
        print(f"❌ Config file not found: {config_file}")
        return False
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        loaded_vars = []
        for line in lines:
            line = line.strip()
            
            # Skip empty lines and comments
            if not line or line.startswith('#'):
                continue
            
            # Parse KEY=VALUE format
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                
                # Remove quotes if present
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                
                # Set in environment
                os.environ[key] = value
                loaded_vars.append(key)
        
        print(f"✅ Loaded {len(loaded_vars)} environment variables from config.env")
        
        # Verify key variables
        if os.getenv('GOOGLE_API_KEY'):
            print("✅ GOOGLE_API_KEY loaded successfully")
        elif os.getenv('GCP_PROJECT'):
            print("✅ GCP_PROJECT loaded successfully")
        else:
            print("⚠️  No LLM configuration found")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Failed to load config.env: {e}")
        return False

# Auto-load when imported
if __name__ != "__main__":
    load_environment()

if __name__ == "__main__":
    success = load_environment()
    if success:
        print("\n🎉 Environment loaded successfully!")
    else:
        print("\n❌ Environment loading failed!")
