from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel
import requests
import json
from datetime import datetime
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client() -> Client:
    """Get Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise Exception("Supabase credentials not found")
    
    return create_client(url, key)

class WeatherProviderConfig(BaseModel):
    """Configuration for a weather API provider"""
    name: str
    base_url: str
    key_param: str  # Parameter name for API key (e.g., "appid", "key", "api_key")
    key: str
    city_param: str  # Parameter name for city (e.g., "q", "location", "city")
    
    # Response field mappings
    temperature_path: str  # JSON path to temperature (e.g., "main.temp", "current.temp_c")
    humidity_path: str     # JSON path to humidity (e.g., "main.humidity", "current.humidity")
    description_path: str  # JSON path to description (e.g., "weather.0.description", "current.condition.text")
    wind_speed_path: Optional[str] = None
    pressure_path: Optional[str] = None
    
    # Optional headers
    headers: Optional[Dict[str, str]] = None
    
    # Request method (GET/POST)
    method: str = "GET"
    
    # Additional parameters
    additional_params: Optional[Dict[str, Any]] = None

class WeatherData(BaseModel):
    """Standardized weather data response"""
    temperature: float
    humidity: int
    description: str
    wind_speed: Optional[float] = None
    pressure: Optional[float] = None
    source: str
    timestamp: datetime
    location: str

class WeatherProvider(ABC):
    """Abstract base class for weather providers"""
    
    def __init__(self, config: WeatherProviderConfig):
        self.config = config
    
    @abstractmethod
    def get_weather(self, location: str) -> WeatherData:
        """Get weather data for a location"""
        pass
    
    def _make_request(self, location: str) -> Dict[str, Any]:
        """Make HTTP request to weather API"""
        params = {
            self.config.city_param: location,
            self.config.key_param: self.config.key
        }
        
        # Add additional parameters if provided
        if self.config.additional_params:
            params.update(self.config.additional_params)
        
        headers = self.config.headers or {}
        
        try:
            if self.config.method.upper() == "GET":
                response = requests.get(
                    self.config.base_url,
                    params=params,
                    headers=headers,
                    timeout=10
                )
            else:
                response = requests.post(
                    self.config.base_url,
                    data=params,
                    headers=headers,
                    timeout=10
                )
            
            response.raise_for_status()
            response_data = response.json()
            
            return response_data
            
        except requests.exceptions.RequestException as e:
            # Provide more helpful error messages for IMD APIs
            if "imd.gov.in" in self.config.base_url and "401" in str(e):
                raise Exception(f"Weather API request failed: {str(e)}. Note: IMD APIs require IP whitelisting. Please contact IMD to whitelist your IP address.")
            else:
                raise Exception(f"Weather API request failed: {str(e)}")
        except json.JSONDecodeError as e:
            raise Exception(f"Weather API returned invalid JSON: {str(e)}")
    
    def _extract_value(self, data: Dict[str, Any], path: str) -> Any:
        """Extract value from JSON using dot notation path"""
        if not path:
            return None
            
        keys = path.split('.')
        current = data
        
        try:
            for key in keys:
                if isinstance(current, list) and key.isdigit():
                    current = current[int(key)]
                else:
                    current = current[key]
            return current
        except (KeyError, IndexError, TypeError):
            return None

class GenericWeatherProvider(WeatherProvider):
    """Generic weather provider that works with any API based on configuration"""
    
    def get_weather(self, location: str) -> WeatherData:
        """Get weather data using the configured API"""
        try:
            data = self._make_request(location)
            
            # Extract values using configured paths
            temperature = self._extract_value(data, self.config.temperature_path)
            humidity = self._extract_value(data, self.config.humidity_path)
            description = self._extract_value(data, self.config.description_path)
            wind_speed = self._extract_value(data, self.config.wind_speed_path) if self.config.wind_speed_path else None
            pressure = self._extract_value(data, self.config.pressure_path) if self.config.pressure_path else None
            
            # Convert temperature from Kelvin to Celsius if needed (OpenWeather default)
            if temperature is not None and temperature > 200:  # Likely Kelvin if > 200
                temperature = temperature - 273.15
            
            # Validate required fields
            if temperature is None:
                raise ValueError(f"Temperature not found at path: {self.config.temperature_path}. Available keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            if humidity is None:
                raise ValueError(f"Humidity not found at path: {self.config.humidity_path}. Available keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            if description is None:
                raise ValueError(f"Description not found at path: {self.config.description_path}. Available keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            
            weather_data = WeatherData(
                temperature=float(temperature),
                humidity=int(humidity),
                description=str(description),
                wind_speed=float(wind_speed) if wind_speed is not None else None,
                pressure=float(pressure) if pressure is not None else None,
                source=self.config.name,
                timestamp=datetime.now(),
                location=location
            )
            
            return weather_data
            
        except Exception as e:
            raise Exception(f"Failed to get weather data from {self.config.name}: {str(e)}")

class WeatherProviderManager:
    """Manages multiple weather providers with database persistence"""
    
    def __init__(self):
        self.providers: Dict[str, WeatherProvider] = {}
        self.active_provider_id: Optional[str] = None
        self.user_id: Optional[str] = None
        self._load_predefined_providers()
    
    def set_user_id(self, user_id: str):
        """Set the current user ID for database operations"""
        self.user_id = user_id
        self._load_user_providers()
    
    def _load_user_providers(self):
        """Load user's weather providers from database"""
        if not self.user_id:
            return
            
        try:
            supabase = get_supabase_client()
            
            # Load providers
            result = supabase.table("weather_providers").select("*").eq("user_id", self.user_id).execute()
            
            self.providers = {}
            for row in result.data:
                config = WeatherProviderConfig(
                    name=row["name"],
                    base_url=row["base_url"],
                    key_param=row["key_param"],
                    key=row["api_key"],
                    city_param=row["city_param"],
                    temperature_path=row["temperature_path"],
                    humidity_path=row["humidity_path"],
                    description_path=row["description_path"],
                    wind_speed_path=row.get("wind_speed_path"),
                    pressure_path=row.get("pressure_path"),
                    headers=row.get("headers"),
                    method=row.get("method", "GET"),
                    additional_params=row.get("additional_params")
                )
                self.providers[row["provider_id"]] = GenericWeatherProvider(config)
            
            # Load active provider
            active_result = supabase.table("active_weather_providers").select("*").eq("user_id", self.user_id).execute()
            if active_result.data:
                self.active_provider_id = active_result.data[0]["provider_id"]
                
        except Exception as e:
            raise Exception(f"Failed to load weather providers from Supabase: {str(e)}")
    
    def _load_predefined_providers(self):
        """Load predefined weather provider configurations"""
        predefined_configs = {
            "openweather": WeatherProviderConfig(
                name="OpenWeather",
                base_url="https://api.openweathermap.org/data/2.5/weather",
                key_param="appid",
                key="",  # Will be set by user
                city_param="q",
                temperature_path="main.temp",
                humidity_path="main.humidity",
                description_path="weather.0.description",
                wind_speed_path="wind.speed",
                pressure_path="main.pressure",
                additional_params={"units": "metric"}  # Request temperature in Celsius
            ),
            "weatherapi": WeatherProviderConfig(
                name="WeatherAPI",
                base_url="http://api.weatherapi.com/v1/current.json",
                key_param="key",
                key="",  # Will be set by user
                city_param="q",
                temperature_path="current.temp_c",
                humidity_path="current.humidity",
                description_path="current.condition.text",
                wind_speed_path="current.wind_kph",
                pressure_path="current.pressure_mb"
            ),
            "accuweather": WeatherProviderConfig(
                name="AccuWeather",
                base_url="http://dataservice.accuweather.com/currentconditions/v1/{location_key}",
                key_param="apikey",
                key="",  # Will be set by user
                city_param="location_key",  # Requires location key lookup first
                temperature_path="0.Temperature.Metric.Value",
                humidity_path="0.RelativeHumidity",
                description_path="0.WeatherText",
                wind_speed_path="0.Wind.Speed.Metric.Value",
                pressure_path="0.Pressure.Metric.Value"
            ),
            "tomorrow": WeatherProviderConfig(
                name="Tomorrow.io",
                base_url="https://api.tomorrow.io/v4/weather/realtime",
                key_param="apikey",
                key="",  # Will be set by user
                city_param="location",
                temperature_path="data.values.temperature",
                humidity_path="data.values.humidity",
                description_path="data.values.weatherCode",
                wind_speed_path="data.values.windSpeed",
                pressure_path="data.values.pressureSurfaceLevel",
                additional_params={"units": "metric"}
            ),
            "imd_current": WeatherProviderConfig(
                name="IMD Current Weather",
                base_url="https://mausam.imd.gov.in/api/current_wx_api.php",
                key_param="",
                key="",  # No API key required
                city_param="id",
                temperature_path="CURR_TEMP",
                humidity_path="RH",
                description_path="MEATHER_CODE",
                wind_speed_path="WIND_SPEED",
                pressure_path="MSLP"
            ),
            "imd_forecast": WeatherProviderConfig(
                name="IMD 7-Day Forecast",
                base_url="https://city.imd.gov.in/api/cityweather.php",
                key_param="",
                key="",  # No API key required
                city_param="id",
                temperature_path="Todays_Forecast_Max_Temp",
                humidity_path="Relative_Humidity_at_0830",
                description_path="Todays_Forecast",
                wind_speed_path="",
                pressure_path=""
            ),
            "imd_nowcast": WeatherProviderConfig(
                name="IMD District Nowcast",
                base_url="https://mausam.imd.gov.in/api/nowcast_district_api.php",
                key_param="",
                key="",  # No API key required
                city_param="id",
                temperature_path="",
                humidity_path="",
                description_path="",
                wind_speed_path="",
                pressure_path=""
            ),
            "imd_rainfall": WeatherProviderConfig(
                name="IMD District Rainfall",
                base_url="https://mausam.imd.gov.in/api/districtwise_rainfall_api.php",
                key_param="",
                key="",  # No API key required
                city_param="",
                temperature_path="",
                humidity_path="",
                description_path="",
                wind_speed_path="",
                pressure_path=""
            ),
            "imd_warnings": WeatherProviderConfig(
                name="IMD District Warnings",
                base_url="https://mausam.imd.gov.in/api/warnings_district_api.php",
                key_param="",
                key="",  # No API key required
                city_param="id",
                temperature_path="",
                humidity_path="",
                description_path="",
                wind_speed_path="",
                pressure_path=""
            )
        }
        
        # Store predefined configs (without API keys)
        self.predefined_configs = predefined_configs
    
    def add_provider(self, config: WeatherProviderConfig) -> str:
        """Add a new weather provider and save to database"""
        provider_id = f"{config.name.lower().replace(' ', '_')}_{len(self.providers)}"
        
        # Add to memory
        self.providers[provider_id] = GenericWeatherProvider(config)
        
        # Save to database if user is set
        if self.user_id:
            try:
                supabase = get_supabase_client()
                
                provider_data = {
                    "user_id": self.user_id,
                    "provider_id": provider_id,
                    "name": config.name,
                    "base_url": config.base_url,
                    "key_param": config.key_param,
                    "api_key": config.key,
                    "city_param": config.city_param,
                    "temperature_path": config.temperature_path,
                    "humidity_path": config.humidity_path,
                    "description_path": config.description_path,
                    "wind_speed_path": config.wind_speed_path,
                    "pressure_path": config.pressure_path,
                    "headers": config.headers,
                    "method": config.method,
                    "additional_params": config.additional_params,
                    "is_active": False
                }
                
                supabase.table("weather_providers").insert(provider_data).execute()
                
            except Exception as e:
                # Remove from memory if database save failed
                del self.providers[provider_id]
                raise Exception(f"Failed to save provider to Supabase: {str(e)}")
        else:
            raise Exception("User ID not set. Cannot save provider without user context.")
        
        return provider_id
    
    def get_provider(self, provider_id: str) -> Optional[WeatherProvider]:
        """Get a weather provider by ID"""
        return self.providers.get(provider_id)
    
    def get_weather(self, provider_id: str, location: str) -> WeatherData:
        """Get weather data from a specific provider"""
        provider = self.get_provider(provider_id)
        if not provider:
            raise ValueError(f"Provider {provider_id} not found")
        
        return provider.get_weather(location)
    
    def list_providers(self) -> Dict[str, Dict[str, Any]]:
        """List all available providers"""
        return {
            provider_id: {
                "name": provider.config.name,
                "base_url": provider.config.base_url,
                "has_key": bool(provider.config.key)
            }
            for provider_id, provider in self.providers.items()
        }
    
    def get_predefined_config(self, name: str) -> Optional[WeatherProviderConfig]:
        """Get predefined configuration by name"""
        return self.predefined_configs.get(name)
    
    def set_active_provider(self, provider_id: str) -> bool:
        """Set the active weather provider and save to database"""
        if provider_id not in self.providers:
            available_providers = list(self.providers.keys())
            raise Exception(f"Provider '{provider_id}' not found. Available providers: {available_providers}")
            
        self.active_provider_id = provider_id
        
        # Save to database if user is set
        if self.user_id:
            try:
                supabase = get_supabase_client()
                
                # Update all providers to set is_active = False
                supabase.table("weather_providers").update({"is_active": False}).eq("user_id", self.user_id).execute()
                
                # Set the selected provider as active
                supabase.table("weather_providers").update({"is_active": True}).eq("user_id", self.user_id).eq("provider_id", provider_id).execute()
                
                # Update active_weather_providers table
                # First, try to delete any existing active provider for this user
                supabase.table("active_weather_providers").delete().eq("user_id", self.user_id).execute()
                
                # Then insert the new active provider
                supabase.table("active_weather_providers").insert({
                    "user_id": self.user_id,
                    "provider_id": provider_id
                }).execute()
                
                
            except Exception as e:
                # Revert memory change if database save failed
                self.active_provider_id = None
                raise Exception(f"Failed to save active provider to database: {str(e)}")
        else:
            # Memory only mode (no user context)
            pass
            
        return True
    
    def get_active_provider(self) -> Optional[WeatherProvider]:
        """Get the currently active weather provider"""
        if self.active_provider_id and self.active_provider_id in self.providers:
            return self.providers[self.active_provider_id]
        return None
    
    def get_active_provider_id(self) -> Optional[str]:
        """Get the ID of the currently active provider"""
        return self.active_provider_id
    
    def get_weather_from_active_provider(self, location: str) -> WeatherData:
        """Get weather data from the active provider"""
        active_provider = self.get_active_provider()
        if not active_provider:
            raise Exception("No active weather provider set. Please add and activate a weather provider first.")
        return active_provider.get_weather(location)

# Global provider manager instance
weather_manager = WeatherProviderManager()
