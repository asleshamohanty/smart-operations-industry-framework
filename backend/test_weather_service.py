#!/usr/bin/env python3
"""Test weather service directly"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.openweather_service import OpenWeatherService

def test_weather_service():
    weather_service = OpenWeatherService()
    
    print("Testing current weather...")
    try:
        current = weather_service.get_current_weather("Mumbai")
        print(f"Current weather: {current.get('weather_condition')} at {current.get('temperature')}°C")
    except Exception as e:
        print(f"Error getting current weather: {e}")
    
    print("\nTesting forecast...")
    try:
        forecast = weather_service.get_weather_forecast("Mumbai", 3)
        print(f"Forecast count: {len(forecast)}")
        if forecast:
            print(f"First forecast: {forecast[0].get('weather_condition')} at {forecast[0].get('temperature')}°C")
    except Exception as e:
        print(f"Error getting forecast: {e}")

if __name__ == "__main__":
    test_weather_service()
