#!/usr/bin/env python3
"""
Test shipments loading performance
"""

import time
import requests

def test_shipments_performance():
    """Test shipments loading performance"""
    base_url = "http://localhost:8000"
    
    print("Testing Shipments Loading Performance")
    print("=" * 50)
    
    # Test 1: Check loading status
    print("1. Checking loading status...")
    try:
        start_time = time.time()
        response = requests.get(f"{base_url}/shipments/loading-status", timeout=5)
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: {data['status']}")
            print(f"   Cache size: {data['cache_size']}")
            print(f"   Response time: {(end_time - start_time)*1000:.2f}ms")
        else:
            print(f"   ERROR: {response.status_code}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    # Test 2: Load shipments
    print(f"\n2. Loading shipments...")
    try:
        start_time = time.time()
        response = requests.get(f"{base_url}/shipments/", timeout=30)
        end_time = time.time()
        
        if response.status_code == 200:
            shipments = response.json()
            print(f"   SUCCESS: Loaded {len(shipments)} shipments")
            print(f"   Response time: {(end_time - start_time)*1000:.2f}ms")
            
            if shipments:
                print(f"   First shipment: {shipments[0]['material_type']} - {shipments[0]['status']}")
                print(f"   Weather summary: {shipments[0]['weather_summary']}")
        else:
            print(f"   ERROR: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    # Test 3: Load shipments again (should be faster with cache)
    print(f"\n3. Loading shipments again (cache test)...")
    try:
        start_time = time.time()
        response = requests.get(f"{base_url}/shipments/", timeout=30)
        end_time = time.time()
        
        if response.status_code == 200:
            shipments = response.json()
            print(f"   SUCCESS: Loaded {len(shipments)} shipments")
            print(f"   Response time: {(end_time - start_time)*1000:.2f}ms")
            print(f"   Performance: {'FASTER' if (end_time - start_time) < 2 else 'SLOWER'} than expected")
        else:
            print(f"   ERROR: {response.status_code}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    # Test 4: Check cache stats
    print(f"\n4. Checking cache statistics...")
    try:
        response = requests.get(f"{base_url}/shipments/cache/stats")
        if response.status_code == 200:
            cache_stats = response.json()
            print(f"   Cache size: {cache_stats['cache_size']}")
            print(f"   Cache keys: {len(cache_stats['cache_keys'])}")
        else:
            print(f"   ERROR: {response.status_code}")
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Performance test completed!")

if __name__ == "__main__":
    test_shipments_performance()
