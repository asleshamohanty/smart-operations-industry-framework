from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from schemas import (
    Project as ProjectSchema,
    ProjectCreate,
    ProjectUpdate,
    Task as TaskSchema,
    TaskCreate,
    SimulationRequest,
    SimulationResult,
    MaterialCreate,
)
from typing import List
import uuid
from datetime import datetime, timedelta
import os
from supabase import create_client, Client

router = APIRouter(prefix="/projects", tags=["projects"])

# Initialize Supabase client
def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    
    return create_client(supabase_url, supabase_key)

# Mock materials data for testing (fallback)
mock_materials = []

# Mock projects data for testing
mock_projects = [
    {
        "id": 1,
        "project_id": 1,
        "project_name": "Highway project",
        "location": "Mumbai, Maharashtra, India",
        "project_budget": 44.0,
        "currency": "INR",
        "project_type": "wasd",
        "description": "wasd",
        "estimated_duration_days": 444,
        "team_size": 44,
        "created_at": datetime.now().isoformat()
    },
    {
        "id": 2,
        "project_id": 2,
        "project_name": "Test Delhi",
        "location": "New Delhi",
        "project_budget": 100000000.0,
        "currency": "INR",
        "project_type": "Construction",
        "description": "infeinef",
        "estimated_duration_days": 0,
        "team_size": 5,
        "created_at": datetime.now().isoformat()
    }
]

@router.post("/", response_model=ProjectSchema)
async def create_project(project: ProjectCreate, db=Depends(get_db)):
    """Create a new project"""
    try:
        # Use the database client (SQLite or Supabase)
        # Get the next project_id
        result = db.table("projects").select("project_id").order("project_id", desc=True).limit(1).execute()
        next_project_id = (result.data[0]["project_id"] + 1) if result.data else 1
        
        # Create the project
        project_data = {
            "project_id": next_project_id,
            "project_name": project.project_name,
            "location": project.location,
            "project_budget": project.project_budget,
            "currency": getattr(project, 'currency', 'INR'),
            "project_type": project.project_type,
            "description": project.description,
            "estimated_duration_days": project.estimated_duration_days,
            "team_size": project.team_size,
            "created_at": datetime.now().isoformat()
        }
        
        result = db.table("projects").insert(project_data).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create project")
            
    except Exception as e:
        print(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")


@router.get("/", response_model=List[ProjectSchema])
async def get_all_projects(db=Depends(get_db)):
    """Get all projects"""
    try:
        # Use the database client (SQLite or Supabase)
        result = db.table("projects").select("*").execute()
        return result.data
    except Exception as e:
        print(f"Error fetching projects: {str(e)}")
        # Fallback to mock data
        return mock_projects


@router.get("/{project_id}", response_model=ProjectSchema)
async def get_project(project_id: int, db=Depends(get_db)):
    """Get a specific project by ID"""
    try:
        # Use the database client (SQLite or Supabase)
        result = db.table("projects").select("*").eq("project_id", project_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Project not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching project: {str(e)}")
        # Fallback to mock data
        project = next((p for p in mock_projects if p["project_id"] == project_id), None)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project


@router.put("/{project_id}", response_model=ProjectSchema)
async def update_project(project_id: int, project_update: ProjectUpdate, db=Depends(get_db)):
    """Update a project"""
    try:
        # Check if project exists
        existing_project = db.table("projects").select("*").eq("project_id", project_id).execute()
        if not existing_project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Prepare update data - only include fields that are provided
        update_data = {}
        if project_update.project_name is not None:
            update_data["project_name"] = project_update.project_name
        if project_update.location is not None:
            update_data["location"] = project_update.location
        if project_update.project_budget is not None:
            update_data["project_budget"] = project_update.project_budget
        if project_update.currency is not None:
            update_data["currency"] = project_update.currency
        if project_update.project_type is not None:
            update_data["project_type"] = project_update.project_type
        if project_update.description is not None:
            update_data["description"] = project_update.description
        if project_update.estimated_duration_days is not None:
            update_data["estimated_duration_days"] = project_update.estimated_duration_days
        if project_update.team_size is not None:
            update_data["team_size"] = project_update.team_size
        
        # Don't add updated_at if the column doesn't exist in the database
        # update_data["updated_at"] = datetime.now().isoformat()

        # Perform the update
        result = db.table("projects").update(update_data).eq("project_id", project_id).execute()
        
        # Get the updated project
        updated_project = db.table("projects").select("*").eq("project_id", project_id).execute()
        if not updated_project.data:
            raise HTTPException(status_code=500, detail="Failed to retrieve updated project")

        return updated_project.data[0]
        
    except Exception as e:
        print(f"Error updating project: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/{project_id}")
async def delete_project(project_id: int, db=Depends(get_db)):
    """Delete a project and cancel all related shipments"""
    try:
        # Try Supabase first, fallback to mock data if not available
        try:
            supabase = get_supabase_client()
            
            # Check if project exists
            result = supabase.table("projects").select("*").eq("project_id", project_id).execute()
            if not result.data:
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Cancel all shipments for this project
            from routers.shipments import cancel_shipments_for_project
            cancelled_shipments = cancel_shipments_for_project(project_id)
            
            # Delete the project (this will cascade delete materials and shipments due to foreign key constraints)
            supabase.table("projects").delete().eq("project_id", project_id).execute()
            
            return {
                "message": f"Project {project_id} deleted successfully",
                "cancelled_shipments": len(cancelled_shipments),
                "cancelled_shipment_ids": [s["shipment_id"] for s in cancelled_shipments]
            }
            
        except Exception as supabase_error:
            print(f"Supabase error, falling back to mock data: {str(supabase_error)}")
            
            # Fallback to mock data
            global mock_projects
            project = next((p for p in mock_projects if p["project_id"] == project_id), None)
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Cancel all shipments for this project
            from routers.shipments import cancel_shipments_for_project
            cancelled_shipments = cancel_shipments_for_project(project_id)
            
            # Remove project from mock data
            mock_projects = [p for p in mock_projects if p["project_id"] != project_id]
            
            # Remove associated materials
            global mock_materials
            mock_materials = [m for m in mock_materials if m["project_id"] != project_id]
            
            return {
                "message": f"Project {project_id} deleted successfully (mock data)",
                "cancelled_shipments": len(cancelled_shipments),
                "cancelled_shipment_ids": [s["shipment_id"] for s in cancelled_shipments]
            }
        
    except Exception as e:
        print(f"Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

@router.post("/{project_id}/materials", response_model=MaterialCreate)
async def create_project_material(project_id: int, material: MaterialCreate, db = Depends(get_db)):
    """Create a material for a project"""
    try:
        # Verify project exists using database
        project_result = db.table("projects").select("*").eq("project_id", project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get project location for local suppliers/quarries
        project = project_result.data[0]
        project_location = project["location"]
        
        # Replace "Local suppliers" and "Local quarries" with project location
        import_location = material.import_location
        if import_location in ["Local suppliers", "Local quarries"]:
            import_location = project_location
            print(f"Replaced '{material.import_location}' with project location: {project_location}")
        
        # Create material in database
        material_data = {
            "name": material.name,
            "quantity": material.quantity,
            "unit": material.unit,
            "import_location": import_location,
            "project_id": project_id,
            "created_at": datetime.now().isoformat()
        }
        
        result = db.table("materials").insert(material_data).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create material")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating material: {str(e)}")
        # Fallback to mock data
        project = next((p for p in mock_projects if p["project_id"] == project_id), None)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        new_material = {
            "id": len(mock_materials) + 1,
            "name": material.name,
            "quantity": material.quantity,
            "unit": material.unit,
            "import_location": material.import_location,
            "project_id": project_id,
            "created_at": datetime.now().isoformat()
        }
        
        mock_materials.append(new_material)
        return new_material

@router.get("/{project_id}/materials")
async def get_project_materials(project_id: int, db = Depends(get_db)):
    """Get materials for a project"""
    try:
        # Use the database client (SQLite or Supabase)
        result = db.table("materials").select("*").eq("project_id", project_id).execute()
        return result.data
    except Exception as e:
        print(f"Error fetching materials: {str(e)}")
        # Fallback to mock data
        project_materials = [m for m in mock_materials if m["project_id"] == project_id]
        return project_materials




@router.post("/{project_id}/tasks", response_model=TaskSchema)
async def create_task(project_id: int, task: TaskCreate, db=Depends(get_db)):
    """Create a new task for a project"""
    project_result = db.table("projects").select("*").eq("project_id", project_id).execute()
    if not project_result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    task_id = int(str(uuid.uuid4().int)[:8])

    task_data = {
        "task_id": task_id,
        "task_name": task.task_name,
        "planned_start_date": task.planned_start_date.isoformat() if task.planned_start_date else None,
        "planned_end_date": task.planned_end_date.isoformat() if task.planned_end_date else None,
        "duration_days": task.duration_days,
        "labor_count": task.labor_count,
        "labor_cost_per_day": task.labor_cost_per_day,
        "equipment_cost_per_day": task.equipment_cost_per_day,
        "material": task.material,
        "material_quantity": task.material_quantity,
        "material_unit_cost": task.material_unit_cost,
        "planned_task_cost": task.planned_task_cost,
        "e_score": task.e_score,
        "s_score": task.s_score,
        "g_score": task.g_score,
        "carbon_footprint_kg": task.carbon_footprint_kg,
        "water_usage_m3": task.water_usage_m3,
        "energy_usage_kwh": task.energy_usage_kwh,
        "sdg_alignment_score": task.sdg_alignment_score,
        "predicted_delay_days": task.predicted_delay_days,
        "predicted_task_cost": task.predicted_task_cost,
        "predicted_esg_score": task.predicted_esg_score,
        "profit_impact": task.profit_impact,
        "project_id": project_id,
        "created_at": datetime.now().isoformat(),
    }

    result = db.table("tasks").insert(task_data).execute()

    if result.data:
        return result.data[0]
    else:
        raise HTTPException(status_code=500, detail="Failed to create task")


@router.get("/{project_id}/tasks", response_model=List[TaskSchema])
async def get_project_tasks(project_id: int, db=Depends(get_db)):
    """Get all tasks for a specific project"""
    result = db.table("tasks").select("*").eq("project_id", project_id).execute()
    return result.data or []


@router.post("/simulate", response_model=SimulationResult)
async def simulate_project_scenario(simulation_request: SimulationRequest, db=Depends(get_db)):
    """Run 'what-if' simulations for alternate materials/resources"""
    project_result = db.table("projects").select("*").eq("project_id", simulation_request.project_id).execute()
    if not project_result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    project = project_result.data[0]
    tasks_result = db.table("tasks").select("*").eq("project_id", simulation_request.project_id).execute()

    if tasks_result.data:
        tasks = tasks_result.data
        original_cost = sum(task.get("planned_task_cost", 0) for task in tasks)
        original_duration = sum(task.get("duration_days", 0) for task in tasks)
    else:
        original_cost = project.get("project_budget", 1000000)
        original_duration = project.get("estimated_duration_days", 90)

    predicted_cost = original_cost
    predicted_duration = original_duration

    # Material substitution
    if simulation_request.alternative_materials:
        cost_multiplier = 1.0
        duration_multiplier = 1.0

        for material in simulation_request.alternative_materials:
            if material.lower() == "recycled":
                cost_multiplier *= 0.9
                duration_multiplier *= 1.1
            elif material.lower() == "sustainable":
                cost_multiplier *= 1.2
                duration_multiplier *= 0.95

        predicted_cost *= cost_multiplier
        predicted_duration *= duration_multiplier

    # Resource adjustments
    if simulation_request.alternative_resources:
        labor_multiplier = simulation_request.alternative_resources.get("labor", 1.0)
        equipment_multiplier = simulation_request.alternative_resources.get("equipment", 1.0)

        predicted_cost *= (labor_multiplier + equipment_multiplier) / 2
        predicted_duration *= 1 / labor_multiplier

    # Weather scenario impact
    weather_impact = 1.0
    weather_data = None
    weather_recommendations = []

    if simulation_request.weather_scenario:
        try:
            from utils.openweather_service import OpenWeatherService
            weather_service = OpenWeatherService()
            
            print(f"🌤️ Processing weather scenario: {simulation_request.weather_scenario}")

            if simulation_request.weather_scenario == "current":
                print(f"🌡️ Fetching current weather for: {project.get('location', 'Mumbai')}")
                weather_data = weather_service.get_current_weather(project.get("location", "Mumbai"))
                print(f"📊 Weather data received: {weather_data.get('weather_condition', 'Unknown')} at {weather_data.get('temperature', 'N/A')}°C")
                
                weather_impact_data = weather_service.calculate_weather_impact(weather_data)
                weather_impact = weather_impact_data["cost_multiplier"]
                predicted_duration *= weather_impact_data["duration_multiplier"]
                weather_recommendations = weather_impact_data["recommendations"]
                print(f"⚡ Weather impact calculated: {weather_impact}x cost, {weather_impact_data['duration_multiplier']}x duration")

            elif simulation_request.weather_scenario == "forecast_3d":
                forecasts = weather_service.get_weather_forecast(project.get("location", "Mumbai"), 3)
                total_cost_impact = 0
                total_duration_impact = 0
                for forecast in forecasts[:8]:
                    impact = weather_service.calculate_weather_impact(forecast)
                    total_cost_impact += impact["cost_multiplier"]
                    total_duration_impact += impact["duration_multiplier"]
                weather_impact = total_cost_impact / 8
                predicted_duration *= total_duration_impact / 8
                if forecasts:
                    weather_data = {
                        "location": project.get("location", "Mumbai"),
                        "temperature": forecasts[0]["temperature"],
                        "humidity": forecasts[0]["humidity"],
                        "wind_speed": forecasts[0]["wind_speed"],
                        "weather_condition": forecasts[0]["weather_condition"],
                        "weather_description": forecasts[0]["weather_description"],
                        "timestamp": forecasts[0]["datetime"],
                    }

            elif simulation_request.weather_scenario == "forecast_7d":
                forecasts = weather_service.get_weather_forecast(project.get("location", "Mumbai"), 7)
                total_cost_impact = 0
                total_duration_impact = 0
                for forecast in forecasts[:16]:
                    impact = weather_service.calculate_weather_impact(forecast)
                    total_cost_impact += impact["cost_multiplier"]
                    total_duration_impact += impact["duration_multiplier"]
                weather_impact = total_cost_impact / 16
                predicted_duration *= total_duration_impact / 16
                if forecasts:
                    weather_data = {
                        "location": project.get("location", "Mumbai"),
                        "temperature": forecasts[0]["temperature"],
                        "humidity": forecasts[0]["humidity"],
                        "wind_speed": forecasts[0]["wind_speed"],
                        "weather_condition": forecasts[0]["weather_condition"],
                        "weather_description": forecasts[0]["weather_description"],
                        "timestamp": forecasts[0]["datetime"],
                    }

            elif simulation_request.weather_scenario == "severe":
                weather_impact = 1.4
                predicted_duration *= 1.5
                weather_recommendations = [
                    "Postpone outdoor activities due to severe weather",
                    "Implement emergency weather protocols",
                    "Secure all equipment and materials",
                    "Consider indoor work alternatives",
                ]
                weather_data = {
                    "location": project.get("location", "Mumbai"),
                    "temperature": 5.0,
                    "humidity": 95,
                    "wind_speed": 25.0,
                    "weather_condition": "Storm",
                    "weather_description": "Severe thunderstorm with heavy rain",
                    "timestamp": datetime.now().isoformat(),
                }

        except Exception as e:
            print(f"❌ Weather service failed: {e}")
            print(f"🔄 Using fallback weather data for scenario: {simulation_request.weather_scenario}")
            
            # Provide better fallback data based on scenario
            if simulation_request.weather_scenario == "current":
                weather_impact = 1.0
                weather_data = {
                    "location": project.get("location", "Mumbai"),
                    "temperature": 25.0,
                    "humidity": 65,
                    "pressure": 1013,
                    "wind_speed": 8.0,
                    "wind_direction": 180,
                    "weather_condition": "Clear",
                    "weather_description": "Clear sky (fallback data)",
                    "visibility": 10,
                    "cloudiness": 25,
                    "timestamp": datetime.now().isoformat(),
                }
                weather_recommendations = [
                    "Monitor weather conditions regularly",
                    "Have contingency plans for weather changes",
                    "Ensure proper weather protection for materials"
                ]
            elif simulation_request.weather_scenario == "severe":
                weather_impact = 1.4
                predicted_duration *= 1.5
                weather_recommendations = [
                    "Postpone outdoor activities due to severe weather",
                    "Implement emergency weather protocols",
                    "Secure all equipment and materials",
                    "Consider indoor work alternatives",
                ]
                weather_data = {
                    "location": project.get("location", "Mumbai"),
                    "temperature": 5.0,
                    "humidity": 95,
                    "wind_speed": 25.0,
                    "weather_condition": "Storm",
                    "weather_description": "Severe thunderstorm with heavy rain",
                    "timestamp": datetime.now().isoformat(),
                }
            else:
                # Default fallback for other scenarios
                weather_impact = 1.0
                weather_data = {
                    "location": project.get("location", "Mumbai"),
                    "temperature": 20.0,
                    "humidity": 60,
                    "wind_speed": 5.0,
                    "weather_condition": "Clear",
                    "weather_description": "Clear sky (fallback data)",
                    "timestamp": datetime.now().isoformat(),
                }
                weather_recommendations = [
                    "Monitor weather conditions regularly",
                    "Have contingency plans for weather changes"
                ]

    predicted_cost *= weather_impact

    # ESG Calculation
    from utils.esg_calculator import ESGCalculator
    esg_calc = ESGCalculator()

    tasks_data = []
    if tasks_result.data:
        for task in tasks_result.data:
            tasks_data.append({
                "e_score": task.get("e_score", 0),
                "s_score": task.get("s_score", 0),
                "g_score": task.get("g_score", 0),
                "water_usage_m3": task.get("water_usage_m3", 0),
                "energy_usage_kwh": task.get("energy_usage_kwh", 0),
                "carbon_footprint_kg": task.get("carbon_footprint_kg", 0),
                "material_unit_cost": task.get("material_unit_cost", 0),
            })
    else:
        tasks_data = [{
            "e_score": 0.7,
            "s_score": 0.8,
            "g_score": 0.75,
            "water_usage_m3": 1000,
            "energy_usage_kwh": 5000,
            "carbon_footprint_kg": 2000,
            "material_unit_cost": original_cost * 0.6,
        }]

    esg_impact = esg_calc.calculate_project_esg(tasks_data)

    # Llama AI Recommendations
    try:
        print(f"🤖 Starting AI recommendations generation...")
        from utils.hybrid_ai_service import hybrid_ai_service
        print(f"✅ Hybrid AI service imported successfully")

        simulation_context = {
            "project_name": project.get("project_name", "Construction Project"),
            "project_type": project.get("project_type", "Infrastructure"),
            "location": project.get("location", "Unknown"),
            "original_cost": original_cost,
            "predicted_cost": predicted_cost,
            "original_duration": original_duration,
            "predicted_duration": int(predicted_duration),
            "alternative_materials": simulation_request.alternative_materials or [],
            "alternative_resources": simulation_request.alternative_resources or {},
            "weather_scenario": simulation_request.weather_scenario or "current",
            "weather_data": weather_data,
            "weather_impact": weather_impact,
            "weather_recommendations": weather_recommendations,
            "esg_impact": esg_impact,
            "detailed_weather_analysis": {
                "current_conditions": weather_data,
                "impact_on_construction": {
                    "cost_multiplier": weather_impact,
                    "duration_impact": f"{((predicted_duration - original_duration) / original_duration * 100):.1f}%",
                    "productivity_factor": 1.0 / weather_impact if weather_impact > 0 else 1.0
                },
                "weather_risks": _analyze_weather_risks(weather_data, simulation_request.weather_scenario),
                "seasonal_considerations": _get_seasonal_advice(project.get("location", "Mumbai"))
            }
        }

        print(f"🤖 Calling AI service with context:")
        print(f"   📊 Project: {simulation_context['project_name']}")
        print(f"   🌤️ Weather: {simulation_context['weather_scenario']}")
        print(f"   💰 Cost: ₹{original_cost:,.0f} → ₹{predicted_cost:,.0f}")
        print(f"   ⏱️ Duration: {original_duration} → {int(predicted_duration)} days")
        print(f"   🌡️ Weather data available: {weather_data is not None}")

        print(f"🔄 Calling hybrid AI service...")
        recommendations = await hybrid_ai_service.generateSimulationRecommendations(simulation_context)
        print(f"✅ AI service returned {len(recommendations) if recommendations else 0} recommendations")

        if weather_recommendations:
            recommendations.extend(weather_recommendations[:3])

    except Exception as e:
        print(f"❌ AI service failed, using fallback recommendations: {e}")
        print(f"🔍 Exception type: {type(e).__name__}")
        import traceback
        print(f"🔍 Traceback: {traceback.format_exc()}")
        recommendations = esg_calc.generate_esg_recommendations(esg_impact)
        if weather_recommendations:
            recommendations.extend(weather_recommendations[:3])

    return SimulationResult(
        original_cost=round(original_cost, 2),
        predicted_cost=round(predicted_cost, 2),
        original_duration=original_duration,
        predicted_duration=int(predicted_duration),
        esg_impact=esg_impact,
        weather_impact=weather_impact,
        weather_data=weather_data,
        recommendations=recommendations,
    )


def _analyze_weather_risks(weather_data: dict, scenario: str) -> list:
    """Analyze weather-related risks for construction"""
    risks = []

    if weather_data.get("temperature", 20) < 5:
        risks.append("Freezing temperatures may affect concrete curing and worker safety")
    elif weather_data.get("temperature", 20) > 35:
        risks.append("High temperatures may cause heat stress and material expansion")

    if weather_data.get("humidity", 60) > 80:
        risks.append("High humidity may delay drying times and affect material quality")

    if weather_data.get("wind_speed", 5) > 15:
        risks.append("Strong winds may pose safety risks for crane operations and high work")

    if "rain" in weather_data.get("weather_condition", "").lower():
        risks.append("Rain may cause delays in outdoor activities and material damage")

    if scenario == "severe":
        risks.extend([
            "Severe weather conditions require emergency protocols",
            "Consider postponing critical outdoor activities",
            "Implement enhanced safety measures for workers"
        ])

    return risks


def _get_seasonal_advice(location: str) -> list:
    """Get seasonal construction advice based on location"""
    advice = [
        "Monitor weather forecasts daily for project planning",
        "Have contingency plans for weather-related delays",
        "Schedule critical outdoor work during favorable weather windows",
        "Maintain proper material storage to prevent weather damage"
    ]

    if "mumbai" in location.lower():
        advice.extend([
            "Monsoon season (June-September) requires special drainage considerations",
            "High humidity year-round may affect material storage and curing",
            "Consider prefabricated components to reduce weather exposure"
        ])

    return advice


@router.get("/{project_id}/summary")
async def get_project_summary(project_id: int, db=Depends(get_db)):
    """Get project summary with key metrics"""
    # Check if Supabase is configured
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    print(f"Supabase URL: {supabase_url}")
    print(f"Supabase Key: {supabase_key}")
    
    if not supabase_url or not supabase_key:
        # Use mock data when Supabase is not configured
        print(f"Supabase not configured, using mock data for project summary. Looking for project_id: {project_id}")
        print(f"Available mock projects: {[p['project_id'] for p in mock_projects]}")
        mock_project = next((p for p in mock_projects if p["project_id"] == project_id), None)
        if not mock_project:
            print(f"Project {project_id} not found in mock data")
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {
            "project": mock_project,
            "total_tasks": 5,
            "total_cost": mock_project["project_budget"] * 0.8,
            "total_duration": mock_project["estimated_duration_days"],
            "avg_esg_score": 75.5,
        }
    
    try:
        project_result = db.table("projects").select("*").eq("project_id", project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")

        project = project_result.data[0]
        tasks_result = db.table("tasks").select("*").eq("project_id", project_id).execute()
        tasks = tasks_result.data or []

        if not tasks:
            return {
                "project": project,
                "total_tasks": 0,
                "total_cost": 0,
                "total_duration": 0,
                "avg_esg_score": 0,
            }
    except Exception as e:
        # Fallback to mock data if database is not available
        print(f"Database error, using mock data: {e}")
        mock_project = next((p for p in mock_projects if p["project_id"] == project_id), None)
        if not mock_project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {
            "project": mock_project,
            "total_tasks": 5,
            "total_cost": mock_project["project_budget"] * 0.8,
            "total_duration": mock_project["estimated_duration_days"],
            "avg_esg_score": 75.5,
        }

    total_cost = sum(task.get("planned_task_cost", 0) for task in tasks)
    total_duration = sum(task.get("duration_days", 0) for task in tasks)
    avg_esg_score = sum(task.get("predicted_esg_score", 0) for task in tasks) / len(tasks)

    return {
        "project": project,
        "total_tasks": len(tasks),
        "total_cost": round(total_cost, 2),
        "total_duration": total_duration,
        "avg_esg_score": round(avg_esg_score, 3),
        "budget_utilization": round((total_cost / project.get("project_budget", 1)) * 100, 2),
    }
