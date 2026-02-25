from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any

# Material Schemas
class MaterialBase(BaseModel):
    name: str
    quantity: float
    unit: str  # "tonnes" or "kg"
    import_location: str

class MaterialCreate(MaterialBase):
    pass

class Material(MaterialBase):
    id: int
    project_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    project_name: str
    location: str
    project_budget: float
    currency: Optional[str] = "INR"
    project_type: Optional[str] = None
    description: Optional[str] = None
    estimated_duration_days: Optional[int] = None
    team_size: Optional[int] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    location: Optional[str] = None
    project_budget: Optional[float] = None
    currency: Optional[str] = None
    project_type: Optional[str] = None
    description: Optional[str] = None
    estimated_duration_days: Optional[int] = None
    team_size: Optional[int] = None

class Project(ProjectBase):
    id: int
    project_id: int
    
    class Config:
        from_attributes = True

# Task Schemas
class TaskBase(BaseModel):
    task_name: str
    planned_start_date: datetime
    planned_end_date: datetime
    duration_days: int
    labor_count: int
    labor_cost_per_day: float
    equipment_cost_per_day: float
    material: str
    material_quantity: float
    material_unit_cost: float
    planned_task_cost: float
    e_score: float
    s_score: float
    g_score: float
    carbon_footprint_kg: float
    water_usage_m3: float
    energy_usage_kwh: float
    sdg_alignment_score: float
    predicted_delay_days: int
    predicted_task_cost: float
    predicted_esg_score: float
    profit_impact: float

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    task_id: int
    project_id: int
    
    class Config:
        from_attributes = True

# Weather Schemas
class WeatherDataBase(BaseModel):
    date: datetime
    weather_condition: str
    rain_mm: float
    temperature_c: float
    wind_speed_kmh: float
    weather_disruption_score: float

class WeatherDataCreate(WeatherDataBase):
    task_id: int

class WeatherData(WeatherDataBase):
    id: int
    task_id: int
    
    class Config:
        from_attributes = True

# ESG Analysis Schemas
class ESGAnalysis(BaseModel):
    environment: float
    social: float
    governance: float
    overall_score: float
    sdg_alignment: Dict[str, float]

class WeatherForecast(BaseModel):
    location: str
    current_weather: Dict[str, Any]
    forecast: List[Dict[str, Any]]
    disruption_score: float

class SimulationRequest(BaseModel):
    project_id: int
    alternative_materials: Optional[List[str]] = None
    alternative_resources: Optional[Dict[str, float]] = None
    weather_scenario: Optional[str] = None

class SimulationResult(BaseModel):
    original_cost: float
    predicted_cost: float
    original_duration: int
    predicted_duration: int
    esg_impact: ESGAnalysis
    weather_impact: float
    weather_data: Optional[Dict[str, Any]] = None
    recommendations: List[str]

# Shipment Schemas
class ShipmentBase(BaseModel):
    project_id: int
    project_name: str
    material_type: str
    quantity: float
    unit: str
    origin: str
    destination: str
    estimated_arrival: datetime

class ShipmentCreate(ShipmentBase):
    pass

class ShipmentUpdate(BaseModel):
    status: Optional[str] = None
    actual_arrival: Optional[datetime] = None
    weather_delay_days: Optional[int] = None
    weather_condition: Optional[str] = None

class Shipment(ShipmentBase):
    shipment_id: str
    status: str
    actual_arrival: Optional[datetime] = None
    weather_delay_days: int
    weather_condition: str
    weather_summary: str
    disruption_score: float
    impact_level: str
    temperature: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True