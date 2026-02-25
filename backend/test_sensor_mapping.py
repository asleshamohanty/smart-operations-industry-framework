"""
Test script for sensor mapping in anomaly detection system
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

class SensorAnomalyDetectionSystem:
    """Simplified Anomaly Detection System with Sensor Mapping"""
    
    def __init__(self, dataset_path='dataset.csv'):
        self.dataset_path = dataset_path
        self.scaler = StandardScaler()
        self.isolation_forest = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.feature_columns = None
        self.sensor_mapping = None
        
        # Define sensor mapping for meaningful names
        self.sensor_mapping = {
            'project_budget': 'Project_Budget_Sensor',
            'duration_days': 'Duration_Tracker_Sensor',
            'labor_count': 'Workforce_Counter_Sensor',
            'labor_cost_per_day': 'Labor_Cost_Monitor_Sensor',
            'equipment_cost_per_day': 'Equipment_Cost_Tracker_Sensor',
            'material_quantity': 'Material_Quantity_Sensor',
            'material_unit_cost': 'Material_Cost_Monitor_Sensor',
            'planned_task_cost': 'Task_Cost_Predictor_Sensor',
            'rain_mm': 'Rainfall_Gauge_Sensor',
            'temperature_c': 'Temperature_Probe_Sensor',
            'wind_speed_kmh': 'Wind_Speed_Anemometer_Sensor',
            'weather_disruption_score': 'Weather_Impact_Analyzer_Sensor',
            'E_score': 'Environmental_Impact_Sensor',
            'S_score': 'Social_Impact_Sensor',
            'G_score': 'Governance_Impact_Sensor',
            'carbon_footprint_kg': 'Carbon_Footprint_Tracker_Sensor',
            'water_usage_m3': 'Water_Consumption_Meter_Sensor',
            'energy_usage_kwh': 'Energy_Consumption_Meter_Sensor',
            'SDG_alignment_score': 'SDG_Compliance_Monitor_Sensor',
            'predicted_delay_days': 'Schedule_Delay_Predictor_Sensor',
            'predicted_task_cost': 'Cost_Overrun_Predictor_Sensor',
            'predicted_ESG_score': 'ESG_Performance_Monitor_Sensor',
            'profit_impact': 'Profitability_Impact_Analyzer_Sensor'
        }
        
    def load_and_clean_data(self):
        """Load and clean the dataset"""
        print("=" * 80)
        print("STEP 1: Loading and Cleaning Data")
        print("=" * 80)
        
        # Load dataset
        print(f"Loading dataset from {self.dataset_path}...")
        df = pd.read_csv(self.dataset_path)
        print(f"[OK] Loaded {len(df):,} rows and {len(df.columns)} columns")
        
        # Display initial info
        print(f"\nDataset shape: {df.shape}")
        print(f"Missing values: {df.isnull().sum().sum()} total missing values")
        
        # Select numeric columns for anomaly detection
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Exclude ID columns and target columns we'll use for validation
        exclude_cols = ['project_id', 'task_id']
        self.feature_columns = [col for col in numeric_cols if col not in exclude_cols]
        
        # Map feature columns to sensor names
        self.sensor_columns = [self.sensor_mapping.get(col, col) for col in self.feature_columns]
        
        print(f"\n[OK] Selected {len(self.feature_columns)} numeric features for anomaly detection")
        print(f"[OK] Mapped to {len(self.sensor_columns)} sensor names")
        print(f"Sensors: {', '.join(self.sensor_columns[:10])}..." if len(self.sensor_columns) > 10 else f"Sensors: {', '.join(self.sensor_columns)}")
        
        # Handle missing values
        df_clean = df[self.feature_columns].copy()
        
        # Impute missing values with median
        missing_before = df_clean.isnull().sum().sum()
        if missing_before > 0:
            print(f"\n⚠ Imputing {missing_before} missing values with median...")
            df_clean = df_clean.fillna(df_clean.median())
            print("[OK] Missing values handled")
        
        # Remove infinite values
        df_clean = df_clean.replace([np.inf, -np.inf], np.nan)
        df_clean = df_clean.fillna(df_clean.median())
        
        print(f"[OK] Clean dataset shape: {df_clean.shape}")
        
        return df_clean, df
    
    def add_sensor_values(self, df):
        """Add realistic sensor values to the dataset"""
        print("\n" + "=" * 80)
        print("STEP 1.5: Adding Realistic Sensor Values")
        print("=" * 80)
        
        # Create a copy of the dataframe
        df_with_sensors = df.copy()
        
        # Add sensor-specific realistic values based on the data
        sensor_values = {}
        
        for i, col in enumerate(self.feature_columns):
            sensor_name = self.sensor_columns[i]
            
            if 'Budget' in sensor_name or 'Cost' in sensor_name:
                # Financial sensors - add currency and precision
                sensor_values[sensor_name] = df[col].round(2)
            elif 'Temperature' in sensor_name:
                # Temperature sensor - add precision and unit
                sensor_values[sensor_name] = df[col].round(1)
            elif 'Rainfall' in sensor_name:
                # Rainfall sensor - add precision
                sensor_values[sensor_name] = df[col].round(2)
            elif 'Wind' in sensor_name:
                # Wind speed sensor - add precision
                sensor_values[sensor_name] = df[col].round(1)
            elif 'Carbon' in sensor_name:
                # Carbon footprint sensor - add precision
                sensor_values[sensor_name] = df[col].round(2)
            elif 'Water' in sensor_name:
                # Water usage sensor - add precision
                sensor_values[sensor_name] = df[col].round(3)
            elif 'Energy' in sensor_name:
                # Energy sensor - add precision
                sensor_values[sensor_name] = df[col].round(2)
            elif 'Count' in sensor_name or 'Duration' in sensor_name:
                # Count/duration sensors - round to integers
                sensor_values[sensor_name] = df[col].round(0).astype(int)
            elif 'Score' in sensor_name:
                # Score sensors - add precision
                sensor_values[sensor_name] = df[col].round(4)
            else:
                # Default precision
                sensor_values[sensor_name] = df[col].round(3)
        
        # Add sensor values as new columns
        for sensor_name, values in sensor_values.items():
            df_with_sensors[sensor_name] = values
        
        print(f"[OK] Added {len(sensor_values)} sensor value columns")
        print(f"[OK] Sensor values include appropriate precision and formatting")
        
        return df_with_sensors
    
    def introduce_synthetic_anomalies(self, df, contamination_rate=0.07):
        """Introduce synthetic anomalies for validation"""
        print("\n" + "=" * 80)
        print("STEP 2: Introducing Synthetic Anomalies")
        print("=" * 80)
        
        n_samples = len(df)
        n_anomalies = int(n_samples * contamination_rate)
        
        print(f"Contamination rate: {contamination_rate * 100}%")
        print(f"Introducing {n_anomalies:,} synthetic anomalies...")
        
        # Create labels (0 = normal, 1 = anomaly)
        labels = np.zeros(n_samples)
        
        # Randomly select indices for anomalies
        anomaly_indices = np.random.choice(n_samples, n_anomalies, replace=False)
        labels[anomaly_indices] = 1
        
        # Create a copy of the dataframe
        df_with_anomalies = df.copy()
        
        # Use only the original feature columns for anomaly injection (not sensor columns)
        feature_cols_for_anomaly = [col for col in df.columns if col in self.feature_columns]
        
        # Introduce anomalies by adding noise to random features
        print("")
        for idx in anomaly_indices:
            # Select 3-5 random features to perturb
            n_features_to_perturb = np.random.randint(3, 6)
            features_to_perturb = np.random.choice(feature_cols_for_anomaly, n_features_to_perturb, replace=False)
            
            for feature in features_to_perturb:
                # Add significant noise (3-5 standard deviations)
                std = df[feature].std()
                mean = df[feature].mean()
                noise_factor = np.random.uniform(3, 5) * std
                
                # Convert to float to avoid dtype warnings
                current_value = float(df_with_anomalies.loc[idx, feature])
                
                # Randomly add or subtract
                if np.random.random() > 0.5:
                    df_with_anomalies.loc[idx, feature] = current_value + noise_factor
                else:
                    df_with_anomalies.loc[idx, feature] = current_value - noise_factor
        
        print(f"\n[OK] Introduced {n_anomalies:,} synthetic anomalies")
        print(f"[OK] Normal samples: {(labels == 0).sum():,}")
        print(f"[OK] Anomalous samples: {(labels == 1).sum():,}")
        
        return df_with_anomalies, labels
    
    def prepare_data(self, df, labels):
        """Normalize and split data"""
        print("\n" + "=" * 80)
        print("STEP 3: Data Normalization and Splitting")
        print("=" * 80)
        
        # Use only feature columns for training (not sensor columns)
        df_features = df[self.feature_columns].copy()
        
        # Normalize data
        print("Normalizing features using StandardScaler...")
        X_scaled = self.scaler.fit_transform(df_features)
        print(f"[OK] Data normalized to mean=0, std=1")
        
        # Split into train/test (80/20)
        print("\nSplitting data (80% train, 20% test)...")
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X_scaled, labels, test_size=0.2, random_state=42, stratify=labels
        )
        
        print(f"[OK] Training set: {len(self.X_train):,} samples")
        print(f"  - Normal: {(self.y_train == 0).sum():,}")
        print(f"  - Anomalous: {(self.y_train == 1).sum():,}")
        print(f"[OK] Test set: {len(self.X_test):,} samples")
        print(f"  - Normal: {(self.y_test == 0).sum():,}")
        print(f"  - Anomalous: {(self.y_test == 1).sum():,}")
    
    def train_isolation_forest(self, contamination=0.07):
        """Train Isolation Forest"""
        print("\n" + "=" * 80)
        print("STEP 4: Training Isolation Forest")
        print("=" * 80)
        
        print(f"Contamination rate: {contamination}")
        print(f"Training on {len(self.X_train):,} samples...")
        print("⏳ Training 100 trees...")
        
        self.isolation_forest = IsolationForest(
            contamination=contamination,
            n_estimators=100,
            max_samples='auto',
            random_state=42,
            n_jobs=-1
        )
        
        self.isolation_forest.fit(self.X_train)
        
        print("\n[OK] Isolation Forest trained successfully!")
    
    def detect_anomalies_isolation_forest(self):
        """Detect anomalies using Isolation Forest"""
        print("\n" + "=" * 80)
        print("STEP 5: Detecting Anomalies with Isolation Forest")
        print("=" * 80)
        
        # Predict (-1 for anomalies, 1 for normal)
        if_predictions_raw = self.isolation_forest.predict(self.X_test)
        
        # Convert to 0/1 (0 = normal, 1 = anomaly)
        if_predictions = (if_predictions_raw == -1).astype(int)
        
        # Get anomaly scores
        if_scores = self.isolation_forest.decision_function(self.X_test)
        
        print(f"[OK] Isolation Forest Predictions:")
        print(f"  Normal: {(if_predictions == 0).sum():,}")
        print(f"  Anomalies: {(if_predictions == 1).sum():,}")
        
        return if_predictions, if_scores
    
    def save_results(self, if_preds, original_df):
        """Save results with sensor names"""
        print("\n" + "=" * 80)
        print("STEP 6: Saving Results")
        print("=" * 80)
        
        # Create output CSV with test data using sensor names
        output_df = pd.DataFrame(self.X_test, columns=self.sensor_columns)
        output_df['isolationforest_anomaly'] = if_preds
        output_df['true_label'] = self.y_test
        
        output_df.to_csv('sensor_anomaly_output.csv', index=False)
        print(f"[OK] Saved: sensor_anomaly_output.csv ({len(output_df):,} rows)")
        
        # Save sensor mapping report
        with open('sensor_mapping_report.txt', 'w') as f:
            f.write("=" * 80 + "\n")
            f.write("SENSOR MAPPING REPORT\n")
            f.write("=" * 80 + "\n\n")
            
            f.write("FEATURE TO SENSOR MAPPING:\n")
            f.write("-" * 40 + "\n")
            for i, feature in enumerate(self.feature_columns):
                sensor_name = self.sensor_columns[i]
                f.write(f"{feature} -> {sensor_name}\n")
            f.write(f"\nTotal Sensors: {len(self.sensor_columns)}\n\n")
            
            f.write("SENSOR DESCRIPTIONS:\n")
            f.write("-" * 40 + "\n")
            for sensor_name in self.sensor_columns:
                if 'Budget' in sensor_name or 'Cost' in sensor_name:
                    f.write(f"{sensor_name}: Financial monitoring sensor\n")
                elif 'Temperature' in sensor_name:
                    f.write(f"{sensor_name}: Environmental temperature monitoring\n")
                elif 'Rainfall' in sensor_name:
                    f.write(f"{sensor_name}: Precipitation measurement sensor\n")
                elif 'Wind' in sensor_name:
                    f.write(f"{sensor_name}: Wind speed measurement sensor\n")
                elif 'Carbon' in sensor_name:
                    f.write(f"{sensor_name}: Carbon footprint tracking sensor\n")
                elif 'Water' in sensor_name:
                    f.write(f"{sensor_name}: Water consumption monitoring\n")
                elif 'Energy' in sensor_name:
                    f.write(f"{sensor_name}: Energy usage tracking sensor\n")
                elif 'Count' in sensor_name or 'Duration' in sensor_name:
                    f.write(f"{sensor_name}: Counting/timing sensor\n")
                elif 'Score' in sensor_name:
                    f.write(f"{sensor_name}: Performance scoring sensor\n")
                else:
                    f.write(f"{sensor_name}: General monitoring sensor\n")
            
            f.write("=" * 80 + "\n")
        
        print("[OK] Saved: sensor_mapping_report.txt")
        
        print("\n" + "=" * 80)
        print("SENSOR ANOMALY DETECTION SYSTEM COMPLETED SUCCESSFULLY!")
        print("=" * 80)


def main():
    """Main execution function"""
    print("\n")
    print("=" * 80)
    print("SENSOR ANOMALY DETECTION SYSTEM")
    print("Testing Sensor Mapping")
    print("=" * 80)
    print("\n")
    
    # Initialize system
    system = SensorAnomalyDetectionSystem(dataset_path='dataset.csv')
    
    # Step 1: Load and clean data
    df_clean, df_original = system.load_and_clean_data()
    
    # Step 1.5: Add sensor values
    df_with_sensors = system.add_sensor_values(df_clean)
    
    # Step 2: Introduce synthetic anomalies
    df_with_anomalies, labels = system.introduce_synthetic_anomalies(df_with_sensors, contamination_rate=0.07)
    
    # Step 3: Prepare data
    system.prepare_data(df_with_anomalies, labels)
    
    # Step 4-5: Train and detect with Isolation Forest
    system.train_isolation_forest(contamination=0.07)
    if_preds, if_scores = system.detect_anomalies_isolation_forest()
    
    # Step 6: Save results
    system.save_results(if_preds, df_original)
    
    print("\n📁 OUTPUT FILES:")
    print("  - sensor_anomaly_output.csv (Test data with sensor names)")
    print("  - sensor_mapping_report.txt (Sensor mapping documentation)")
    print("\n")


if __name__ == "__main__":
    main()
