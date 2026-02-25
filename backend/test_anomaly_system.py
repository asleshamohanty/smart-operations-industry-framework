"""
Quick test script to verify the anomaly detection system setup
"""

import sys
import os

def check_dependencies():
    """Check if all required packages are installed"""
    print("Checking dependencies...")
    
    required_packages = {
        'pandas': 'pandas',
        'numpy': 'numpy',
        'sklearn': 'scikit-learn',
        'tensorflow': 'tensorflow',
        'keras': 'keras',
        'matplotlib': 'matplotlib',
        'seaborn': 'seaborn',
        'joblib': 'joblib'
    }
    
    missing = []
    installed = []
    
    for package, pip_name in required_packages.items():
        try:
            __import__(package)
            installed.append(package)
            print(f"  ✓ {package}")
        except ImportError:
            missing.append(pip_name)
            print(f"  ✗ {package} (missing)")
    
    print(f"\nInstalled: {len(installed)}/{len(required_packages)}")
    
    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        print(f"\nInstall with: pip install -r requirements-ml.txt")
        return False
    else:
        print("\n✅ All dependencies installed!")
        return True

def check_dataset():
    """Check if dataset.csv exists"""
    print("\nChecking dataset...")
    
    if os.path.exists('dataset.csv'):
        # Get file size
        size_mb = os.path.getsize('dataset.csv') / (1024 * 1024)
        print(f"  ✓ dataset.csv found ({size_mb:.2f} MB)")
        
        # Quick peek at the data
        try:
            import pandas as pd
            df = pd.read_csv('dataset.csv', nrows=5)
            print(f"  ✓ Dataset has {len(df.columns)} columns")
            print(f"  ✓ Sample columns: {', '.join(df.columns[:5].tolist())}...")
            return True
        except Exception as e:
            print(f"  ✗ Error reading dataset: {e}")
            return False
    else:
        print("  ✗ dataset.csv not found!")
        print("  Make sure you're in the backend directory")
        return False

def check_system_resources():
    """Check system resources"""
    print("\nChecking system resources...")
    
    try:
        import psutil
        
        # CPU
        cpu_count = psutil.cpu_count()
        print(f"  ✓ CPU cores: {cpu_count}")
        
        # RAM
        ram_gb = psutil.virtual_memory().total / (1024**3)
        print(f"  ✓ RAM: {ram_gb:.1f} GB")
        
        # Available RAM
        available_ram_gb = psutil.virtual_memory().available / (1024**3)
        print(f"  ✓ Available RAM: {available_ram_gb:.1f} GB")
        
        if available_ram_gb < 2:
            print("  ⚠️  Low memory! Consider reducing batch size")
        
    except ImportError:
        print("  ⚠️  psutil not installed (optional, skipping resource check)")
    
    # Check GPU
    try:
        import tensorflow as tf
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            print(f"  ✓ GPU available: {len(gpus)} device(s)")
            for gpu in gpus:
                print(f"    - {gpu.name}")
        else:
            print("  ℹ️  No GPU detected (will use CPU)")
    except Exception as e:
        print(f"  ⚠️  Cannot check GPU: {e}")

def run_quick_test():
    """Run a quick test with sample data"""
    print("\nRunning quick functionality test...")
    
    try:
        import numpy as np
        from sklearn.preprocessing import StandardScaler
        from sklearn.ensemble import IsolationForest
        
        # Create small sample data
        X_sample = np.random.randn(100, 10)
        
        # Test scaling
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_sample)
        print("  ✓ Data scaling works")
        
        # Test Isolation Forest
        iso_forest = IsolationForest(contamination=0.1, random_state=42)
        iso_forest.fit(X_scaled)
        predictions = iso_forest.predict(X_scaled)
        print("  ✓ Isolation Forest works")
        
        # Test TensorFlow/Keras
        import tensorflow as tf
        from tensorflow.keras import layers
        
        model = tf.keras.Sequential([
            layers.Dense(8, activation='relu', input_shape=(10,)),
            layers.Dense(4, activation='relu'),
            layers.Dense(10, activation='linear')
        ])
        model.compile(optimizer='adam', loss='mse')
        print("  ✓ TensorFlow/Keras works")
        
        print("\n✅ All functionality tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("  ANOMALY DETECTION SYSTEM - SETUP VERIFICATION")
    print("=" * 60)
    
    # Check dependencies
    deps_ok = check_dependencies()
    
    # Check dataset
    dataset_ok = check_dataset()
    
    # Check system resources
    check_system_resources()
    
    # Run quick test
    if deps_ok:
        test_ok = run_quick_test()
    else:
        test_ok = False
    
    # Final summary
    print("\n" + "=" * 60)
    print("  VERIFICATION SUMMARY")
    print("=" * 60)
    
    if deps_ok and dataset_ok and test_ok:
        print("\n✅ System is ready!")
        print("\nYou can now run:")
        print("  python anomaly_detection.py")
    else:
        print("\n⚠️  Setup incomplete. Please fix the issues above.")
        
        if not deps_ok:
            print("\n1. Install dependencies:")
            print("   pip install -r requirements-ml.txt")
        
        if not dataset_ok:
            print("\n2. Ensure dataset.csv is in the backend directory")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()

