#!/usr/bin/env python3
"""
Test script for Llama integration
Run this to verify your local Llama setup is working correctly
"""

import requests
import json
import os
from utils.llama_service import LlamaService

def test_llama_connection():
    """Test if Llama API is accessible"""
    api_url = os.getenv('LLAMA_API_URL', 'http://localhost:11434/api/generate')
    model_name = os.getenv('LLAMA_MODEL', 'llama3.2')
    
    print(f"Testing Llama connection...")
    print(f"API URL: {api_url}")
    print(f"Model: {model_name}")
    
    try:
        # Simple test request
        payload = {
            "model": model_name,
            "prompt": "Hello, respond with just 'OK' if you can hear me.",
            "stream": False,
            "options": {
                "temperature": 0.1,
                "max_tokens": 10
            }
        }
        
        response = requests.post(api_url, json=payload, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        print(f"✅ Llama API is working!")
        print(f"Response: {result.get('response', 'No response')}")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed. Make sure Ollama/LM Studio is running.")
        print("   Try: ollama serve")
        return False
    except requests.exceptions.Timeout:
        print("❌ Request timed out. The model might be loading.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_simulation_recommendations():
    """Test the simulation recommendation generation"""
    print(f"\nTesting simulation recommendations...")
    
    try:
        llama_service = LlamaService()
        
        # Test simulation context
        simulation_context = {
            "project_name": "Test Highway Project",
            "project_type": "Infrastructure",
            "location": "Mumbai",
            "original_cost": 1000000,
            "predicted_cost": 1200000,
            "original_duration": 90,
            "predicted_duration": 100,
            "alternative_materials": ["Recycled Materials"],
            "alternative_resources": {"labor": 1.2},
            "weather_scenario": "severe",
            "esg_impact": {
                "environment": 0.7,
                "social": 0.8,
                "governance": 0.75
            }
        }
        
        # This is an async function, so we need to handle it properly
        import asyncio
        
        async def run_test():
            recommendations = await llama_service.generateSimulationRecommendations(simulation_context)
            return recommendations
        
        recommendations = asyncio.run(run_test())
        
        print(f"✅ Generated {len(recommendations)} recommendations:")
        for i, rec in enumerate(recommendations, 1):
            print(f"   {i}. {rec}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating recommendations: {e}")
        return False

def test_backend_integration():
    """Test the full backend integration"""
    print(f"\nTesting backend integration...")
    
    try:
        # Test the simulation endpoint
        data = {
            'project_id': 18977588,
            'alternative_materials': ['Recycled Materials'],
            'alternative_resources': {'labor': 1.2},
            'weather_scenario': 'severe'
        }
        
        response = requests.post('http://localhost:8000/projects/simulate', json=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Backend integration working!")
            print(f"Generated {len(result.get('recommendations', []))} recommendations")
            return True
        else:
            print(f"❌ Backend error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Backend integration error: {e}")
        return False

def main():
    """Run all tests"""
    print("🦙 Llama Integration Test Suite")
    print("=" * 50)
    
    # Test 1: Basic connection
    connection_ok = test_llama_connection()
    
    if connection_ok:
        # Test 2: Recommendation generation
        recommendations_ok = test_simulation_recommendations()
        
        # Test 3: Backend integration
        backend_ok = test_backend_integration()
        
        print(f"\n📊 Test Results:")
        print(f"   Connection: {'✅' if connection_ok else '❌'}")
        print(f"   Recommendations: {'✅' if recommendations_ok else '❌'}")
        print(f"   Backend Integration: {'✅' if backend_ok else '❌'}")
        
        if all([connection_ok, recommendations_ok, backend_ok]):
            print(f"\n🎉 All tests passed! Llama integration is working correctly.")
        else:
            print(f"\n⚠️  Some tests failed. Check the errors above.")
    else:
        print(f"\n❌ Basic connection failed. Please check your Llama setup.")
        print(f"\nSetup instructions:")
        print(f"1. Install Ollama: https://ollama.ai/")
        print(f"2. Run: ollama serve")
        print(f"3. Run: ollama pull llama3.2")
        print(f"4. Try this test again")

if __name__ == "__main__":
    main()
