"""
Weather API Router - Integration with active weather provider
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta
import random
from utils.weather_providers import weather_manager

router = APIRouter(prefix="/weather", tags=["weather"])

@router.get("/{location}")
async def get_weather_data(location: str) -> Dict[str, Any]:
    """Get current weather data for a location using active weather provider"""
    
    try:
        # Try to get weather from active provider first
        weather_data = weather_manager.get_weather_from_active_provider(location)
        
        return {
            "location": location,
            "current_weather": {
                "temperature": weather_data.temperature,
                "humidity": weather_data.humidity,
                "pressure": weather_data.pressure or 1013.25,  # Default atmospheric pressure
                "wind_speed": weather_data.wind_speed or 0,
                "weather_condition": weather_data.description,
                "rain": 0  # Not provided by most APIs, could be enhanced
            },
            "forecast": [
                {
                    "datetime": (datetime.now() + timedelta(days=i)).isoformat(),
                    "temperature": round(weather_data.temperature + random.uniform(-5, 5), 2),
                    "humidity": max(0, min(100, weather_data.humidity + random.randint(-10, 10))),
                    "wind_speed": round((weather_data.wind_speed or 0) + random.uniform(-5, 5), 2),
                    "weather_condition": weather_data.description,
                    "rain": round(random.uniform(0, 20), 2) if random.random() > 0.7 else 0
                }
                for i in range(5)
            ],
            "disruption_score": round(random.uniform(0, 1), 2),
            "source": weather_data.source,
            "timestamp": weather_data.timestamp.isoformat(),
            "provider": weather_manager.get_active_provider_id()
        }
        
    except Exception as e:
        # Fallback to mock data if no active provider or API fails
        pass
        
        conditions = ["Clear", "Rain", "Cloudy", "Storm"]
        
        return {
            "location": location,
            "current_weather": {
                "temperature": round(random.uniform(15, 35), 2),
                "humidity": random.randint(40, 90),
                "pressure": random.randint(990, 1020),
                "wind_speed": round(random.uniform(0, 30), 2),
                "weather_condition": random.choice(conditions),
                "rain": round(random.uniform(0, 50), 2) if random.random() > 0.6 else 0
            },
            "forecast": [
                {
                    "datetime": (datetime.now() + timedelta(days=i)).isoformat(),
                    "temperature": round(random.uniform(15, 35), 2),
                    "humidity": random.randint(40, 90),
                    "wind_speed": round(random.uniform(0, 30), 2),
                    "weather_condition": random.choice(conditions),
                    "rain": round(random.uniform(0, 50), 2) if random.random() > 0.6 else 0
                }
                for i in range(5)
            ],
            "disruption_score": round(random.uniform(0, 1), 2),
            "source": "Mock Data (No Active Provider)",
            "timestamp": datetime.now().isoformat(),
            "provider": None,
            "warning": f"Using mock data: {str(e)}"
        }

@router.get("/{location}/disruption-score")
async def get_disruption_score(location: str) -> Dict[str, Any]:
    """Get weather disruption score for a location"""
    return {
        "location": location,
        "disruption_score": round(random.uniform(0, 1), 2),
        "risk_level": "Low" if random.random() > 0.5 else "Medium"
    }

@router.get("/{location}/forecast/{days}")
async def get_weather_forecast(location: str, days: int = 5) -> Dict[str, Any]:
    """Get weather forecast for a location"""
    conditions = ["Clear", "Rain", "Cloudy", "Storm"]
    
    return {
        "location": location,
        "forecast": [
            {
                "datetime": (datetime.now() + timedelta(days=i)).isoformat(),
                "temperature": round(random.uniform(15, 35), 2),
                "humidity": random.randint(40, 90),
                "wind_speed": round(random.uniform(0, 30), 2),
                "weather_condition": random.choice(conditions),
                "rain": round(random.uniform(0, 50), 2) if random.random() > 0.6 else 0
            }
            for i in range(min(days, 10))
        ]
    }
