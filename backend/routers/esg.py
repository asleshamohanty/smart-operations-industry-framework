"""
ESG Analysis API Router - Supabase-driven implementation
"""

from fastapi import APIRouter, HTTPException  # type: ignore
from typing import Dict, Any, List
import math
import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_supabase

# Try to import Gemini AI, but don't fail if it's not available
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-generativeai not installed. AI report generation will be disabled.")

router = APIRouter(prefix="/esg", tags=["esg"])

BRSR_THRESHOLDS = {
    "environment_score": 70,
    "social_score": 75,
    "governance_score": 80,
    "total_score": 70,
}

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_gemini_api_key_here")
if GEMINI_AVAILABLE and GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    genai.configure(api_key=GEMINI_API_KEY)
    # Use the latest available model
    gemini_model = genai.GenerativeModel('gemini-pro-latest')
else:
    gemini_model = None

# -----------------------------
# Supabase Data Fetching
# -----------------------------
def _fetch_projects_data() -> List[Dict[str, Any]]:
    """Fetch all projects from Supabase"""
    try:
        supabase = get_supabase()
        result = supabase.table("projects").select("*").execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return []

def _fetch_materials_data() -> List[Dict[str, Any]]:
    """Fetch all materials from Supabase"""
    try:
        supabase = get_supabase()
        result = supabase.table("materials").select("*").execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error fetching materials: {e}")
        return []

def _fetch_shipments_data() -> List[Dict[str, Any]]:
    """Fetch all shipments from Supabase"""
    try:
        supabase = get_supabase()
        result = supabase.table("shipments").select("*").execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error fetching shipments: {e}")
        return []

def _project_feature_aggregation() -> Dict[int, Dict[str, float]]:
    """Aggregate project features from Supabase data"""
    projects_data = _fetch_projects_data()
    materials_data = _fetch_materials_data()
    shipments_data = _fetch_shipments_data()
    
    projects: Dict[int, Dict[str, Any]] = {}
    
    # Material CO2 factors in tCO2 per ton
    material_factors: Dict[str, float] = {
        "cement": 0.8,
        "steel": 1.85,
        "sand": 0.01,
        "bricks": 0.25,
        "timber": 0.5,
        "glass": 0.9,
        "paint": 0.6,
        "concrete": 0.8,
        "aluminum": 1.2,
        "plastic": 0.3,
        "bitumen": 0.4,
        "gravel": 0.05,  # Low CO2 factor for gravel
        "asphalt": 0.3,  # Moderate CO2 factor for asphalt
        "drainage pipes": 0.2,  # Low CO2 factor for pipes
        "recycled steel": 0.9,  # Lower CO2 for recycled materials
        "sustainable timber": 0.2,  # Lower CO2 for sustainable timber
        "low-carbon cement": 0.4,  # Lower CO2 for low-carbon cement
        "eco-friendly paint": 0.2,  # Lower CO2 for eco-friendly paint
        "solar panels": 0.1,  # Very low CO2 for renewable energy
        "insulation material": 0.15,  # Low CO2 for insulation
        "water treatment system": 0.05,  # Very low CO2 for water systems
        "wind turbines": 0.08,  # Very low CO2 for renewable energy
        "green roof materials": 0.12,  # Low CO2 for green materials
        "skilled labor": 0.02,  # Very low CO2 for workforce
        "engineers": 0.01,  # Very low CO2 for engineers
        "supervisors": 0.01,  # Very low CO2 for supervisors
        "safety personnel": 0.01,  # Very low CO2 for safety personnel
        "equipment operators": 0.02,  # Very low CO2 for operators
        "quality inspectors": 0.01,  # Very low CO2 for inspectors
    }
    
    # Benchmark factors (industry average - slightly higher than optimal)
    benchmark_factors: Dict[str, float] = {
        "cement": 0.9,
        "steel": 2.0,
        "sand": 0.02,
        "bricks": 0.3,
        "timber": 0.6,
        "glass": 1.0,
        "paint": 0.7,
        "concrete": 0.9,
        "aluminum": 1.3,
        "plastic": 0.4,
        "bitumen": 0.5,
        "gravel": 0.08,  # Slightly higher benchmark for gravel
        "asphalt": 0.4,  # Slightly higher benchmark for asphalt
        "drainage pipes": 0.25,  # Slightly higher benchmark for pipes
        "recycled steel": 1.2,  # Higher benchmark for recycled steel
        "sustainable timber": 0.3,  # Higher benchmark for sustainable timber
        "low-carbon cement": 0.5,  # Higher benchmark for low-carbon cement
        "eco-friendly paint": 0.3,  # Higher benchmark for eco-friendly paint
        "solar panels": 0.2,  # Higher benchmark for solar panels
        "insulation material": 0.25,  # Higher benchmark for insulation
        "water treatment system": 0.1,  # Higher benchmark for water systems
        "wind turbines": 0.15,  # Higher benchmark for wind turbines
        "green roof materials": 0.2,  # Higher benchmark for green materials
        "skilled labor": 0.05,  # Higher benchmark for workforce
        "engineers": 0.03,  # Higher benchmark for engineers
        "supervisors": 0.03,  # Higher benchmark for supervisors
        "safety personnel": 0.03,  # Higher benchmark for safety personnel
        "equipment operators": 0.05,  # Higher benchmark for operators
        "quality inspectors": 0.03,  # Higher benchmark for inspectors
    }
    
    # Initialize projects from projects table
    for project in projects_data:
        pid = project.get("project_id")
        if pid:
            projects[pid] = {
                "project_name": project.get("project_name", f"Project {pid}"),
                "location": project.get("location", ""),
                "project_type": project.get("project_type", ""),
                "team_size": project.get("team_size", 0),
                "budget": project.get("project_budget", 0),
                "duration_days": project.get("estimated_duration_days", 0),
                "material_co2_total": 0.0,
                "material_co2_benchmark": 0.0,
                "total_materials": 0.0,
                "recycled_materials": 0.0,
                "delay_days": 0.0,
                "disruption_score": 0.0,
                "shipment_count": 0,
            }
    
    # Process materials data
    for material in materials_data:
        pid = material.get("project_id")
        if pid and pid in projects:
            mat_name = (material.get("name") or "").strip().lower()
            qty = float(material.get("quantity", 0) or 0)
            
            projects[pid]["total_materials"] += qty
            
            # Check for recycled materials
            if "recycled" in mat_name or "reuse" in mat_name:
                projects[pid]["recycled_materials"] += qty
            
            # Calculate CO2 emissions
            if mat_name in material_factors:
                actual_factor = material_factors[mat_name]
                benchmark_factor = benchmark_factors.get(mat_name, actual_factor * 1.1)  # Default 10% higher
                projects[pid]["material_co2_total"] += qty * actual_factor
                projects[pid]["material_co2_benchmark"] += qty * benchmark_factor
    
    # Process shipments data for delays and disruptions
    for shipment in shipments_data:
        pid = shipment.get("project_id")
        if pid and pid in projects:
            projects[pid]["shipment_count"] += 1
            projects[pid]["delay_days"] += float(shipment.get("weather_delay_days", 0) or 0)
            projects[pid]["disruption_score"] += float(shipment.get("disruption_score", 0) or 0)
    
    # Calculate features
    features: Dict[int, Dict[str, float]] = {}
    for pid, agg in projects.items():
        shipment_count = max(1, agg["shipment_count"])
        material_total = max(1.0, agg["total_materials"])
        
        avg_delay_days = agg["delay_days"] / shipment_count
        avg_disruption = agg["disruption_score"] / shipment_count
        recycled_percentage = (agg["recycled_materials"] / material_total * 100.0) if material_total > 0 else 0.0
        
        features[pid] = {
            "project_name": agg["project_name"],
            "location": agg["location"],
            "project_type": agg["project_type"],
            "team_size": agg["team_size"],
            "budget": agg["budget"],
            "duration_days": agg["duration_days"],
            # Environmental metrics
            "material_co2_total": agg["material_co2_total"],
            "material_co2_benchmark": agg["material_co2_benchmark"],
            "waste_recycled": recycled_percentage,
            "energy_efficiency": max(0.0, min(100.0, 100.0 - (avg_disruption * 20.0))),
            # Social metrics
            "safety_compliance": max(0.0, min(100.0, 100.0 - (avg_disruption * 30.0 + avg_delay_days * 2.0))),
            "diversity_index": max(0.0, min(100.0, 30.0 + (agg["team_size"] / 100.0) * 70.0)),
            "community_initiatives": 60.0,
            # Governance metrics
            "audit_compliance": 85.0,
            "supplier_ethics_score": 75.0,
            "delay_index": min(100.0, (avg_delay_days / 15.0) * 100.0),
        }
    
    return features

# -----------------------------
# ESG Score Calculations
# -----------------------------
def normalize(value: float, max_val: float = 100) -> float:
    return max(0.0, min(100.0, (float(value) / float(max_val)) * 100.0))

def weighted_avg(values: List[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)

def calculate_esg_scores(project_data: Dict[str, float]) -> Dict[str, Any]:
    # Environmental score based on materials CO2 accounting when available
    mat_total = float(project_data.get('material_co2_total', 0) or 0)
    mat_benchmark = float(project_data.get('material_co2_benchmark', 0) or 0)
    
    if mat_benchmark > 0 and mat_total > 0:
        # Calculate efficiency score (lower emissions = higher score)
        efficiency_ratio = mat_total / mat_benchmark
        e_score = max(0.0, min(100.0, 100.0 * (1.0 - efficiency_ratio)))
        
        # Add bonus for recycled materials
        recycled_bonus = min(20.0, project_data.get('waste_recycled', 0) * 0.2)
        e_score = min(100.0, e_score + recycled_bonus)
    else:
        # Fallback to proxy metrics when no material data
        e_score = weighted_avg([
            normalize(project_data.get('waste_recycled', 0)),
            normalize(project_data.get('energy_efficiency', 0)),
            50.0,  # Default baseline
        ])
    
    s_score = weighted_avg([
        normalize(project_data.get('safety_compliance', 0)),
        normalize(project_data.get('diversity_index', 0)),
        normalize(project_data.get('community_initiatives', 0)),
    ])
    g_score = weighted_avg([
        normalize(project_data.get('audit_compliance', 0)),
        normalize(project_data.get('supplier_ethics_score', 0)),
        normalize(100 - project_data.get('delay_index', 0)),
    ])
    total_score = (0.4 * e_score) + (0.3 * s_score) + (0.3 * g_score)
    sdg_alignment = {
        "SDG 9": f"{e_score:.1f}% (Industry, Innovation, Infrastructure)",
        "SDG 11": f"{s_score:.1f}% (Sustainable Cities)",
        "SDG 12": f"{total_score:.1f}% (Responsible Production)",
        "SDG 13": f"{e_score:.1f}% (Climate Action)",
    }
    return {
        "environment_score": e_score,
        "social_score": s_score,
        "governance_score": g_score,
        "total_score": total_score,
        "sdg_alignment": sdg_alignment,
    }

# -----------------------------
# Gemini AI Summary
# -----------------------------
'''def generate_ai_summary(env, soc, gov, total) -> str:
    prompt = (
        f"Generate a concise ESG performance summary for a company:\n"
        f"Environment Score: {env}\n"
        f"Social Score: {soc}\n"
        f"Governance Score: {gov}\n"
        f"Overall Score: {total}\n"
        "Include improvement recommendations aligned to SDG 9, 11, 12, and 13."
    )
    try:
        response = openai.ChatCompletion.create(
            model="gemini-1.5",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=300
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        return f"AI summary generation failed: {str(e)}"'''

# -----------------------------
# API Endpoints
# -----------------------------
@router.get("/scores")
async def get_company_esg_scores():
    features = _project_feature_aggregation()
    if not features:
        raise HTTPException(status_code=404, detail="No project data found in Supabase")
    
    project_scores = []
    for pid, feat in features.items():
        scores = calculate_esg_scores(feat)
        project_scores.append({
            "project_id": pid,
            "project_name": feat.get("project_name"),
            "location": feat.get("location"),
            "project_type": feat.get("project_type"),
            **scores,
        })
    
    if project_scores:
        env_avg = weighted_avg([p["environment_score"] for p in project_scores])
        soc_avg = weighted_avg([p["social_score"] for p in project_scores])
        gov_avg = weighted_avg([p["governance_score"] for p in project_scores])
        total_avg = (0.4 * env_avg) + (0.3 * soc_avg) + (0.3 * gov_avg)
    else:
        env_avg = soc_avg = gov_avg = total_avg = 0.0
    
    return {
        "data": project_scores,
        "aggregate": {
            "environment_score": env_avg,
            "social_score": soc_avg,
            "governance_score": gov_avg,
            "total_score": total_avg,
        },
        "thresholds": BRSR_THRESHOLDS,
    }

@router.get("/report")
async def get_company_esg_report():
    features = _project_feature_aggregation()
    if not features:
        raise HTTPException(status_code=404, detail="No project data found in Supabase")
    
    project_scores = [calculate_esg_scores(feat) for feat in features.values()]
    if project_scores:
        env_avg = weighted_avg([p["environment_score"] for p in project_scores])
        soc_avg = weighted_avg([p["social_score"] for p in project_scores])
        gov_avg = weighted_avg([p["governance_score"] for p in project_scores])
        total_avg = (0.4 * env_avg) + (0.3 * soc_avg) + (0.3 * gov_avg)
    else:
        env_avg = soc_avg = gov_avg = total_avg = 0.0

    recommendations: List[str] = []
    if env_avg < BRSR_THRESHOLDS["environment_score"]:
        recommendations.append("Increase recycled material usage and reduce carbon intensity.")
        recommendations.append("Invest in energy-efficient equipment to improve energy efficiency.")
    if soc_avg < BRSR_THRESHOLDS["social_score"]:
        recommendations.append("Enhance safety training and community engagement programs.")
        recommendations.append("Improve diversity and inclusion initiatives.")
    if gov_avg < BRSR_THRESHOLDS["governance_score"]:
        recommendations.append("Strengthen supplier audits and governance transparency.")
        recommendations.append("Reduce project delays through better risk management.")
    if total_avg < BRSR_THRESHOLDS["total_score"]:
        recommendations.append("Prioritize ESG improvements to meet BRSR compliance levels.")

    # Summary (local generation to avoid external AI dependency)
    ai_summary = (
        f"Company ESG performance summary: Environment {env_avg:.1f}, Social {soc_avg:.1f}, "
        f"Governance {gov_avg:.1f}, Overall {total_avg:.1f}. Focus on meeting BRSR thresholds "
        f"and improving alignment with SDG 9, 11, 12, and 13."
    )

    sdg_alignment = {
        "SDG 9": f"{env_avg:.1f}% (Industry, Innovation, Infrastructure)",
        "SDG 11": f"{soc_avg:.1f}% (Sustainable Cities)",
        "SDG 12": f"{total_avg:.1f}% (Responsible Production)",
        "SDG 13": f"{env_avg:.1f}% (Climate Action)",
    }
    
    return {
        "summary": ai_summary,
        "aggregate": {
            "environment_score": env_avg,
            "social_score": soc_avg,
            "governance_score": gov_avg,
            "total_score": total_avg,
        },
        "sdg_alignment": sdg_alignment,
        "recommendations": recommendations,
        "thresholds": BRSR_THRESHOLDS,
    }

@router.get("/materials")
async def get_material_usage(project_id: int | None = None):
    """Return aggregated material usage from Supabase.

    - If project_id is provided, returns materials for that project only
    - Otherwise returns company-wide totals
    """
    materials_data = _fetch_materials_data()
    if not materials_data:
        raise HTTPException(status_code=404, detail="No material data found in Supabase")

    def include_material(material: Dict[str, Any]) -> bool:
        if project_id is None:
            return True
        try:
            return int(material.get("project_id", 0)) == int(project_id)
        except Exception:
            return False

    materials: Dict[str, float] = {}
    total_qty = 0.0
    projects_seen: Dict[int, bool] = {}
    
    for material in materials_data:
        if not include_material(material):
            continue
        
        mat_name = (material.get("name") or "").strip()
        try:
            qty = float(material.get("quantity", 0) or 0)
        except Exception:
            qty = 0.0
        
        if not mat_name:
            continue
        
        materials[mat_name] = materials.get(mat_name, 0.0) + qty
        total_qty += qty
        
        try:
            projects_seen[int(material.get("project_id", 0))] = True
        except Exception:
            pass

    # Format as list sorted by quantity desc
    material_list = [
        {"material": m, "quantity": q} for m, q in sorted(materials.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "scope": "project" if project_id is not None else "company",
        "project_id": project_id,
        "total_material_quantity": total_qty,
        "materials": material_list,
        "projects_count": len(projects_seen) if project_id is None else (1 if material_list else 0),
    }

@router.get("/ai-report")
async def generate_ai_esg_report():
    """
    Generate AI-powered ESG report using Gemini API
    Fetches comprehensive data from Supabase and creates detailed analysis
    """
    try:
        if not gemini_model:
            # Provide a fallback report when Gemini is not available
            return {
                "status": "fallback",
                "generated_at": "2024-01-01T00:00:00Z",
                "message": "Gemini AI not available. Showing template report.",
                "data_summary": {
                    "projects_analyzed": len(_fetch_projects_data()),
                    "materials_analyzed": len(_fetch_materials_data()),
                    "shipments_analyzed": len(_fetch_shipments_data())
                },
                "ai_report": {
                    "executive_summary": "This is a template ESG report. To get AI-powered analysis, please install google-generativeai and configure GEMINI_API_KEY.",
                    "environmental_analysis": {
                        "carbon_footprint": "Based on your materials data, focus on reducing high-emission materials like steel and cement.",
                        "waste_management": "Implement waste reduction programs and increase recycling rates.",
                        "resource_efficiency": "Optimize material usage and consider circular economy principles.",
                        "recommendations": ["Switch to low-carbon materials", "Implement waste tracking", "Use recycled materials"]
                    },
                    "social_analysis": {
                        "community_impact": "Engage with local communities and create employment opportunities.",
                        "worker_safety": "Maintain high safety standards and provide proper training.",
                        "local_sourcing": "Source materials locally to support regional economy.",
                        "recommendations": ["Increase local employment", "Enhance safety protocols", "Support local suppliers"]
                    },
                    "governance_analysis": {
                        "compliance_status": "Ensure compliance with all environmental and safety regulations.",
                        "transparency": "Maintain transparent reporting and regular audits.",
                        "risk_management": "Implement comprehensive ESG risk management framework.",
                        "recommendations": ["Regular compliance audits", "Transparent reporting", "Risk assessment protocols"]
                    },
                    "priority_actions": [
                        "Install Gemini AI for detailed analysis",
                        "Improve environmental score above 70",
                        "Enhance social compliance above 75"
                    ],
                    "next_steps": [
                        "Configure GEMINI_API_KEY environment variable",
                        "Install google-generativeai package",
                        "Generate AI-powered insights"
                    ]
                }
            }
        
        # Fetch comprehensive data from Supabase
        projects_data = _fetch_projects_data()
        materials_data = _fetch_materials_data()
        shipments_data = _fetch_shipments_data()
        
        # Calculate ESG scores using the aggregation function
        features = _project_feature_aggregation()
        if not features:
            raise HTTPException(status_code=404, detail="No project data found in Supabase")
        
        # Calculate aggregate ESG scores
        project_scores = []
        for pid, feat in features.items():
            scores = calculate_esg_scores(feat)
            project_scores.append(scores)
        
        if project_scores:
            env_avg = weighted_avg([p["environment_score"] for p in project_scores])
            soc_avg = weighted_avg([p["social_score"] for p in project_scores])
            gov_avg = weighted_avg([p["governance_score"] for p in project_scores])
            total_avg = (0.4 * env_avg) + (0.3 * soc_avg) + (0.3 * gov_avg)
        else:
            env_avg = soc_avg = gov_avg = total_avg = 0.0
        
        esg_scores = {
            "environment_score": env_avg,
            "social_score": soc_avg,
            "governance_score": gov_avg,
            "total_score": total_avg,
        }
        
        # Prepare data for AI analysis
        analysis_data = {
            "projects": {
                "total_count": len(projects_data),
                "projects": projects_data[:10],  # Limit to first 10 for prompt size
                "summary": {
                    "total_budget": sum(float(p.get("project_budget", 0) or 0) for p in projects_data),
                    "locations": list(set(p.get("location", "Unknown") for p in projects_data)),
                    "project_types": list(set(p.get("project_type", "Building") for p in projects_data))
                }
            },
            "materials": {
                "total_count": len(materials_data),
                "materials": materials_data[:20],  # Limit to first 20 for prompt size
                "summary": {
                    "total_quantity": sum(float(m.get("quantity", 0) or 0) for m in materials_data),
                    "material_types": list(set(m.get("name", "Unknown") for m in materials_data)),
                    "projects_with_materials": len(set(m.get("project_id") for m in materials_data))
                }
            },
            "shipments": {
                "total_count": len(shipments_data),
                "shipments": shipments_data[:15],  # Limit to first 15 for prompt size
                "summary": {
                    "total_distance": sum(float(s.get("distance", 0) or 0) for s in shipments_data),
                    "total_cost": sum(float(s.get("cost", 0) or 0) for s in shipments_data),
                    "transport_modes": list(set(s.get("transport_mode", "Unknown") for s in shipments_data))
                }
            },
            "esg_scores": esg_scores,
            "thresholds": BRSR_THRESHOLDS
        }
        
        # Create comprehensive prompt for Gemini
        prompt = f"""
        You are an ESG (Environmental, Social, Governance) analyst. Generate a comprehensive ESG report based on the following construction company data:

        PROJECTS DATA:
        - Total Projects: {analysis_data['projects']['total_count']}
        - Total Budget: ${analysis_data['projects']['summary']['total_budget']:,.2f}
        - Locations: {', '.join(analysis_data['projects']['summary']['locations'])}
        - Project Types: {', '.join(analysis_data['projects']['summary']['project_types'])}

        MATERIALS DATA:
        - Total Materials: {analysis_data['materials']['total_count']}
        - Total Quantity: {analysis_data['materials']['summary']['total_quantity']:,.2f} units
        - Material Types: {', '.join(analysis_data['materials']['summary']['material_types'])}
        - Projects with Materials: {analysis_data['materials']['summary']['projects_with_materials']}

        SHIPMENTS DATA:
        - Total Shipments: {analysis_data['shipments']['total_count']}
        - Total Distance: {analysis_data['shipments']['summary']['total_distance']:,.2f} km
        - Total Cost: ${analysis_data['shipments']['summary']['total_cost']:,.2f}
        - Transport Modes: {', '.join(analysis_data['shipments']['summary']['transport_modes'])}

        CURRENT ESG SCORES:
        - Environmental Score: {esg_scores.get('environment_score', 0):.1f}/100 (Threshold: {BRSR_THRESHOLDS['environment_score']})
        - Social Score: {esg_scores.get('social_score', 0):.1f}/100 (Threshold: {BRSR_THRESHOLDS['social_score']})
        - Governance Score: {esg_scores.get('governance_score', 0):.1f}/100 (Threshold: {BRSR_THRESHOLDS['governance_score']})
        - Overall Score: {esg_scores.get('total_score', 0):.1f}/100 (Threshold: {BRSR_THRESHOLDS['total_score']})

        Please provide a comprehensive ESG report in the following JSON format:
        {{
            "executive_summary": "Brief overview of ESG performance and key findings",
            "environmental_analysis": {{
                "carbon_footprint": "Analysis of carbon emissions from materials and transportation",
                "waste_management": "Assessment of waste reduction and recycling efforts",
                "resource_efficiency": "Evaluation of material usage efficiency",
                "recommendations": ["Specific environmental improvement recommendations"]
            }},
            "social_analysis": {{
                "community_impact": "Assessment of local community engagement and employment",
                "worker_safety": "Analysis of safety measures and compliance",
                "local_sourcing": "Evaluation of local material sourcing practices",
                "recommendations": ["Specific social responsibility recommendations"]
            }},
            "governance_analysis": {{
                "compliance_status": "Assessment of regulatory compliance and reporting",
                "transparency": "Evaluation of reporting transparency and accuracy",
                "risk_management": "Analysis of ESG risk management practices",
                "recommendations": ["Specific governance improvement recommendations"]
            }},
            "priority_actions": [
                "Top 3 priority actions for ESG improvement"
            ],
            "next_steps": [
                "Specific next steps for ESG enhancement"
            ]
        }}

        Focus on actionable insights and specific recommendations based on the actual data provided.
        """
        
        # Generate AI report
        try:
            response = gemini_model.generate_content(prompt)
            ai_report_text = response.text
        except Exception as gemini_error:
            print(f"Gemini API error: {str(gemini_error)}")
            # Fall back to template report if Gemini fails
            return {
                "status": "fallback",
                "generated_at": "2024-01-01T00:00:00Z",
                "message": f"Gemini AI error: {str(gemini_error)}. Showing template report.",
                "data_summary": {
                    "projects_analyzed": len(projects_data),
                    "materials_analyzed": len(materials_data),
                    "shipments_analyzed": len(shipments_data)
                },
                "ai_report": {
                    "executive_summary": "This is a template ESG report. To get AI-powered analysis, please configure a valid GEMINI_API_KEY in your .env file. Get your API key from https://makersuite.google.com/app/apikey",
                    "environmental_analysis": {
                        "carbon_footprint": "Based on your materials data, focus on reducing high-emission materials like steel and cement.",
                        "waste_management": "Implement waste reduction programs and increase recycling rates.",
                        "resource_efficiency": "Optimize material usage and consider circular economy principles.",
                        "recommendations": ["Switch to low-carbon materials", "Implement waste tracking", "Use recycled materials"]
                    },
                    "social_analysis": {
                        "community_impact": "Engage with local communities and create employment opportunities.",
                        "worker_safety": "Maintain high safety standards and provide proper training.",
                        "local_sourcing": "Source materials locally to support regional economy.",
                        "recommendations": ["Increase local employment", "Enhance safety protocols", "Support local suppliers"]
                    },
                    "governance_analysis": {
                        "compliance_status": "Ensure compliance with all environmental and safety regulations.",
                        "transparency": "Maintain transparent reporting and regular audits.",
                        "risk_management": "Implement comprehensive ESG risk management framework.",
                        "recommendations": ["Regular compliance audits", "Transparent reporting", "Risk assessment protocols"]
                    },
                    "priority_actions": [
                        "Configure valid GEMINI_API_KEY in .env file",
                        "Get API key from https://makersuite.google.com/app/apikey",
                        "Improve environmental score above 70"
                    ],
                    "next_steps": [
                        "Set up valid Gemini API key",
                        "Implement material efficiency programs",
                        "Strengthen ESG reporting framework"
                    ]
                }
            }
        
        # Try to parse as JSON, fallback to text if parsing fails
        try:
            ai_report = json.loads(ai_report_text)
        except json.JSONDecodeError:
            # If JSON parsing fails, create a structured response from the text
            ai_report = {
                "executive_summary": ai_report_text[:500] + "..." if len(ai_report_text) > 500 else ai_report_text,
                "environmental_analysis": {
                    "carbon_footprint": "AI analysis generated based on materials and transportation data",
                    "waste_management": "Assessment of current waste management practices",
                    "resource_efficiency": "Evaluation of material usage patterns",
                    "recommendations": ["Improve material efficiency", "Implement waste reduction programs"]
                },
                "social_analysis": {
                    "community_impact": "Analysis of community engagement and local employment",
                    "worker_safety": "Assessment of safety compliance and measures",
                    "local_sourcing": "Evaluation of local sourcing practices",
                    "recommendations": ["Increase local employment", "Enhance community engagement"]
                },
                "governance_analysis": {
                    "compliance_status": "Assessment of regulatory compliance",
                    "transparency": "Evaluation of reporting practices",
                    "risk_management": "Analysis of ESG risk management",
                    "recommendations": ["Improve reporting transparency", "Strengthen compliance monitoring"]
                },
                "priority_actions": [
                    "Address environmental score below threshold",
                    "Improve social compliance standards",
                    "Enhance governance oversight"
                ],
                "next_steps": [
                    "Implement material efficiency programs",
                    "Strengthen ESG reporting framework",
                    "Develop sustainability action plan"
                ]
            }
        
        return {
            "status": "success",
            "generated_at": "2024-01-01T00:00:00Z",  # You can use datetime.now().isoformat()
            "data_summary": {
                "projects_analyzed": analysis_data['projects']['total_count'],
                "materials_analyzed": analysis_data['materials']['total_count'],
                "shipments_analyzed": analysis_data['shipments']['total_count']
            },
            "ai_report": ai_report,
            "raw_data": analysis_data  # Include raw data for reference
        }
        
    except Exception as e:
        print(f"Error generating AI ESG report: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate AI ESG report: {str(e)}"
        )
