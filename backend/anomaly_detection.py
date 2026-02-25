"""
Anomaly Detection System for Digital Twin Simulation
Comparing Autoencoder vs Isolation Forest for circular manufacturing supply chain
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import joblib
import os
import warnings
from datetime import datetime
from tqdm import tqdm

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow warnings

# Set random seeds for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

class AnomalyDetectionSystem:
    """Complete Anomaly Detection System with Autoencoder and Isolation Forest"""
    
    def __init__(self, dataset_path='dataset.csv'):
        self.dataset_path = dataset_path
        self.scaler = StandardScaler()
        self.autoencoder = None
        self.isolation_forest = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.feature_columns = None
        self.sensor_mapping = None
        self.results = {}
        
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
        print(f"✓ Loaded {len(df):,} rows and {len(df.columns)} columns")
        
        # Display initial info
        print(f"\nDataset shape: {df.shape}")
        print(f"Missing values:\n{df.isnull().sum().sum()} total missing values")
        
        # Select numeric columns for anomaly detection
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Exclude ID columns and target columns we'll use for validation
        exclude_cols = ['project_id', 'task_id']
        self.feature_columns = [col for col in numeric_cols if col not in exclude_cols]
        
        # Map feature columns to sensor names
        self.sensor_columns = [self.sensor_mapping.get(col, col) for col in self.feature_columns]
        
        print(f"\n✓ Selected {len(self.feature_columns)} numeric features for anomaly detection")
        print(f"✓ Mapped to {len(self.sensor_columns)} sensor names")
        print(f"Sensors: {', '.join(self.sensor_columns[:10])}..." if len(self.sensor_columns) > 10 else f"Sensors: {', '.join(self.sensor_columns)}")
        
        # Handle missing values
        df_clean = df[self.feature_columns].copy()
        
        # Impute missing values with median
        missing_before = df_clean.isnull().sum().sum()
        if missing_before > 0:
            print(f"\n⚠ Imputing {missing_before} missing values with median...")
            df_clean = df_clean.fillna(df_clean.median())
            print("✓ Missing values handled")
        
        # Remove infinite values
        df_clean = df_clean.replace([np.inf, -np.inf], np.nan)
        df_clean = df_clean.fillna(df_clean.median())
        
        print(f"✓ Clean dataset shape: {df_clean.shape}")
        
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
        
        print(f"✓ Added {len(sensor_values)} sensor value columns")
        print(f"✓ Sensor values include appropriate precision and formatting")
        
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
        for idx in tqdm(anomaly_indices, desc="Injecting anomalies", unit="sample", ncols=100):
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
        print(f"\n✓ Introduced {n_anomalies:,} synthetic anomalies")
        print(f"✓ Normal samples: {(labels == 0).sum():,}")
        print(f"✓ Anomalous samples: {(labels == 1).sum():,}")
        
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
        print(f"✓ Data normalized to mean=0, std=1")
        
        # Split into train/test (80/20)
        print("\nSplitting data (80% train, 20% test)...")
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X_scaled, labels, test_size=0.2, random_state=42, stratify=labels
        )
        
        print(f"✓ Training set: {len(self.X_train):,} samples")
        print(f"  - Normal: {(self.y_train == 0).sum():,}")
        print(f"  - Anomalous: {(self.y_train == 1).sum():,}")
        print(f"✓ Test set: {len(self.X_test):,} samples")
        print(f"  - Normal: {(self.y_test == 0).sum():,}")
        print(f"  - Anomalous: {(self.y_test == 1).sum():,}")
        
    def build_autoencoder(self, input_dim):
        """Build Autoencoder model"""
        print("\n" + "=" * 80)
        print("STEP 4: Building Autoencoder Model")
        print("=" * 80)
        
        # Encoder
        encoder_input = layers.Input(shape=(input_dim,))
        encoded = layers.Dense(128, activation='relu')(encoder_input)
        encoded = layers.Dropout(0.2)(encoded)
        encoded = layers.Dense(64, activation='relu')(encoded)
        encoded = layers.Dropout(0.2)(encoded)
        encoded = layers.Dense(32, activation='relu')(encoded)  # Bottleneck
        
        # Decoder
        decoded = layers.Dense(64, activation='relu')(encoded)
        decoded = layers.Dropout(0.2)(decoded)
        decoded = layers.Dense(128, activation='relu')(decoded)
        decoded = layers.Dropout(0.2)(decoded)
        decoded = layers.Dense(input_dim, activation='linear')(decoded)
        
        # Autoencoder
        self.autoencoder = keras.Model(encoder_input, decoded)
        self.autoencoder.compile(optimizer='adam', loss='mse', metrics=['mae'])
        
        print("✓ Autoencoder Architecture:")
        print(f"  Input: {input_dim} features")
        print(f"  Encoder: {input_dim} → 128 → 64 → 32 (bottleneck)")
        print(f"  Decoder: 32 → 64 → 128 → {input_dim}")
        print(f"  Loss: Mean Squared Error (MSE)")
        
        self.autoencoder.summary()
        
    def train_autoencoder(self, epochs=50, batch_size=256):
        """Train the Autoencoder"""
        print("\n" + "=" * 80)
        print("STEP 5: Training Autoencoder")
        print("=" * 80)
        
        # Use only normal data for training (unsupervised)
        X_train_normal = self.X_train[self.y_train == 0]
        
        print(f"Training on {len(X_train_normal):,} normal samples...")
        print(f"Epochs: {epochs}, Batch size: {batch_size}")
        print("\n⏳ This will take 5-8 minutes... Training in progress:")
        
        # Progress callback
        class ProgressCallback(keras.callbacks.Callback):
            def on_epoch_end(self, epoch, logs=None):
                progress = (epoch + 1) / epochs * 100
                bar_length = 40
                filled = int(bar_length * (epoch + 1) / epochs)
                bar = '█' * filled + '░' * (bar_length - filled)
                print(f"\r  [{bar}] {progress:.0f}% - Epoch {epoch+1}/{epochs} - Loss: {logs.get('loss', 0):.6f}", end='', flush=True)
        
        # Early stopping
        early_stopping = keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        # Train
        history = self.autoencoder.fit(
            X_train_normal, X_train_normal,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            callbacks=[early_stopping, ProgressCallback()],
            verbose=0  # Disable default verbose to use our progress bar
        )
        
        print("\n\n✓ Autoencoder training completed!")
        
        return history
    
    def detect_anomalies_autoencoder(self):
        """Detect anomalies using Autoencoder"""
        print("\n" + "=" * 80)
        print("STEP 6: Detecting Anomalies with Autoencoder")
        print("=" * 80)
        
        # Predict on test set
        print("Computing reconstruction errors...")
        X_test_pred = self.autoencoder.predict(self.X_test, verbose=0)
        
        # Calculate reconstruction error (MSE)
        reconstruction_errors = np.mean(np.square(self.X_test - X_test_pred), axis=1)
        
        print(f"✓ Computed reconstruction errors for {len(reconstruction_errors):,} samples")
        print(f"  Mean error: {reconstruction_errors.mean():.6f}")
        print(f"  Std error: {reconstruction_errors.std():.6f}")
        
        # Set threshold (mean + 3*std)
        threshold = reconstruction_errors.mean() + 3 * reconstruction_errors.std()
        print(f"  Threshold (mean + 3×std): {threshold:.6f}")
        
        # Predict anomalies
        autoencoder_predictions = (reconstruction_errors > threshold).astype(int)
        
        print(f"\n✓ Autoencoder Predictions:")
        print(f"  Normal: {(autoencoder_predictions == 0).sum():,}")
        print(f"  Anomalies: {(autoencoder_predictions == 1).sum():,}")
        
        return autoencoder_predictions, reconstruction_errors, threshold
    
    def train_isolation_forest(self, contamination=0.07):
        """Train Isolation Forest"""
        print("\n" + "=" * 80)
        print("STEP 7: Training Isolation Forest")
        print("=" * 80)
        
        print(f"Contamination rate: {contamination}")
        print(f"Training on {len(self.X_train):,} samples...")
        print("⏳ This will take 1-2 minutes... Training 100 trees...")
        
        self.isolation_forest = IsolationForest(
            contamination=contamination,
            n_estimators=100,
            max_samples='auto',
            random_state=42,
            n_jobs=-1,
            verbose=1  # Show progress
        )
        
        self.isolation_forest.fit(self.X_train)
        
        print("\n✓ Isolation Forest trained successfully!")
        
    def detect_anomalies_isolation_forest(self):
        """Detect anomalies using Isolation Forest"""
        print("\n" + "=" * 80)
        print("STEP 8: Detecting Anomalies with Isolation Forest")
        print("=" * 80)
        
        # Predict (-1 for anomalies, 1 for normal)
        if_predictions_raw = self.isolation_forest.predict(self.X_test)
        
        # Convert to 0/1 (0 = normal, 1 = anomaly)
        if_predictions = (if_predictions_raw == -1).astype(int)
        
        # Get anomaly scores
        if_scores = self.isolation_forest.decision_function(self.X_test)
        
        print(f"✓ Isolation Forest Predictions:")
        print(f"  Normal: {(if_predictions == 0).sum():,}")
        print(f"  Anomalies: {(if_predictions == 1).sum():,}")
        
        return if_predictions, if_scores
    
    def evaluate_models(self, autoencoder_preds, if_preds):
        """Evaluate both models"""
        print("\n" + "=" * 80)
        print("STEP 9: Model Evaluation")
        print("=" * 80)
        
        # Autoencoder metrics
        print("\n📊 AUTOENCODER METRICS:")
        print("-" * 40)
        ae_precision = precision_score(self.y_test, autoencoder_preds)
        ae_recall = recall_score(self.y_test, autoencoder_preds)
        ae_f1 = f1_score(self.y_test, autoencoder_preds)
        ae_roc_auc = roc_auc_score(self.y_test, autoencoder_preds)
        
        print(f"Precision: {ae_precision:.4f}")
        print(f"Recall:    {ae_recall:.4f}")
        print(f"F1-Score:  {ae_f1:.4f}")
        print(f"ROC-AUC:   {ae_roc_auc:.4f}")
        
        print("\nConfusion Matrix:")
        print(confusion_matrix(self.y_test, autoencoder_preds))
        
        # Isolation Forest metrics
        print("\n📊 ISOLATION FOREST METRICS:")
        print("-" * 40)
        if_precision = precision_score(self.y_test, if_preds)
        if_recall = recall_score(self.y_test, if_preds)
        if_f1 = f1_score(self.y_test, if_preds)
        if_roc_auc = roc_auc_score(self.y_test, if_preds)
        
        print(f"Precision: {if_precision:.4f}")
        print(f"Recall:    {if_recall:.4f}")
        print(f"F1-Score:  {if_f1:.4f}")
        print(f"ROC-AUC:   {if_roc_auc:.4f}")
        
        print("\nConfusion Matrix:")
        print(confusion_matrix(self.y_test, if_preds))
        
        # Determine best model
        print("\n" + "=" * 80)
        print("MODEL COMPARISON")
        print("=" * 80)
        
        ae_avg_score = (ae_precision + ae_recall + ae_f1 + ae_roc_auc) / 4
        if_avg_score = (if_precision + if_recall + if_f1 + if_roc_auc) / 4
        
        print(f"\nAutoencoder Average Score:      {ae_avg_score:.4f}")
        print(f"Isolation Forest Average Score: {if_avg_score:.4f}")
        
        if ae_avg_score > if_avg_score:
            best_model = 'autoencoder'
            print(f"\n🏆 WINNER: Autoencoder (Score: {ae_avg_score:.4f})")
        else:
            best_model = 'isolation_forest'
            print(f"\n🏆 WINNER: Isolation Forest (Score: {if_avg_score:.4f})")
        
        # Store results
        self.results = {
            'autoencoder': {
                'precision': ae_precision,
                'recall': ae_recall,
                'f1': ae_f1,
                'roc_auc': ae_roc_auc,
                'avg_score': ae_avg_score
            },
            'isolation_forest': {
                'precision': if_precision,
                'recall': if_recall,
                'f1': if_f1,
                'roc_auc': if_roc_auc,
                'avg_score': if_avg_score
            },
            'best_model': best_model
        }
        
        return best_model
    
    def visualize_results(self, reconstruction_errors, threshold, if_scores):
        """Create visualization plots"""
        print("\n" + "=" * 80)
        print("STEP 10: Creating Visualizations")
        print("=" * 80)
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # 1. Reconstruction Error Distribution
        axes[0, 0].hist(reconstruction_errors[self.y_test == 0], bins=50, alpha=0.7, label='Normal', color='blue')
        axes[0, 0].hist(reconstruction_errors[self.y_test == 1], bins=50, alpha=0.7, label='Anomaly', color='red')
        axes[0, 0].axvline(threshold, color='green', linestyle='--', linewidth=2, label=f'Threshold: {threshold:.4f}')
        axes[0, 0].set_xlabel('Reconstruction Error')
        axes[0, 0].set_ylabel('Frequency')
        axes[0, 0].set_title('Autoencoder: Reconstruction Error Distribution')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        # 2. Isolation Forest Anomaly Scores
        axes[0, 1].hist(if_scores[self.y_test == 0], bins=50, alpha=0.7, label='Normal', color='blue')
        axes[0, 1].hist(if_scores[self.y_test == 1], bins=50, alpha=0.7, label='Anomaly', color='red')
        axes[0, 1].set_xlabel('Anomaly Score')
        axes[0, 1].set_ylabel('Frequency')
        axes[0, 1].set_title('Isolation Forest: Anomaly Score Distribution')
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)
        
        # 3. Model Performance Comparison
        metrics = ['Precision', 'Recall', 'F1-Score', 'ROC-AUC']
        metric_keys = ['precision', 'recall', 'f1', 'roc_auc']
        ae_values = [self.results['autoencoder'][key] for key in metric_keys]
        if_values = [self.results['isolation_forest'][key] for key in metric_keys]
        
        x = np.arange(len(metrics))
        width = 0.35
        
        axes[1, 0].bar(x - width/2, ae_values, width, label='Autoencoder', color='skyblue')
        axes[1, 0].bar(x + width/2, if_values, width, label='Isolation Forest', color='lightcoral')
        axes[1, 0].set_xlabel('Metrics')
        axes[1, 0].set_ylabel('Score')
        axes[1, 0].set_title('Model Performance Comparison')
        axes[1, 0].set_xticks(x)
        axes[1, 0].set_xticklabels(metrics)
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3, axis='y')
        axes[1, 0].set_ylim([0, 1])
        
        # 4. Scatter plot of errors vs scores
        axes[1, 1].scatter(reconstruction_errors, if_scores, c=self.y_test, cmap='coolwarm', alpha=0.5)
        axes[1, 1].set_xlabel('Reconstruction Error (Autoencoder)')
        axes[1, 1].set_ylabel('Anomaly Score (Isolation Forest)')
        axes[1, 1].set_title('Reconstruction Error vs Anomaly Score')
        axes[1, 1].grid(True, alpha=0.3)
        axes[1, 1].axhline(0, color='black', linestyle='--', linewidth=1, alpha=0.5)
        
        plt.tight_layout()
        plt.savefig('anomaly_detection_results.png', dpi=300, bbox_inches='tight')
        print("✓ Saved plot: anomaly_detection_results.png")
        
    def save_models_and_results(self, best_model, autoencoder_preds, if_preds, original_df):
        """Save models and output files"""
        print("\n" + "=" * 80)
        print("STEP 11: Saving Models and Results")
        print("=" * 80)
        
        # Save best model
        if best_model == 'autoencoder':
            self.autoencoder.save('best_model.h5')
            print("✓ Saved: best_model.h5 (Autoencoder)")
        else:
            joblib.dump(self.isolation_forest, 'best_model.pkl')
            print("✓ Saved: best_model.pkl (Isolation Forest)")
        
        # Save scaler
        joblib.dump(self.scaler, 'scaler.pkl')
        print("✓ Saved: scaler.pkl")
        
        # Create output CSV with test data using sensor names
        output_df = pd.DataFrame(self.X_test, columns=self.sensor_columns)
        output_df['autoencoder_anomaly'] = autoencoder_preds
        output_df['isolationforest_anomaly'] = if_preds
        output_df['final_anomaly_label'] = autoencoder_preds if best_model == 'autoencoder' else if_preds
        output_df['true_label'] = self.y_test
        
        output_df.to_csv('anomaly_output.csv', index=False)
        print(f"✓ Saved: anomaly_output.csv ({len(output_df):,} rows)")
        
        # Save metrics report
        with open('anomaly_detection_report.txt', 'w') as f:
            f.write("=" * 80 + "\n")
            f.write("ANOMALY DETECTION SYSTEM - FINAL REPORT\n")
            f.write("=" * 80 + "\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("SENSOR MAPPING:\n")
            f.write("-" * 40 + "\n")
            for i, feature in enumerate(self.feature_columns):
                sensor_name = self.sensor_columns[i]
                f.write(f"{feature} -> {sensor_name}\n")
            f.write(f"\nTotal Sensors: {len(self.sensor_columns)}\n\n")
            
            f.write("AUTOENCODER RESULTS:\n")
            f.write("-" * 40 + "\n")
            for metric, value in self.results['autoencoder'].items():
                f.write(f"{metric.upper()}: {value:.4f}\n")
            
            f.write("\nISOLATION FOREST RESULTS:\n")
            f.write("-" * 40 + "\n")
            for metric, value in self.results['isolation_forest'].items():
                f.write(f"{metric.upper()}: {value:.4f}\n")
            
            f.write(f"\nBEST MODEL: {best_model.upper()}\n")
            f.write("=" * 80 + "\n")
        
        print("✓ Saved: anomaly_detection_report.txt")
        
        print("\n" + "=" * 80)
        print("✅ ANOMALY DETECTION SYSTEM COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        

def main():
    """Main execution function"""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 15 + "DIGITAL TWIN ANOMALY DETECTION SYSTEM" + " " * 25 + "║")
    print("║" + " " * 20 + "Autoencoder vs Isolation Forest" + " " * 27 + "║")
    print("╚" + "=" * 78 + "╝")
    print("\n")
    
    # Initialize system
    system = AnomalyDetectionSystem(dataset_path='dataset.csv')
    
    # Step 1: Load and clean data
    df_clean, df_original = system.load_and_clean_data()
    
    # Step 1.5: Add sensor values
    df_with_sensors = system.add_sensor_values(df_clean)
    
    # Step 2: Introduce synthetic anomalies
    df_with_anomalies, labels = system.introduce_synthetic_anomalies(df_with_sensors, contamination_rate=0.07)
    
    # Step 3: Prepare data
    system.prepare_data(df_with_anomalies, labels)
    
    # Step 4-5: Build and train Autoencoder
    input_dim = system.X_train.shape[1]
    system.build_autoencoder(input_dim)
    system.train_autoencoder(epochs=50, batch_size=256)
    
    # Step 6: Detect anomalies with Autoencoder
    autoencoder_preds, reconstruction_errors, threshold = system.detect_anomalies_autoencoder()
    
    # Step 7-8: Train and detect with Isolation Forest
    system.train_isolation_forest(contamination=0.07)
    if_preds, if_scores = system.detect_anomalies_isolation_forest()
    
    # Step 9: Evaluate models
    best_model = system.evaluate_models(autoencoder_preds, if_preds)
    
    # Step 10: Visualize results
    system.visualize_results(reconstruction_errors, threshold, if_scores)
    
    # Step 11: Save models and results
    system.save_models_and_results(best_model, autoencoder_preds, if_preds, df_original)
    
    print("\n📁 OUTPUT FILES:")
    print("  - best_model.h5 or best_model.pkl (Best performing model)")
    print("  - scaler.pkl (Data scaler)")
    print("  - anomaly_output.csv (Test data with predictions)")
    print("  - anomaly_detection_results.png (Visualization plots)")
    print("  - anomaly_detection_report.txt (Detailed metrics report)")
    print("\n")


if __name__ == "__main__":
    main()

