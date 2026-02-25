from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from utils.weather_providers import (
    WeatherProviderConfig, 
    WeatherData, 
    weather_manager
)
from auth import get_current_user_id
import json

router = APIRouter(prefix="/weather-providers", tags=["weather-providers"])

# Request/Response Models
class WeatherProviderRequest(BaseModel):
    """Request model for adding a weather provider"""
    config: WeatherProviderConfig

class WeatherProviderResponse(BaseModel):
    """Response model for weather provider operations"""
    provider_id: str
    name: str
    message: str

class WeatherRequest(BaseModel):
    """Request model for getting weather data"""
    provider_id: str
    location: str

class WeatherProviderListResponse(BaseModel):
    """Response model for listing providers"""
    providers: Dict[str, Dict[str, Any]]
    predefined: List[str]

class PredefinedProviderRequest(BaseModel):
    """Request model for using predefined provider"""
    provider_name: str  # e.g., "openweather", "weatherapi", "imd_current"
    api_key: str = ""  # Optional for providers that don't need API keys

@router.post("/providers", response_model=WeatherProviderResponse)
async def add_weather_provider(request: WeatherProviderRequest, user_id: str = Depends(get_current_user_id)):
    """
    Add a custom weather provider configuration
    
    This endpoint allows users to add their own weather API configurations.
    The configuration includes API endpoints, parameter mappings, and response parsing.
    """
    try:
        # Set user ID for the weather manager
        weather_manager.set_user_id(user_id)
        
        # Validate the configuration
        if not request.config.key:
            raise HTTPException(status_code=400, detail="API key is required")
        
        if not request.config.base_url:
            raise HTTPException(status_code=400, detail="Base URL is required")
        
        # Add the provider
        provider_id = weather_manager.add_provider(request.config)
        
        return WeatherProviderResponse(
            provider_id=provider_id,
            name=request.config.name,
            message=f"Weather provider '{request.config.name}' added successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add weather provider: {str(e)}")

@router.post("/providers/predefined", response_model=WeatherProviderResponse)
async def add_predefined_provider(request: PredefinedProviderRequest, user_id: str = Depends(get_current_user_id)):
    """
    Add a predefined weather provider with API key
    
    Supported providers: openweather, weatherapi, accuweather, tomorrow
    """
    try:
        # Set user ID for the weather manager
        weather_manager.set_user_id(user_id)
        
        # Get predefined configuration
        config = weather_manager.get_predefined_config(request.provider_name)
        if not config:
            available = list(weather_manager.predefined_configs.keys())
            raise HTTPException(
                status_code=400, 
                detail=f"Unknown provider '{request.provider_name}'. Available: {available}"
            )
        
        # Update with user's API key (only if the provider requires one)
        if config.key_param and config.key_param != "":
            if not request.api_key:
                raise HTTPException(
                    status_code=400, 
                    detail=f"API key is required for {config.name}"
                )
            config.key = request.api_key
        else:
            # For providers that don't need API keys (like IMD), keep empty key
            config.key = ""
        
        # Add the provider
        provider_id = weather_manager.add_provider(config)
        
        return WeatherProviderResponse(
            provider_id=provider_id,
            name=config.name,
            message=f"Predefined provider '{config.name}' added successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add predefined provider: {str(e)}")

@router.get("/providers", response_model=WeatherProviderListResponse)
async def list_weather_providers(user_id: str = Depends(get_current_user_id)):
    """
    List all available weather providers
    
    Returns both custom providers and predefined provider templates.
    """
    try:
        # Set user ID for the weather manager
        weather_manager.set_user_id(user_id)
        
        providers = weather_manager.list_providers()
        predefined = list(weather_manager.predefined_configs.keys())
        
        return WeatherProviderListResponse(
            providers=providers,
            predefined=predefined
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list providers: {str(e)}")

@router.get("/providers/predefined/{provider_name}")
async def get_predefined_provider_config(provider_name: str):
    """
    Get configuration template for a predefined provider
    
    This returns the configuration structure without the API key,
    which can be used as a template for custom providers.
    """
    try:
        config = weather_manager.get_predefined_config(provider_name)
        if not config:
            available = list(weather_manager.predefined_configs.keys())
            raise HTTPException(
                status_code=404, 
                detail=f"Provider '{provider_name}' not found. Available: {available}"
            )
        
        # Return config without API key for security
        config_dict = config.dict()
        config_dict["key"] = ""  # Remove API key for security
        
        return {
            "name": provider_name,
            "config": config_dict,
            "description": f"Configuration template for {config.name}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get provider config: {str(e)}")

@router.post("/current", response_model=WeatherData)
async def get_current_weather(request: WeatherRequest):
    """
    Get current weather data from a specific provider
    
    This endpoint fetches weather data using the specified provider configuration.
    The response is standardized regardless of the underlying API.
    """
    try:
        # Validate input
        if not request.location:
            raise HTTPException(status_code=400, detail="Location is required")
        
        if not request.provider_id:
            raise HTTPException(status_code=400, detail="Provider ID is required")
        
        # Get weather data
        weather_data = weather_manager.get_weather(request.provider_id, request.location)
        
        return weather_data
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get weather data: {str(e)}")

@router.delete("/providers/{provider_id}")
async def remove_weather_provider(provider_id: str):
    """
    Remove a weather provider
    
    This removes the provider from the active providers list.
    """
    try:
        if provider_id not in weather_manager.providers:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        provider_name = weather_manager.providers[provider_id].config.name
        del weather_manager.providers[provider_id]
        
        return {
            "message": f"Weather provider '{provider_name}' removed successfully",
            "provider_id": provider_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove provider: {str(e)}")

@router.post("/test/{provider_id}")
async def test_weather_provider(provider_id: str, location: str = "London"):
    """
    Test a weather provider with a sample request
    
    This is useful for validating provider configurations before using them.
    """
    try:
        weather_data = weather_manager.get_weather(provider_id, location)
        
        return {
            "success": True,
            "message": f"Provider '{weather_manager.providers[provider_id].config.name}' is working correctly",
            "test_data": weather_data,
            "test_location": location
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Provider test failed: {str(e)}",
            "test_location": location
        }

@router.post("/debug/{provider_id}")
async def debug_weather_provider(provider_id: str, location: str = "London"):
    """
    Debug a weather provider by showing raw API response
    
    This endpoint shows the actual API response structure to help with configuration.
    """
    try:
        provider = weather_manager.get_provider(provider_id)
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        # Make raw request to see the actual API response
        raw_data = provider._make_request(location)
        
        return {
            "success": True,
            "provider_name": provider.config.name,
            "test_location": location,
            "raw_api_response": raw_data,
            "configuration": {
                "base_url": provider.config.base_url,
                "temperature_path": provider.config.temperature_path,
                "humidity_path": provider.config.humidity_path,
                "description_path": provider.config.description_path,
                "wind_speed_path": provider.config.wind_speed_path,
                "pressure_path": provider.config.pressure_path,
            },
            "extracted_values": {
                "temperature": provider._extract_value(raw_data, provider.config.temperature_path),
                "humidity": provider._extract_value(raw_data, provider.config.humidity_path),
                "description": provider._extract_value(raw_data, provider.config.description_path),
                "wind_speed": provider._extract_value(raw_data, provider.config.wind_speed_path) if provider.config.wind_speed_path else None,
                "pressure": provider._extract_value(raw_data, provider.config.pressure_path) if provider.config.pressure_path else None,
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Debug failed: {str(e)}",
            "test_location": location
        }

# Active Provider Management Endpoints
@router.post("/active/{provider_id}")
async def set_active_provider(provider_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Set the active weather provider
    
    This provider will be used for all weather-related operations in the project.
    """
    try:
        # Set user ID for the weather manager
        weather_manager.set_user_id(user_id)
        
        # Check if provider exists before trying to set it as active
        provider = weather_manager.get_provider(provider_id)
        if not provider:
            available_providers = list(weather_manager.providers.keys())
            raise HTTPException(
                status_code=404, 
                detail=f"Provider '{provider_id}' not found. Available providers: {available_providers}"
            )
        
        success = weather_manager.set_active_provider(provider_id)
        if success:
            return {
                "success": True,
                "message": f"Active provider set to '{provider.config.name}'",
                "provider_id": provider_id,
                "provider_name": provider.config.name
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to set active provider")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set active provider: {str(e)}")

@router.get("/active")
async def get_active_provider(user_id: str = Depends(get_current_user_id)):
    """
    Get the currently active weather provider for the user
    """
    try:
        # Set user ID for the weather manager
        weather_manager.set_user_id(user_id)
        
        active_provider_id = weather_manager.get_active_provider_id()
        if active_provider_id:
            provider = weather_manager.get_provider(active_provider_id)
            return {
                "success": True,
                "provider_id": active_provider_id,
                "provider_name": provider.config.name,
                "base_url": provider.config.base_url,
                "has_key": bool(provider.config.key)
            }
        else:
            return {
                "success": False,
                "message": "No active provider set",
                "provider_id": None
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active provider: {str(e)}")

@router.get("/weather/active")
async def get_weather_from_active_provider(location: str = "London", user_id: str = Depends(get_current_user_id)):
    """
    Get weather data from the currently active provider for the user
    
    This is the main endpoint that projects should use for weather data.
    """
    try:
        # Set user ID for the weather manager
        weather_manager.set_user_id(user_id)
        
        weather_data = weather_manager.get_weather_from_active_provider(location)
        return {
            "success": True,
            "data": weather_data,
            "provider": weather_manager.get_active_provider_id()
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e),
            "location": location
        }

# Health check endpoint
@router.get("/health")
async def weather_service_health():
    """Check weather service health"""
    try:
        provider_count = len(weather_manager.providers)
        predefined_count = len(weather_manager.predefined_configs)
        
        return {
            "status": "healthy",
            "active_providers": provider_count,
            "predefined_templates": predefined_count,
            "message": "Weather service is operational"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather service health check failed: {str(e)}")
