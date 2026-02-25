#!/usr/bin/env python3
"""
Debug script to test active provider functionality
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = "http://127.0.0.1:8001"

def test_active_provider():
    """Test setting active provider"""
    
    # First, let's see what providers are available
    print("=== Testing Active Provider Functionality ===")
    
    try:
        # Get providers list
        print("\n1. Getting providers list...")
        response = requests.get(f"{API_BASE_URL}/weather-providers/providers")
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: Providers loaded successfully")
            print(f"   Available providers: {list(data['providers'].keys())}")
            print(f"   Predefined providers: {data['predefined']}")
        else:
            print(f"ERROR: Failed to get providers: {response.status_code} - {response.text}")
            return
            
        # Try to set an active provider
        if data['providers']:
            provider_id = list(data['providers'].keys())[0]
            print(f"\n2. Setting active provider to: {provider_id}")
            
            response = requests.post(f"{API_BASE_URL}/weather-providers/active/{provider_id}")
            if response.status_code == 200:
                result = response.json()
                print(f"SUCCESS: Active provider set successfully: {result}")
            else:
                print(f"ERROR: Failed to set active provider: {response.status_code} - {response.text}")
                
        # Get active provider
        print(f"\n3. Getting active provider...")
        response = requests.get(f"{API_BASE_URL}/weather-providers/active")
        if response.status_code == 200:
            result = response.json()
            print(f"SUCCESS: Active provider retrieved: {result}")
        else:
            print(f"ERROR: Failed to get active provider: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"ERROR: Error during testing: {str(e)}")

if __name__ == "__main__":
    test_active_provider()
