"""
Simplified Live Sensor Data Manager for Safety Monitoring

This module provides basic sensor data management without heavy dependencies
"""

import json
import os
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import random
import threading
import time
from pathlib import Path

class SimpleLiveSensorDataManager:
    """Simplified sensor data manager"""
    
    def __init__(self, data_dir: str = "sensor_data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Database for real-time data
        self.db_path = self.data_dir / "live_sensors.db"
        
        # Initialize database
        self._initialize_database()
        
        # Live data streaming
        self.is_streaming = False
        self.stream_thread = None
        
    def _initialize_database(self):
        """Initialize SQLite database for real-time data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create live sensor data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS live_sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                sensor_type TEXT,
                sensor_id TEXT,
                project_id INTEGER,
                location TEXT,
                value REAL,
                unit TEXT,
                status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON live_sensor_data(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sensor_type ON live_sensor_data(sensor_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_project_id ON live_sensor_data(project_id)')
        
        conn.commit()
        conn.close()
        print("[OK] Live sensor database initialized")
    
    def start_live_streaming(self):
        """Start live data streaming"""
        if self.is_streaming:
            return
        
        self.is_streaming = True
        self.stream_thread = threading.Thread(target=self._stream_data)
        self.stream_thread.daemon = True
        self.stream_thread.start()
        print("✓ Live sensor data streaming started")
    
    def stop_live_streaming(self):
        """Stop live data streaming"""
        self.is_streaming = False
        if self.stream_thread:
            self.stream_thread.join()
        print("✓ Live sensor data streaming stopped")
    
    def _stream_data(self):
        """Stream live data to database"""
        while self.is_streaming:
            try:
                # Generate new data points
                current_time = datetime.now()
                
                # Generate data for all projects
                for project_id in range(1, 12):
                    self._add_live_temperature_data(project_id, current_time)
                    self._add_live_slm_data(project_id, current_time)
                    self._add_live_pm25_data(project_id, current_time)
                
                # Wait 2 minutes before next update (better for safety monitoring)
                time.sleep(120)  # 2 minutes
                
            except Exception as e:
                print(f"Error in live streaming: {e}")
                time.sleep(60)  # Wait 1 minute before retry
    
    def _add_live_temperature_data(self, project_id: int, timestamp: datetime):
        """Add live temperature data to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Generate realistic temperature
        hour = timestamp.hour
        day_of_year = timestamp.timetuple().tm_yday
        
        # Seasonal variation (simplified)
        seasonal_temp = 25 + 10 * (1 if day_of_year < 180 else -1)  # Summer/winter
        
        # Daily variation
        daily_temp = 5 * (1 if 6 <= hour <= 18 else -1)  # Day/night
        
        # Add random variation
        temp = seasonal_temp + daily_temp + random.uniform(-3, 3)
        temp = max(10, min(45, temp))
        
        cursor.execute('''
            INSERT INTO live_sensor_data 
            (timestamp, sensor_type, sensor_id, project_id, location, value, unit, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            timestamp, 'Temperature_Probe_Sensor', f'TEMP_PROBE_{project_id:02d}_LIVE',
            project_id, f'Zone_{random.choice(["A", "B", "C"])}',
            round(temp, 1), '°C', 'active'
        ))
        
        conn.commit()
        conn.close()
    
    def _add_live_slm_data(self, project_id: int, timestamp: datetime):
        """Add live SLM data to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Project types for noise variation
        project_types = ["Highway", "Industrial", "Building", "Residential", "Commercial"]
        project_type = project_types[project_id % len(project_types)]
        
        # Base noise levels
        base_noise = {
            "Highway": 75, "Industrial": 80, "Building": 65,
            "Residential": 55, "Commercial": 70
        }[project_type]
        
        # Time-based variation
        hour = timestamp.hour
        if 8 <= hour <= 18:
            noise_level = base_noise + random.uniform(-5, 15)
        elif 19 <= hour <= 22:
            noise_level = base_noise + 10 + random.uniform(-5, 10)
        else:
            noise_level = base_noise - 20 + random.uniform(-5, 10)
        
        noise_level = max(30, min(120, noise_level))
        
        cursor.execute('''
            INSERT INTO live_sensor_data 
            (timestamp, sensor_type, sensor_id, project_id, location, value, unit, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            timestamp, 'SLM', f'SLM_{project_id:02d}_LIVE',
            project_id, f'Zone_{random.choice(["A", "B", "C"])}',
            round(noise_level, 1), 'dB', 'active'
        ))
        
        conn.commit()
        conn.close()
    
    def _add_live_pm25_data(self, project_id: int, timestamp: datetime):
        """Add live PM2.5 data to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        project_types = ["Highway", "Industrial", "Building", "Residential", "Commercial"]
        project_type = project_types[project_id % len(project_types)]
        
        # Base air quality
        base_pm25 = {
            "Highway": 35, "Industrial": 45, "Building": 25,
            "Residential": 20, "Commercial": 30
        }[project_type]
        
        # Time-based variation
        hour = timestamp.hour
        if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
            pm25 = base_pm25 * 1.3 + random.uniform(-8, 8)
        elif 10 <= hour <= 16:
            pm25 = base_pm25 * 1.1 + random.uniform(-8, 8)
        else:
            pm25 = base_pm25 * 0.8 + random.uniform(-8, 8)
        
        pm25 = max(5, min(150, pm25))
        
        # Calculate AQI
        if pm25 <= 12:
            aqi = (pm25 / 12) * 50
        elif pm25 <= 35:
            aqi = 50 + ((pm25 - 12) / 23) * 50
        else:
            aqi = 100 + ((pm25 - 35) / 20) * 50
        
        cursor.execute('''
            INSERT INTO live_sensor_data 
            (timestamp, sensor_type, sensor_id, project_id, location, value, unit, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            timestamp, 'PM2.5', f'PM25_{project_id:02d}_LIVE',
            project_id, f'Zone_{random.choice(["A", "B", "C"])}',
            round(pm25, 1), 'μg/m³', 'active'
        ))
        
        cursor.execute('''
            INSERT INTO live_sensor_data 
            (timestamp, sensor_type, sensor_id, project_id, location, value, unit, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            timestamp, 'AQI', f'AQI_{project_id:02d}_LIVE',
            project_id, f'Zone_{random.choice(["A", "B", "C"])}',
            round(aqi, 0), 'AQI', 'active'
        ))
        
        conn.commit()
        conn.close()
    
    def get_latest_sensor_data(self, project_id: int, sensor_type: str) -> Optional[Dict]:
        """Get latest sensor data for a specific project and sensor type"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM live_sensor_data 
            WHERE project_id = ? AND sensor_type = ?
            ORDER BY timestamp DESC 
            LIMIT 1
        ''', (project_id, sensor_type))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'id': result[0],
                'timestamp': result[1],
                'sensor_type': result[2],
                'sensor_id': result[3],
                'project_id': result[4],
                'location': result[5],
                'value': result[6],
                'unit': result[7],
                'status': result[8],
                'created_at': result[9]
            }
        return None
    
    def get_sensor_history(self, project_id: int, sensor_type: str, hours: int = 24) -> List[Dict]:
        """Get sensor history for the last N hours"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        cursor.execute('''
            SELECT * FROM live_sensor_data 
            WHERE project_id = ? AND sensor_type = ? AND timestamp >= ?
            ORDER BY timestamp DESC
        ''', (project_id, sensor_type, cutoff_time))
        
        results = cursor.fetchall()
        conn.close()
        
        return [{
            'id': r[0], 'timestamp': r[1], 'sensor_type': r[2],
            'sensor_id': r[3], 'project_id': r[4], 'location': r[5],
            'value': r[6], 'unit': r[7], 'status': r[8], 'created_at': r[9]
        } for r in results]
    
    def get_dataset_stats(self) -> Dict:
        """Get statistics about the datasets"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get total records
        cursor.execute('SELECT COUNT(*) FROM live_sensor_data')
        total_records = cursor.fetchone()[0]
        
        # Get sensor type counts
        cursor.execute('SELECT sensor_type, COUNT(*) FROM live_sensor_data GROUP BY sensor_type')
        sensor_counts = dict(cursor.fetchall())
        
        # Get latest data timestamp
        cursor.execute('SELECT MAX(timestamp) FROM live_sensor_data')
        latest_timestamp = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'live_database': {
                'total_records': total_records,
                'sensor_types': len(sensor_counts),
                'sensor_counts': sensor_counts,
                'latest_timestamp': latest_timestamp,
                'is_streaming': self.is_streaming
            }
        }

# Global instance
sensor_manager = SimpleLiveSensorDataManager()

def get_sensor_manager() -> SimpleLiveSensorDataManager:
    """Get the global sensor manager instance"""
    return sensor_manager
