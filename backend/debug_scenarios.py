#!/usr/bin/env python3
"""Debug simulation scenarios"""

import requests
import json

def test_scenarios():
    scenarios = ['current', 'severe', 'forecast_3d', 'forecast_7d']
    
    for scenario in scenarios:
        print(f"\n=== Testing {scenario} weather scenario ===")
        data = {
            'project_id': 18977588,
            'weather_scenario': scenario,
            'alternative_materials': ['recycled'],
            'alternative_resources': {'labor': 1.2, 'equipment': 1.1}
        }
        
        try:
            response = requests.post('http://localhost:8000/projects/simulate', json=data)
            result = response.json()
            print(f"Status: {response.status_code}")
            print(f"Recommendations count: {len(result.get('recommendations', []))}")
            print(f"Weather data available: {result.get('weather_data') is not None}")
            if result.get('weather_data'):
                print(f"Weather condition: {result.get('weather_data', {}).get('weather_condition', 'None')}")
            print(f"First recommendation: {result.get('recommendations', ['No recommendations'])[0][:80]}...")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_scenarios()
