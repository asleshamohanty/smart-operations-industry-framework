"""
Live Sensor Data Management System for Safety Monitoring

This module provides:
1. Integration with Digital Twin Temperature Probe Sensor
2. Live SLM (Sound Level Meter) dataset generation and management
3. Live PM2.5 sensor dataset generation and management
4. Real-time data streaming for safety monitoring
"""

import pandas as pd
import numpy as np
import json
import os
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import random
import threading
import time
from pathlib import Path

class LiveSensorDataManager:
    """Manages live sensor data for safety monitoring"""
    
    def __init__(self, data_dir: str = "sensor_data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Dataset file paths
        self.slm_dataset_path = self.data_dir / "slm_dataset.csv"
        self.pm25_dataset_path = self.data_dir / "pm25_dataset.csv"
        self.temperature_dataset_path = self.data_dir / "temperature_dataset.csv"
        
        # Database for real-time data
        self.db_path = self.data_dir / "live_sensors.db"
        
        # Initialize datasets
        self._initialize_datasets()
        self._initialize_database()
        
        # Live data streaming
        self.is_streaming = False
        self.stream_thread = None
        
    def _initialize_datasets(self):
        """Initialize 10k line datasets for SLM and PM2.5"""
        
        # Initialize SLM Dataset (Sound Level Meter)
        if not self.slm_dataset_path.exists():
            print("Creating SLM dataset...")
            self._create_slm_dataset()
            
        # Initialize PM2.5 Dataset (Air Quality)
        if not self.pm25_dataset_path.exists():
            print("Creating PM2.5 dataset...")
            self._create_pm25_dataset()
            
        # Initialize Temperature Dataset (from Digital Twin)
        if not self.temperature_dataset_path.exists():
            print("Creating Temperature dataset...")
            self._create_temperature_dataset()
    
    def _create_slm_dataset(self):
        """Create 10k line SLM dataset with realistic noise level patterns"""
        print("Generating 10,000 SLM (Sound Level Meter) data points...")
        
        # Generate realistic noise patterns
        timestamps = []
        noise_levels = []
        locations = []
        project_ids = []
        sensor_ids = []
        
        # Base noise levels by project type and time
        project_noise_base = {
            "Highway": {"base": 75, "peak": 95, "night": 45},
            "Industrial": {"base": 80, "peak": 100, "night": 50},
            "Building": {"base": 65, "peak": 85, "night": 40},
            "Residential": {"base": 55, "peak": 75, "night": 35},
            "Commercial": {"base": 70, "peak": 90, "night": 45},
        }
        
        # Generate data for 30 days
        start_date = datetime.now() - timedelta(days=30)
        
        for i in range(10000):
            # Generate timestamp (every 4 minutes)
            timestamp = start_date + timedelta(minutes=i * 4)
            timestamps.append(timestamp)
            
            # Select random project type
            project_type = random.choice(list(project_noise_base.keys()))
            project_id = random.randint(1, 11)
            
            # Get base noise level
            base_config = project_noise_base[project_type]
            hour = timestamp.hour
            
            # Time-based noise variation
            if 8 <= hour <= 18:  # Work hours
                base_noise = base_config["base"]
            elif 19 <= hour <= 22:  # Evening
                base_noise = base_config["peak"]
            else:  # Night
                base_noise = base_config["night"]
            
            # Add realistic variations
            variation = random.gauss(0, 8)  # Gaussian noise
            noise_level = max(30, min(120, base_noise + variation))
            
            noise_levels.append(round(noise_level, 1))
            locations.append(f"Zone_{random.choice(['A', 'B', 'C'])}")
            project_ids.append(project_id)
            sensor_ids.append(f"SLM_{project_id:02d}_{random.randint(1, 5):02d}")
        
        # Create DataFrame
        slm_data = pd.DataFrame({
            'timestamp': timestamps,
            'noise_level_db': noise_levels,
            'location': locations,
            'project_id': project_ids,
            'sensor_id': sensor_ids,
            'sensor_type': 'SLM',
            'unit': 'dB',
            'status': 'active'
        })
        
        # Save to CSV
        slm_data.to_csv(self.slm_dataset_path, index=False)
        print(f"✓ SLM dataset created: {len(slm_data)} records")
    
    def _create_pm25_dataset(self):
        """Create 10k line PM2.5 dataset with realistic air quality patterns"""
        print("Generating 10,000 PM2.5 (Air Quality) data points...")
        
        timestamps = []
        pm25_values = []
        pm10_values = []
        aqi_values = []
        co2_values = []
        locations = []
        project_ids = []
        sensor_ids = []
        
        # Base air quality by project type
        project_air_base = {
            "Highway": {"pm25": 35, "pm10": 80, "co2": 450},
            "Industrial": {"pm25": 45, "pm10": 100, "co2": 500},
            "Building": {"pm25": 25, "pm10": 60, "co2": 400},
            "Residential": {"pm25": 20, "pm10": 50, "co2": 380},
            "Commercial": {"pm25": 30, "pm10": 70, "co2": 420},
        }
        
        # Generate data for 30 days
        start_date = datetime.now() - timedelta(days=30)
        
        for i in range(10000):
            # Generate timestamp (every 4 minutes)
            timestamp = start_date + timedelta(minutes=i * 4)
            timestamps.append(timestamp)
            
            # Select random project type
            project_type = random.choice(list(project_air_base.keys()))
            project_id = random.randint(1, 11)
            
            # Get base air quality
            base_config = project_air_base[project_type]
            
            # Time-based air quality variation (worse during peak hours)
            hour = timestamp.hour
            if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
                multiplier = 1.3
            elif 10 <= hour <= 16:  # Work hours
                multiplier = 1.1
            else:  # Night/early morning
                multiplier = 0.8
            
            # Add realistic variations
            pm25_base = base_config["pm25"] * multiplier
            pm10_base = base_config["pm10"] * multiplier
            co2_base = base_config["co2"] * multiplier
            
            pm25 = max(5, min(150, pm25_base + random.gauss(0, 8)))
            pm10 = max(10, min(300, pm10_base + random.gauss(0, 15)))
            co2 = max(300, min(2000, co2_base + random.gauss(0, 50)))
            
            # Calculate AQI from PM2.5
            if pm25 <= 12:
                aqi = (pm25 / 12) * 50
            elif pm25 <= 35:
                aqi = 50 + ((pm25 - 12) / 23) * 50
            elif pm25 <= 55:
                aqi = 100 + ((pm25 - 35) / 20) * 50
            else:
                aqi = min(300, 150 + ((pm25 - 55) / 95) * 150)
            
            pm25_values.append(round(pm25, 1))
            pm10_values.append(round(pm10, 1))
            aqi_values.append(round(aqi, 0))
            co2_values.append(round(co2, 0))
            locations.append(f"Zone_{random.choice(['A', 'B', 'C'])}")
            project_ids.append(project_id)
            sensor_ids.append(f"PM25_{project_id:02d}_{random.randint(1, 3):02d}")
        
        # Create DataFrame
        pm25_data = pd.DataFrame({
            'timestamp': timestamps,
            'pm25_ug_m3': pm25_values,
            'pm10_ug_m3': pm10_values,
            'aqi': aqi_values,
            'co2_ppm': co2_values,
            'location': locations,
            'project_id': project_ids,
            'sensor_id': sensor_ids,
            'sensor_type': 'PM2.5',
            'unit': 'μg/m³',
            'status': 'active'
        })
        
        # Save to CSV
        pm25_data.to_csv(self.pm25_dataset_path, index=False)
        print(f"✓ PM2.5 dataset created: {len(pm25_data)} records")
    
    def _create_temperature_dataset(self):
        """Create temperature dataset from Digital Twin anomaly detection"""
        print("Creating Temperature dataset from Digital Twin...")
        
        # Try to load existing anomaly detection data
        try:
            if os.path.exists("anomaly_output.csv"):
                anomaly_data = pd.read_csv("anomaly_output.csv")
                if 'temperature_c' in anomaly_data.columns:
                    temp_data = anomaly_data[['temperature_c']].copy()
                    temp_data['timestamp'] = pd.date_range(
                        start=datetime.now() - timedelta(days=30),
                        periods=len(temp_data),
                        freq='4min'
                    )
                    temp_data['project_id'] = random.choices(range(1, 12), k=len(temp_data))
                    temp_data['sensor_id'] = [f"TEMP_PROBE_{i:04d}" for i in range(len(temp_data))]
                    temp_data['location'] = [f"Zone_{random.choice(['A', 'B', 'C'])}" for _ in range(len(temp_data))]
                    temp_data['sensor_type'] = 'Temperature_Probe_Sensor'
                    temp_data['unit'] = '°C'
                    temp_data['status'] = 'active'
                    
                    temp_data.to_csv(self.temperature_dataset_path, index=False)
                    print(f"✓ Temperature dataset created from Digital Twin: {len(temp_data)} records")
                    return
        except Exception as e:
            print(f"Could not load anomaly data: {e}")
        
        # Fallback: Generate synthetic temperature data
        print("Generating synthetic temperature data...")
        timestamps = []
        temperatures = []
        project_ids = []
        sensor_ids = []
        locations = []
        
        start_date = datetime.now() - timedelta(days=30)
        
        for i in range(10000):
            timestamp = start_date + timedelta(minutes=i * 4)
            timestamps.append(timestamp)
            
            # Generate realistic temperature patterns
            hour = timestamp.hour
            day_of_year = timestamp.timetuple().tm_yday
            
            # Base temperature with seasonal variation
            seasonal_temp = 25 + 10 * np.sin(2 * np.pi * day_of_year / 365)
            
            # Daily temperature variation
            daily_temp = 5 * np.sin(2 * np.pi * hour / 24)
            
            # Add random variation
            temp = seasonal_temp + daily_temp + random.gauss(0, 3)
            temp = max(10, min(45, temp))  # Realistic range
            
            temperatures.append(round(temp, 1))
            project_ids.append(random.randint(1, 11))
            sensor_ids.append(f"TEMP_PROBE_{i:04d}")
            locations.append(f"Zone_{random.choice(['A', 'B', 'C'])}")
        
        temp_data = pd.DataFrame({
            'timestamp': timestamps,
            'temperature_c': temperatures,
            'project_id': project_ids,
            'sensor_id': sensor_ids,
            'location': locations,
            'sensor_type': 'Temperature_Probe_Sensor',
            'unit': '°C',
            'status': 'active'
        })
        
        temp_data.to_csv(self.temperature_dataset_path, index=False)
        print(f"✓ Temperature dataset created: {len(temp_data)} records")
    
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
        print("✓ Live sensor database initialized")
    
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
                
                # Generate SLM data
                self._add_live_slm_data(current_time)
                
                # Generate PM2.5 data
                self._add_live_pm25_data(current_time)
                
                # Generate Temperature data
                self._add_live_temperature_data(current_time)
                
                # Wait 4 minutes before next update
                time.sleep(240)  # 4 minutes
                
            except Exception as e:
                print(f"Error in live streaming: {e}")
                time.sleep(60)  # Wait 1 minute before retry
    
    def _add_live_slm_data(self, timestamp: datetime):
        """Add live SLM data to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Generate realistic noise levels for each project
        for project_id in range(1, 12):
            # Get project type (simplified)
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
                noise_level = base_noise + random.gauss(0, 8)
            elif 19 <= hour <= 22:
                noise_level = base_noise + 10 + random.gauss(0, 8)
            else:
                noise_level = base_noise - 20 + random.gauss(0, 8)
            
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
    
    def _add_live_pm25_data(self, timestamp: datetime):
        """Add live PM2.5 data to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for project_id in range(1, 12):
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
                pm25 = base_pm25 * 1.3 + random.gauss(0, 8)
            elif 10 <= hour <= 16:
                pm25 = base_pm25 * 1.1 + random.gauss(0, 8)
            else:
                pm25 = base_pm25 * 0.8 + random.gauss(0, 8)
            
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
    
    def _add_live_temperature_data(self, timestamp: datetime):
        """Add live temperature data to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for project_id in range(1, 12):
            # Generate realistic temperature
            hour = timestamp.hour
            day_of_year = timestamp.timetuple().tm_yday
            
            # Seasonal variation
            seasonal_temp = 25 + 10 * np.sin(2 * np.pi * day_of_year / 365)
            
            # Daily variation
            daily_temp = 5 * np.sin(2 * np.pi * hour / 24)
            
            # Add random variation
            temp = seasonal_temp + daily_temp + random.gauss(0, 3)
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
        stats = {}
        
        # SLM Dataset stats
        if self.slm_dataset_path.exists():
            slm_df = pd.read_csv(self.slm_dataset_path)
            stats['slm'] = {
                'total_records': len(slm_df),
                'date_range': f"{slm_df['timestamp'].min()} to {slm_df['timestamp'].max()}",
                'avg_noise_level': round(slm_df['noise_level_db'].mean(), 1),
                'max_noise_level': round(slm_df['noise_level_db'].max(), 1),
                'min_noise_level': round(slm_df['noise_level_db'].min(), 1)
            }
        
        # PM2.5 Dataset stats
        if self.pm25_dataset_path.exists():
            pm25_df = pd.read_csv(self.pm25_dataset_path)
            stats['pm25'] = {
                'total_records': len(pm25_df),
                'date_range': f"{pm25_df['timestamp'].min()} to {pm25_df['timestamp'].max()}",
                'avg_pm25': round(pm25_df['pm25_ug_m3'].mean(), 1),
                'avg_aqi': round(pm25_df['aqi'].mean(), 0),
                'max_aqi': round(pm25_df['aqi'].max(), 0)
            }
        
        # Temperature Dataset stats
        if self.temperature_dataset_path.exists():
            temp_df = pd.read_csv(self.temperature_dataset_path)
            stats['temperature'] = {
                'total_records': len(temp_df),
                'date_range': f"{temp_df['timestamp'].min()} to {temp_df['timestamp'].max()}",
                'avg_temperature': round(temp_df['temperature_c'].mean(), 1),
                'max_temperature': round(temp_df['temperature_c'].max(), 1),
                'min_temperature': round(temp_df['temperature_c'].min(), 1)
            }
        
        # Live database stats
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM live_sensor_data')
        live_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(DISTINCT sensor_type) FROM live_sensor_data')
        sensor_types = cursor.fetchone()[0]
        
        conn.close()
        
        stats['live_database'] = {
            'total_records': live_count,
            'sensor_types': sensor_types,
            'is_streaming': self.is_streaming
        }
        
        return stats

# Global instance
sensor_manager = LiveSensorDataManager()

def get_sensor_manager() -> LiveSensorDataManager:
    """Get the global sensor manager instance"""
    return sensor_manager
