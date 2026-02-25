import os
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

# Try to load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If python-dotenv is not installed, continue without it
    pass

class OpenWeatherService:
    def __init__(self):
        self.api_key = os.getenv('OPENWEATHER_API_KEY', '')
        self.base_url = "http://api.openweathermap.org/data/2.5"
    
    def get_current_weather(self, location: str) -> Dict[str, Any]:
        """Get current weather for a location"""
        try:
            # First get coordinates for the location
            geo_url = f"{self.base_url}/weather"
            params = {
                'q': location,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(geo_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                'location': location,
                'temperature': data['main']['temp'],
                'humidity': data['main']['humidity'],
                'pressure': data['main']['pressure'],
                'wind_speed': data['wind']['speed'],
                'wind_direction': data['wind'].get('deg', 0),
                'weather_condition': data['weather'][0]['main'],
                'weather_description': data['weather'][0]['description'],
                'visibility': data.get('visibility', 10000) / 1000,  # Convert to km
                'cloudiness': data['clouds']['all'],
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error fetching current weather: {e}")
            return self._get_fallback_weather()
    
    def get_weather_forecast(self, location: str, days: int = 5) -> List[Dict[str, Any]]:
        """Get weather forecast for a location"""
        try:
            # Get 5-day forecast (OpenWeather provides 5-day forecast)
            forecast_url = f"{self.base_url}/forecast"
            params = {
                'q': location,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(forecast_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            forecasts = []
            
            # Process forecast data (3-hour intervals)
            for item in data['list'][:days * 8]:  # 8 intervals per day
                forecasts.append({
                    'datetime': item['dt_txt'],
                    'temperature': item['main']['temp'],
                    'humidity': item['main']['humidity'],
                    'pressure': item['main']['pressure'],
                    'wind_speed': item['wind']['speed'],
                    'weather_condition': item['weather'][0]['main'],
                    'weather_description': item['weather'][0]['description'],
                    'cloudiness': item['clouds']['all'],
                    'precipitation_probability': item.get('pop', 0) * 100  # Convert to percentage
                })
            
            return forecasts[:days * 8]  # Return requested number of days
            
        except Exception as e:
            print(f"Error fetching weather forecast: {e}")
            return self._get_fallback_forecast(days)
    
    def calculate_weather_impact(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate construction impact based on weather conditions"""
        condition = weather_data.get('weather_condition', 'Clear').lower()
        temperature = weather_data.get('temperature', 20)
        wind_speed = weather_data.get('wind_speed', 0)
        precipitation_prob = weather_data.get('precipitation_probability', 0)
        
        # Initialize impact factors
        cost_impact = 1.0
        duration_impact = 1.0
        safety_risk = 0.0
        productivity_factor = 1.0
        
        # Temperature impact
        if temperature < 0:
            cost_impact *= 1.3  # 30% cost increase for freezing conditions
            duration_impact *= 1.4  # 40% duration increase
            safety_risk += 0.3
            productivity_factor *= 0.6
        elif temperature > 35:
            cost_impact *= 1.2  # 20% cost increase for extreme heat
            duration_impact *= 1.3  # 30% duration increase
            safety_risk += 0.2
            productivity_factor *= 0.7
        
        # Weather condition impact
        if condition in ['rain', 'drizzle', 'thunderstorm']:
            cost_impact *= 1.25  # 25% cost increase
            duration_impact *= 1.5  # 50% duration increase
            safety_risk += 0.4
            productivity_factor *= 0.5
        elif condition in ['snow', 'mist', 'fog']:
            cost_impact *= 1.4  # 40% cost increase
            duration_impact *= 1.6  # 60% duration increase
            safety_risk += 0.5
            productivity_factor *= 0.4
        
        # Wind impact
        if wind_speed > 15:  # High wind
            cost_impact *= 1.15  # 15% cost increase
            duration_impact *= 1.2  # 20% duration increase
            safety_risk += 0.3
            productivity_factor *= 0.8
        
        # Precipitation probability impact
        if precipitation_prob > 70:
            cost_impact *= 1.2  # 20% cost increase
            duration_impact *= 1.3  # 30% duration increase
            safety_risk += 0.2
        
        return {
            'cost_multiplier': round(cost_impact, 2),
            'duration_multiplier': round(duration_impact, 2),
            'safety_risk': round(min(safety_risk, 1.0), 2),
            'productivity_factor': round(max(productivity_factor, 0.1), 2),
            'weather_score': round(1.0 - safety_risk, 2),
            'recommendations': self._generate_weather_recommendations(weather_data, cost_impact, duration_impact)
        }
    
    def _generate_weather_recommendations(self, weather_data: Dict[str, Any], cost_impact: float, duration_impact: float) -> List[str]:
        """Generate weather-specific recommendations"""
        recommendations = []
        
        condition = weather_data.get('weather_condition', 'Clear').lower()
        temperature = weather_data.get('temperature', 20)
        wind_speed = weather_data.get('wind_speed', 0)
        
        if temperature < 5:
            recommendations.append("Schedule concrete work during warmer hours")
            recommendations.append("Use heated enclosures for critical activities")
            recommendations.append("Implement cold weather protection measures")
        
        if temperature > 30:
            recommendations.append("Schedule heavy work during cooler morning hours")
            recommendations.append("Provide adequate hydration and rest breaks")
            recommendations.append("Use sun protection and cooling measures")
        
        if condition in ['rain', 'drizzle', 'thunderstorm']:
            recommendations.append("Postpone outdoor activities if possible")
            recommendations.append("Use weather-resistant materials and equipment")
            recommendations.append("Implement proper drainage and water management")
        
        if wind_speed > 15:
            recommendations.append("Avoid crane operations in high winds")
            recommendations.append("Secure loose materials and equipment")
            recommendations.append("Consider wind barriers for sensitive work")
        
        if cost_impact > 1.2:
            recommendations.append("Consider weather contingency planning")
            recommendations.append("Implement flexible scheduling strategies")
        
        if duration_impact > 1.3:
            recommendations.append("Allocate additional time buffers")
            recommendations.append("Consider parallel work streams")
        
        return recommendations[:5]  # Limit to 5 recommendations
    
    def _get_fallback_weather(self) -> Dict[str, Any]:
        """Fallback weather data when API fails"""
        return {
            'location': 'Unknown',
            'temperature': 20,
            'humidity': 60,
            'pressure': 1013,
            'wind_speed': 5,
            'wind_direction': 0,
            'weather_condition': 'Clear',
            'weather_description': 'Clear sky',
            'visibility': 10,
            'cloudiness': 20,
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_fallback_forecast(self, days: int) -> List[Dict[str, Any]]:
        """Fallback forecast data when API fails"""
        forecasts = []
        for i in range(days * 8):
            forecasts.append({
                'datetime': (datetime.now() + timedelta(hours=i*3)).strftime('%Y-%m-%d %H:%M:%S'),
                'temperature': 20 + (i % 3 - 1) * 5,
                'humidity': 60 + (i % 2) * 10,
                'pressure': 1013,
                'wind_speed': 5 + (i % 2) * 2,
                'weather_condition': 'Clear',
                'weather_description': 'Clear sky',
                'cloudiness': 20 + (i % 3) * 10,
                'precipitation_probability': (i % 4) * 10
            })
        return forecasts
