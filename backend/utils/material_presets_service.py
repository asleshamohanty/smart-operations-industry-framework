"""
Material Presets and Surplus Detection Service

This module provides:
1. Recommended material presets based on project type
2. Surplus detection system for circular resources
3. Smart material allocation recommendations
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

class ProjectType(Enum):
    """Project types for material presets"""
    INFRASTRUCTURE = "Infrastructure"
    COMMERCIAL = "Commercial"
    RESIDENTIAL = "Residential"
    INDUSTRIAL = "Industrial"
    HIGHWAY = "Highway"
    BRIDGE = "Bridge"
    BUILDING = "Building"

@dataclass
class MaterialPreset:
    """Material preset for a project type"""
    material_name: str
    recommended_quantity: float
    unit: str
    priority: int  # 1 = essential, 2 = important, 3 = optional
    description: str
    typical_supplier_location: str

@dataclass
class SurplusMaterial:
    """Represents a surplus material available for exchange"""
    material_id: int
    material_name: str
    current_quantity: float
    unit: str
    project_id: int
    project_name: str
    project_location: str
    surplus_quantity: float
    surplus_percentage: float
    expiry_date: datetime
    days_until_expiry: int
    status: str  # 'surplus', 'near_expiry', 'urgent'
    exchange_priority: float  # 0-1 score for exchange priority

class MaterialPresetService:
    """Service for managing material presets by project type"""
    
    def __init__(self):
        self.material_presets = self._initialize_presets()
    
    def _initialize_presets(self) -> Dict[ProjectType, List[MaterialPreset]]:
        """Initialize material presets for different project types"""
        
        presets = {
            ProjectType.HIGHWAY: [
                MaterialPreset("Asphalt", 1000.0, "tonnes", 1, "Primary road surface material", "Mumbai, Maharashtra"),
                MaterialPreset("Concrete", 500.0, "cubic meters", 1, "For bridges and structures", "Pune, Maharashtra"),
                MaterialPreset("Steel", 200.0, "tonnes", 1, "Reinforcement and structures", "Delhi, India"),
                MaterialPreset("Gravel", 2000.0, "tonnes", 1, "Base layer material", "Local quarries"),
                MaterialPreset("Cement", 300.0, "bags", 1, "Binding material", "Local suppliers"),
                MaterialPreset("Bitumen", 50.0, "tonnes", 2, "Waterproofing", "Mumbai, Maharashtra"),
                MaterialPreset("Drainage Pipes", 100.0, "meters", 2, "Water management", "Local suppliers"),
                MaterialPreset("Skilled Labor", 30.0, "workers", 1, "Construction workforce", "Local workforce centers"),
                MaterialPreset("Equipment Operators", 15.0, "operators", 1, "Heavy machinery operators", "Local workforce centers"),
                MaterialPreset("Supervisors", 8.0, "supervisors", 1, "Project supervision", "Local workforce centers"),
            ],
            
            ProjectType.BRIDGE: [
                MaterialPreset("Steel", 500.0, "tonnes", 1, "Main structural material", "Delhi, India"),
                MaterialPreset("Concrete", 800.0, "cubic meters", 1, "Foundation and deck", "Pune, Maharashtra"),
                MaterialPreset("Cement", 400.0, "bags", 1, "Binding material", "Local suppliers"),
                MaterialPreset("Rebar", 100.0, "tonnes", 1, "Reinforcement", "Mumbai, Maharashtra"),
                MaterialPreset("Formwork", 200.0, "square meters", 2, "Concrete molding", "Local suppliers"),
                MaterialPreset("Bearings", 20.0, "units", 1, "Structural support", "Specialized suppliers"),
                MaterialPreset("Paint", 50.0, "liters", 3, "Protective coating", "Local suppliers"),
                MaterialPreset("Engineers", 12.0, "engineers", 1, "Structural engineering", "Engineering firms"),
                MaterialPreset("Skilled Labor", 40.0, "workers", 1, "Construction workforce", "Local workforce centers"),
                MaterialPreset("Safety Personnel", 6.0, "safety_officers", 1, "Safety compliance", "Safety agencies"),
                MaterialPreset("Quality Inspectors", 8.0, "inspectors", 1, "Quality assurance", "Quality agencies"),
            ],
            
            ProjectType.BUILDING: [
                MaterialPreset("Steel", 300.0, "tonnes", 1, "Structural framework", "Delhi, India"),
                MaterialPreset("Concrete", 600.0, "cubic meters", 1, "Foundation and structure", "Pune, Maharashtra"),
                MaterialPreset("Cement", 250.0, "bags", 1, "Binding material", "Local suppliers"),
                MaterialPreset("Bricks", 10000.0, "units", 1, "Wall construction", "Local kilns"),
                MaterialPreset("Sand", 500.0, "tonnes", 1, "Construction material", "Local suppliers"),
                MaterialPreset("Aggregate", 300.0, "tonnes", 1, "Concrete component", "Local quarries"),
                MaterialPreset("Electrical Wire", 2000.0, "meters", 2, "Electrical systems", "Specialized suppliers"),
                MaterialPreset("Plumbing Pipes", 500.0, "meters", 2, "Water systems", "Local suppliers"),
                MaterialPreset("Paint", 100.0, "liters", 3, "Interior/exterior coating", "Local suppliers"),
                MaterialPreset("Engineers", 10.0, "engineers", 1, "Building engineering", "Engineering firms"),
                MaterialPreset("Skilled Labor", 35.0, "workers", 1, "Construction workforce", "Local workforce centers"),
                MaterialPreset("Supervisors", 6.0, "supervisors", 1, "Project supervision", "Local workforce centers"),
                MaterialPreset("Safety Personnel", 4.0, "safety_officers", 1, "Safety compliance", "Safety agencies"),
            ],
            
            ProjectType.INDUSTRIAL: [
                MaterialPreset("Steel", 800.0, "tonnes", 1, "Heavy structural material", "Delhi, India"),
                MaterialPreset("Concrete", 1000.0, "cubic meters", 1, "Foundation and floors", "Pune, Maharashtra"),
                MaterialPreset("Cement", 500.0, "bags", 1, "Binding material", "Local suppliers"),
                MaterialPreset("Insulation", 200.0, "square meters", 2, "Thermal protection", "Specialized suppliers"),
                MaterialPreset("Fireproofing", 100.0, "square meters", 1, "Safety requirement", "Specialized suppliers"),
                MaterialPreset("HVAC Ducts", 300.0, "meters", 2, "Ventilation systems", "Specialized suppliers"),
                MaterialPreset("Electrical Panels", 10.0, "units", 1, "Power distribution", "Specialized suppliers"),
                MaterialPreset("Engineers", 15.0, "engineers", 1, "Industrial engineering", "Engineering firms"),
                MaterialPreset("Skilled Labor", 50.0, "workers", 1, "Construction workforce", "Local workforce centers"),
                MaterialPreset("Equipment Operators", 20.0, "operators", 1, "Heavy machinery operators", "Local workforce centers"),
                MaterialPreset("Supervisors", 10.0, "supervisors", 1, "Project supervision", "Local workforce centers"),
                MaterialPreset("Safety Personnel", 8.0, "safety_officers", 1, "Safety compliance", "Safety agencies"),
                MaterialPreset("Quality Inspectors", 6.0, "inspectors", 1, "Quality assurance", "Quality agencies"),
            ],
            
            ProjectType.COMMERCIAL: [
                MaterialPreset("Steel", 200.0, "tonnes", 1, "Structural framework", "Delhi, India"),
                MaterialPreset("Concrete", 400.0, "cubic meters", 1, "Foundation and structure", "Pune, Maharashtra"),
                MaterialPreset("Glass", 100.0, "square meters", 2, "Windows and facades", "Specialized suppliers"),
                MaterialPreset("Aluminum", 50.0, "tonnes", 2, "Window frames and cladding", "Mumbai, Maharashtra"),
                MaterialPreset("Carpet", 500.0, "square meters", 3, "Flooring", "Local suppliers"),
                MaterialPreset("Lighting Fixtures", 100.0, "units", 2, "Interior lighting", "Specialized suppliers"),
                MaterialPreset("Elevator Components", 2.0, "units", 1, "Vertical transportation", "Specialized suppliers"),
                MaterialPreset("Engineers", 8.0, "engineers", 1, "Commercial engineering", "Engineering firms"),
                MaterialPreset("Skilled Labor", 25.0, "workers", 1, "Construction workforce", "Local workforce centers"),
                MaterialPreset("Supervisors", 5.0, "supervisors", 1, "Project supervision", "Local workforce centers"),
                MaterialPreset("Safety Personnel", 3.0, "safety_officers", 1, "Safety compliance", "Safety agencies"),
            ],
            
            ProjectType.RESIDENTIAL: [
                MaterialPreset("Steel", 100.0, "tonnes", 1, "Structural framework", "Delhi, India"),
                MaterialPreset("Concrete", 200.0, "cubic meters", 1, "Foundation", "Pune, Maharashtra"),
                MaterialPreset("Bricks", 5000.0, "units", 1, "Wall construction", "Local kilns"),
                MaterialPreset("Sand", 200.0, "tonnes", 1, "Construction material", "Local suppliers"),
                MaterialPreset("Tiles", 1000.0, "square meters", 2, "Flooring and walls", "Local suppliers"),
                MaterialPreset("Paint", 50.0, "liters", 3, "Interior coating", "Local suppliers"),
                MaterialPreset("Doors", 20.0, "units", 2, "Entry and interior doors", "Local suppliers"),
                MaterialPreset("Windows", 30.0, "units", 2, "Natural lighting", "Local suppliers"),
                MaterialPreset("Engineers", 5.0, "engineers", 1, "Residential engineering", "Engineering firms"),
                MaterialPreset("Skilled Labor", 20.0, "workers", 1, "Construction workforce", "Local workforce centers"),
                MaterialPreset("Supervisors", 3.0, "supervisors", 1, "Project supervision", "Local workforce centers"),
                MaterialPreset("Safety Personnel", 2.0, "safety_officers", 1, "Safety compliance", "Safety agencies"),
            ]
        }
        
        return presets
    
    def get_material_presets(self, project_type: str) -> List[MaterialPreset]:
        """Get material presets for a specific project type"""
        try:
            # Convert string to enum
            project_type_enum = ProjectType(project_type)
            return self.material_presets.get(project_type_enum, [])
        except ValueError:
            # If project type not found, return generic presets
            return self._get_generic_presets()
    
    def _get_generic_presets(self) -> List[MaterialPreset]:
        """Get generic material presets for unknown project types"""
        return [
            MaterialPreset("Steel", 200.0, "tonnes", 1, "Structural material", "Delhi, India"),
            MaterialPreset("Concrete", 300.0, "cubic meters", 1, "Foundation material", "Pune, Maharashtra"),
            MaterialPreset("Cement", 150.0, "bags", 1, "Binding material", "Local suppliers"),
            MaterialPreset("Sand", 200.0, "tonnes", 1, "Construction material", "Local suppliers"),
            MaterialPreset("Aggregate", 150.0, "tonnes", 1, "Concrete component", "Local quarries"),
        ]
    
    def get_project_type_from_name(self, project_name: str) -> str:
        """Determine project type from project name"""
        project_name_lower = project_name.lower()
        
        if any(word in project_name_lower for word in ["highway", "road", "street"]):
            return ProjectType.HIGHWAY.value
        elif any(word in project_name_lower for word in ["bridge", "overpass"]):
            return ProjectType.BRIDGE.value
        elif any(word in project_name_lower for word in ["building", "office", "tower"]):
            return ProjectType.BUILDING.value
        elif any(word in project_name_lower for word in ["industrial", "factory", "plant"]):
            return ProjectType.INDUSTRIAL.value
        elif any(word in project_name_lower for word in ["commercial", "mall", "retail"]):
            return ProjectType.COMMERCIAL.value
        elif any(word in project_name_lower for word in ["residential", "housing", "apartment"]):
            return ProjectType.RESIDENTIAL.value
        else:
            return ProjectType.BUILDING.value  # Default

class SurplusDetectionService:
    """Service for detecting surplus materials and managing circular resources"""
    
    def __init__(self):
        self.surplus_threshold_percentage = 20  # 20% excess considered surplus
        self.near_expiry_days = 30
        self.urgent_expiry_days = 7
    
    def generate_resource_exchange_recommendations(self) -> List[Dict[str, Any]]:
        """Generate recommendations for exchanging surplus materials with shortage materials"""
        try:
            # Get surplus and shortage materials
            surplus_materials = self.detect_surplus_materials()
            shortage_materials = self.detect_shortage_materials()
            
            recommendations = []
            
            # Match surplus with shortages
            for shortage in shortage_materials:
                shortage_material_name = shortage["material_name"]
                shortage_quantity = shortage["shortage_quantity"]
                shortage_project = shortage["project_name"]
                shortage_location = shortage["project_location"]
                
                # Find matching surplus materials
                matching_surplus = [
                    surplus for surplus in surplus_materials 
                    if surplus.material_name.lower() == shortage_material_name.lower()
                    and surplus.surplus_quantity >= shortage_quantity * 0.5  # At least 50% of shortage
                ]
                
                if matching_surplus:
                    # Sort by exchange priority (highest first)
                    matching_surplus.sort(key=lambda x: x.exchange_priority, reverse=True)
                    
                    best_match = matching_surplus[0]
                    
                    # Calculate transfer details
                    transfer_quantity = min(shortage_quantity, best_match.surplus_quantity)
                    transfer_percentage = (transfer_quantity / shortage_quantity) * 100
                    
                    # Calculate distance (simplified - using city names)
                    distance_km = self._calculate_distance(shortage_location, best_match.project_location)
                    
                    # Calculate CO2 savings
                    co2_savings = transfer_quantity * 0.2 * 150  # 0.2 tonnes CO2 per tonne material, 150km avg distance
                    
                    recommendation = {
                        "shortage_project": shortage_project,
                        "shortage_location": shortage_location,
                        "surplus_project": best_match.project_name,
                        "surplus_location": best_match.project_location,
                        "material_name": shortage_material_name,
                        "shortage_quantity": shortage_quantity,
                        "surplus_quantity": best_match.surplus_quantity,
                        "transfer_quantity": transfer_quantity,
                        "transfer_percentage": transfer_percentage,
                        "distance_km": distance_km,
                        "co2_savings_kg": co2_savings,
                        "urgency_level": shortage["urgency_level"],
                        "exchange_priority": best_match.exchange_priority,
                        "recommendation_message": f"Transfer {transfer_quantity:.1f} {shortage['unit']} from {best_match.project_name} to {shortage_project}",
                        "feasibility_score": self._calculate_feasibility_score(
                            transfer_quantity, distance_km, best_match.exchange_priority, shortage["urgency_level"]
                        )
                    }
                    
                    recommendations.append(recommendation)
            
            # Sort by feasibility score (highest first)
            recommendations.sort(key=lambda x: x["feasibility_score"], reverse=True)
            return recommendations
            
        except Exception as e:
            print(f"Error generating resource exchange recommendations: {str(e)}")
            return []
    
    def _calculate_distance(self, location1: str, location2: str) -> float:
        """Calculate approximate distance between two locations (simplified)"""
        # This is a simplified distance calculation
        # In a real implementation, you would use a geocoding service
        city_distances = {
            ("Delhi", "Mumbai"): 1400,
            ("Delhi", "Pune"): 1400,
            ("Delhi", "Ahmedabad"): 800,
            ("Mumbai", "Pune"): 150,
            ("Mumbai", "Ahmedabad"): 530,
            ("Pune", "Ahmedabad"): 650,
        }
        
        # Extract city names (simplified)
        city1 = location1.split(",")[0].strip()
        city2 = location2.split(",")[0].strip()
        
        # Check both directions
        distance = city_distances.get((city1, city2)) or city_distances.get((city2, city1))
        return distance or 500  # Default distance
    
    def _calculate_feasibility_score(self, transfer_quantity: float, distance_km: float, 
                                   exchange_priority: float, urgency_level: str) -> float:
        """Calculate feasibility score for resource exchange"""
        # Factors: quantity match, distance, priority, urgency
        quantity_score = min(transfer_quantity / 100, 1.0)  # Normalize quantity
        distance_score = max(0, 1 - (distance_km / 2000))  # Closer is better
        priority_score = exchange_priority
        urgency_score = {"high": 1.0, "medium": 0.7, "low": 0.4}.get(urgency_level, 0.4)
        
        # Weighted average
        feasibility_score = (
            quantity_score * 0.3 +
            distance_score * 0.2 +
            priority_score * 0.3 +
            urgency_score * 0.2
        )
        
        return min(feasibility_score, 1.0)

    def detect_shortage_materials(self, project_id: int = None) -> List[Dict[str, Any]]:
        """Detect materials that are below recommended quantities (shortages)"""
        try:
            from database import get_db
            db = get_db()
            
            # Get all materials
            if project_id:
                materials_result = db.table("materials").select("*").eq("project_id", project_id).execute()
            else:
                materials_result = db.table("materials").select("*").execute()
            
            materials = materials_result.data if materials_result.data else []
            shortage_materials = []
            
            for material in materials:
                # Get project information
                project_result = db.table("projects").select("*").eq("project_id", material["project_id"]).execute()
                if not project_result.data:
                    continue
                
                project = project_result.data[0]
                
                # Determine shortage based on project type
                project_type = project.get("project_type", "Building")
                presets = MaterialPresetService().get_material_presets(project_type)
                
                # Find matching preset
                matching_preset = next(
                    (p for p in presets if p.material_name.lower() == material["name"].lower()), 
                    None
                )
                
                if matching_preset:
                    recommended_quantity = matching_preset.recommended_quantity
                    current_quantity = material["quantity"]
                    
                    # Calculate shortage
                    if current_quantity < recommended_quantity:
                        shortage_quantity = recommended_quantity - current_quantity
                        shortage_percentage = (shortage_quantity / recommended_quantity) * 100
                        
                        shortage_material = {
                            "material_id": material["id"],
                            "material_name": material["name"],
                            "current_quantity": current_quantity,
                            "unit": material["unit"],
                            "project_id": material["project_id"],
                            "project_name": project["project_name"],
                            "project_location": project["location"],
                            "recommended_quantity": recommended_quantity,
                            "shortage_quantity": shortage_quantity,
                            "shortage_percentage": shortage_percentage,
                            "status": "shortage",
                            "urgency_level": "high" if shortage_percentage > 50 else "medium" if shortage_percentage > 25 else "low"
                        }
                        
                        shortage_materials.append(shortage_material)
            
            # Sort by shortage percentage (highest first)
            shortage_materials.sort(key=lambda x: x["shortage_percentage"], reverse=True)
            return shortage_materials
            
        except Exception as e:
            print(f"Error detecting shortage materials: {str(e)}")
            return []

    def detect_surplus_materials(self, project_id: int = None) -> List[SurplusMaterial]:
        """Detect surplus materials across all projects or a specific project"""
        try:
            from database import get_db
            db = get_db()
            
            # Get all materials
            if project_id:
                result = db.table("materials").select("*").eq("project_id", project_id).execute()
            else:
                result = db.table("materials").select("*").execute()
            
            materials = result.data if result.data else []
            
            surplus_materials = []
            
            for material in materials:
                # Get project information
                project_result = db.table("projects").select("*").eq("project_id", material["project_id"]).execute()
                if not project_result.data:
                    continue
                
                project = project_result.data[0]
                
                # Calculate expiry date
                expiry_date = self._calculate_expiry_date(material)
                # Ensure both datetimes are timezone-naive for comparison
                if expiry_date.tzinfo is not None:
                    expiry_date = expiry_date.replace(tzinfo=None)
                days_until_expiry = (expiry_date - datetime.now()).days
                
                # Determine surplus quantity based on project type
                project_type = project.get("project_type", "Building")  # Use project_type field directly
                presets = MaterialPresetService().get_material_presets(project_type)
                
                # Find matching preset
                matching_preset = next(
                    (p for p in presets if p.material_name.lower() == material["name"].lower()), 
                    None
                )
                
                if matching_preset:
                    recommended_quantity = matching_preset.recommended_quantity
                    current_quantity = material["quantity"]
                    
                    # Calculate surplus
                    if current_quantity > recommended_quantity:
                        surplus_quantity = current_quantity - recommended_quantity
                        surplus_percentage = (surplus_quantity / recommended_quantity) * 100
                        
                        # Determine status
                        status = self._determine_surplus_status(days_until_expiry, surplus_percentage)
                        
                        # Calculate exchange priority
                        exchange_priority = self._calculate_exchange_priority(
                            surplus_percentage, days_until_expiry, surplus_quantity
                        )
                        
                        surplus_material = SurplusMaterial(
                            material_id=material["id"],
                            material_name=material["name"],
                            current_quantity=current_quantity,
                            unit=material["unit"],
                            project_id=material["project_id"],
                            project_name=project["project_name"],
                            project_location=project["location"],
                            surplus_quantity=surplus_quantity,
                            surplus_percentage=surplus_percentage,
                            expiry_date=expiry_date,
                            days_until_expiry=days_until_expiry,
                            status=status,
                            exchange_priority=exchange_priority
                        )
                        
                        surplus_materials.append(surplus_material)
            
            # Sort by exchange priority (highest first)
            surplus_materials.sort(key=lambda x: x.exchange_priority, reverse=True)
            
            return surplus_materials
            
        except Exception as e:
            print(f"Error detecting surplus materials: {str(e)}")
            return []
    
    def _calculate_expiry_date(self, material: Dict[str, Any]) -> datetime:
        """Calculate expiry date based on material type and creation date"""
        material_name = material["name"].lower()
        created_at_str = material["created_at"]
        
        # Handle timezone-aware datetime strings
        if created_at_str.endswith('Z'):
            created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
        elif '+' in created_at_str or created_at_str.endswith('00:00'):
            created_at = datetime.fromisoformat(created_at_str)
        else:
            created_at = datetime.fromisoformat(created_at_str)
        
        # Different materials have different shelf lives
        if any(x in material_name for x in ["cement", "concrete"]):
            expiry_days = 90
        elif any(x in material_name for x in ["steel", "iron", "metal"]):
            expiry_days = 365
        elif any(x in material_name for x in ["paint", "coating"]):
            expiry_days = 730
        elif any(x in material_name for x in ["wood", "timber"]):
            expiry_days = 1825
        else:
            expiry_days = 180
        
        return created_at + timedelta(days=expiry_days)
    
    def _determine_surplus_status(self, days_until_expiry: int, surplus_percentage: float) -> str:
        """Determine the status of surplus material"""
        if days_until_expiry <= self.urgent_expiry_days:
            return "urgent"
        elif days_until_expiry <= self.near_expiry_days:
            return "near_expiry"
        elif surplus_percentage >= self.surplus_threshold_percentage:
            return "surplus"
        else:
            return "available"
    
    def _calculate_exchange_priority(self, surplus_percentage: float, days_until_expiry: int, surplus_quantity: float) -> float:
        """Calculate exchange priority score (0-1, higher is better)"""
        
        # Expiry urgency score
        if days_until_expiry <= self.urgent_expiry_days:
            expiry_score = 1.0
        elif days_until_expiry <= self.near_expiry_days:
            expiry_score = 0.8
        else:
            expiry_score = max(0, 1 - (days_until_expiry / 365))
        
        # Surplus percentage score
        surplus_score = min(1.0, surplus_percentage / 100)
        
        # Quantity adequacy score
        quantity_score = min(1.0, surplus_quantity / 50)  # Normalize to 50 units
        
        # Weighted composite score
        priority_score = (
            expiry_score * 0.4 +      # 40% weight for expiry urgency
            surplus_score * 0.3 +     # 30% weight for surplus percentage
            quantity_score * 0.3     # 30% weight for quantity adequacy
        )
        
        return round(priority_score, 3)
    
    def get_surplus_summary(self) -> Dict[str, Any]:
        """Get summary of surplus materials"""
        surplus_materials = self.detect_surplus_materials()
        
        total_surplus = len(surplus_materials)
        urgent_count = len([m for m in surplus_materials if m.status == "urgent"])
        near_expiry_count = len([m for m in surplus_materials if m.status == "near_expiry"])
        surplus_count = len([m for m in surplus_materials if m.status == "surplus"])
        
        total_surplus_quantity = sum(m.surplus_quantity for m in surplus_materials)
        
        return {
            "total_surplus_materials": total_surplus,
            "urgent_materials": urgent_count,
            "near_expiry_materials": near_expiry_count,
            "surplus_materials": surplus_count,
            "total_surplus_quantity": total_surplus_quantity,
            "exchange_potential": "High" if total_surplus > 5 else "Medium" if total_surplus > 2 else "Low"
        }
