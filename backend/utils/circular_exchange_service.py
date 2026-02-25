"""
Circular Resource Exchange Service

This module implements intelligent material matching and recommendation system
for delayed shipments, promoting circular economy principles by reusing surplus
materials from other projects to minimize waste and maintain timelines.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import math
from dataclasses import dataclass
from enum import Enum

class RecommendationReason(Enum):
    """Reasons for material recommendations"""
    EXPIRY_URGENT = "Recommended because material is nearing expiry; reuse prevents waste."
    DISTANCE_EFFICIENCY = "Recommended due to better distance and emission efficiency."

@dataclass
class MaterialMatch:
    """Represents a potential material match for circular exchange"""
    project_id: int
    project_name: str
    material_name: str
    quantity_available: float
    unit: str
    distance_km: float
    expiry_date: datetime
    feasibility_score: float
    recommendation_message: str
    co2_emissions_kg: float
    days_until_expiry: int

@dataclass
class CircularExchangeRecommendation:
    """Complete recommendation for circular resource exchange"""
    delayed_material: str
    delayed_project_id: int
    delayed_project_name: str
    alternatives: List[MaterialMatch]
    total_alternatives_found: int
    recommendation_summary: str

class CircularResourceExchangeService:
    """Service for managing circular resource exchange recommendations"""
    
    def __init__(self):
        self.base_co2_per_km_kg = 0.2  # Base CO2 emissions per km per kg
        self.max_distance_km = 500  # Maximum distance for consideration
        self.expiry_threshold_days = 30  # Days before expiry to trigger urgent recommendation
    
    def find_alternate_materials(
        self, 
        delayed_material: str, 
        delayed_project_id: int,
        required_quantity: float,
        required_unit: str,
        delayed_project_location: str
    ) -> CircularExchangeRecommendation:
        """
        Find alternate materials for a delayed shipment
        
        Args:
            delayed_material: Name of the delayed material
            delayed_project_id: ID of the project with delayed material
            required_quantity: Quantity needed
            required_unit: Unit of measurement
            delayed_project_location: Location of the delayed project
            
        Returns:
            CircularExchangeRecommendation with suggested alternatives
        """
        try:
            # Get all available materials from other projects
            available_materials = self._get_available_materials(delayed_project_id)
            
            # Filter materials by type and unit
            matching_materials = self._filter_matching_materials(
                available_materials, delayed_material, required_unit
            )
            
            if not matching_materials:
                return CircularExchangeRecommendation(
                    delayed_material=delayed_material,
                    delayed_project_id=delayed_project_id,
                    delayed_project_name=self._get_project_name(delayed_project_id),
                    alternatives=[],
                    total_alternatives_found=0,
                    recommendation_summary="No suitable alternate materials found. Consider ordering new materials or adjusting project timeline."
                )
            
            # Calculate feasibility scores and create matches
            material_matches = []
            for material in matching_materials:
                match = self._create_material_match(
                    material, delayed_project_location, required_quantity
                )
                if match:
                    material_matches.append(match)
            
            # Sort by feasibility score (highest first)
            material_matches.sort(key=lambda x: x.feasibility_score, reverse=True)
            
            # Take top 5 recommendations
            top_alternatives = material_matches[:5]
            
            # Generate summary
            summary = self._generate_recommendation_summary(
                delayed_material, len(top_alternatives), len(material_matches)
            )
            
            return CircularExchangeRecommendation(
                delayed_material=delayed_material,
                delayed_project_id=delayed_project_id,
                delayed_project_name=self._get_project_name(delayed_project_id),
                alternatives=top_alternatives,
                total_alternatives_found=len(material_matches),
                recommendation_summary=summary
            )
            
        except Exception as e:
            print(f"Error finding alternate materials: {str(e)}")
            return CircularExchangeRecommendation(
                delayed_material=delayed_material,
                delayed_project_id=delayed_project_id,
                delayed_project_name="Unknown Project",
                alternatives=[],
                total_alternatives_found=0,
                recommendation_summary="Error occurred while searching for alternate materials."
            )
    
    def _get_available_materials(self, exclude_project_id: int) -> List[Dict[str, Any]]:
        """Get all available materials from other projects"""
        try:
            from database import get_db
            db = get_db()
            
            # Get materials from all projects except the delayed one
            result = db.table("materials").select("*").neq("project_id", exclude_project_id).execute()
            materials = result.data if result.data else []
            
            # Get project information for each material
            enriched_materials = []
            for material in materials:
                project_result = db.table("projects").select("*").eq("project_id", material["project_id"]).execute()
                if project_result.data:
                    project = project_result.data[0]
                    enriched_material = {
                        **material,
                        "project_name": project["project_name"],
                        "project_location": project["location"]
                    }
                    enriched_materials.append(enriched_material)
            
            return enriched_materials
            
        except Exception as e:
            print(f"Error getting available materials: {str(e)}")
            return []
    
    def _filter_matching_materials(
        self, 
        materials: List[Dict[str, Any]], 
        material_name: str, 
        required_unit: str
    ) -> List[Dict[str, Any]]:
        """Filter materials that match the required type and unit"""
        matching = []
        
        for material in materials:
            # Check if material name matches (case-insensitive)
            if material["name"].lower() == material_name.lower():
                # Check if unit matches
                if material["unit"].lower() == required_unit.lower():
                    # Add expiry date (simulate based on creation date + material type)
                    expiry_date = self._calculate_expiry_date(material)
                    material["expiry_date"] = expiry_date
                    matching.append(material)
        
        return matching
    
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
            # Assume naive datetime
            created_at = datetime.fromisoformat(created_at_str)
        
        # Different materials have different shelf lives
        if any(x in material_name for x in ["cement", "concrete"]):
            # Cement expires in 3 months
            expiry_days = 90
        elif any(x in material_name for x in ["steel", "iron", "metal"]):
            # Steel doesn't really expire but gets rusty, consider 1 year
            expiry_days = 365
        elif any(x in material_name for x in ["paint", "coating"]):
            # Paint expires in 2 years
            expiry_days = 730
        elif any(x in material_name for x in ["wood", "timber"]):
            # Wood can last 5 years if stored properly
            expiry_days = 1825
        else:
            # Default to 6 months
            expiry_days = 180
        
        return created_at + timedelta(days=expiry_days)
    
    def _create_material_match(
        self, 
        material: Dict[str, Any], 
        delayed_project_location: str,
        required_quantity: float
    ) -> Optional[MaterialMatch]:
        """Create a MaterialMatch object with feasibility scoring"""
        try:
            # Calculate distance (simplified - in real implementation, use actual coordinates)
            distance_km = self._calculate_distance(
                material["project_location"], 
                delayed_project_location
            )
            
            # Skip if too far
            if distance_km > self.max_distance_km:
                return None
            
            # Calculate CO2 emissions
            co2_emissions = self._calculate_co2_emissions(
                distance_km, material["quantity"]
            )
            
            # Calculate days until expiry
            expiry_date = material["expiry_date"]
            current_time = datetime.now()
            
            # Handle timezone-aware datetime comparison
            if expiry_date.tzinfo is not None and current_time.tzinfo is None:
                current_time = current_time.replace(tzinfo=expiry_date.tzinfo)
            elif expiry_date.tzinfo is None and current_time.tzinfo is not None:
                expiry_date = expiry_date.replace(tzinfo=current_time.tzinfo)
            
            days_until_expiry = (expiry_date - current_time).days
            
            # Calculate feasibility score
            feasibility_score = self._calculate_feasibility_score(
                distance_km, co2_emissions, days_until_expiry, material["quantity"], required_quantity
            )
            
            # Determine recommendation message
            recommendation_message = self._get_recommendation_message(days_until_expiry)
            
            return MaterialMatch(
                project_id=material["project_id"],
                project_name=material["project_name"],
                material_name=material["name"],
                quantity_available=material["quantity"],
                unit=material["unit"],
                distance_km=distance_km,
                expiry_date=expiry_date,
                feasibility_score=feasibility_score,
                recommendation_message=recommendation_message,
                co2_emissions_kg=co2_emissions,
                days_until_expiry=days_until_expiry
            )
            
        except Exception as e:
            print(f"Error creating material match: {str(e)}")
            return None
    
    def _calculate_distance(self, location1: str, location2: str) -> float:
        """Calculate approximate distance between two locations"""
        # Simplified distance calculation based on city names
        # In a real implementation, you would use geocoding and distance APIs
        
        # Extract city names
        city1 = self._extract_city_name(location1)
        city2 = self._extract_city_name(location2)
        
        # Distance matrix for major Indian cities (simplified)
        distances = {
            ("Mumbai", "Delhi"): 1400,
            ("Mumbai", "Bangalore"): 850,
            ("Mumbai", "Chennai"): 1300,
            ("Mumbai", "Kolkata"): 2000,
            ("Mumbai", "Hyderabad"): 700,
            ("Mumbai", "Pune"): 150,
            ("Delhi", "Bangalore"): 2100,
            ("Delhi", "Chennai"): 2200,
            ("Delhi", "Kolkata"): 1500,
            ("Delhi", "Hyderabad"): 1500,
            ("Delhi", "Pune"): 1400,
            ("Bangalore", "Chennai"): 350,
            ("Bangalore", "Kolkata"): 1800,
            ("Bangalore", "Hyderabad"): 570,
            ("Chennai", "Kolkata"): 1700,
            ("Chennai", "Hyderabad"): 700,
            ("Kolkata", "Hyderabad"): 1200,
        }
        
        # Check both directions
        key1 = (city1, city2)
        key2 = (city2, city1)
        
        if key1 in distances:
            return distances[key1]
        elif key2 in distances:
            return distances[key2]
        else:
            # Default distance for unknown cities
            return 500
    
    def _extract_city_name(self, location: str) -> str:
        """Extract city name from location string"""
        # Common city names
        cities = [
            "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", 
            "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", 
            "Thane", "Bhopal", "Visakhapatnam", "Pimpri", "Patna", "Vadodara", 
            "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", 
            "Rajkot", "Kalyan", "Vasai", "Varanasi", "Srinagar", "Aurangabad", 
            "Navi Mumbai", "Solapur", "Vijayawada", "Kolhapur", "Amritsar", "Noida"
        ]
        
        for city in cities:
            if city.lower() in location.lower():
                return city
        
        # If no city found, return first word
        return location.split(",")[0].strip()
    
    def _calculate_co2_emissions(self, distance_km: float, quantity_kg: float) -> float:
        """Calculate CO2 emissions for transport"""
        # Simplified calculation: base emissions per km per kg
        return distance_km * quantity_kg * self.base_co2_per_km_kg
    
    def _calculate_feasibility_score(
        self, 
        distance_km: float, 
        co2_emissions: float, 
        days_until_expiry: int,
        available_quantity: float,
        required_quantity: float
    ) -> float:
        """Calculate composite feasibility score (0-1, higher is better)"""
        
        # Distance score (closer is better)
        distance_score = max(0, 1 - (distance_km / self.max_distance_km))
        
        # CO2 score (lower emissions is better)
        max_co2 = self.max_distance_km * required_quantity * self.base_co2_per_km_kg
        co2_score = max(0, 1 - (co2_emissions / max_co2))
        
        # Expiry score (sooner expiry gets higher priority)
        if days_until_expiry <= self.expiry_threshold_days:
            expiry_score = 1.0  # Maximum priority for urgent expiry
        else:
            expiry_score = max(0, 1 - (days_until_expiry / 365))  # Normalize to year
        
        # Quantity adequacy score
        quantity_score = min(1.0, available_quantity / required_quantity)
        
        # Weighted composite score
        feasibility_score = (
            distance_score * 0.3 +      # 30% weight for distance
            co2_score * 0.2 +           # 20% weight for emissions
            expiry_score * 0.3 +        # 30% weight for expiry urgency
            quantity_score * 0.2        # 20% weight for quantity adequacy
        )
        
        return round(feasibility_score, 3)
    
    def _get_recommendation_message(self, days_until_expiry: int) -> str:
        """Get recommendation message based on expiry date"""
        if days_until_expiry <= self.expiry_threshold_days:
            return RecommendationReason.EXPIRY_URGENT.value
        else:
            return RecommendationReason.DISTANCE_EFFICIENCY.value
    
    def _get_project_name(self, project_id: int) -> str:
        """Get project name by ID"""
        try:
            from database import get_db
            db = get_db()
            result = db.table("projects").select("project_name").eq("project_id", project_id).execute()
            if result.data:
                return result.data[0]["project_name"]
            return f"Project {project_id}"
        except Exception as e:
            print(f"Error getting project name: {str(e)}")
            return f"Project {project_id}"
    
    def _generate_recommendation_summary(
        self, 
        delayed_material: str, 
        top_alternatives_count: int, 
        total_alternatives_count: int
    ) -> str:
        """Generate summary message for recommendations"""
        if top_alternatives_count == 0:
            return f"No suitable alternate materials found for {delayed_material}."
        
        return f"Found {total_alternatives_count} potential alternatives for {delayed_material}. Top {top_alternatives_count} recommendations prioritize sustainability and efficiency."
