#!/usr/bin/env python3
"""
Weather Provider API Test Script

This script tests the weather provider system to ensure actual API calls are being made.
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
API_BASE_URL = "http://localhost:8000"

def test_openweather_provider():
    """Test with OpenWeather API (requires valid API key)"""
    print("=" * 60)
    print("TESTING OPENWEATHER PROVIDER")
    print("=" * 60)
    
    # Note: You need a valid OpenWeather API key for this to work
    api_key = input("Enter your OpenWeather API key (or press Enter to skip): ").strip()
    
    if not api_key:
        print("Skipping OpenWeather test (no API key provided)")
        return
    
    try:
        # Add OpenWeather provider
        print("\n1. Adding OpenWeather provider...")
        response = requests.post(
            f"{API_BASE_URL}/weather-providers/providers/predefined",
            json={
                "provider_name": "openweather",
                "api_key": api_key
            }
        )
        
        if response.status_code == 200:
            provider_data = response.json()
            provider_id = provider_data["provider_id"]
            print(f"✅ Provider added successfully: {provider_data['name']} (ID: {provider_id})")
        else:
            print(f"❌ Failed to add provider: {response.text}")
            return
        
        # Test the provider
        print("\n2. Testing provider with London...")
        test_response = requests.post(
            f"{API_BASE_URL}/weather-providers/test/{provider_id}",
            params={"location": "London"}
        )
        
        if test_response.status_code == 200:
            test_data = test_response.json()
            if test_data["success"]:
                weather = test_data["test_data"]
                print(f"✅ Test successful!")
                print(f"   Location: {weather['location']}")
                print(f"   Temperature: {weather['temperature']}°C")
                print(f"   Humidity: {weather['humidity']}%")
                print(f"   Description: {weather['description']}")
                print(f"   Source: {weather['source']}")
                print(f"   Timestamp: {weather['timestamp']}")
            else:
                print(f"❌ Test failed: {test_data['message']}")
        else:
            print(f"❌ Test request failed: {test_response.text}")
        
        # Debug the provider
        print("\n3. Debugging provider (showing raw API response)...")
        debug_response = requests.post(
            f"{API_BASE_URL}/weather-providers/debug/{provider_id}",
            params={"location": "London"}
        )
        
        if debug_response.status_code == 200:
            debug_data = debug_response.json()
            if debug_data["success"]:
                print(f"✅ Debug successful!")
                print(f"   Provider: {debug_data['provider_name']}")
                print(f"   Raw API Response Keys: {list(debug_data['raw_api_response'].keys())}")
                print(f"   Extracted Temperature: {debug_data['extracted_values']['temperature']}")
                print(f"   Extracted Humidity: {debug_data['extracted_values']['humidity']}")
                print(f"   Extracted Description: {debug_data['extracted_values']['description']}")
            else:
                print(f"❌ Debug failed: {debug_data['message']}")
        else:
            print(f"❌ Debug request failed: {debug_response.text}")
        
        # Clean up
        print("\n4. Cleaning up...")
        delete_response = requests.delete(f"{API_BASE_URL}/weather-providers/providers/{provider_id}")
        if delete_response.status_code == 200:
            print("✅ Provider removed successfully")
        else:
            print(f"❌ Failed to remove provider: {delete_response.text}")
            
    except Exception as e:
        print(f"❌ Error during OpenWeather test: {e}")

def test_custom_provider():
    """Test with a custom provider configuration"""
    print("\n" + "=" * 60)
    print("TESTING CUSTOM PROVIDER")
    print("=" * 60)
    
    # Example custom provider (this will fail because the API doesn't exist)
    custom_config = {
        "name": "Test Weather API",
        "base_url": "https://api.example.com/weather",
        "key_param": "api_key",
        "key": "test_key_123",
        "city_param": "location",
        "temperature_path": "main.temp",
        "humidity_path": "main.humidity",
        "description_path": "weather.0.description",
        "method": "GET"
    }
    
    try:
        print("\n1. Adding custom provider...")
        response = requests.post(
            f"{API_BASE_URL}/weather-providers/providers",
            json={"config": custom_config}
        )
        
        if response.status_code == 200:
            provider_data = response.json()
            provider_id = provider_data["provider_id"]
            print(f"✅ Custom provider added: {provider_data['name']} (ID: {provider_id})")
            
            # Test the provider (this should fail)
            print("\n2. Testing custom provider...")
            test_response = requests.post(
                f"{API_BASE_URL}/weather-providers/test/{provider_id}",
                params={"location": "London"}
            )
            
            if test_response.status_code == 200:
                test_data = test_response.json()
                if test_data["success"]:
                    print(f"✅ Test successful (unexpected)!")
                else:
                    print(f"✅ Test failed as expected: {test_data['message']}")
            
            # Clean up
            print("\n3. Cleaning up...")
            delete_response = requests.delete(f"{API_BASE_URL}/weather-providers/providers/{provider_id}")
            if delete_response.status_code == 200:
                print("✅ Custom provider removed successfully")
                
        else:
            print(f"❌ Failed to add custom provider: {response.text}")
            
    except Exception as e:
        print(f"❌ Error during custom provider test: {e}")

def test_provider_list():
    """Test listing providers"""
    print("\n" + "=" * 60)
    print("TESTING PROVIDER LIST")
    print("=" * 60)
    
    try:
        response = requests.get(f"{API_BASE_URL}/weather-providers/providers")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Provider list retrieved successfully")
            print(f"   Active providers: {len(data['providers'])}")
            print(f"   Predefined templates: {len(data['predefined'])}")
            print(f"   Available predefined: {', '.join(data['predefined'])}")
        else:
            print(f"❌ Failed to get provider list: {response.text}")
            
    except Exception as e:
        print(f"❌ Error during provider list test: {e}")

def main():
    """Main test function"""
    print("WEATHER PROVIDER API TEST")
    print("This script tests the weather provider system to ensure actual API calls are made.")
    print("Check the backend console for detailed request/response logs.")
    
    try:
        # Test provider list
        test_provider_list()
        
        # Test custom provider
        test_custom_provider()
        
        # Test OpenWeather provider (if API key provided)
        test_openweather_provider()
        
        print("\n" + "=" * 60)
        print("TEST COMPLETED")
        print("=" * 60)
        print("Check the backend console logs to verify actual API requests were made.")
        print("Look for [WEATHER API REQUEST] and [WEATHER API RESPONSE] log entries.")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API server.")
        print("   Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
