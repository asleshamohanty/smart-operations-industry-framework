# 🔍 Anomaly Detection System for Digital Twin Simulation

## Overview

This system compares **Autoencoder** and **Isolation Forest** models for anomaly detection in a circular manufacturing supply chain digital twin simulation.

## 🎯 Features

- **Dual Model Approach**: Autoencoder (Deep Learning) vs Isolation Forest (Ensemble)
- **Synthetic Anomaly Injection**: Introduces 5-10% controlled anomalies for validation
- **Comprehensive Evaluation**: Precision, Recall, F1-Score, ROC-AUC metrics
- **Automatic Best Model Selection**: Chooses the superior performer
- **Rich Visualizations**: Distribution plots, performance comparisons, scatter plots
- **Production-Ready Outputs**: Saved models, predictions, and detailed reports

## 📦 Installation

```bash
cd backend

# Install ML dependencies
pip install -r requirements-ml.txt
```

## 🚀 Usage

### Quick Start

```bash
cd backend
python anomaly_detection.py
```

### What It Does

1. **Loads** 500,000+ rows from `dataset.csv`
2. **Cleans** data (handles missing values, normalizes features)
3. **Injects** 7% synthetic anomalies for validation
4. **Trains** both Autoencoder and Isolation Forest models
5. **Evaluates** performance with multiple metrics
6. **Selects** the best-performing model
7. **Saves** models, predictions, and visualizations

## 📊 Output Files

| File                                | Description                                             |
| ----------------------------------- | ------------------------------------------------------- |
| `best_model.h5` or `best_model.pkl` | Best performing model (Autoencoder or Isolation Forest) |
| `scaler.pkl`                        | StandardScaler for data normalization                   |
| `anomaly_output.csv`                | Test data with predictions from both models             |
| `anomaly_detection_results.png`     | Visualization plots (4 subplots)                        |
| `anomaly_detection_report.txt`      | Detailed metrics and comparison report                  |

## 📈 Model Details

### Autoencoder Architecture

```
Input (n features) → Dense(128) → Dense(64) → Dense(32) [Bottleneck]
                    ↓
Output (n features) ← Dense(128) ← Dense(64) ← Dense(32)
```

- **Loss Function**: Mean Squared Error (MSE)
- **Optimizer**: Adam
- **Anomaly Detection**: Reconstruction error > (mean + 3×std)

### Isolation Forest Configuration

```python
IsolationForest(
    contamination=0.07,
    n_estimators=100,
    max_samples='auto',
    random_state=42
)
```

## 🔧 Customization

### Adjust Contamination Rate

```python
# In anomaly_detection.py, line ~600
system.introduce_synthetic_anomalies(df_clean, contamination_rate=0.10)  # 10%
```

### Modify Autoencoder Training

```python
# In anomaly_detection.py, line ~605
system.train_autoencoder(epochs=100, batch_size=512)
```

### Change Threshold Sensitivity

```python
# In detect_anomalies_autoencoder method
threshold = reconstruction_errors.mean() + 2 * reconstruction_errors.std()  # Less strict
```

## 📊 Sample Output

```
═══════════════════════════════════════════════════════════
MODEL COMPARISON
═══════════════════════════════════════════════════════════

Autoencoder Average Score:      0.8542
Isolation Forest Average Score: 0.8231

🏆 WINNER: Autoencoder (Score: 0.8542)
```

## 🎨 Visualizations

The system generates 4 plots:

1. **Reconstruction Error Distribution** - Autoencoder errors for normal vs anomalous samples
2. **Anomaly Score Distribution** - Isolation Forest scores
3. **Model Performance Comparison** - Bar chart of all metrics
4. **Scatter Plot** - Reconstruction error vs anomaly score correlation

## 🔬 Evaluation Metrics

- **Precision**: How many detected anomalies are actually anomalous
- **Recall**: How many actual anomalies were detected
- **F1-Score**: Harmonic mean of precision and recall
- **ROC-AUC**: Area under ROC curve (overall discriminative power)

## 🧪 Testing

The system automatically:

- Injects synthetic anomalies
- Labels them for validation
- Computes confusion matrices
- Generates classification reports

## 🎓 Technical Details

### Data Processing

1. **Feature Selection**: Numeric columns only (excludes IDs)
2. **Missing Values**: Median imputation
3. **Normalization**: StandardScaler (mean=0, std=1)
4. **Split**: 80% train, 20% test (stratified)

### Anomaly Injection Strategy

- Perturbs 3-5 random features per anomalous sample
- Adds noise of 3-5 standard deviations
- Maintains realistic data distribution

## 🚨 Troubleshooting

### Out of Memory Error

Reduce batch size or sample the dataset:

```python
# Add after loading data
df_clean = df_clean.sample(n=100000, random_state=42)
```

### TensorFlow Warnings

These are normal and can be ignored:

```python
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
```

## 📝 Notes

- **Training Time**: ~5-10 minutes on CPU, ~1-2 minutes on GPU
- **Memory Usage**: ~2-4GB RAM for full dataset
- **Reproducibility**: Fixed random seeds (42) for consistent results

## 🔮 Future Enhancements

- [ ] Add LSTM-based anomaly detection
- [ ] Implement One-Class SVM
- [ ] Real-time streaming anomaly detection
- [ ] Web dashboard for visualization
- [ ] Model retraining pipeline

## 📚 References

- Autoencoder for Anomaly Detection: [Deep Learning Book](https://www.deeplearningbook.org/)
- Isolation Forest: [Liu et al., 2008](https://ieeexplore.ieee.org/document/4781136)
- Anomaly Detection Review: [Chandola et al., 2009](https://dl.acm.org/doi/10.1145/1541880.1541882)

---

**Built for Digital Twin Simulation - Smart Ops Platform**
