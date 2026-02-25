#!/usr/bin/env python3
"""
Test script for Enhanced Circular Resource Exchange Feature
Tests the new material presets and surplus detection functionality
"""

import requests
import json

def test_enhanced_circular_exchange():
    """Test the enhanced circular exchange API endpoints"""
    
    base_url = "http://localhost:8000"
    
    print("Testing Enhanced Circular Resource Exchange API")
    print("=" * 50)
    
    # Test 1: Get project types
    print("1. Testing project types...")
    try:
        response = requests.get(f"{base_url}/circular-exchange/project-types")
        if response.status_code == 200:
            data = response.json()
            print(f"   SUCCESS: Found {len(data['project_types'])} project types")
            for pt in data['project_types']:
                print(f"   - {pt}")
        else:
            print(f"   ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    # Test 2: Get material presets for Highway project
    print("\n2. Testing material presets for Highway project...")
    try:
        response = requests.get(f"{base_url}/circular-exchange/material-presets/Highway")
        if response.status_code == 200:
            presets = response.json()
            print(f"   SUCCESS: Found {len(presets)} material presets for Highway projects")
            for preset in presets[:3]:  # Show first 3
                print(f"   - {preset['material_name']}: {preset['recommended_quantity']} {preset['unit']} (Priority: {preset['priority']})")
        else:
            print(f"   ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    # Test 3: Get surplus materials
    print("\n3. Testing surplus materials detection...")
    try:
        response = requests.get(f"{base_url}/circular-exchange/surplus-materials")
        if response.status_code == 200:
            surplus_materials = response.json()
            print(f"   SUCCESS: Found {len(surplus_materials)} surplus materials")
            for material in surplus_materials[:3]:  # Show first 3
                print(f"   - {material['material_name']}: {material['surplus_quantity']} {material['unit']} surplus from {material['project_name']}")
                print(f"     Status: {material['status']}, Priority: {material['exchange_priority']}")
        else:
            print(f"   ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    # Test 4: Get surplus summary
    print("\n4. Testing surplus summary...")
    try:
        response = requests.get(f"{base_url}/circular-exchange/surplus-summary")
        if response.status_code == 200:
            summary = response.json()
            print(f"   SUCCESS: Surplus summary retrieved")
            print(f"   - Total surplus materials: {summary['total_surplus_materials']}")
            print(f"   - Urgent materials: {summary['urgent_materials']}")
            print(f"   - Near expiry materials: {summary['near_expiry_materials']}")
            print(f"   - Exchange potential: {summary['exchange_potential']}")
        else:
            print(f"   ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    # Test 5: Get proactive recommendations
    print("\n5. Testing proactive recommendations...")
    try:
        response = requests.get(f"{base_url}/circular-exchange/proactive-recommendations")
        if response.status_code == 200:
            recommendations = response.json()
            print(f"   SUCCESS: Found {recommendations['total_recommendations']} proactive recommendations")
            print(f"   Summary: {recommendations['summary']}")
            
            if recommendations['proactive_recommendations']:
                print("   Top recommendations:")
                for i, rec in enumerate(recommendations['proactive_recommendations'][:2], 1):
                    print(f"     {i}. {rec['reason']}")
                    print(f"        Priority: {rec['exchange_priority']}")
        else:
            print(f"   ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    # Test 6: Health check
    print("\n6. Testing health check...")
    try:
        response = requests.get(f"{base_url}/circular-exchange/health")
        if response.status_code == 200:
            data = response.json()
            print(f"   SUCCESS: Service is {data['status']}")
            print(f"   Features: {', '.join(data['features'])}")
        else:
            print(f"   ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Enhanced Circular Exchange Test completed!")

if __name__ == "__main__":
    test_enhanced_circular_exchange()
