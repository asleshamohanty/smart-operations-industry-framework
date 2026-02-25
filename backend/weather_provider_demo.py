#!/usr/bin/env python3
"""
Weather Provider System Demo Script

This script demonstrates how to use the weather provider system
to add providers and get weather data.
"""

import requests
import json
from typing import Dict, Any

# Configuration
API_BASE_URL = "http://localhost:8000"

def add_predefined_provider(provider_name: str, api_key: str) -> Dict[str, Any]:
    """Add a predefined weather provider"""
    url = f"{API_BASE_URL}/weather-providers/providers/predefined"
    payload = {
        "provider_name": provider_name,
        "api_key": api_key
    }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

def add_custom_provider(config: Dict[str, Any]) -> Dict[str, Any]:
    """Add a custom weather provider"""
    url = f"{API_BASE_URL}/weather-providers/providers"
    payload = {"config": config}
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

def get_weather(provider_id: str, location: str) -> Dict[str, Any]:
    """Get weather data from a provider"""
    url = f"{API_BASE_URL}/weather-providers/current"
    payload = {
        "provider_id": provider_id,
        "location": location
    }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

def test_provider(provider_id: str, location: str = "London") -> Dict[str, Any]:
    """Test a weather provider"""
    url = f"{API_BASE_URL}/weather-providers/test/{provider_id}"
    params = {"location": location}
    
    response = requests.post(url, params=params)
    return response.json()

def list_providers() -> Dict[str, Any]:
    """List all available providers"""
    url = f"{API_BASE_URL}/weather-providers/providers"
    
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def main():
    """Main demo function"""
    print("Weather Provider System Demo")
    print("=" * 50)
    print("IMPORTANT: This system makes ACTUAL API calls to weather services.")
    print("Check the backend console for detailed request/response logs.")
    print("Look for [WEATHER API REQUEST] and [WEATHER API RESPONSE] entries.")
    
    try:
        # 1. List available providers
        print("\n1. Listing available providers...")
        providers = list_providers()
        print(f"   Predefined providers: {providers['predefined']}")
        print(f"   Active providers: {len(providers['providers'])}")
        
        # 2. Add a predefined provider (OpenWeather example)
        print("\n2. Adding OpenWeather provider...")
        print("   Note: You need a valid OpenWeather API key for this to work")
        print("   The system will make REAL API calls to OpenWeather!")
        
        # Uncomment and add your API key to test:
        # openweather_response = add_predefined_provider("openweather", "YOUR_API_KEY_HERE")
        # print(f"   Provider added: {openweather_response['name']} (ID: {openweather_response['provider_id']})")
        
        # 3. Add a custom provider example
        print("\n3. Adding custom provider example...")
        custom_config = {
            "name": "Example Weather API",
            "base_url": "https://api.example.com/weather",
            "key_param": "api_key",
            "key": "example_key",
            "city_param": "location",
            "temperature_path": "main.temp",
            "humidity_path": "main.humidity",
            "description_path": "weather.0.description",
            "method": "GET"
        }
        
        # This will fail because the API doesn't exist, but shows the structure
        try:
            custom_response = add_custom_provider(custom_config)
            print(f"   Custom provider added: {custom_response['name']}")
        except requests.exceptions.HTTPError as e:
            print(f"   Expected error (API doesn't exist): {e}")
        
        # 4. Show how to get weather data
        print("\n4. Getting weather data example...")
        print("   To get weather data, use:")
        print("   weather_data = get_weather('provider_id', 'London')")
        print("   This makes REAL API calls to the configured weather service!")
        
        # 5. Show testing functionality
        print("\n5. Testing provider example...")
        print("   To test a provider, use:")
        print("   test_result = test_provider('provider_id', 'London')")
        print("   This makes REAL API calls and shows the actual response!")
        
        print("\nDemo completed successfully!")
        print("\nTo use this system:")
        print("1. Get an API key from a weather service (OpenWeather, WeatherAPI, etc.)")
        print("2. Add the provider using the frontend or API")
        print("3. Test the provider to ensure it works (makes real API calls)")
        print("4. Use the provider to get weather data (makes real API calls)")
        print("\nIMPORTANT: All weather data comes from REAL API calls!")
        print("Check the backend console logs to see the actual HTTP requests.")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API server.")
        print("   Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
