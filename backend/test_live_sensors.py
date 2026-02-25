#!/usr/bin/env python3
"""
Test script for Live Sensor Data System
"""

import requests
import time
import json

def test_safety_system():
    print("=== TESTING LIVE SENSOR DATA SYSTEM ===")
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get("http://localhost:8000/safety/health")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test metrics endpoint
    print("\n2. Testing metrics endpoint...")
    try:
        response = requests.get("http://localhost:8000/safety/metrics/1")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Temperature: {data.get('temperature', 'N/A')}°C")
            print(f"Noise: {data.get('noise_level', 'N/A')} dB")
            print(f"AQI: {data.get('aqi', 'N/A')}")
            print(f"CO2: {data.get('co2_level', 'N/A')} ppm")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test sensor streaming start
    print("\n3. Testing sensor streaming start...")
    try:
        response = requests.post("http://localhost:8000/safety/sensor-streaming/start")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Wait a moment for data to be generated
    print("\n4. Waiting for data generation...")
    time.sleep(5)
    
    # Test metrics again after streaming starts
    print("\n5. Testing metrics after streaming...")
    try:
        response = requests.get("http://localhost:8000/safety/metrics/1")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Temperature: {data.get('temperature', 'N/A')}°C (Digital Twin)")
            print(f"Noise: {data.get('noise_level', 'N/A')} dB (SLM)")
            print(f"AQI: {data.get('aqi', 'N/A')} (PM2.5)")
            print(f"CO2: {data.get('co2_level', 'N/A')} ppm")
            print(f"PM2.5: {data.get('pm25', 'N/A')} μg/m³")
            print(f"PM10: {data.get('pm10', 'N/A')} μg/m³")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test sensor data endpoint
    print("\n6. Testing sensor data endpoint...")
    try:
        response = requests.get("http://localhost:8000/safety/sensor-data/1")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Project {data.get('project_id', 'N/A')} sensor data:")
            sensor_data = data.get('sensor_data', {})
            for sensor_type, info in sensor_data.items():
                count = info.get('count', 0)
                latest = info.get('latest')
                if latest:
                    print(f"  {sensor_type}: {latest['value']} {latest['unit']} ({count} records)")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_safety_system()
