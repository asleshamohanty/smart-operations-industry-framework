from fastapi import APIRouter, HTTPException, Depends  # type: ignore  
from database import get_db
from schemas import Shipment, ShipmentCreate, ShipmentUpdate, Material, MaterialCreate
from utils.weather_utils import WeatherService
from utils.circular_exchange_service import CircularResourceExchangeService
from utils.working_shipments import generate_optimized_shipments_from_materials
from typing import List, Dict, Any, Tuple
import uuid
from datetime import datetime, timedelta
import random
from supabase import create_client, Client  # type: ignore
import os
from dotenv import load_dotenv  # type: ignore

load_dotenv()

def get_supabase_client() -> Client:
    """Get Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise Exception("Supabase credentials not found")
    
    return create_client(url, key)

router = APIRouter(prefix="/shipments", tags=["shipments"])

# Import materials from projects router
from routers.projects import mock_materials, mock_projects

# Initialize circular exchange service
circular_exchange_service = CircularResourceExchangeService()

def generate_shipments_from_materials(db=None):
    """Legacy function - use optimized version instead"""
    return generate_optimized_shipments_from_materials(db)

def generate_shipments_from_materials_legacy(db=None):
    """Generate shipments dynamically from materials data"""
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
        
        for material in materials:
            # Find the project for this material
            project = next((p for p in projects if p.get("project_id") == material["project_id"]), None)
            if not project:
                continue
                
            # Get project location for weather summary
            project_location = project["location"]
            material_location = material["import_location"]
            
            # Replace "Local suppliers" and "Local quarries" with project location
            if material_location in ["Local suppliers", "Local quarries"]:
                material_location = project_location
                print(f"Replaced '{material['import_location']}' with project location: {project_location}")
            
            # Generate shipment status based on dynamic weather analysis
            try:
                # Get enroute weather data using WeatherService
                weather_service = WeatherService()
                weather_data = weather_service.get_enroute_weather(
                    origin=material_location,
                    destination=project_location
                )
                
                # Extract weather information from enroute data
                route_weather_data = weather_data.get("weather_data", {})
                if route_weather_data:
                    # Get weather from origin city
                    origin_weather = list(route_weather_data.values())[0] if route_weather_data else {}
                    weather_condition = origin_weather.get("weather_condition", "Unknown")
                    temperature = origin_weather.get("temperature", 20)
                else:
                    weather_condition = "Unknown"
                    temperature = 20
                
                # Calculate disruption score with material type consideration
                disruption_score = weather_service.calculate_disruption_score(
                    route_weather_data.get(list(route_weather_data.keys())[0], {}) if route_weather_data else {}, 
                    material_type=material["name"], 
                    location=material_location
                )
                weather_delay_days = weather_data.get("estimated_delay_days", 0)
                impact_level = weather_data.get("impact_level", "minimal")
                
                # Generate weather summary for route using actual weather data
                # Extract just city names for cleaner display
                origin_city = extract_city_name(material_location)
                destination_city = extract_city_name(project_location)
                weather_summary = f"{weather_condition} between {origin_city} and {destination_city}"
                
                # Determine status based on delay
                if weather_delay_days > 0:
                    status = "delayed"
                else:
                    status = "on_time"
                    
            except Exception as e:
                print(f"Weather API error for {material_location} to {project_location}: {str(e)}")
                # Fallback to basic weather condition
                weather_condition = f"Weather data unavailable between {material_location} and {project_location}"
                disruption_score = 0.0
                weather_delay_days = 0
                impact_level = "minimal"
                status = "on_time"
            
            # Calculate arrival times based on status
            if status == "delayed":
                estimated_arrival = datetime.now() + timedelta(days=2) + timedelta(days=weather_delay_days)
                actual_arrival = None
            elif status == "on_time":
                estimated_arrival = datetime.now() + timedelta(days=2)
                actual_arrival = None
            else:  # delivered (for very old materials)
                status = "delivered"
                estimated_arrival = datetime.now() + timedelta(days=2)
                actual_arrival = estimated_arrival
            
            # Generate circular exchange recommendations for delayed shipments
            circular_exchange_recommendations = None
            if status == "delayed" and weather_delay_days > 0:
                try:
                    circular_exchange_recommendations = circular_exchange_service.find_alternate_materials(
                        delayed_material=material["name"],
                        delayed_project_id=material["project_id"],
                        required_quantity=material["quantity"],
                        required_unit=material["unit"],
                        delayed_project_location=project["location"]
                    )
                except Exception as e:
                    print(f"Error generating circular exchange recommendations: {str(e)}")
                    circular_exchange_recommendations = None
            
            shipment = {
                "shipment_id": str(uuid.uuid4()),
                "project_id": material["project_id"],
                "project_name": project["project_name"],
                "material_type": material["name"],
                "quantity": material["quantity"],
                "unit": material["unit"],
                "origin": material_location,  # This now uses the corrected location
                "destination": project["location"],
                "status": status,
                "estimated_arrival": estimated_arrival.isoformat(),
                "actual_arrival": actual_arrival.isoformat() if actual_arrival else None,
                "weather_delay_days": weather_delay_days,
                "weather_condition": weather_condition,
                "weather_summary": weather_summary,
                "temperature": temperature,
                "disruption_score": disruption_score,
                "impact_level": impact_level,
                "circular_exchange_recommendations": circular_exchange_recommendations,
                "created_at": material["created_at"],
                "updated_at": datetime.now().isoformat()
            }
            
            shipments.append(shipment)
        
        return shipments
        
    except Exception as e:
        print(f"Error generating shipments: {str(e)}")
        return []

@router.get("/", response_model=List[Shipment])
async def get_shipments(db=Depends(get_db)):
    """Get all shipments generated from materials data (optimized with caching)"""
    try:
        shipments = generate_optimized_shipments_from_materials(db)
        return shipments
    except Exception as e:
        print(f"Error getting shipments: {str(e)}")
        return []

@router.get("/cache/stats")
async def get_cache_stats():
    """Get weather cache statistics"""
    from utils.optimized_shipments import get_cache_stats
    return get_cache_stats()

@router.get("/loading-status")
async def get_loading_status():
    """Get shipments loading status"""
    from utils.optimized_shipments import get_cache_stats
    cache_stats = get_cache_stats()
    
    return {
        "status": "ready",
        "cache_size": cache_stats["cache_size"],
        "message": "Shipments are ready to load"
    }

@router.get("/{shipment_id}", response_model=Shipment)
async def get_shipment(shipment_id: str, db=Depends(get_db)):
    """Get a specific shipment by ID"""
    shipments = generate_shipments_from_materials(db)
    shipment = next((s for s in shipments if s["shipment_id"] == shipment_id), None)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@router.get("/project/{project_id}", response_model=List[Shipment])
async def get_shipments_by_project(project_id: int, db=Depends(get_db)):
    """Get all shipments for a specific project"""
    shipments = generate_shipments_from_materials(db)
    project_shipments = [s for s in shipments if s["project_id"] == project_id]
    return project_shipments

@router.post("/", response_model=Shipment)
async def create_shipment(shipment: ShipmentCreate, db=Depends(get_db)):
    """Create a new shipment"""
    try:
        supabase = get_supabase_client()
        
        shipment_id = str(uuid.uuid4())
        
        # Prepare shipment data for Supabase
        shipment_data = {
            "shipment_id": shipment_id,
            "project_id": shipment.project_id,
            "material_type": shipment.material_type,
            "quantity": shipment.quantity,
            "unit": shipment.unit,
            "origin": shipment.origin,
            "destination": shipment.destination,
            "status": "pending",
            "estimated_arrival": shipment.estimated_arrival.isoformat(),
            "actual_arrival": None,
            "weather_delay_days": 0,
            "weather_condition": "Unknown",
            "disruption_score": 0.0,
            "impact_level": "minimal"
        }
        
        # Save to Supabase
        result = supabase.table("shipments").insert(shipment_data).execute()
        
        if result.data:
            # Convert back to the expected format
            saved_shipment = result.data[0]
            return {
                "shipment_id": saved_shipment["shipment_id"],
                "project_id": saved_shipment["project_id"],
                "material_type": saved_shipment["material_type"],
                "quantity": saved_shipment["quantity"],
                "unit": saved_shipment["unit"],
                "origin": saved_shipment["origin"],
                "destination": saved_shipment["destination"],
                "status": saved_shipment["status"],
                "estimated_arrival": datetime.fromisoformat(saved_shipment["estimated_arrival"].replace('Z', '+00:00')),
                "actual_arrival": datetime.fromisoformat(saved_shipment["actual_arrival"].replace('Z', '+00:00')) if saved_shipment["actual_arrival"] else None,
                "weather_delay_days": saved_shipment["weather_delay_days"],
                "weather_condition": saved_shipment["weather_condition"],
                "disruption_score": saved_shipment["disruption_score"],
                "impact_level": saved_shipment["impact_level"],
                "created_at": datetime.fromisoformat(saved_shipment["created_at"].replace('Z', '+00:00')),
                "updated_at": datetime.fromisoformat(saved_shipment["updated_at"].replace('Z', '+00:00'))
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create shipment")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create shipment: {str(e)}")

@router.put("/{shipment_id}", response_model=Shipment)
async def update_shipment(shipment_id: str, shipment_update: ShipmentUpdate, db=Depends(get_db)):
    """Update a shipment"""
    shipments = generate_shipments_from_materials(db)
    shipment = next((s for s in shipments if s["shipment_id"] == shipment_id), None)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    # Update fields
    for field, value in shipment_update.dict(exclude_unset=True).items():
        shipment[field] = value
    
    shipment["updated_at"] = datetime.now()
    return shipment

@router.get("/weather/{location}/impact")
async def get_weather_impact_on_shipments(location: str):
    """Get weather impact analysis for shipments to a specific location"""
    weather_service = WeatherService()
    
    try:
        # Extract city name from location string
        # Handle cases like "Mumbai Steel Mill" -> "Mumbai"
        city_name = extract_city_name(location)
        
        weather_data = weather_service.get_current_weather(city_name)
        # Pass material type and location for better disruption scoring
        disruption_score = weather_service.calculate_disruption_score(weather_data, material_type=None, location=location)
        
        # Determine impact level with more nuanced thresholds
        impact_level, delay_range, emoji, color = _determine_impact_level(disruption_score, weather_data)
        
        return {
            "location": location,
            "weather_condition": weather_data.get("weather_condition", "Unknown"),
            "temperature": weather_data.get("temperature", 0),
            "rain": weather_data.get("rain", 0),
            "wind_speed": weather_data.get("wind_speed", 0),
            "disruption_score": round(disruption_score, 3),
            "impact_level": impact_level,
            "delay_range": delay_range,
            "emoji": emoji,
            "color": color,
            "recommendations": get_weather_recommendations(impact_level, weather_data.get("weather_condition", ""))
        }
        
    except Exception as e:
        # Return fallback data if weather API fails
        return {
            "location": location,
            "weather_condition": "Unknown",
            "temperature": 25.0,
            "rain": 0,
            "wind_speed": 5.0,
            "disruption_score": 0.1,
            "impact_level": "minimal",
            "delay_range": "0 days",
            "emoji": "☀️",
            "color": "green",
            "recommendations": ["Normal operations can continue", "Good conditions for material transport"]
        }

@router.get("/enroute-weather/{origin}/{destination}")
async def get_enroute_weather_analysis(origin: str, destination: str):
    """Get detailed enroute weather analysis for a shipment route"""
    weather_service = WeatherService()
    
    try:
        enroute_data = weather_service.get_enroute_weather(origin, destination)
        
        return {
            "origin": origin,
            "destination": destination,
            "route_cities": enroute_data["route_cities"],
            "weather_summary": {
                "overall_disruption": enroute_data["overall_disruption"],
                "average_disruption": enroute_data["average_disruption"],
                "route_status": enroute_data["route_status"],
                "estimated_delay_days": enroute_data["estimated_delay_days"],
                "total_cities": enroute_data["route_summary"]["total_cities"],
                "severe_weather_count": enroute_data["route_summary"]["severe_weather_count"],
                "worst_weather_city": enroute_data["route_summary"]["worst_weather_city"]
            },
            "city_weather": enroute_data["weather_data"],
            "severe_weather_cities": enroute_data["severe_weather_cities"],
            "recommendations": get_route_recommendations(enroute_data["route_status"], enroute_data["severe_weather_cities"])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enroute weather analysis failed: {str(e)}")

def get_route_recommendations(route_status: str, severe_cities: List[Dict]) -> List[str]:
    """Get recommendations based on route weather conditions"""
    recommendations = []
    
    if route_status == "severe_delay":
        recommendations.extend([
            "Consider alternative routes or delay shipment",
            "Monitor weather conditions closely",
            "Prepare for extended delays",
            "Notify stakeholders of potential delays"
        ])
    elif route_status == "moderate_delay":
        recommendations.extend([
            "Monitor weather conditions",
            "Prepare for minor delays",
            "Consider weather-resistant packaging"
        ])
    else:
        recommendations.extend([
            "Normal operations can continue",
            "Good conditions for material transport",
            "Monitor for any weather changes"
        ])
    
    if severe_cities:
        city_names = [city["city"] for city in severe_cities]
        recommendations.append(f"Avoid or monitor: {', '.join(city_names)}")
    
    return recommendations

def extract_city_name(location: str) -> str:
    """Extract city name from location string"""
    # Common city names to look for
    cities = [
        "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad",
        "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
        "Visakhapatnam", "Pimpri", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra",
        "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan", "Vasai", "Varanasi", "Srinagar",
        "Aurangabad", "Navi Mumbai", "Solapur", "Vijayawada", "Kolhapur", "Amritsar", "Noida",
        "Ranchi", "Howrah", "Coimbatore", "Raipur", "Jabalpur", "Gwalior", "Chandigarh",
        "Tiruchirappalli", "Mysore", "Bhubaneswar", "Kochi", "Bhavnagar", "Salem", "Warangal",
        "Guntur", "Bhiwandi", "Amravati", "Nanded", "Kolhapur", "Sangli", "Malegaon", "Ulhasnagar",
        "Jalgaon", "Latur", "Ahmadnagar", "Dhule", "Ichalkaranji", "Parbhani", "Jalna", "Bhusawal",
        "Panvel", "Satara", "Beed", "Yavatmal", "Kamptee", "Gondia", "Barshi", "Achalpur",
        "Osmanabad", "Nandurbar", "Wardha", "Udgir", "Hinganghat", "Akola", "Amalner", "Dhule",
        "Chalisgaon", "Bhadravati", "Sangamner", "Malegaon", "Lonavla", "Deolali", "Yeola",
        "Umarkhed", "Warud", "Pusad", "Uran", "Malkapur", "Mukhed", "Mehkar", "Yawal", "Digras",
        "Achalpur", "Anjangaon", "Lonar", "Deulgaon Raja", "Shirpur", "Savner", "Tasgaon",
        "Udgir", "Umarkhed", "Warud", "Pusad", "Uran", "Malkapur", "Mukhed", "Mehkar", "Yawal",
        "Digras", "Achalpur", "Anjangaon", "Lonar", "Deulgaon Raja", "Shirpur", "Savner", "Tasgaon"
    ]
    
    # Check if any city name is in the location string
    for city in cities:
        if city.lower() in location.lower():
            return city
    
    # If no city found, try to extract the first word
    words = location.split()
    if words:
        return words[0]
    
    # Fallback to original location
    return location

# Materials endpoints
@router.get("/materials/", response_model=List[Material])
async def get_materials(db=Depends(get_db)):
    """Get all materials"""
    try:
        # Use the database client (SQLite or Supabase)
        result = db.table("materials").select("*").execute()
        return result.data
    except Exception as e:
        print(f"Error fetching materials: {str(e)}")
        # Fallback to mock data
        from routers.projects import mock_materials
        return mock_materials

@router.get("/materials/project/{project_id}", response_model=List[Material])
async def get_materials_by_project(project_id: int, db=Depends(get_db)):
    """Get materials for a specific project"""
    try:
        # Use the database client (SQLite or Supabase)
        result = db.table("materials").select("*").eq("project_id", project_id).execute()
        return result.data
    except Exception as e:
        print(f"Error fetching materials: {str(e)}")
        # Fallback to mock data
        from routers.projects import mock_materials
        return [m for m in mock_materials if m["project_id"] == project_id]

@router.post("/materials/", response_model=Material)
async def create_material(material: MaterialCreate, db=Depends(get_db)):
    """Create a new material"""
    try:
        # Create material in database
        material_data = {
            "name": material.name,
            "quantity": material.quantity,
            "unit": material.unit,
            "import_location": material.import_location,
            "project_id": material.project_id,
            "created_at": datetime.now().isoformat()
        }
        
        result = db.table("materials").insert(material_data).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create material")
            
    except Exception as e:
        print(f"Error creating material: {str(e)}")
        # Fallback to mock data
        from routers.projects import mock_materials
        new_material = {
            "id": len(mock_materials) + 1,
            "name": material.name,
            "quantity": material.quantity,
            "unit": material.unit,
            "import_location": material.import_location,
            "project_id": material.project_id,
            "created_at": datetime.now().isoformat()
        }
        mock_materials.append(new_material)
        return new_material

def _determine_impact_level(disruption_score: float, weather_data: Dict[str, Any]) -> Tuple[str, str, str, str]:
    """Determine impact level with more nuanced thresholds based on disruption score and weather conditions"""
    temp = weather_data.get("temperature", 20)
    condition = weather_data.get("weather_condition", "").lower()
    wind_speed = weather_data.get("wind_speed", 0)
    rain = weather_data.get("rain", 0)
    
    # More nuanced impact level determination
    if disruption_score >= 0.8:
        # Critical conditions
        impact_level = "critical"
        delay_range = "5-7 days"
        emoji = "🚨"
        color = "red"
    elif disruption_score >= 0.6:
        # Severe conditions
        impact_level = "severe"
        delay_range = "3-5 days"
        emoji = "⛈️"
        color = "red"
    elif disruption_score >= 0.4:
        # Moderate conditions
        impact_level = "moderate"
        delay_range = "1-3 days"
        emoji = "🌧️"
        color = "orange"
    elif disruption_score >= 0.2:
        # Minor conditions
        impact_level = "minor"
        delay_range = "0-1 days"
        emoji = "🌤️"
        color = "yellow"
    else:
        # Minimal impact
        impact_level = "minimal"
        delay_range = "0 days"
        emoji = "☀️"
        color = "green"
    
    # Adjust based on specific weather conditions
    if condition in ["thunderstorm", "storm"] and wind_speed > 30:
        impact_level = "critical" if impact_level != "critical" else impact_level
        delay_range = "5-7 days"
        emoji = "🚨"
        color = "red"
    elif temp < 0 or temp > 40:
        # Extreme temperatures
        if impact_level == "minimal":
            impact_level = "minor"
            delay_range = "0-1 days"
            emoji = "🌡️"
            color = "yellow"
    
    return impact_level, delay_range, emoji, color

def get_weather_recommendations(impact_level: str, weather_condition: str) -> List[str]:
    """Get comprehensive recommendations based on weather impact"""
    recommendations = []
    
    if impact_level == "critical":
        recommendations.extend([
            "🚨 IMMEDIATE ACTION REQUIRED: Delay all non-essential shipments",
            "Use maximum weather-resistant packaging and protection",
            "Consider alternative transportation methods (air freight if critical)",
            "Implement emergency contingency plans",
            "Notify all stakeholders of potential major delays",
            "Monitor weather conditions every 2 hours"
        ])
    elif impact_level == "severe":
        recommendations.extend([
            "Consider delaying non-critical shipments",
            "Use weather-resistant packaging",
            "Plan alternative routes",
            "Increase safety margins in scheduling",
            "Prepare for extended delays (3-5 days)",
            "Consider expedited shipping for critical materials only"
        ])
    elif impact_level == "moderate":
        recommendations.extend([
            "Monitor weather conditions closely",
            "Prepare for potential delays (1-3 days)",
            "Use standard weather protection measures",
            "Consider expedited shipping for critical materials",
            "Have backup suppliers ready"
        ])
    elif impact_level == "minor":
        recommendations.extend([
            "Monitor weather conditions",
            "Prepare for minor delays (0-1 days)",
            "Use basic weather protection",
            "Normal operations with extra caution"
        ])
    else:  # minimal
        recommendations.extend([
            "Normal operations can continue",
            "Good conditions for material transport",
            "Standard monitoring recommended"
        ])
    
    # Add specific recommendations based on weather condition
    condition_lower = weather_condition.lower()
    if "rain" in condition_lower or "drizzle" in condition_lower:
        recommendations.append("Ensure waterproof packaging for sensitive materials")
    if "storm" in condition_lower or "thunderstorm" in condition_lower:
        recommendations.append("Avoid transport during peak storm hours")
    if "wind" in condition_lower:
        recommendations.append("Secure loads properly for high winds")
    if "fog" in condition_lower or "mist" in condition_lower:
        recommendations.append("Ensure proper lighting and visibility equipment")
    if "snow" in condition_lower or "ice" in condition_lower:
        recommendations.append("Use winter-grade equipment and anti-freeze measures")
    
    return recommendations[:6]  # Limit to 6 recommendations for UI

def cancel_shipments_for_project(project_id: int, db=None) -> List[Dict[str, Any]]:
    """Cancel all shipments for a given project"""
    cancelled_shipments_list = []
    
    # Get all shipments for this project
    shipments = generate_shipments_from_materials(db)
    
    for shipment in shipments:
        if shipment["project_id"] == project_id:
            # Mark as cancelled
            shipment["status"] = "cancelled"
            shipment["updated_at"] = datetime.now().isoformat()
            cancelled_shipments_list.append(shipment)
    
    return cancelled_shipments_list

@router.get("/{shipment_id}/circular-exchange-recommendations")
async def get_circular_exchange_recommendations_for_shipment(
    shipment_id: str,
    db=Depends(get_db)
):
    """
    Get circular exchange recommendations for a specific delayed shipment
    
    This endpoint provides alternate material recommendations when a shipment is delayed,
    helping to maintain project timelines through circular resource exchange.
    """
    try:
        # Get the shipment
        shipments = generate_shipments_from_materials(db)
        shipment = next((s for s in shipments if s["shipment_id"] == shipment_id), None)
        
        if not shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")
        
        # Check if shipment is delayed
        if shipment["status"] != "delayed":
            return {
                "shipment_id": shipment_id,
                "status": shipment["status"],
                "message": "Shipment is not delayed. Circular exchange recommendations are only available for delayed shipments.",
                "circular_exchange_recommendations": None
            }
        
        # Get project information
        project_result = db.table("projects").select("*").eq("project_id", shipment["project_id"]).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = project_result.data[0]
        
        # Get circular exchange recommendations
        recommendations = circular_exchange_service.find_alternate_materials(
            delayed_material=shipment["material_type"],
            delayed_project_id=shipment["project_id"],
            required_quantity=shipment["quantity"],
            required_unit=shipment["unit"],
            delayed_project_location=project["location"]
        )
        
        # Convert recommendations to response format
        alternatives_response = []
        for alt in recommendations.alternatives:
            alternatives_response.append({
                "project_id": alt.project_id,
                "project_name": alt.project_name,
                "material_name": alt.material_name,
                "quantity_available": alt.quantity_available,
                "unit": alt.unit,
                "distance_km": alt.distance_km,
                "expiry_date": alt.expiry_date.isoformat(),
                "feasibility_score": alt.feasibility_score,
                "recommendation_message": alt.recommendation_message,
                "co2_emissions_kg": alt.co2_emissions_kg,
                "days_until_expiry": alt.days_until_expiry
            })
        
        return {
            "shipment_id": shipment_id,
            "delayed_material": shipment["material_type"],
            "delayed_project_id": shipment["project_id"],
            "delayed_project_name": project["project_name"],
            "weather_delay_days": shipment["weather_delay_days"],
            "circular_exchange_recommendations": {
                "alternatives": alternatives_response,
                "total_alternatives_found": recommendations.total_alternatives_found,
                "recommendation_summary": recommendations.recommendation_summary
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting circular exchange recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")