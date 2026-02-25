#!/bin/bash

echo "================================================================================"
echo "          Digital Twin Anomaly Detection System"
echo "          Autoencoder vs Isolation Forest Comparison"
echo "================================================================================"
echo ""

echo "Step 1: Installing ML dependencies..."
pip install -r requirements-ml.txt
echo ""

echo "Step 2: Running anomaly detection system..."
python anomaly_detection.py
echo ""

echo "================================================================================"
echo "                        PROCESS COMPLETED!"
echo "================================================================================"
echo ""
echo "Output files created:"
echo "  - best_model.h5 or best_model.pkl"
echo "  - scaler.pkl"
echo "  - anomaly_output.csv"
echo "  - anomaly_detection_results.png"
echo "  - anomaly_detection_report.txt"
echo ""

