from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, unique=True, index=True)
    project_name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    project_budget = Column(Float, nullable=False)
    project_type = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    raw_materials = Column(Text, nullable=True)
    estimated_duration_days = Column(Integer, nullable=True)
    team_size = Column(Integer, nullable=True)
    environmental_goals = Column(Text, nullable=True)
    social_goals = Column(Text, nullable=True)
    governance_goals = Column(Text, nullable=True)
    
    # Relationships
    tasks = relationship("Task", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, index=True)
    task_name = Column(String(255), nullable=False)
    planned_start_date = Column(DateTime, nullable=False)
    planned_end_date = Column(DateTime, nullable=False)
    duration_days = Column(Integer, nullable=False)
    labor_count = Column(Integer, nullable=False)
    labor_cost_per_day = Column(Float, nullable=False)
    equipment_cost_per_day = Column(Float, nullable=False)
    material = Column(String(255), nullable=False)
    material_quantity = Column(Float, nullable=False)
    material_unit_cost = Column(Float, nullable=False)
    planned_task_cost = Column(Float, nullable=False)
    
    # ESG Scores
    e_score = Column(Float, nullable=False)
    s_score = Column(Float, nullable=False)
    g_score = Column(Float, nullable=False)
    
    # Environmental Impact
    carbon_footprint_kg = Column(Float, nullable=False)
    water_usage_m3 = Column(Float, nullable=False)
    energy_usage_kwh = Column(Float, nullable=False)
    
    # SDG and Predictions
    sdg_alignment_score = Column(Float, nullable=False)
    predicted_delay_days = Column(Integer, nullable=False)
    predicted_task_cost = Column(Float, nullable=False)
    predicted_esg_score = Column(Float, nullable=False)
    profit_impact = Column(Float, nullable=False)
    
    # Foreign Key
    project_id = Column(Integer, ForeignKey("projects.project_id"))
    project = relationship("Project", back_populates="tasks")

class WeatherData(Base):
    __tablename__ = "weather_data"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.task_id"))
    date = Column(DateTime, nullable=False)
    weather_condition = Column(String(50), nullable=False)
    rain_mm = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=False)
    wind_speed_kmh = Column(Float, nullable=False)
    weather_disruption_score = Column(Float, nullable=False)
    
    # Relationship
    task = relationship("Task")
