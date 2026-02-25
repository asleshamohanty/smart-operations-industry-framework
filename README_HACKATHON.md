# Manipal Hackathon 2025: Phish-Chips Digital Twin Platform

**Team Name:** Phish-Chips

**Problem Statement:** Weather-Aware ESG Digital Twin for Infrastructure Management

## Introduction
Our project addresses the critical challenge of infrastructure project management in unpredictable weather conditions, where delays and cost overruns are common due to inadequate weather impact assessment and ESG compliance tracking. We've developed a comprehensive digital twin platform that integrates real-time weather data with ESG analytics to predict schedule delays, cost overruns, and environmental impact. The solution combines AI-powered anomaly detection, and circular economy principles to provide actionable insights for sustainable infrastructure development.

## Access & Live Demo

**Deployed Website:** [Local Development Only - See Setup Instructions Below]

**Local Deployment Instructions**

For complete technical review, code verification, and reproducibility, follow these instructions to set up and run the project locally. This allows for thorough assessment of the project's architecture and build process.

**System Requirements:**
- Node.js (v18.x or later)
- npm (v9.x or later)
- Python (v3.9 or later)
- Supabase account (free tier available)
- OpenWeatherMap API key

**Steps:**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Manipal-Hackathon-2025/Phish-Chips-Bugbounty.git
   cd Phish-Chips-Bugbounty
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend/vite-project
   npm install
   ```

4. **Environment Configuration:**
   Create `.env` file in backend directory:
   ```bash
   SUPABASE_URL=https://nubbrpaldzantyiejwly.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YmJycGFsZHphbnR5aWVqd2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDYwNjIsImV4cCI6MjA3NTQ4MjA2Mn0.ydpcymatalKeJWDVK2stafXPprr104SXrAakMzaCIGs
   SUPABASE_DB_PASSWORD=abcd801
   OPENWEATHER_API_KEY=your_api_key_here  (https://openweathermap.org/api)
   Current Weather Data Api key.
   If the api keys get exhausted then make a new account.
   ```
  Create `.env` file in vite-project directory:
  # Supabase Configuration
VITE_SUPABASE_URL=https://nubbrpaldzantyiejwly.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YmJycGFsZHphbnR5aWVqd2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDYwNjIsImV4cCI6MjA3NTQ4MjA2Mn0.ydpcymatalKeJWDVK2stafXPprr104SXrAakMzaCIGs

# Backend API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8001

# Gemini AI Configuration
VITE_GEMINI_API_KEY= https://aistudio.google.com/api-keys (Generate your own)


5. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uvicorn main:app

   # Terminal 2 - Frontend
   cd frontend/vite-project
   npm run dev
   ```

6. **Access the application:** Open http://localhost:8080 in your browser.
    (Make sure the frontend is running on 8080 and backend on 8000)

## Features
**Feature 1: Real-time Weather Integration & Disruption Prediction**
- Live weather data integration from OpenWeatherMap API with intelligent disruption scoring
- Predictive analytics for weather impact on project schedules and costs
- Multi-location weather monitoring with historical trend analysis

**Feature 2: ESG Analysis & SDG Alignment Dashboard**
- Comprehensive Environmental, Social, and Governance metrics calculation
- United Nations Sustainable Development Goals alignment tracking
- Carbon footprint, water usage, and energy consumption monitoring
- Interactive ESG scoring with visual progress indicators

**Feature 3: AI-Powered Anomaly Detection System**
- Dual-model approach: Autoencoder (Deep Learning) vs Isolation Forest (Ensemble)
- Synthetic anomaly injection for model validation and testing
- Comprehensive evaluation with Precision, Recall, F1-Score, and ROC-AUC metrics
- Automatic best model selection and production-ready outputs

**Feature 4: Circular Economy & Supply Chain Optimization**
- Circular exchange platform for material and resource sharing
- Enhanced supply chain analytics with sustainability metrics
- Shipment optimization with ESG impact assessment
- Resource efficiency tracking and recommendations

**Feature 5: Project Simulation Engine**
- What-if scenario analysis for different materials and resources
- Weather impact simulation with cost and duration predictions
- ESG impact analysis for sustainable decision making
- Interactive simulation results with detailed visualizations

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, TailwindCSS, Radix UI, Three.js, React Three Fiber, Recharts, Zustand

**Backend:** FastAPI, Python 3.9+, SQLAlchemy, Supabase (PostgreSQL), WebSocket, Uvicorn

**Database:** Supabase (PostgreSQL), Real-time subscriptions

**Machine Learning:** TensorFlow, scikit-learn, pandas, numpy, matplotlib, seaborn

**APIs & Services:** OpenWeatherMap API, Supabase Auth, WebSocket real-time communication

**Deployment:** Nginx, Environment-based configuration

