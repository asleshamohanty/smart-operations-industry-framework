"""
Enhanced Circular Exchange API Router

This module provides enhanced API endpoints for:
1. Material presets by project type
2. Surplus detection and management
3. Proactive circular resource recommendations
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from utils.circular_exchange_service import CircularResourceExchangeService
from utils.material_presets_service import MaterialPresetService, SurplusDetectionService, ProjectType
from database import get_db

router = APIRouter(prefix="/circular-exchange", tags=["circular-exchange"])

# Initialize services
circular_exchange_service = CircularResourceExchangeService()
material_preset_service = MaterialPresetService()
surplus_detection_service = SurplusDetectionService()

# Pydantic models
class MaterialPresetResponse(BaseModel):
    material_name: str
    recommended_quantity: float
    unit: str
    priority: int
    description: str
    typical_supplier_location: str

class SurplusMaterialResponse(BaseModel):
    material_id: int
    material_name: str
    current_quantity: float
    unit: str
    project_id: int
    project_name: str
    project_location: str
    surplus_quantity: float
    surplus_percentage: float
    expiry_date: str
    days_until_expiry: int
    status: str
    exchange_priority: float

class SurplusSummaryResponse(BaseModel):
    total_surplus_materials: int
    urgent_materials: int
    near_expiry_materials: int
    surplus_materials: int
    total_surplus_quantity: float
    exchange_potential: str
    generated_at: str

class ProjectTypeRequest(BaseModel):
    project_type: str

class ProjectMaterialRequest(BaseModel):
    project_id: int
    project_name: str
    project_type: str

# Material Presets Endpoints
@router.get("/material-presets/{project_type}", response_model=List[MaterialPresetResponse])
async def get_material_presets(project_type: str):
    """
    Get recommended material presets for a specific project type
    
    Project types: Highway, Bridge, Building, Industrial, Commercial, Residential
    """
    try:
        presets = material_preset_service.get_material_presets(project_type)
        
        return [
            MaterialPresetResponse(
                material_name=preset.material_name,
                recommended_quantity=preset.recommended_quantity,
                unit=preset.unit,
                priority=preset.priority,
                description=preset.description,
                typical_supplier_location=preset.typical_supplier_location
            )
            for preset in presets
        ]
        
    except Exception as e:
        print(f"Error getting material presets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get material presets: {str(e)}")

@router.get("/project-types")
async def get_available_project_types():
    """Get list of available project types"""
    return {
        "project_types": [pt.value for pt in ProjectType],
        "descriptions": {
            "Highway": "Road construction and maintenance projects",
            "Bridge": "Bridge construction and infrastructure projects",
            "Building": "General building construction projects",
            "Industrial": "Industrial facility construction projects",
            "Commercial": "Commercial building and retail projects",
            "Residential": "Residential housing and apartment projects"
        }
    }

# Surplus Detection Endpoints
class MaterialTransferRequest(BaseModel):
    from_project_id: int
    to_project_id: int
    material_name: str
    transfer_quantity: float
    unit: str

@router.post("/transfer-material")
async def transfer_material(request: MaterialTransferRequest, db=Depends(get_db)):
    """Transfer material from one project to another"""
    try:
        # Get the source material (case-insensitive search)
        all_materials_result = db.table("materials").select("*").eq("project_id", request.from_project_id).execute()
        
        if not all_materials_result.data:
            raise HTTPException(status_code=404, detail="No materials found for source project")
        
        # Find material with case-insensitive name matching
        source_material = None
        for material in all_materials_result.data:
            if material["name"].strip().lower() == request.material_name.strip().lower():
                source_material = material
                break
        
        if not source_material:
            available_materials = [m["name"] for m in all_materials_result.data]
            raise HTTPException(
                status_code=404, 
                detail=f"Source material '{request.material_name}' not found. Available materials: {available_materials}"
            )
        
        # Check if source has enough quantity
        if source_material["quantity"] < request.transfer_quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient quantity. Available: {source_material['quantity']} {request.unit}")
        
        # Check if destination project already has this material (case-insensitive)
        dest_materials_result = db.table("materials").select("*").eq("project_id", request.to_project_id).execute()
        
        dest_material = None
        if dest_materials_result.data:
            for material in dest_materials_result.data:
                if material["name"].strip().lower() == request.material_name.strip().lower():
                    dest_material = material
                    break
        
        if dest_material:
            # Update existing material quantity
            new_quantity = dest_material["quantity"] + request.transfer_quantity
            
            update_result = db.table("materials").update({
                "quantity": new_quantity,
                "updated_at": datetime.now().isoformat()
            }).eq("id", dest_material["id"]).execute()
            
            if not update_result.data:
                raise HTTPException(status_code=500, detail="Failed to update destination material")
        else:
            # Create new material for destination project
            dest_project_result = db.table("projects").select("*").eq("project_id", request.to_project_id).execute()
            if not dest_project_result.data:
                raise HTTPException(status_code=404, detail="Destination project not found")
            
            dest_project = dest_project_result.data[0]
            
            new_material_data = {
                "name": request.material_name,
                "quantity": request.transfer_quantity,
                "unit": request.unit,
                "import_location": dest_project["location"],  # Use project location
                "project_id": request.to_project_id,
                "created_at": datetime.now().isoformat()
            }
            
            create_result = db.table("materials").insert(new_material_data).execute()
            if not create_result.data:
                raise HTTPException(status_code=500, detail="Failed to create destination material")
        
        # Update source material quantity
        new_source_quantity = source_material["quantity"] - request.transfer_quantity
        
        update_source_result = db.table("materials").update({
            "quantity": new_source_quantity,
            "updated_at": datetime.now().isoformat()
        }).eq("id", source_material["id"]).execute()
        
        if not update_source_result.data:
            raise HTTPException(status_code=500, detail="Failed to update source material")
        
        return {
            "message": f"Successfully transferred {request.transfer_quantity} {request.unit} of {request.material_name}",
            "from_project_id": request.from_project_id,
            "to_project_id": request.to_project_id,
            "transfer_quantity": request.transfer_quantity,
            "remaining_source_quantity": new_source_quantity
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error transferring material: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transfer failed: {str(e)}")

@router.get("/dashboard-metrics", response_model=Dict[str, Any])
async def get_dashboard_metrics(db=Depends(get_db)):
    """Get dashboard metrics for the Circular Resources Exchange"""
    try:
        # Get all materials from all projects
        materials_result = db.table("materials").select("*").execute()
        materials = materials_result.data if materials_result.data else []
        
        # Get all projects
        projects_result = db.table("projects").select("*").execute()
        projects = projects_result.data if projects_result.data else []
        
        # Calculate metrics
        total_materials = len(materials)
        
        # Calculate near expiry materials (materials expiring within 30 days)
        near_expiry_count = 0
        co2_savings_kg = 0
        
        for material in materials:
            # Simple expiry calculation (could be enhanced)
            created_at = material.get("created_at", "")
            if created_at:
                try:
                    from datetime import datetime, timedelta
                    created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    expiry_date = created_date + timedelta(days=180)  # 6 months default
                    days_until_expiry = (expiry_date - datetime.now()).days
                    
                    if days_until_expiry <= 30:
                        near_expiry_count += 1
                except:
                    pass
            
            # Calculate CO2 savings potential (simplified)
            # Assume each material unit saves 0.2 kg CO2 when reused
            material_quantity = material.get("quantity", 0)
            co2_savings_kg += material_quantity * 0.2
        
        # Calculate exchange potential based on surplus and shortage
        surplus_materials = surplus_detection_service.detect_surplus_materials()
        shortage_materials = surplus_detection_service.detect_shortage_materials()
        
        exchange_potential = "Low"
        if len(surplus_materials) > 0 and len(shortage_materials) > 0:
            exchange_potential = "High"
        elif len(surplus_materials) > 0 or len(shortage_materials) > 0:
            exchange_potential = "Medium"
        
        return {
            "total_materials": total_materials,
            "near_expiry": near_expiry_count,
            "co2_savings_kg": round(co2_savings_kg, 1),
            "exchange_potential": exchange_potential,
            "surplus_count": len(surplus_materials),
            "shortage_count": len(shortage_materials),
            "total_projects": len(projects),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error getting dashboard metrics: {str(e)}")
        return {
            "total_materials": 0,
            "near_expiry": 0,
            "co2_savings_kg": 0,
            "exchange_potential": "Low",
            "surplus_count": 0,
            "shortage_count": 0,
            "total_projects": 0,
            "generated_at": datetime.now().isoformat()
        }

@router.get("/all-project-materials", response_model=List[Dict[str, Any]])
async def get_all_project_materials(db=Depends(get_db)):
    """Get ALL materials from ALL projects for the All Available Materials section"""
    try:
        # Get all materials from database
        materials_result = db.table("materials").select("*").execute()
        materials = materials_result.data if materials_result.data else []
        
        # Get all projects for context
        projects_result = db.table("projects").select("*").execute()
        projects = projects_result.data if projects_result.data else []
        
        # Create projects map for efficient lookup
        projects_map = {project["project_id"]: project for project in projects}
        
        all_materials = []
        
        for material in materials:
            project = projects_map.get(material["project_id"])
            if not project:
                continue
            
            # Determine if this material is surplus or shortage
            project_type = project.get("project_type", "Building")
            presets = MaterialPresetService().get_material_presets(project_type)
            
            # Find matching preset
            matching_preset = next(
                (p for p in presets if p.material_name.lower() == material["name"].lower()), 
                None
            )
            
            material_type = "normal"
            surplus_quantity = 0
            surplus_percentage = 0
            shortage_quantity = 0
            shortage_percentage = 0
            status = "available"
            
            if matching_preset:
                recommended_quantity = matching_preset.recommended_quantity
                current_quantity = material["quantity"]
                
                if current_quantity > recommended_quantity:
                    # Surplus
                    material_type = "surplus"
                    surplus_quantity = current_quantity - recommended_quantity
                    surplus_percentage = (surplus_quantity / recommended_quantity) * 100
                    status = "surplus"
                elif current_quantity < recommended_quantity:
                    # Shortage
                    material_type = "shortage"
                    shortage_quantity = recommended_quantity - current_quantity
                    shortage_percentage = (shortage_quantity / recommended_quantity) * 100
                    status = "shortage"
            
            material_data = {
                "material_id": material["id"],
                "material_name": material["name"],
                "current_quantity": material["quantity"],
                "unit": material["unit"],
                "project_id": material["project_id"],
                "project_name": project["project_name"],
                "project_location": project["location"],
                "created_at": material["created_at"],
                "expiry_date": None,  # Could be calculated if needed
                "days_until_expiry": None,  # Could be calculated if needed
                "status": status,
                "material_type": material_type,
                "surplus_quantity": surplus_quantity,
                "surplus_percentage": surplus_percentage,
                "shortage_quantity": shortage_quantity,
                "shortage_percentage": shortage_percentage,
                "exchange_priority": 0.5,  # Default priority
                "urgency_level": "medium"  # Default urgency
            }
            
            all_materials.append(material_data)
        
        # Sort by project name, then by material name
        all_materials.sort(key=lambda x: (x["project_name"], x["material_name"]))
        
        return all_materials
        
    except Exception as e:
        print(f"Error getting all project materials: {str(e)}")
        return []

@router.get("/all-materials", response_model=List[Dict[str, Any]])
async def get_all_materials(db=Depends(get_db)):
    """Get all materials (both surplus and shortage) for the All Materials section"""
    try:
        # Get surplus materials
        surplus_materials = surplus_detection_service.detect_surplus_materials()
        
        # Get shortage materials
        shortage_materials = surplus_detection_service.detect_shortage_materials()
        
        # Convert surplus materials to the same format as shortage materials
        all_materials = []
        
        # Add surplus materials
        for surplus in surplus_materials:
            material_data = {
                "material_id": surplus.material_id,
                "material_name": surplus.material_name,
                "current_quantity": surplus.current_quantity,
                "unit": surplus.unit,
                "project_id": surplus.project_id,
                "project_name": surplus.project_name,
                "project_location": surplus.project_location,
                "surplus_quantity": surplus.surplus_quantity,
                "surplus_percentage": surplus.surplus_percentage,
                "expiry_date": surplus.expiry_date.isoformat(),
                "days_until_expiry": surplus.days_until_expiry,
                "status": surplus.status,
                "exchange_priority": surplus.exchange_priority,
                "material_type": "surplus"
            }
            all_materials.append(material_data)
        
        # Add shortage materials
        for shortage in shortage_materials:
            shortage["material_type"] = "shortage"
            all_materials.append(shortage)
        
        # Sort by exchange priority (highest first) for surplus, by shortage percentage (highest first) for shortage
        all_materials.sort(key=lambda x: (
            x.get("exchange_priority", 0) if x.get("material_type") == "surplus" else 0,
            x.get("shortage_percentage", 0) if x.get("material_type") == "shortage" else 0
        ), reverse=True)
        
        return all_materials
        
    except Exception as e:
        print(f"Error getting all materials: {str(e)}")
        return []

@router.get("/resource-exchange-recommendations", response_model=List[Dict[str, Any]])
async def get_resource_exchange_recommendations(db=Depends(get_db)):
    """Get recommendations for exchanging surplus materials with shortage materials"""
    try:
        recommendations = surplus_detection_service.generate_resource_exchange_recommendations()
        return recommendations
    except Exception as e:
        print(f"Error getting resource exchange recommendations: {str(e)}")
        return []

@router.get("/shortage-materials", response_model=List[Dict[str, Any]])
async def get_shortage_materials(db=Depends(get_db)):
    """Get materials that are below recommended quantities (shortages)"""
    try:
        shortage_materials = surplus_detection_service.detect_shortage_materials()
        return shortage_materials
    except Exception as e:
        print(f"Error getting shortage materials: {str(e)}")
        return []

@router.get("/surplus-materials", response_model=List[SurplusMaterialResponse])
async def get_surplus_materials(project_id: int = None):
    """
    Get all surplus materials available for circular exchange
    
    Optionally filter by project_id
    """
    try:
        surplus_materials = surplus_detection_service.detect_surplus_materials(project_id)
        
        return [
            SurplusMaterialResponse(
                material_id=material.material_id,
                material_name=material.material_name,
                current_quantity=material.current_quantity,
                unit=material.unit,
                project_id=material.project_id,
                project_name=material.project_name,
                project_location=material.project_location,
                surplus_quantity=material.surplus_quantity,
                surplus_percentage=material.surplus_percentage,
                expiry_date=material.expiry_date.isoformat(),
                days_until_expiry=material.days_until_expiry,
                status=material.status,
                exchange_priority=material.exchange_priority
            )
            for material in surplus_materials
        ]
        
    except Exception as e:
        print(f"Error getting surplus materials: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get surplus materials: {str(e)}")

@router.get("/surplus-summary", response_model=SurplusSummaryResponse)
async def get_surplus_summary():
    """Get summary of surplus materials across all projects"""
    try:
        summary = surplus_detection_service.get_surplus_summary()
        
        return SurplusSummaryResponse(
            total_surplus_materials=summary["total_surplus_materials"],
            urgent_materials=summary["urgent_materials"],
            near_expiry_materials=summary["near_expiry_materials"],
            surplus_materials=summary["surplus_materials"],
            total_surplus_quantity=summary["total_surplus_quantity"],
            exchange_potential=summary["exchange_potential"],
            generated_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        print(f"Error getting surplus summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get surplus summary: {str(e)}")

# Enhanced Recommendations Endpoints
@router.get("/proactive-recommendations")
async def get_proactive_recommendations():
    """
    Get proactive circular exchange recommendations based on surplus materials
    
    This endpoint identifies opportunities for circular exchange before delays occur
    """
    try:
        surplus_materials = surplus_detection_service.detect_surplus_materials()
        
        recommendations = []
        
        # Group surplus materials by type
        material_groups = {}
        for material in surplus_materials:
            if material.material_name not in material_groups:
                material_groups[material.material_name] = []
            material_groups[material.material_name].append(material)
        
        # Generate recommendations for each material type
        for material_name, materials in material_groups.items():
            if len(materials) >= 2:  # Need at least 2 projects with same material
                # Find projects that might need this material
                db = get_db()
                projects_result = db.table("projects").select("*").execute()
                projects = projects_result.data if projects_result.data else []
                
                for project in projects:
                    # Check if project doesn't have this material or has insufficient quantity
                    project_materials_result = db.table("materials").select("*").eq("project_id", project["project_id"]).execute()
                    project_materials = project_materials_result.data if project_materials_result.data else []
                    
                    project_has_material = any(
                        m["name"].lower() == material_name.lower() 
                        for m in project_materials
                    )
                    
                    if not project_has_material:
                        # This project could benefit from surplus material
                        available_surplus = [m for m in materials if m.project_id != project["project_id"]]
                        
                        if available_surplus:
                            best_match = max(available_surplus, key=lambda x: x.exchange_priority)
                            
                            recommendations.append({
                                "recommendation_type": "proactive_exchange",
                                "material_name": material_name,
                                "source_project": {
                                    "project_id": best_match.project_id,
                                    "project_name": best_match.project_name,
                                    "surplus_quantity": best_match.surplus_quantity,
                                    "unit": best_match.unit
                                },
                                "target_project": {
                                    "project_id": project["project_id"],
                                    "project_name": project["project_name"],
                                    "location": project["location"]
                                },
                                "exchange_priority": best_match.exchange_priority,
                                "reason": f"Project '{project['project_name']}' could benefit from surplus {material_name} from '{best_match.project_name}'",
                                "sustainability_impact": {
                                    "waste_prevention": best_match.status in ["urgent", "near_expiry"],
                                    "distance_km": 150,  # Simplified - would use actual distance calculation
                                    "co2_savings_kg": best_match.surplus_quantity * 0.2 * 150  # Simplified calculation
                                }
                            })
        
        # Sort recommendations by priority
        recommendations.sort(key=lambda x: x["exchange_priority"], reverse=True)
        
        return {
            "proactive_recommendations": recommendations[:10],  # Top 10 recommendations
            "total_recommendations": len(recommendations),
            "generated_at": datetime.now().isoformat(),
            "summary": f"Found {len(recommendations)} proactive exchange opportunities"
        }
        
    except Exception as e:
        print(f"Error getting proactive recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get proactive recommendations: {str(e)}")

@router.post("/analyze-project-materials")
async def analyze_project_materials(request: ProjectMaterialRequest):
    """
    Analyze a project's materials against recommended presets and suggest optimizations
    """
    try:
        # Get project materials
        db = get_db()
        materials_result = db.table("materials").select("*").eq("project_id", request.project_id).execute()
        project_materials = materials_result.data if materials_result.data else []
        
        # Get recommended presets
        presets = material_preset_service.get_material_presets(request.project_type)
        
        analysis = {
            "project_id": request.project_id,
            "project_name": request.project_name,
            "project_type": request.project_type,
            "analysis_results": [],
            "recommendations": [],
            "surplus_detected": [],
            "missing_materials": []
        }
        
        # Analyze each material
        for material in project_materials:
            matching_preset = next(
                (p for p in presets if p.material_name.lower() == material["name"].lower()),
                None
            )
            
            if matching_preset:
                current_qty = material["quantity"]
                recommended_qty = matching_preset.recommended_quantity
                variance = ((current_qty - recommended_qty) / recommended_qty) * 100
                
                analysis["analysis_results"].append({
                    "material_name": material["name"],
                    "current_quantity": current_qty,
                    "recommended_quantity": recommended_qty,
                    "unit": material["unit"],
                    "variance_percentage": round(variance, 2),
                    "status": "surplus" if variance > 20 else "adequate" if variance >= -10 else "insufficient"
                })
                
                if variance > 20:  # Surplus detected
                    analysis["surplus_detected"].append({
                        "material_name": material["name"],
                        "surplus_quantity": current_qty - recommended_qty,
                        "surplus_percentage": variance,
                        "recommendation": "Consider sharing with other projects"
                    })
                elif variance < -10:  # Insufficient
                    analysis["missing_materials"].append({
                        "material_name": material["name"],
                        "shortage": recommended_qty - current_qty,
                        "recommendation": "Order additional materials or find surplus from other projects"
                    })
        
        # Check for missing essential materials
        for preset in presets:
            if preset.priority == 1:  # Essential materials
                has_material = any(
                    m["name"].lower() == preset.material_name.lower() 
                    for m in project_materials
                )
                
                if not has_material:
                    analysis["missing_materials"].append({
                        "material_name": preset.material_name,
                        "shortage": preset.recommended_quantity,
                        "recommendation": f"Essential material missing - order {preset.recommended_quantity} {preset.unit}"
                    })
        
        # Generate recommendations
        if analysis["surplus_detected"]:
            analysis["recommendations"].append("Consider circular exchange for surplus materials")
        
        if analysis["missing_materials"]:
            analysis["recommendations"].append("Order missing essential materials or find surplus alternatives")
        
        analysis["generated_at"] = datetime.now().isoformat()
        
        return analysis
        
    except Exception as e:
        print(f"Error analyzing project materials: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze project materials: {str(e)}")

# Health check
@router.get("/health")
async def health_check():
    """Health check endpoint for enhanced circular exchange service"""
    return {
        "status": "healthy",
        "service": "enhanced-circular-resource-exchange",
        "features": [
            "material_presets",
            "surplus_detection", 
            "proactive_recommendations",
            "project_analysis"
        ],
        "timestamp": datetime.now().isoformat()
    }
