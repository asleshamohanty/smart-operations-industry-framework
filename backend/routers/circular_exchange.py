"""
Circular Resource Exchange API Router

This module provides API endpoints for the circular resource exchange feature,
allowing users to get recommendations for alternate materials when shipments are delayed.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import json

from utils.circular_exchange_service import (
    CircularResourceExchangeService, 
    CircularExchangeRecommendation,
    MaterialMatch
)
from database import get_db

router = APIRouter(prefix="/circular-exchange", tags=["circular-exchange"])

# Pydantic models for API responses
class MaterialMatchResponse(BaseModel):
    project_id: int
    project_name: str
    material_name: str
    quantity_available: float
    unit: str
    distance_km: float
    expiry_date: str
    feasibility_score: float
    recommendation_message: str
    co2_emissions_kg: float
    days_until_expiry: int

class CircularExchangeResponse(BaseModel):
    delayed_material: str
    delayed_project_id: int
    delayed_project_name: str
    alternatives: List[MaterialMatchResponse]
    total_alternatives_found: int
    recommendation_summary: str
    generated_at: str

class DelayNotificationRequest(BaseModel):
    shipment_id: str
    material_name: str
    project_id: int
    required_quantity: float
    required_unit: str
    delay_reason: str
    estimated_delay_days: int

class MaterialSearchRequest(BaseModel):
    material_name: str
    project_id: int
    required_quantity: float
    required_unit: str

# Initialize the service
circular_exchange_service = CircularResourceExchangeService()

@router.post("/recommendations", response_model=CircularExchangeResponse)
async def get_circular_exchange_recommendations(
    request: MaterialSearchRequest,
    db = Depends(get_db)
):
    """
    Get circular exchange recommendations for a delayed material
    
    This endpoint finds alternate materials from other projects that can be used
    to replace a delayed shipment, prioritizing sustainability and efficiency.
    """
    try:
        # Get project location
        project_result = db.table("projects").select("*").eq("project_id", request.project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = project_result.data[0]
        project_location = project["location"]
        
        # Get recommendations
        recommendation = circular_exchange_service.find_alternate_materials(
            delayed_material=request.material_name,
            delayed_project_id=request.project_id,
            required_quantity=request.required_quantity,
            required_unit=request.required_unit,
            delayed_project_location=project_location
        )
        
        # Convert to response format
        alternatives_response = []
        for alt in recommendation.alternatives:
            alternatives_response.append(MaterialMatchResponse(
                project_id=alt.project_id,
                project_name=alt.project_name,
                material_name=alt.material_name,
                quantity_available=alt.quantity_available,
                unit=alt.unit,
                distance_km=alt.distance_km,
                expiry_date=alt.expiry_date.isoformat(),
                feasibility_score=alt.feasibility_score,
                recommendation_message=alt.recommendation_message,
                co2_emissions_kg=alt.co2_emissions_kg,
                days_until_expiry=alt.days_until_expiry
            ))
        
        return CircularExchangeResponse(
            delayed_material=recommendation.delayed_material,
            delayed_project_id=recommendation.delayed_project_id,
            delayed_project_name=recommendation.delayed_project_name,
            alternatives=alternatives_response,
            total_alternatives_found=recommendation.total_alternatives_found,
            recommendation_summary=recommendation.recommendation_summary,
            generated_at=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting circular exchange recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.post("/delay-notification", response_model=CircularExchangeResponse)
async def handle_delay_notification(
    request: DelayNotificationRequest,
    db = Depends(get_db)
):
    """
    Handle a shipment delay notification and automatically suggest alternatives
    
    This endpoint is triggered when a shipment is delayed and automatically
    provides circular exchange recommendations.
    """
    try:
        # Get project information
        project_result = db.table("projects").select("*").eq("project_id", request.project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = project_result.data[0]
        project_location = project["location"]
        
        # Get recommendations
        recommendation = circular_exchange_service.find_alternate_materials(
            delayed_material=request.material_name,
            delayed_project_id=request.project_id,
            required_quantity=request.required_quantity,
            required_unit=request.required_unit,
            delayed_project_location=project_location
        )
        
        # Convert to response format
        alternatives_response = []
        for alt in recommendation.alternatives:
            alternatives_response.append(MaterialMatchResponse(
                project_id=alt.project_id,
                project_name=alt.project_name,
                material_name=alt.material_name,
                quantity_available=alt.quantity_available,
                unit=alt.unit,
                distance_km=alt.distance_km,
                expiry_date=alt.expiry_date.isoformat(),
                feasibility_score=alt.feasibility_score,
                recommendation_message=alt.recommendation_message,
                co2_emissions_kg=alt.co2_emissions_kg,
                days_until_expiry=alt.days_until_expiry
            ))
        
        return CircularExchangeResponse(
            delayed_material=recommendation.delayed_material,
            delayed_project_id=recommendation.delayed_project_id,
            delayed_project_name=recommendation.delayed_project_name,
            alternatives=alternatives_response,
            total_alternatives_found=recommendation.total_alternatives_found,
            recommendation_summary=recommendation.recommendation_summary,
            generated_at=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error handling delay notification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process delay notification: {str(e)}")

@router.get("/available-materials")
async def get_available_materials_for_exchange(
    exclude_project_id: int = None,
    db = Depends(get_db)
):
    """
    Get all materials available for circular exchange
    
    This endpoint returns all materials from projects that could potentially
    be used in circular exchange, excluding materials from a specific project.
    """
    try:
        # Get all materials
        if exclude_project_id:
            result = db.table("materials").select("*").neq("project_id", exclude_project_id).execute()
        else:
            result = db.table("materials").select("*").execute()
        
        materials = result.data if result.data else []
        
        # Enrich with project information
        enriched_materials = []
        for material in materials:
            project_result = db.table("projects").select("*").eq("project_id", material["project_id"]).execute()
            if project_result.data:
                project = project_result.data[0]
                enriched_material = {
                    "material_id": material["id"],
                    "material_name": material["name"],
                    "quantity": material["quantity"],
                    "unit": material["unit"],
                    "import_location": material["import_location"],
                    "project_id": material["project_id"],
                    "project_name": project["project_name"],
                    "project_location": project["location"],
                    "created_at": material["created_at"]
                }
                enriched_materials.append(enriched_material)
        
        return {
            "available_materials": enriched_materials,
            "total_count": len(enriched_materials),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error getting available materials: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get available materials: {str(e)}")

@router.get("/sustainability-metrics")
async def get_sustainability_metrics(db = Depends(get_db)):
    """
    Get sustainability metrics for circular exchange
    
    This endpoint provides metrics about the environmental impact
    of circular exchange activities.
    """
    try:
        # Get all materials
        materials_result = db.table("materials").select("*").execute()
        materials = materials_result.data if materials_result.data else []
        
        # Get all projects
        projects_result = db.table("projects").select("*").execute()
        projects = projects_result.data if projects_result.data else []
        
        # Calculate metrics
        total_materials = len(materials)
        total_projects = len(projects)
        
        # Calculate potential CO2 savings (simplified)
        total_quantity = sum(material.get("quantity", 0) for material in materials)
        avg_distance = 300  # Average distance assumption
        potential_co2_savings = total_quantity * avg_distance * 0.2  # Simplified calculation
        
        # Calculate materials nearing expiry
        current_date = datetime.now()
        materials_nearing_expiry = 0
        
        for material in materials:
            try:
                created_at = datetime.fromisoformat(material["created_at"].replace('Z', '+00:00'))
                # Assume 6 months shelf life for calculation
                expiry_date = created_at + timedelta(days=180)
                days_until_expiry = (expiry_date - current_date).days
                
                if days_until_expiry <= 30:
                    materials_nearing_expiry += 1
            except:
                continue
        
        return {
            "total_materials_available": total_materials,
            "total_projects": total_projects,
            "materials_nearing_expiry": materials_nearing_expiry,
            "potential_co2_savings_kg": round(potential_co2_savings, 2),
            "circular_exchange_potential": "High" if total_materials > 5 else "Medium" if total_materials > 2 else "Low",
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error getting sustainability metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get sustainability metrics: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint for circular exchange service"""
    return {
        "status": "healthy",
        "service": "circular-resource-exchange",
        "timestamp": datetime.now().isoformat()
    }
