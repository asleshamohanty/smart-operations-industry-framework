import random
import math
from datetime import datetime
from typing import List, Dict, Any

# Sensor definitions matching frontend
SENSOR_DEFINITIONS = [
    {
        "name": "Temperature_Probe_Sensor",
        "type": "Temperature",
        "unit": "°C",
        "normalRange": [15, 35],
        "location": "Weather Station"
    },
    {
        "name": "Rainfall_Gauge_Sensor",
        "type": "Rainfall",
        "unit": "mm",
        "normalRange": [0, 50],
        "location": "Weather Station"
    },
    {
        "name": "Wind_Speed_Anemometer_Sensor",
        "type": "Wind",
        "unit": "km/h",
        "normalRange": [0, 40],
        "location": "Weather Station"
    },
    {
        "name": "Weather_Impact_Analyzer_Sensor",
        "type": "Weather Impact",
        "unit": "score",
        "normalRange": [0, 5],
        "location": "Weather Station"
    },
    {
        "name": "Environmental_Impact_Sensor",
        "type": "Environmental Impact",
        "unit": "score",
        "normalRange": [60, 100],
        "location": "ESG Monitor"
    },
    {
        "name": "Social_Impact_Sensor",
        "type": "Social Impact",
        "unit": "score",
        "normalRange": [60, 100],
        "location": "ESG Monitor"
    },
    {
        "name": "Governance_Impact_Sensor",
        "type": "Governance Impact",
        "unit": "score",
        "normalRange": [60, 100],
        "location": "ESG Monitor"
    },
    {
        "name": "Carbon_Footprint_Tracker_Sensor",
        "type": "Carbon Footprint",
        "unit": "kg CO₂",
        "normalRange": [100, 500],
        "location": "Equipment Zone"
    },
    {
        "name": "Water_Consumption_Meter_Sensor",
        "type": "Water Usage",
        "unit": "m³",
        "normalRange": [10, 100],
        "location": "Water Treatment"
    },
    {
        "name": "Energy_Consumption_Meter_Sensor",
        "type": "Energy Usage",
        "unit": "kWh",
        "normalRange": [50, 300],
        "location": "Power Station"
    }
]

def get_3d_location(sensor_type: str) -> Dict[str, float]:
    """Get 3D coordinates for sensor based on type"""
    zones = {
        'Temperature': {'x': -8, 'y': 2, 'z': -8},
        'Rainfall': {'x': 8, 'y': 2, 'z': -8},
        'Wind': {'x': -8, 'y': 2, 'z': 8},
        'Weather Impact': {'x': 8, 'y': 2, 'z': 8},
        'Environmental Impact': {'x': -12, 'y': 1, 'z': 0},
        'Social Impact': {'x': 12, 'y': 1, 'z': 0},
        'Governance Impact': {'x': 0, 'y': 1, 'z': -12},
        'Carbon Footprint': {'x': -10, 'y': 3, 'z': -10},
        'Water Usage': {'x': 10, 'y': 3, 'z': -10},
        'Energy Usage': {'x': -10, 'y': 3, 'z': 10},
    }
    
    base = zones.get(sensor_type, {'x': 0, 'y': 0, 'z': 0})
    # Add small random variation
    return {
        'x': base['x'] + random.uniform(-0.5, 0.5),
        'y': base['y'] + random.uniform(-0.2, 0.2),
        'z': base['z'] + random.uniform(-0.5, 0.5)
    }

def generate_sensor_value(sensor_def: Dict, time_offset: float = 0) -> Dict:
    """Generate realistic sensor value with optional anomaly"""
    min_val, max_val = sensor_def['normalRange']
    mid = (min_val + max_val) / 2
    range_size = max_val - min_val
    
    # 15% chance of anomaly
    is_anomaly = random.random() < 0.15
    
    if is_anomaly:
        # Generate anomalous value (outside range)
        if random.random() < 0.5:
            value = min_val - random.uniform(0.2 * range_size, 0.8 * range_size)
        else:
            value = max_val + random.uniform(0.2 * range_size, 0.8 * range_size)
        
        # Determine severity based on deviation
        deviation_ratio = abs(value - mid) / range_size
        if deviation_ratio > 2:
            severity = 'critical'
        elif deviation_ratio > 1.5:
            severity = 'high'
        elif deviation_ratio > 1:
            severity = 'medium'
        else:
            severity = 'low'
    else:
        # Normal value with sinusoidal variation
        amplitude = range_size / 4
        value = mid + amplitude * math.sin(time_offset * 2 * math.pi * 1.5)
        value += random.uniform(-amplitude * 0.15, amplitude * 0.15)  # Add noise
        severity = None
    
    return {
        'id': f"{sensor_def['name']}_{int(time_offset * 1000)}",
        'name': sensor_def['name'],
        'type': sensor_def['type'],
        'unit': sensor_def['unit'],
        'value': round(value, 2),
        'normalRange': sensor_def['normalRange'],
        'location': get_3d_location(sensor_def['type']),
        'status': 'anomaly' if is_anomaly else 'normal',
        'severity': severity,
        'updatedAt': datetime.now().isoformat()
    }

def get_sensor_snapshot() -> Dict:
    """Get initial snapshot of all sensors"""
    sensors = []
    current_time = datetime.now().timestamp()
    
    for sensor_def in SENSOR_DEFINITIONS:
        sensor_data = generate_sensor_value(sensor_def, current_time)
        sensors.append(sensor_data)
    
    return {
        'type': 'snapshot',
        'sensors': sensors,
        'timestamp': datetime.now().isoformat()
    }

def get_sensor_updates() -> Dict:
    """Get updated sensor values (simulating real-time changes)"""
    sensors = []
    current_time = datetime.now().timestamp()
    
    # Only update a few sensors each time (simulate selective updates)
    num_updates = random.randint(2, min(5, len(SENSOR_DEFINITIONS)))
    selected_sensors = random.sample(SENSOR_DEFINITIONS, num_updates)
    
    for sensor_def in selected_sensors:
        sensor_data = generate_sensor_value(sensor_def, current_time)
        sensors.append(sensor_data)
    
    return {
        'type': 'update',
        'sensors': sensors,
        'timestamp': datetime.now().isoformat()
    }

