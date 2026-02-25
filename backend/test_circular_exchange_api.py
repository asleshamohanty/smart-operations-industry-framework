#!/usr/bin/env python3
"""
Simple test script for Circular Resource Exchange Feature
Run this to test the feature with your existing data
"""

import requests
import json

def test_circular_exchange_api():
    """Test the circular exchange API endpoints"""
    
    base_url = "http://localhost:8000"
    
    print("Testing Circular Resource Exchange API")
    print("=" * 40)
    
    # Test 1: Get available materials
    print("1. Testing available materials...")
    try:
        response = requests.get(f"{base_url}/circular-exchange/available-materials")
        if response.status_code == 200:
            data = response.json()
            print(f"   SUCCESS: Found {data['total_count']} available materials")
            for material in data['available_materials'][:3]:  # Show first 3
                print(f"   - {material['material_name']}: {material['quantity']} {material['unit']} from {material['project_name']}")
        else:
            print(f"   ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    # Test 2: Get sustainability metrics
    print("\n2. Testing sustainability metrics...")
    try:
        response = requests.get(f"{base_url}/circular-exchange/sustainability-metrics")
        if response.status_code == 200:
            data = response.json()
            print(f"   SUCCESS: Sustainability metrics retrieved")
            print(f"   - Total materials: {data['total_materials_available']}")
            print(f"   - Materials nearing expiry: {data['materials_nearing_expiry']}")
            print(f"   - Potential CO2 savings: {data['potential_co2_savings_kg']} kg")
            print(f"   - Exchange potential: {data['circular_exchange_potential']}")
        else:
            print(f"   ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    # Test 3: Get recommendations (if you have projects)
    print("\n3. Testing recommendations...")
    try:
        # Try with project ID 1 (adjust if needed)
        test_data = {
            "material_name": "Steel",
            "project_id": 1,
            "required_quantity": 50.0,
            "required_unit": "tonnes"
        }
        
        response = requests.post(
            f"{base_url}/circular-exchange/recommendations",
            headers={"Content-Type": "application/json"},
            data=json.dumps(test_data)
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   SUCCESS: Recommendations retrieved")
            print(f"   - Delayed material: {data['delayed_material']}")
            print(f"   - Delayed project: {data['delayed_project_name']}")
            print(f"   - Alternatives found: {data['total_alternatives_found']}")
            print(f"   - Summary: {data['recommendation_summary']}")
            
            if data['alternatives']:
                print("   Top recommendations:")
                for i, alt in enumerate(data['alternatives'][:2], 1):
                    print(f"     {i}. {alt['material_name']} from {alt['project_name']}")
                    print(f"        Quantity: {alt['quantity_available']} {alt['unit']}")
                    print(f"        Distance: {alt['distance_km']} km")
                    print(f"        Feasibility Score: {alt['feasibility_score']}")
                    print(f"        Recommendation: {alt['recommendation_message']}")
        else:
            print(f"   ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    # Test 4: Health check
    print("\n4. Testing health check...")
    try:
        response = requests.get(f"{base_url}/circular-exchange/health")
        if response.status_code == 200:
            data = response.json()
            print(f"   SUCCESS: Service is {data['status']}")
        else:
            print(f"   ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    print("\n" + "=" * 40)
    print("Test completed! Check the results above.")

if __name__ == "__main__":
    test_circular_exchange_api()
