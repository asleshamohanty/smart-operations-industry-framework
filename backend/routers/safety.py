"""
Safety Monitoring API Router

This module provides API endpoints for:
1. Real-time safety metrics (AQI, noise, temperature, etc.)
2. Safety alerts and hazard detection
3. Project-specific safety data
4. Integration with Digital Twin Temperature Probe Sensor
5. Live SLM (Sound Level Meter) data
6. Live PM2.5 sensor data
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import random
import json
import hashlib
import sys
import os
import numpy as np

# Add the utils directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.simple_live_sensor_manager import get_sensor_manager
from database import get_supabase

router = APIRouter(prefix="/safety", tags=["safety"])

# Pydantic models
class SafetyMetrics(BaseModel):
    aqi: int
    noise_level: int
    temperature: float
    humidity: float
    co2_level: int
    pm25: float
    pm10: float
    last_updated: str

class SafetyAlert(BaseModel):
    id: str
    project_id: int
    project_name: str
    location: str
    priority: str
    hazard_type: str
    current_reading: float
    unit: str
    threshold: float
    danger_description: str
    recommended_action: str
    detected_at: str
    status: str

class SafetyAlertsResponse(BaseModel):
    alerts: List[SafetyAlert]
    total_count: int
    critical_count: int

# Safety thresholds
SAFETY_THRESHOLDS = {
    "aqi": {"safe": 50, "moderate": 100, "unhealthy": 150},
    "noise": {"safe": 70, "caution": 85, "dangerous": 100},
    "temperature": {"safe": 25, "caution": 35, "dangerous": 40},
    "co2": {"safe": 400, "caution": 1000, "dangerous": 5000},
    "pm25": {"safe": 12, "moderate": 35, "unhealthy": 55},
    "pm10": {"safe": 50, "moderate": 150, "unhealthy": 250},
}

def get_time_based_seed(project_id: int) -> int:
    """Generate a consistent seed based on project ID and 2-minute time intervals"""
    now = datetime.now()
    # Round down to nearest 2-minute interval
    interval_minutes = (now.minute // 2) * 2
    time_key = f"{now.year}{now.month:02d}{now.day:02d}{now.hour:02d}{interval_minutes:02d}"
    
    # Create a hash from project_id and time_key for consistent but varied data
    seed_string = f"{project_id}_{time_key}"
    return int(hashlib.md5(seed_string.encode()).hexdigest()[:8], 16)

def generate_realistic_safety_metrics(project_id: int) -> SafetyMetrics:
    """Generate realistic safety metrics using live sensor data from Digital Twin and SLM/PM2.5 datasets"""
    now = datetime.now()
    
    # Get sensor manager
    sensor_manager = get_sensor_manager()
    
    # Get project info
    db = get_supabase()
    project_result = db.table("projects").select("*").eq("project_id", project_id).execute()
    
    if not project_result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = project_result.data[0]
    project_type = project.get("project_type", "Building")
    
    # Try to get live sensor data first
    try:
        # Get latest temperature from Digital Twin Temperature Probe Sensor
        temp_data = sensor_manager.get_latest_sensor_data(project_id, 'Temperature_Probe_Sensor')
        if temp_data:
            temperature = temp_data['value']
        else:
            # Fallback to generated data
            temperature = _generate_fallback_temperature(project_type, now)
        
        # Get latest SLM (Sound Level Meter) data
        slm_data = sensor_manager.get_latest_sensor_data(project_id, 'SLM')
        if slm_data:
            noise_level = slm_data['value']
        else:
            # Fallback to generated data
            noise_level = _generate_fallback_noise(project_type, now)
        
        # Get latest PM2.5 data
        pm25_data = sensor_manager.get_latest_sensor_data(project_id, 'PM2.5')
        if pm25_data:
            pm25 = pm25_data['value']
        else:
            # Fallback to generated data
            pm25 = _generate_fallback_pm25(project_type, now)
        
        # Get latest AQI data
        aqi_data = sensor_manager.get_latest_sensor_data(project_id, 'AQI')
        if aqi_data:
            aqi = aqi_data['value']
        else:
            # Calculate AQI from PM2.5
            aqi = _calculate_aqi_from_pm25(pm25)
        
        # Calculate CO2 level (derived from air quality)
        co2_level = _calculate_co2_from_aqi(aqi, project_type)
        
        # Calculate PM10 (derived from PM2.5)
        pm10 = pm25 * 2.5  # Typical PM10/PM2.5 ratio
        
        # Humidity varies independently
        humidity = random.uniform(30, 80)
        
    except Exception as e:
        print(f"Error getting live sensor data: {e}")
        # Fallback to original generation method
        return _generate_fallback_metrics(project_id, project_type, now)
    
    return SafetyMetrics(
        aqi=int(aqi),
        noise_level=int(noise_level),
        temperature=round(temperature, 1),
        humidity=round(humidity, 1),
        co2_level=int(co2_level),
        pm25=round(pm25, 1),
        pm10=round(pm10, 1),
        last_updated=now.isoformat()
    )

def _generate_fallback_temperature(project_type: str, now: datetime) -> float:
    """Generate fallback temperature data"""
    base_metrics = {
        "Industrial": {"temp": 28},
        "Highway": {"temp": 32},
        "Building": {"temp": 26},
        "Residential": {"temp": 24},
        "Commercial": {"temp": 27},
    }
    
    base = base_metrics.get(project_type, base_metrics["Building"])
    
    # Use consistent seed based on 2-minute intervals
    seed = get_time_based_seed(1)  # Use project_id 1 for consistency
    random.seed(seed)
    
    hour = now.hour
    daily_temp = 5 * np.sin(2 * np.pi * hour / 24)
    temp = base["temp"] + daily_temp + random.uniform(-3, 5)
    temp = max(15, min(45, temp))
    
    random.seed()  # Reset seed
    return temp

def _generate_fallback_noise(project_type: str, now: datetime) -> float:
    """Generate fallback noise data"""
    base_metrics = {
        "Industrial": {"noise": 75},
        "Highway": {"noise": 80},
        "Building": {"noise": 65},
        "Residential": {"noise": 55},
        "Commercial": {"noise": 70},
    }
    
    base = base_metrics.get(project_type, base_metrics["Building"])
    
    hour = now.hour
    time_factor = 1.0
    
    if 8 <= hour <= 18:
        time_factor = 1.2
    elif 22 <= hour or hour <= 6:
        time_factor = 0.7
    
    noise = base["noise"] * time_factor + random.uniform(-10, 10)
    noise = max(40, min(120, noise))
    
    return noise

def _generate_fallback_pm25(project_type: str, now: datetime) -> float:
    """Generate fallback PM2.5 data"""
    base_metrics = {
        "Industrial": {"pm25": 45},
        "Highway": {"pm25": 35},
        "Building": {"pm25": 25},
        "Residential": {"pm25": 20},
        "Commercial": {"pm25": 30},
    }
    
    base = base_metrics.get(project_type, base_metrics["Building"])
    
    hour = now.hour
    if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
        multiplier = 1.3
    elif 10 <= hour <= 16:
        multiplier = 1.1
    else:
        multiplier = 0.8
    
    pm25 = base["pm25"] * multiplier + random.uniform(-8, 8)
    pm25 = max(5, min(150, pm25))
    
    return pm25

def _calculate_aqi_from_pm25(pm25: float) -> int:
    """Calculate AQI from PM2.5 value"""
    if pm25 <= 12:
        return int((pm25 / 12) * 50)
    elif pm25 <= 35:
        return int(50 + ((pm25 - 12) / 23) * 50)
    elif pm25 <= 55:
        return int(100 + ((pm25 - 35) / 20) * 50)
    else:
        return int(min(300, 150 + ((pm25 - 55) / 95) * 150))

def _calculate_co2_from_aqi(aqi: int, project_type: str) -> int:
    """Calculate CO2 level from AQI and project type"""
    base_co2 = {
        "Industrial": 450,
        "Highway": 420,
        "Building": 400,
        "Residential": 380,
        "Commercial": 410,
    }.get(project_type, 400)
    
    # CO2 increases with AQI
    co2_multiplier = 1 + (aqi - 50) / 200  # Scale based on AQI
    co2 = base_co2 * co2_multiplier
    
    return int(max(300, min(2000, co2)))

def _generate_fallback_metrics(project_id: int, project_type: str, now: datetime) -> SafetyMetrics:
    """Generate fallback metrics using original method"""
    base_metrics = {
        "Industrial": {"aqi": 45, "noise": 75, "temp": 28, "co2": 450},
        "Highway": {"aqi": 65, "noise": 80, "temp": 32, "co2": 420},
        "Building": {"aqi": 35, "noise": 65, "temp": 26, "co2": 400},
        "Residential": {"aqi": 30, "noise": 55, "temp": 24, "co2": 380},
        "Commercial": {"aqi": 40, "noise": 70, "temp": 27, "co2": 410},
    }
    
    base = base_metrics.get(project_type, base_metrics["Building"])
    
    # Use consistent seed based on 2-minute intervals
    seed = get_time_based_seed(project_id)
    random.seed(seed)
    
    # Add realistic variations based on time of day
    hour = now.hour
    time_factor = 1.0
    
    # Higher noise during work hours (8 AM - 6 PM)
    if 8 <= hour <= 18:
        time_factor = 1.2
    # Lower activity at night
    elif 22 <= hour or hour <= 6:
        time_factor = 0.7
    
    # Add consistent variations (±20%) based on seed
    variation = random.uniform(0.8, 1.2)
    
    aqi = int(base["aqi"] * time_factor * variation)
    noise_level = int(base["noise"] * time_factor * variation)
    temperature = base["temp"] + random.uniform(-3, 5)  # Temperature varies more
    co2_level = int(base["co2"] * variation)
    
    # Ensure realistic ranges
    aqi = max(10, min(aqi, 200))
    noise_level = max(40, min(noise_level, 120))
    temperature = max(15, min(temperature, 45))
    co2_level = max(300, min(co2_level, 2000))
    
    # Calculate PM levels based on AQI
    pm25 = (aqi / 100) * 35 + random.uniform(-5, 5)
    pm10 = (aqi / 100) * 150 + random.uniform(-20, 20)
    
    # Humidity varies independently
    humidity = random.uniform(30, 80)
    
    # Reset random seed to avoid affecting other functions
    random.seed()
    
    return SafetyMetrics(
        aqi=aqi,
        noise_level=noise_level,
        temperature=round(temperature, 1),
        humidity=round(humidity, 1),
        co2_level=co2_level,
        pm25=round(pm25, 1),
        pm10=round(pm10, 1),
        last_updated=now.isoformat()
    )

def generate_safety_alerts(project_id: int, metrics: SafetyMetrics = None) -> List[SafetyAlert]:
    """Generate realistic safety alerts based on current metrics"""
    alerts = []
    
    # Get project info
    db = get_supabase()
    project_result = db.table("projects").select("*").eq("project_id", project_id).execute()
    
    if not project_result.data:
        return alerts
    
    project = project_result.data[0]
    project_name = project.get("project_name", "Unknown Project")
    location = project.get("location", "Unknown Location")
    
    # Use provided metrics or generate new ones (for consistency)
    if metrics is None:
        metrics = generate_realistic_safety_metrics(project_id)
    
    now = datetime.now()
    
    # Use consistent seed for alert generation
    seed = get_time_based_seed(project_id)
    random.seed(seed)
    
    # Check for AQI alerts
    if metrics.aqi > SAFETY_THRESHOLDS["aqi"]["moderate"]:
        priority = "high" if metrics.aqi > SAFETY_THRESHOLDS["aqi"]["unhealthy"] else "medium"
        alerts.append(SafetyAlert(
            id=f"aqi-{project_id}-{int(now.timestamp())}",
            project_id=project_id,
            project_name=project_name,
            location=f"{project_name} - Zone A",
            priority=priority,
            hazard_type="Air Quality",
            current_reading=metrics.aqi,
            unit="AQI",
            threshold=SAFETY_THRESHOLDS["aqi"]["moderate"],
            danger_description=f"AQI exceeding safe threshold (Current: {metrics.aqi} AQI)",
            recommended_action="Mandatory PPE enforcement, reduce outdoor activities",
            detected_at=(now - timedelta(minutes=random.randint(5, 60))).isoformat(),
            status="active"
        ))
    
    # Check for noise alerts
    if metrics.noise_level > SAFETY_THRESHOLDS["noise"]["caution"]:
        priority = "high" if metrics.noise_level > SAFETY_THRESHOLDS["noise"]["dangerous"] else "medium"
        alerts.append(SafetyAlert(
            id=f"noise-{project_id}-{int(now.timestamp())}",
            project_id=project_id,
            project_name=project_name,
            location=f"{project_name} - Construction Zone",
            priority=priority,
            hazard_type="Noise Level",
            current_reading=metrics.noise_level,
            unit="dB",
            threshold=SAFETY_THRESHOLDS["noise"]["caution"],
            danger_description=f"Elevated noise levels detected (Current: {metrics.noise_level} dB)",
            recommended_action="Provide hearing protection, reduce heavy machinery during sensitive hours",
            detected_at=(now - timedelta(minutes=random.randint(10, 120))).isoformat(),
            status="active"
        ))
    
    # Check for temperature alerts
    if metrics.temperature > SAFETY_THRESHOLDS["temperature"]["caution"]:
        priority = "high" if metrics.temperature > SAFETY_THRESHOLDS["temperature"]["dangerous"] else "medium"
        alerts.append(SafetyAlert(
            id=f"temp-{project_id}-{int(now.timestamp())}",
            project_id=project_id,
            project_name=project_name,
            location=f"{project_name} - Work Area",
            priority=priority,
            hazard_type="Temperature",
            current_reading=metrics.temperature,
            unit="°C",
            threshold=SAFETY_THRESHOLDS["temperature"]["caution"],
            danger_description=f"High temperature detected (Current: {metrics.temperature}°C)",
            recommended_action="Increase hydration breaks, provide shade, monitor for heat stress",
            detected_at=(now - timedelta(minutes=random.randint(15, 90))).isoformat(),
            status="active"
        ))
    
    # Check for CO2 alerts
    if metrics.co2_level > SAFETY_THRESHOLDS["co2"]["caution"]:
        priority = "high" if metrics.co2_level > SAFETY_THRESHOLDS["co2"]["dangerous"] else "medium"
        alerts.append(SafetyAlert(
            id=f"co2-{project_id}-{int(now.timestamp())}",
            project_id=project_id,
            project_name=project_name,
            location=f"{project_name} - Indoor Area",
            priority=priority,
            hazard_type="CO2 Level",
            current_reading=metrics.co2_level,
            unit="ppm",
            threshold=SAFETY_THRESHOLDS["co2"]["caution"],
            danger_description=f"Poor ventilation detected (Current: CO2: {metrics.co2_level} ppm)",
            recommended_action="Increase ventilation, limit worker exposure time",
            detected_at=(now - timedelta(minutes=random.randint(20, 180))).isoformat(),
            status="active"
        ))
    
    # Add some random additional hazards (10% chance each)
    if random.random() < 0.1:
        alerts.append(SafetyAlert(
            id=f"fall-{project_id}-{int(now.timestamp())}",
            project_id=project_id,
            project_name=project_name,
            location=f"{project_name} - Elevated Work Area",
            priority="high",
            hazard_type="Fall Risk",
            current_reading=0,
            unit="risk",
            threshold=0,
            danger_description="Unprotected edge detected on scaffolding",
            recommended_action="Install guardrails immediately, halt work until secured",
            detected_at=(now - timedelta(minutes=random.randint(5, 30))).isoformat(),
            status="active"
        ))
    
    if random.random() < 0.1:
        alerts.append(SafetyAlert(
            id=f"electrical-{project_id}-{int(now.timestamp())}",
            project_id=project_id,
            project_name=project_name,
            location=f"{project_name} - Electrical Panel",
            priority="medium",
            hazard_type="Electrical",
            current_reading=0,
            unit="risk",
            threshold=0,
            danger_description="Exposed electrical wiring detected",
            recommended_action="De-energize circuit, install proper insulation",
            detected_at=(now - timedelta(minutes=random.randint(10, 60))).isoformat(),
            status="active"
        ))
    
    # Reset random seed to avoid affecting other functions
    random.seed()
    
    return alerts

@router.get("/metrics/{project_id}", response_model=SafetyMetrics)
async def get_safety_metrics(project_id: int):
    """Get current safety metrics for a specific project"""
    try:
        metrics = generate_realistic_safety_metrics(project_id)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating safety metrics: {str(e)}")

@router.get("/alerts/{project_id}", response_model=SafetyAlertsResponse)
async def get_safety_alerts(project_id: int):
    """Get active safety alerts for a specific project"""
    try:
        # Generate metrics first to ensure consistency
        metrics = generate_realistic_safety_metrics(project_id)
        alerts = generate_safety_alerts(project_id, metrics)
        critical_count = len([alert for alert in alerts if alert.priority == "high"])
        
        return SafetyAlertsResponse(
            alerts=alerts,
            total_count=len(alerts),
            critical_count=critical_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating safety alerts: {str(e)}")

@router.get("/projects")
async def get_safety_projects():
    """Get all projects for safety monitoring"""
    try:
        db = get_supabase()
        result = db.table("projects").select("project_id, project_name, location, project_type").execute()
        
        if not result.data:
            return {"projects": []}
        
        return {"projects": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")

@router.get("/thresholds")
async def get_safety_thresholds():
    """Get safety thresholds for different metrics"""
    return {"thresholds": SAFETY_THRESHOLDS}

@router.post("/alert/{alert_id}/resolve")
async def resolve_safety_alert(alert_id: str):
    """Mark a safety alert as resolved"""
    try:
        # In a real implementation, you would update the database
        # For now, we'll just return success
        return {"message": f"Alert {alert_id} marked as resolved", "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resolving alert: {str(e)}")

@router.get("/dashboard/{project_id}")
async def get_safety_dashboard(project_id: int):
    """Get comprehensive safety dashboard data for a project"""
    try:
        # Generate metrics once and use for both metrics and alerts
        metrics = generate_realistic_safety_metrics(project_id)
        alerts = generate_safety_alerts(project_id, metrics)
        
        # Calculate safety score
        safety_score = 100
        for alert in alerts:
            if alert.priority == "high":
                safety_score -= 20
            elif alert.priority == "medium":
                safety_score -= 10
            else:
                safety_score -= 5
        
        safety_score = max(0, safety_score)
        
        return {
            "project_id": project_id,
            "metrics": metrics,
            "alerts": alerts,
            "safety_score": safety_score,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating dashboard data: {str(e)}")

@router.get("/sensor-data/{project_id}")
async def get_sensor_data(project_id: int, sensor_type: str = None, hours: int = 24):
    """Get sensor data for a specific project"""
    try:
        sensor_manager = get_sensor_manager()
        
        if sensor_type:
            # Get specific sensor type data
            data = sensor_manager.get_sensor_history(project_id, sensor_type, hours)
            return {
                "project_id": project_id,
                "sensor_type": sensor_type,
                "data": data,
                "count": len(data)
            }
        else:
            # Get all sensor types
            sensor_types = ['Temperature_Probe_Sensor', 'SLM', 'PM2.5', 'AQI']
            all_data = {}
            
            for st in sensor_types:
                data = sensor_manager.get_sensor_history(project_id, st, hours)
                all_data[st] = {
                    "data": data,
                    "count": len(data),
                    "latest": data[0] if data else None
                }
            
            return {
                "project_id": project_id,
                "sensor_data": all_data
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting sensor data: {str(e)}")

@router.get("/sensor-datasets/stats")
async def get_sensor_dataset_stats():
    """Get statistics about the sensor datasets"""
    try:
        sensor_manager = get_sensor_manager()
        stats = sensor_manager.get_dataset_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting dataset stats: {str(e)}")

@router.post("/sensor-datasets/initialize")
async def initialize_sensor_datasets():
    """Initialize the sensor datasets (10k lines each)"""
    try:
        sensor_manager = get_sensor_manager()
        sensor_manager._initialize_datasets()
        return {"message": "Sensor datasets initialized successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing datasets: {str(e)}")

@router.post("/sensor-streaming/start")
async def start_sensor_streaming():
    """Start live sensor data streaming"""
    try:
        sensor_manager = get_sensor_manager()
        sensor_manager.start_live_streaming()
        return {"message": "Live sensor streaming started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting streaming: {str(e)}")

@router.post("/sensor-streaming/stop")
async def stop_sensor_streaming():
    """Stop live sensor data streaming"""
    try:
        sensor_manager = get_sensor_manager()
        sensor_manager.stop_live_streaming()
        return {"message": "Live sensor streaming stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping streaming: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "safety-monitoring"}
