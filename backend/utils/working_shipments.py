import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import random

# Simple in-memory cache for weather data
weather_cache = {}
cache_duration = 300  # 5 minutes cache

def get_cached_weather(origin: str, destination: str) -> Optional[Dict[str, Any]]:
    """Get cached weather data if available and not expired"""
    cache_key = f"{origin}|{destination}"
    if cache_key in weather_cache:
        cached_data, timestamp = weather_cache[cache_key]
        if time.time() - timestamp < cache_duration:
            return cached_data
        else:
            del weather_cache[cache_key]
    return None

def cache_weather(origin: str, destination: str, weather_data: Dict[str, Any]):
    """Cache weather data with timestamp"""
    cache_key = f"{origin}|{destination}"
    weather_cache[cache_key] = (weather_data, time.time())

def generate_optimized_shipments_from_materials(db=None):
    """Generate shipments with simplified logic"""
    shipments = []
    
    try:
        # Use provided database client or get a new one
        if db is None:
            from database import get_db
            db = get_db()
        
        # Get all materials from database
        materials_result = db.table("materials").select("*").execute()
        materials = materials_result.data if materials_result.data else []
        
        # Get all projects from database
        projects_result = db.table("projects").select("*").execute()
        projects = projects_result.data if projects_result.data else []
        
        # If no data in database, fallback to mock data
        if not materials:
            from routers.projects import mock_materials, mock_projects
            materials = mock_materials
            projects = mock_projects
        
        # Create project lookup dictionary for faster access
        project_lookup = {p.get("project_id"): p for p in projects}
        
        # Process materials
        for material in materials:
            # Find the project for this material
            project = project_lookup.get(material["project_id"])
            if not project:
                continue
                
            # Get project location for weather summary
            project_location = project["location"]
            material_location = material["import_location"]
            
            # Replace "Local suppliers" and "Local quarries" with project location
            if material_location in ["Local suppliers", "Local quarries"]:
                material_location = project_location
                print(f"Replaced '{material['import_location']}' with project location: {project_location}")
            
            # Check cache first
            cached_weather = get_cached_weather(material_location, project_location)
            
            if cached_weather:
                # Use cached weather data
                weather_condition = cached_weather.get("weather_condition", "Clear")
                temperature = cached_weather.get("temperature", 25)
                disruption_score = cached_weather.get("disruption_score", 0.1)
                weather_delay_days = cached_weather.get("estimated_delay_days", 0)
                impact_level = cached_weather.get("impact_level", "minimal")
            else:
                # Generate simple weather data
                weather_condition = random.choice(["Clear", "Partly Cloudy", "Cloudy", "Light Rain"])
                temperature = random.randint(20, 35)
                disruption_score = random.uniform(0.0, 0.3)
                weather_delay_days = 0 if disruption_score < 0.2 else random.randint(1, 2)
                impact_level = "minimal" if disruption_score < 0.2 else "minor"
                
                # Cache the weather data
                cache_weather(material_location, project_location, {
                    "weather_condition": weather_condition,
                    "temperature": temperature,
                    "disruption_score": disruption_score,
                    "estimated_delay_days": weather_delay_days,
                    "impact_level": impact_level
                })
            
            # Generate weather summary
            from routers.shipments import extract_city_name
            origin_city = extract_city_name(material_location)
            destination_city = extract_city_name(project_location)
            weather_summary = f"{weather_condition} between {origin_city} and {destination_city}"
            
            # Determine status based on weather delay
            if weather_delay_days > 0:
                status = "delayed"
                estimated_arrival = datetime.now() + timedelta(days=2 + weather_delay_days)
                actual_arrival = None
            else:
                status = "on_time"
                estimated_arrival = datetime.now() + timedelta(days=2)
                actual_arrival = estimated_arrival
            
            # Create shipment
            shipment = {
                "shipment_id": f"shipment-{material['project_id']}-{material['name'].lower().replace(' ', '-')}-{int(time.time())}",
                "project_id": material["project_id"],
                "project_name": project["project_name"],
                "material_type": material["name"],
                "quantity": material["quantity"],
                "unit": material["unit"],
                "origin": material_location,
                "destination": project_location,
                "status": status,
                "estimated_arrival": estimated_arrival.isoformat(),
                "actual_arrival": actual_arrival.isoformat() if actual_arrival else None,
                "weather_delay_days": weather_delay_days,
                "weather_condition": weather_condition,
                "weather_summary": weather_summary,
                "disruption_score": disruption_score,
                "impact_level": impact_level,
                "temperature": temperature,
                "circular_exchange_recommendations": None,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            shipments.append(shipment)
        
        return shipments
        
    except Exception as e:
        print(f"Error generating shipments: {str(e)}")
        return []

def clear_weather_cache():
    """Clear the weather cache"""
    global weather_cache
    weather_cache.clear()

def get_cache_stats():
    """Get cache statistics"""
    return {
        "cache_size": len(weather_cache),
        "cache_keys": list(weather_cache.keys())
    }
