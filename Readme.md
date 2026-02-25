# Weather-Aware ESG Digital Twin for Infrastructure

A comprehensive digital twin dashboard that predicts schedule delays, cost overruns, and ESG impact using live weather data and infrastructure project analytics.

## 🌟 Features

- **Real-time Weather Integration**: Live weather data from OpenWeatherMap API with disruption scoring
- **ESG Analysis**: Comprehensive Environmental, Social, and Governance metrics with SDG alignment
- **Project Simulation**: What-if scenarios for materials, resources, and weather conditions
- **Interactive Dashboard**: Modern React frontend with Gantt charts, radar charts, and progress tracking
- **Cost & Schedule Prediction**: AI-powered predictions for delays and cost overruns

## 🏗️ Architecture

### Backend (FastAPI)
- **FastAPI** with automatic API documentation
- **SQLAlchemy** for database ORM
- **SQLite** database for data storage
- **Pandas** for data processing
- **OpenWeatherMap API** integration

### Frontend (React + TypeScript)
- **Vite** for fast development and building
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **Radix UI** components for accessibility

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- **Supabase account** (free tier available)
- **OpenWeatherMap API key** (required for weather functionality)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Supabase database**:
   ```bash
   # Create a new project at https://supabase.com
   # Run the SQL commands from SUPABASE_SETUP.md to create tables
   ```

5. **Set up environment variables** (required):
   ```bash
   # Create .env file with your credentials
   echo "SUPABASE_URL=https://your-project-id.supabase.co" > .env
   echo "SUPABASE_KEY=your-anon-key-here" >> .env
   echo "SUPABASE_DB_PASSWORD=your-database-password" >> .env
   echo "OPENWEATHER_API_KEY=your_api_key_here" >> .env
   ```
   
   **Get your credentials from**:
   - Supabase Dashboard → Settings → API
   - Supabase Dashboard → Settings → Database
   - OpenWeatherMap API: https://openweathermap.org/api

6. **Run the backend**:
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend/vite-project
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

## 📊 API Endpoints

### Projects
- `GET /projects` - Get all projects
- `GET /projects/{id}` - Get specific project
- `GET /projects/{id}/tasks` - Get project tasks
- `GET /projects/{id}/summary` - Get project summary
- `POST /projects/simulate` - Run simulation

### Weather
- `GET /weather/{location}` - Get weather data for location
- `GET /weather/{location}/disruption-score` - Get disruption score
- `GET /weather/{location}/forecast/{days}` - Get weather forecast

### ESG
- `GET /esg/project/{id}` - Get ESG analysis
- `GET /esg/project/{id}/sdg-alignment` - Get SDG alignment
- `GET /esg/project/{id}/recommendations` - Get recommendations
- `GET /esg/comparison?project_ids=1,2,3` - Compare projects

## 🎯 Key Features Explained

### Weather-Aware Disruption Prediction
- Real-time weather data integration
- Disruption scoring based on temperature, rain, wind, and conditions
- Impact on project schedules and costs

### ESG Analysis & SDG Alignment
- Environmental, Social, and Governance scoring
- United Nations Sustainable Development Goals alignment
- Carbon footprint, water usage, and energy consumption tracking

### Project Simulation Engine
- What-if scenarios for different materials and resources
- Weather impact simulation
- Cost and duration predictions
- ESG impact analysis

### Interactive Dashboard
- Project timeline with Gantt charts
- ESG progress tracking
- SDG radar charts
- Real-time weather monitoring
- Simulation results visualization

## 📈 Data Model

The system uses your existing infrastructure dataset with the following key fields:
- Project information (name, location, budget, type)
- Task details (duration, materials, resources, costs)
- ESG scores (Environmental, Social, Governance)
- Weather data (conditions, disruption scores)
- SDG alignment scores
- Predicted delays and cost impacts

## 🔧 Configuration

### Backend Configuration
- Database: Supabase (PostgreSQL)
- API Rate Limiting: Configurable
- Weather API: OpenWeatherMap (required - no mock data)

### Frontend Configuration
- API Base URL: `http://localhost:8000`
- Chart Library: Recharts
- UI Components: Radix UI + TailwindCSS

## 🚀 Deployment

### Backend Deployment
1. Set up production database (PostgreSQL recommended)
2. Configure environment variables
3. Use production WSGI server (Gunicorn + Uvicorn)
4. Set up reverse proxy (Nginx)

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Serve static files with Nginx or CDN
3. Configure API endpoints for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
1. Check the API documentation at `/docs`
2. Review the console logs for errors
3. Ensure all dependencies are installed
4. Verify the backend is running on port 8000

## 🔮 Future Enhancements

- Machine learning models for more accurate predictions
- Integration with more weather APIs
- Advanced project management features
- Mobile app development
- Real-time collaboration features
- Advanced analytics and reporting