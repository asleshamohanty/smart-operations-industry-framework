# 🚀 Anomaly Detection System - Quick Start Guide

## ⚡ TL;DR

```bash
cd backend
pip install -r requirements-ml.txt
python anomaly_detection.py
```

**That's it!** The system will automatically:

- ✅ Process 500,000+ rows from `dataset.csv`
- ✅ Train Autoencoder and Isolation Forest models
- ✅ Compare performance and select the best model
- ✅ Generate predictions, visualizations, and reports

---

## 📋 What You Get

### Output Files (Generated Automatically)

1. **`best_model.h5`** or **`best_model.pkl`**

   - The superior performing model (Autoencoder or Isolation Forest)
   - Ready for production deployment

2. **`scaler.pkl`**

   - StandardScaler for normalizing new data
   - Required for making predictions

3. **`anomaly_output.csv`**

   - Test dataset with predictions from both models
   - Columns: `autoencoder_anomaly`, `isolationforest_anomaly`, `final_anomaly_label`, `true_label`

4. **`anomaly_detection_results.png`**

   - 4 comprehensive visualization plots
   - Reconstruction errors, anomaly scores, model comparison, scatter plot

5. **`anomaly_detection_report.txt`**
   - Detailed metrics report
   - Precision, Recall, F1-Score, ROC-AUC for both models

---

## 🎯 System Workflow

```
1. Load dataset.csv (500K+ rows)
   ↓
2. Clean & normalize data
   ↓
3. Inject 7% synthetic anomalies (for validation)
   ↓
4. Train Autoencoder (Deep Learning)
   ↓
5. Train Isolation Forest (Ensemble)
   ↓
6. Detect anomalies with both models
   ↓
7. Evaluate & compare performance
   ↓
8. Select best model & save outputs
```

---

## 📊 Expected Results

### Typical Performance Metrics

| Metric    | Autoencoder | Isolation Forest |
| --------- | ----------- | ---------------- |
| Precision | 0.82 - 0.91 | 0.79 - 0.87      |
| Recall    | 0.78 - 0.88 | 0.75 - 0.85      |
| F1-Score  | 0.80 - 0.89 | 0.77 - 0.86      |
| ROC-AUC   | 0.85 - 0.93 | 0.82 - 0.90      |

_Note: Actual results may vary based on data distribution_

---

## 🎨 Visualizations Preview

The generated plot includes:

1. **Top-Left**: Reconstruction error distribution (Autoencoder)

   - Blue = Normal samples
   - Red = Anomalous samples
   - Green line = Decision threshold

2. **Top-Right**: Anomaly score distribution (Isolation Forest)

   - Shows separation between normal and anomalous data

3. **Bottom-Left**: Performance comparison bar chart

   - Side-by-side comparison of all metrics

4. **Bottom-Right**: Scatter plot
   - Correlation between both models' scores

---

## 🔧 Customization Options

### Change Contamination Rate

Edit `anomaly_detection.py`, line ~600:

```python
# Default: 7% anomalies
system.introduce_synthetic_anomalies(df_clean, contamination_rate=0.07)

# Change to 10%
system.introduce_synthetic_anomalies(df_clean, contamination_rate=0.10)
```

### Adjust Training Epochs

Edit `anomaly_detection.py`, line ~605:

```python
# Default: 50 epochs
system.train_autoencoder(epochs=50, batch_size=256)

# Train longer for better accuracy
system.train_autoencoder(epochs=100, batch_size=256)
```

### Modify Anomaly Threshold

Edit the `detect_anomalies_autoencoder` method:

```python
# Default: mean + 3*std (strict)
threshold = reconstruction_errors.mean() + 3 * reconstruction_errors.std()

# More lenient: mean + 2*std
threshold = reconstruction_errors.mean() + 2 * reconstruction_errors.std()

# Very strict: mean + 4*std
threshold = reconstruction_errors.mean() + 4 * reconstruction_errors.std()
```

---

## ⏱️ Performance Expectations

| Dataset Size | CPU Time | GPU Time | Memory |
| ------------ | -------- | -------- | ------ |
| 100K rows    | ~2 min   | ~30 sec  | ~1 GB  |
| 500K rows    | ~8 min   | ~2 min   | ~3 GB  |
| 1M rows      | ~15 min  | ~4 min   | ~5 GB  |

_Based on Intel i7/AMD Ryzen 7 CPU and NVIDIA RTX GPU_

---

## 🐛 Troubleshooting

### Issue: "Out of Memory"

**Solution**: Reduce batch size

```python
system.train_autoencoder(epochs=50, batch_size=128)  # Instead of 256
```

### Issue: "TensorFlow not found"

**Solution**: Install TensorFlow

```bash
pip install tensorflow==2.15.0
```

### Issue: Training too slow

**Solution**: Use GPU (if available)

```python
# Check GPU availability
import tensorflow as tf
print("GPU Available:", tf.config.list_physical_devices('GPU'))
```

### Issue: "dataset.csv not found"

**Solution**: Ensure you're in the backend directory

```bash
cd backend
ls dataset.csv  # Should show the file
```

---

## 🎓 Understanding the Output

### `anomaly_output.csv` Structure

```csv
feature1,feature2,...,autoencoder_anomaly,isolationforest_anomaly,final_anomaly_label,true_label
12.5,34.2,...,0,0,0,0  # Normal (both models agree)
98.7,123.4,...,1,1,1,1  # Anomaly (both models agree)
45.3,67.8,...,0,1,0,0  # Disagreement (Autoencoder wins if best)
```

### Interpreting Results

- `0` = Normal sample
- `1` = Anomalous sample
- `final_anomaly_label` = Prediction from the best model
- `true_label` = Ground truth (from synthetic injection)

---

## 🚀 Production Deployment

### Using the Saved Model

**Autoencoder (if best):**

```python
from tensorflow import keras
import joblib
import numpy as np

# Load model and scaler
model = keras.models.load_model('best_model.h5')
scaler = joblib.load('scaler.pkl')

# Predict on new data
new_data = np.array([[...]])  # Your data
new_data_scaled = scaler.transform(new_data)
predictions = model.predict(new_data_scaled)

# Calculate reconstruction error
reconstruction_error = np.mean(np.square(new_data_scaled - predictions), axis=1)

# Set threshold (from training)
threshold = 0.05  # Use the value from training output
anomalies = (reconstruction_error > threshold).astype(int)
```

**Isolation Forest (if best):**

```python
import joblib
import numpy as np

# Load model and scaler
model = joblib.load('best_model.pkl')
scaler = joblib.load('scaler.pkl')

# Predict on new data
new_data = np.array([[...]])  # Your data
new_data_scaled = scaler.transform(new_data)
predictions = model.predict(new_data_scaled)

# Convert to 0/1
anomalies = (predictions == -1).astype(int)
```

---

## 📞 Support

For issues or questions:

1. Check the detailed README: `README_ANOMALY_DETECTION.md`
2. Review the generated report: `anomaly_detection_report.txt`
3. Examine the visualization: `anomaly_detection_results.png`

---

**Happy Anomaly Detecting! 🔍**
