from typing import Dict, List, Any
import math

class ESGCalculator:
    def __init__(self):
        # SDG mapping weights for infrastructure projects
        self.sdg_weights = {
            "SDG 6": {"water_usage": 0.4, "water_efficiency": 0.3, "sanitation": 0.3},  # Clean Water
            "SDG 7": {"energy_usage": 0.5, "renewable_energy": 0.3, "energy_efficiency": 0.2},  # Affordable Energy
            "SDG 9": {"infrastructure": 0.4, "innovation": 0.3, "industry": 0.3},  # Industry & Infrastructure
            "SDG 11": {"sustainable_cities": 0.4, "urban_planning": 0.3, "community": 0.3},  # Sustainable Cities
            "SDG 12": {"sustainable_consumption": 0.4, "waste_management": 0.3, "resource_efficiency": 0.3},  # Responsible Consumption
            "SDG 13": {"carbon_footprint": 0.5, "climate_action": 0.3, "emissions": 0.2},  # Climate Action
            "SDG 15": {"biodiversity": 0.4, "land_use": 0.3, "ecosystems": 0.3},  # Life on Land
        }
    
    def calculate_project_esg(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate overall ESG score for a project based on its tasks"""
        if not tasks:
            return self._get_default_esg()
        
        # Aggregate task-level ESG scores
        total_e_score = sum(task.get("e_score", 0) for task in tasks)
        total_s_score = sum(task.get("s_score", 0) for task in tasks)
        total_g_score = sum(task.get("g_score", 0) for task in tasks)
        
        # Calculate weighted averages
        num_tasks = len(tasks)
        avg_e_score = total_e_score / num_tasks
        avg_s_score = total_s_score / num_tasks
        avg_g_score = total_g_score / num_tasks
        
        # Calculate overall ESG score
        overall_score = (avg_e_score + avg_s_score + avg_g_score) / 3
        
        # Calculate SDG alignment
        sdg_alignment = self._calculate_sdg_alignment(tasks)
        
        return {
            "environment": round(avg_e_score, 3),
            "social": round(avg_s_score, 3),
            "governance": round(avg_g_score, 3),
            "overall_score": round(overall_score, 3),
            "sdg_alignment": sdg_alignment
        }
    
    def _calculate_sdg_alignment(self, tasks: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate SDG alignment scores based on task characteristics"""
        sdg_scores = {}
        
        for sdg, weights in self.sdg_weights.items():
            score = 0.0
            
            if sdg == "SDG 6":  # Clean Water
                avg_water_usage = sum(task.get("water_usage_m3", 0) for task in tasks) / len(tasks)
                # Lower water usage = higher score (inverted)
                water_score = max(0, 1 - (avg_water_usage / 1000))  # Normalize
                score = water_score * weights["water_usage"]
            
            elif sdg == "SDG 7":  # Affordable Energy
                avg_energy = sum(task.get("energy_usage_kwh", 0) for task in tasks) / len(tasks)
                # Lower energy usage = higher score (inverted)
                energy_score = max(0, 1 - (avg_energy / 10000))  # Normalize
                score = energy_score * weights["energy_usage"]
            
            elif sdg == "SDG 9":  # Industry & Infrastructure
                # Based on project type and innovation
                infrastructure_score = 0.8  # Default for infrastructure projects
                score = infrastructure_score * weights["infrastructure"]
            
            elif sdg == "SDG 11":  # Sustainable Cities
                # Based on location and urban planning
                urban_score = 0.7  # Default for urban projects
                score = urban_score * weights["sustainable_cities"]
            
            elif sdg == "SDG 12":  # Responsible Consumption
                # Based on material efficiency
                avg_material_cost = sum(task.get("material_unit_cost", 0) for task in tasks) / len(tasks)
                material_score = max(0, 1 - (avg_material_cost / 10000))  # Normalize
                score = material_score * weights["sustainable_consumption"]
            
            elif sdg == "SDG 13":  # Climate Action
                avg_carbon = sum(task.get("carbon_footprint_kg", 0) for task in tasks) / len(tasks)
                # Lower carbon footprint = higher score (inverted)
                carbon_score = max(0, 1 - (avg_carbon / 10000))  # Normalize
                score = carbon_score * weights["carbon_footprint"]
            
            elif sdg == "SDG 15":  # Life on Land
                # Based on environmental impact
                avg_e_score = sum(task.get("e_score", 0) for task in tasks) / len(tasks)
                score = avg_e_score * weights["biodiversity"]
            
            sdg_scores[sdg] = round(score, 3)
        
        return sdg_scores
    
    def calculate_weather_impact_on_esg(self, esg_scores: Dict[str, Any], weather_disruption: float) -> Dict[str, Any]:
        """Calculate how weather disruption affects ESG scores"""
        impact_factor = 1 - (weather_disruption * 0.1)  # 10% impact per disruption unit
        
        adjusted_esg = {
            "environment": round(esg_scores["environment"] * impact_factor, 3),
            "social": round(esg_scores["social"] * impact_factor, 3),
            "governance": round(esg_scores["governance"] * impact_factor, 3),
            "overall_score": round(esg_scores["overall_score"] * impact_factor, 3),
            "sdg_alignment": {}
        }
        
        # Adjust SDG scores
        for sdg, score in esg_scores["sdg_alignment"].items():
            adjusted_esg["sdg_alignment"][sdg] = round(score * impact_factor, 3)
        
        return adjusted_esg
    
    def generate_esg_recommendations(self, esg_scores: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on ESG scores"""
        recommendations = []
        
        if esg_scores["environment"] < 0.5:
            recommendations.append("Consider using more sustainable materials to improve environmental score")
            recommendations.append("Implement waste reduction strategies")
        
        if esg_scores["social"] < 0.5:
            recommendations.append("Increase local community engagement")
            recommendations.append("Improve worker safety protocols")
        
        if esg_scores["governance"] < 0.5:
            recommendations.append("Strengthen project governance and transparency")
            recommendations.append("Implement better risk management practices")
        
        # SDG-specific recommendations
        for sdg, score in esg_scores["sdg_alignment"].items():
            if score < 0.5:
                if sdg == "SDG 13":
                    recommendations.append("Reduce carbon footprint through renewable energy sources")
                elif sdg == "SDG 6":
                    recommendations.append("Implement water conservation measures")
                elif sdg == "SDG 7":
                    recommendations.append("Use energy-efficient equipment and processes")
        
        return recommendations if recommendations else ["ESG performance is satisfactory"]
    
    def _get_default_esg(self) -> Dict[str, Any]:
        """Return default ESG scores when no tasks are available"""
        return {
            "environment": 0.5,
            "social": 0.5,
            "governance": 0.5,
            "overall_score": 0.5,
            "sdg_alignment": {
                "SDG 6": 0.5,
                "SDG 7": 0.5,
                "SDG 9": 0.5,
                "SDG 11": 0.5,
                "SDG 12": 0.5,
                "SDG 13": 0.5,
                "SDG 15": 0.5
            }
        }
