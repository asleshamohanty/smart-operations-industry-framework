from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Import routers
from routers import projects, weather, esg, anomaly, shipments, weather_providers, circular_exchange, enhanced_circular_exchange, safety

app = FastAPI(
    title="Weather-Aware ESG Digital Twin for Infrastructure",
    description="A digital twin dashboard that predicts schedule delays, cost overruns, and ESG impact using live weather data",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(projects.router)
app.include_router(anomaly.router)
app.include_router(weather.router)
app.include_router(weather_providers.router)
app.include_router(esg.router)
app.include_router(shipments.router)
app.include_router(circular_exchange.router)
app.include_router(enhanced_circular_exchange.router)
app.include_router(safety.router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("Smart Ops Platform Backend Started!")
    print("API: http://localhost:8000")
    print("Docs: http://localhost:8000/docs")

@app.get("/")
async def root():
    return {
        "message": "Weather-Aware ESG Digital Twin for Infrastructure API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "projects": "/projects",
            "anomaly": "/anomaly",
            "weather": "/weather",
            "esg": "/esg"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
