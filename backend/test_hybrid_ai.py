#!/usr/bin/env python3
"""Test hybrid AI service directly"""

import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_hybrid_ai():
    try:
        print("Importing hybrid AI service...")
        from utils.hybrid_ai_service import hybrid_ai_service
        print("Hybrid AI service imported successfully")
        
        # Test simulation context
        simulation_context = {
            "project_name": "Highway project",
            "project_type": "Infrastructure",
            "location": "Mumbai",
            "original_cost": 1000000,
            "predicted_cost": 1800000,
            "original_duration": 444,
            "predicted_duration": 233,
            "alternative_materials": ["recycled"],
            "alternative_resources": {"labor": 1.2, "equipment": 1.1},
            "weather_scenario": "current",
            "weather_data": {
                "location": "Mumbai",
                "temperature": 26.86,
                "humidity": 72,
                "wind_speed": 2.47,
                "weather_condition": "Clear",
                "weather_description": "clear sky",
                "timestamp": "2025-01-08T20:00:00"
            },
            "weather_impact": 1.0,
            "weather_recommendations": ["Monitor weather conditions"],
            "esg_impact": {"e_score": 0.7, "s_score": 0.8, "g_score": 0.75},
            "detailed_weather_analysis": {
                "current_conditions": {"temperature": 26.86, "humidity": 72},
                "impact_on_construction": {"cost_multiplier": 1.0},
                "weather_risks": ["High humidity may delay drying times"],
                "seasonal_considerations": ["Monitor monsoon patterns"]
            }
        }
        
        print("Calling AI service...")
        recommendations = await hybrid_ai_service.generateSimulationRecommendations(simulation_context)
        print(f"AI service returned {len(recommendations) if recommendations else 0} recommendations")
        
        if recommendations:
            print("First recommendation:", recommendations[0][:100])
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(test_hybrid_ai())
