import requests
import os
from typing import Dict, Any, List, Tuple
import math
import random

# Try to load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If python-dotenv is not installed, continue without it
    pass

class WeatherService:
    def __init__(self):
        self.api_key = os.getenv("OPENWEATHER_API_KEY", "your_api_key_here")
        self.base_url = "http://api.openweathermap.org/data/2.5"
    
    def get_current_weather(self, location: str) -> Dict[str, Any]:
        """Get current weather data for a location"""
        if not self.api_key or self.api_key == "your_api_key_here":
            # Return realistic mock data based on location
            return self._get_mock_weather_data(location)
        
        try:
            url = f"{self.base_url}/weather"
            params = {
                "q": location,
                "appid": self.api_key,
                "units": "metric"
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return {
                "temperature": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "wind_speed": data["wind"]["speed"],
                "weather_condition": data["weather"][0]["main"],
                "rain": data.get("rain", {}).get("1h", 0),
                "location": location
            }
        except requests.exceptions.RequestException as e:
            print(f"Weather API failed, using mock data: {str(e)}")
            return self._get_mock_weather_data(location)
        except KeyError as e:
            print(f"Invalid weather data format, using mock data: {str(e)}")
            return self._get_mock_weather_data(location)
        except Exception as e:
            print(f"Weather API error, using mock data: {str(e)}")
            return self._get_mock_weather_data(location)
    
    def _get_mock_weather_data(self, location: str) -> Dict[str, Any]:
        """Generate realistic mock weather data based on location"""
        import random
        from datetime import datetime
        
        location_lower = location.lower()
        
        # Base weather conditions by region
        if any(x in location_lower for x in ["mumbai", "goa", "kochi", "chennai"]):
            # Coastal cities - more humid, moderate temps
            base_temp = random.uniform(25, 32)
            humidity = random.uniform(70, 90)
            wind_speed = random.uniform(8, 18)
            conditions = ["Clear", "Clouds", "Rain", "Drizzle"]
            rain_prob = 0.3
        elif any(x in location_lower for x in ["delhi", "lucknow", "kanpur", "agra"]):
            # North India - more temperature variation
            base_temp = random.uniform(15, 35)
            humidity = random.uniform(40, 70)
            wind_speed = random.uniform(5, 15)
            conditions = ["Clear", "Clouds", "Fog", "Mist"]
            rain_prob = 0.2
        elif any(x in location_lower for x in ["bangalore", "hyderabad", "pune"]):
            # South/Central India - moderate conditions
            base_temp = random.uniform(20, 30)
            humidity = random.uniform(50, 80)
            wind_speed = random.uniform(6, 12)
            conditions = ["Clear", "Clouds", "Rain"]
            rain_prob = 0.25
        elif any(x in location_lower for x in ["kolkata", "bhubaneswar", "guwahati"]):
            # East India - humid, rainy
            base_temp = random.uniform(22, 30)
            humidity = random.uniform(75, 95)
            wind_speed = random.uniform(5, 15)
            conditions = ["Rain", "Drizzle", "Clouds", "Thunderstorm"]
            rain_prob = 0.4
        elif any(x in location_lower for x in ["rajasthan", "jodhpur", "jaisalmer", "bikaner"]):
            # Desert regions - hot, dry
            base_temp = random.uniform(28, 42)
            humidity = random.uniform(20, 50)
            wind_speed = random.uniform(10, 25)
            conditions = ["Clear", "Clouds", "Dust"]
            rain_prob = 0.1
        else:
            # Default conditions
            base_temp = random.uniform(20, 30)
            humidity = random.uniform(50, 80)
            wind_speed = random.uniform(5, 15)
            conditions = ["Clear", "Clouds", "Rain"]
            rain_prob = 0.2
        
        # Add some randomness
        temp = base_temp + random.uniform(-3, 3)
        humidity = max(10, min(100, humidity + random.uniform(-10, 10)))
        wind_speed = max(0, wind_speed + random.uniform(-3, 3))
        
        # Determine weather condition
        if random.random() < rain_prob:
            weather_condition = random.choice(["Rain", "Drizzle", "Thunderstorm"])
            rain = random.uniform(2, 15)
        else:
            weather_condition = random.choice(conditions)
            rain = 0
        
        # Add seasonal variation (simplified)
        month = datetime.now().month
        if month in [6, 7, 8, 9]:  # Monsoon season
            rain_prob *= 2
            if random.random() < rain_prob:
                weather_condition = random.choice(["Rain", "Thunderstorm", "Drizzle"])
                rain = random.uniform(5, 25)
        
        return {
            "temperature": round(temp, 1),
            "humidity": round(humidity, 1),
            "pressure": round(random.uniform(1000, 1020), 1),
            "wind_speed": round(wind_speed, 1),
            "weather_condition": weather_condition,
            "rain": round(rain, 1),
            "visibility": round(random.uniform(5, 15), 1),
            "location": location
        }
    
    def get_weather_forecast(self, location: str, days: int = 5) -> List[Dict[str, Any]]:
        """Get weather forecast for a location"""
        if not self.api_key or self.api_key == "your_api_key_here":
            raise ValueError("OpenWeatherMap API key is required. Please set OPENWEATHER_API_KEY environment variable.")
        
        try:
            url = f"{self.base_url}/forecast"
            params = {
                "q": location,
                "appid": self.api_key,
                "units": "metric"
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            forecast = []
            for item in data["list"][:days * 8]:  # 8 forecasts per day (3-hour intervals)
                forecast.append({
                    "datetime": item["dt_txt"],
                    "temperature": item["main"]["temp"],
                    "humidity": item["main"]["humidity"],
                    "wind_speed": item["wind"]["speed"],
                    "weather_condition": item["weather"][0]["main"],
                    "rain": item.get("rain", {}).get("3h", 0)
                })
            
            return forecast
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch weather forecast: {str(e)}")
        except KeyError as e:
            raise Exception(f"Invalid weather forecast format: {str(e)}")
        except Exception as e:
            raise Exception(f"Weather forecast API error: {str(e)}")
    
    def calculate_disruption_score(self, weather_data: Dict[str, Any], material_type: str = None, location: str = None) -> float:
        """Calculate comprehensive weather disruption score (0-1) based on weather conditions, material type, and location"""
        disruption = 0.0
        
        # Get weather parameters
        temp = weather_data.get("temperature", 20)
        rain = weather_data.get("rain", 0)
        wind_speed = weather_data.get("wind_speed", 0)
        humidity = weather_data.get("humidity", 50)
        condition = weather_data.get("weather_condition", "").lower()
        
        # Material-specific sensitivity factors
        material_sensitivity = self._get_material_sensitivity(material_type)
        
        # Location-specific factors (seasonal, regional)
        location_factor = self._get_location_factor(location)
        
        # 1. Temperature Impact (more nuanced)
        temp_disruption = self._calculate_temperature_disruption(temp, material_type)
        disruption += temp_disruption * material_sensitivity["temperature"]
        
        # 2. Precipitation Impact (more detailed)
        rain_disruption = self._calculate_precipitation_disruption(rain, condition, material_type)
        disruption += rain_disruption * material_sensitivity["precipitation"]
        
        # 3. Wind Impact (considering material type)
        wind_disruption = self._calculate_wind_disruption(wind_speed, material_type)
        disruption += wind_disruption * material_sensitivity["wind"]
        
        # 4. Humidity Impact (for certain materials)
        humidity_disruption = self._calculate_humidity_disruption(humidity, material_type)
        disruption += humidity_disruption * material_sensitivity["humidity"]
        
        # 5. Weather Condition Impact (enhanced)
        condition_disruption = self._calculate_condition_disruption(condition, material_type)
        disruption += condition_disruption * material_sensitivity["condition"]
        
        # 6. Visibility Impact (for transportation)
        visibility = weather_data.get("visibility", 10)
        visibility_disruption = self._calculate_visibility_disruption(visibility)
        disruption += visibility_disruption * 0.3  # Weight for transport
        
        # Apply location factor
        disruption *= location_factor
        
        # Apply compound effects (weather combinations)
        disruption = self._apply_compound_effects(disruption, temp, rain, wind_speed, condition)
        
        return min(disruption, 1.0)  # Cap at 1.0
    
    def _get_material_sensitivity(self, material_type: str) -> Dict[str, float]:
        """Get material-specific sensitivity factors"""
        if not material_type:
            return {"temperature": 1.0, "precipitation": 1.0, "wind": 1.0, "humidity": 1.0, "condition": 1.0}
        
        material_lower = material_type.lower()
        
        # High sensitivity materials
        if any(x in material_lower for x in ["cement", "concrete", "steel", "iron"]):
            return {"temperature": 1.2, "precipitation": 1.5, "wind": 0.8, "humidity": 1.3, "condition": 1.4}
        
        # Medium sensitivity materials
        elif any(x in material_lower for x in ["sand", "gravel", "aggregate", "stone"]):
            return {"temperature": 0.8, "precipitation": 1.2, "wind": 1.1, "humidity": 0.9, "condition": 1.1}
        
        # Low sensitivity materials
        elif any(x in material_lower for x in ["wood", "timber", "plastic", "polymer"]):
            return {"temperature": 1.1, "precipitation": 0.9, "wind": 1.0, "humidity": 1.2, "condition": 0.8}
        
        # Default sensitivity
        return {"temperature": 1.0, "precipitation": 1.0, "wind": 1.0, "humidity": 1.0, "condition": 1.0}
    
    def _get_location_factor(self, location: str) -> float:
        """Get location-specific weather factor"""
        if not location:
            return 1.0
        
        location_lower = location.lower()
        
        # Coastal cities (more humidity, wind)
        if any(x in location_lower for x in ["mumbai", "chennai", "kolkata", "visakhapatnam", "kochi"]):
            return 1.1
        
        # Mountain regions (more temperature variation)
        elif any(x in location_lower for x in ["shimla", "srinagar", "manali", "darjeeling"]):
            return 1.2
        
        # Desert regions (extreme temperatures)
        elif any(x in location_lower for x in ["jaisalmer", "bikaner", "jodhpur", "rajasthan"]):
            return 1.15
        
        # Default factor
        return 1.0
    
    def _calculate_temperature_disruption(self, temp: float, material_type: str) -> float:
        """Calculate temperature-based disruption"""
        disruption = 0.0
        
        # Extreme cold
        if temp < -5:
            disruption += 0.4
        elif temp < 0:
            disruption += 0.3
        elif temp < 5:
            disruption += 0.2
        elif temp < 10:
            disruption += 0.1
        
        # Extreme heat
        elif temp > 45:
            disruption += 0.4
        elif temp > 40:
            disruption += 0.3
        elif temp > 35:
            disruption += 0.2
        elif temp > 30:
            disruption += 0.1
        
        # Material-specific temperature effects
        if material_type and "concrete" in material_type.lower():
            if temp < 5 or temp > 35:  # Concrete curing issues
                disruption += 0.2
        
        return disruption
    
    def _calculate_precipitation_disruption(self, rain: float, condition: str, material_type: str) -> float:
        """Calculate precipitation-based disruption"""
        disruption = 0.0
        
        # Rain intensity
        if rain > 50:  # Very heavy rain
            disruption += 0.5
        elif rain > 25:  # Heavy rain
            disruption += 0.4
        elif rain > 15:  # Moderate rain
            disruption += 0.3
        elif rain > 5:  # Light rain
            disruption += 0.2
        elif rain > 0:  # Drizzle
            disruption += 0.1
        
        # Weather condition impact
        if condition in ["thunderstorm", "storm"]:
            disruption += 0.3
        elif condition in ["rain", "drizzle"]:
            disruption += 0.1
        elif condition in ["snow", "hail"]:
            disruption += 0.4
        
        # Material-specific precipitation effects
        if material_type and any(x in material_type.lower() for x in ["cement", "concrete", "steel"]):
            if rain > 0:  # These materials are very sensitive to moisture
                disruption += 0.2
        
        return disruption
    
    def _calculate_wind_disruption(self, wind_speed: float, material_type: str) -> float:
        """Calculate wind-based disruption"""
        disruption = 0.0
        
        # Wind speed impact
        if wind_speed > 60:  # Very strong wind
            disruption += 0.4
        elif wind_speed > 40:  # Strong wind
            disruption += 0.3
        elif wind_speed > 25:  # Moderate wind
            disruption += 0.2
        elif wind_speed > 15:  # Light wind
            disruption += 0.1
        
        # Material-specific wind effects
        if material_type and any(x in material_type.lower() for x in ["sand", "gravel", "dust"]):
            if wind_speed > 20:  # Loose materials affected by wind
                disruption += 0.2
        
        return disruption
    
    def _calculate_humidity_disruption(self, humidity: float, material_type: str) -> float:
        """Calculate humidity-based disruption"""
        disruption = 0.0
        
        # High humidity
        if humidity > 90:
            disruption += 0.3
        elif humidity > 80:
            disruption += 0.2
        elif humidity > 70:
            disruption += 0.1
        
        # Low humidity
        elif humidity < 20:
            disruption += 0.2
        elif humidity < 30:
            disruption += 0.1
        
        # Material-specific humidity effects
        if material_type and any(x in material_type.lower() for x in ["wood", "timber", "paper"]):
            if humidity > 80:  # Wood expands with humidity
                disruption += 0.15
        
        return disruption
    
    def _calculate_condition_disruption(self, condition: str, material_type: str) -> float:
        """Calculate weather condition-based disruption"""
        disruption = 0.0
        
        # Severe weather conditions
        if condition in ["thunderstorm", "storm", "hurricane", "typhoon"]:
            disruption += 0.5
        elif condition in ["snow", "blizzard", "hail"]:
            disruption += 0.4
        elif condition in ["fog", "mist", "smog"]:
            disruption += 0.3
        elif condition in ["rain", "drizzle", "shower"]:
            disruption += 0.2
        elif condition in ["clouds", "overcast"]:
            disruption += 0.05
        
        return disruption
    
    def _calculate_visibility_disruption(self, visibility: float) -> float:
        """Calculate visibility-based disruption for transportation"""
        disruption = 0.0
        
        if visibility < 1:  # Very poor visibility
            disruption += 0.4
        elif visibility < 3:  # Poor visibility
            disruption += 0.3
        elif visibility < 5:  # Reduced visibility
            disruption += 0.2
        elif visibility < 10:  # Moderate visibility
            disruption += 0.1
        
        return disruption
    
    def _apply_compound_effects(self, base_disruption: float, temp: float, rain: float, wind: float, condition: str) -> float:
        """Apply compound weather effects"""
        compound_factor = 1.0
        
        # Hot and humid (very uncomfortable)
        if temp > 30 and rain > 0:
            compound_factor += 0.2
        
        # Cold and windy (wind chill effect)
        if temp < 10 and wind > 20:
            compound_factor += 0.15
        
        # Rain and wind (storm conditions)
        if rain > 10 and wind > 25:
            compound_factor += 0.25
        
        # Severe weather combinations
        if condition in ["thunderstorm", "storm"] and wind > 30:
            compound_factor += 0.3
        
        return base_disruption * compound_factor
    
    def get_multiple_cities_weather(self, cities: List[str]) -> Dict[str, Dict[str, Any]]:
        """Get weather data for multiple cities in batch"""
        if not self.api_key or self.api_key == "your_api_key_here":
            raise ValueError("OpenWeatherMap API key is required. Please set OPENWEATHER_API_KEY environment variable.")
        
        weather_data = {}
        
        # Process cities in batches of 20 (API limit)
        batch_size = 20
        for i in range(0, len(cities), batch_size):
            batch = cities[i:i + batch_size]
            
            try:
                # Use group weather API for batch requests
                city_ids = []
                for city in batch:
                    # For simplicity, we'll make individual requests
                    # In production, you'd use city IDs for batch requests
                    try:
                        weather_data[city] = self.get_current_weather(city)
                    except Exception as e:
                        print(f"Failed to get weather for {city}: {str(e)}")
                        # Provide fallback data
                        weather_data[city] = {
                            "temperature": random.uniform(20, 30),
                            "humidity": random.uniform(40, 80),
                            "pressure": random.uniform(1000, 1020),
                            "wind_speed": random.uniform(5, 15),
                            "weather_condition": random.choice(["Clear", "Clouds", "Rain"]),
                            "rain": random.uniform(0, 5),
                            "location": city
                        }
                        
            except Exception as e:
                print(f"Batch weather request failed: {str(e)}")
                # Provide fallback data for all cities in batch
                for city in batch:
                    weather_data[city] = {
                        "temperature": random.uniform(20, 30),
                        "humidity": random.uniform(40, 80),
                        "pressure": random.uniform(1000, 1020),
                        "wind_speed": random.uniform(5, 15),
                        "weather_condition": random.choice(["Clear", "Clouds", "Rain"]),
                        "rain": random.uniform(0, 5),
                        "location": city
                    }
        
        return weather_data
    
    def calculate_route_cities(self, origin: str, destination: str) -> List[str]:
        """Calculate intermediate cities along a route"""
        # Extract city names from location strings
        origin_city = self.extract_city_name(origin)
        dest_city = self.extract_city_name(destination)
        
        # Define major Indian cities and their approximate coordinates
        major_cities = {
            "Mumbai": (19.0760, 72.8777),
            "Delhi": (28.7041, 77.1025),
            "Bangalore": (12.9716, 77.5946),
            "Chennai": (13.0827, 80.2707),
            "Kolkata": (22.5726, 88.3639),
            "Hyderabad": (17.3850, 78.4867),
            "Pune": (18.5204, 73.8567),
            "Ahmedabad": (23.0225, 72.5714),
            "Jaipur": (26.9124, 75.7873),
            "Surat": (21.1702, 72.8311),
            "Lucknow": (26.8467, 80.9462),
            "Kanpur": (26.4499, 80.3319),
            "Nagpur": (21.1458, 79.0882),
            "Indore": (22.7196, 75.8577),
            "Thane": (19.2183, 72.9781),
            "Bhopal": (23.2599, 77.4126),
            "Visakhapatnam": (17.6868, 83.2185),
            "Patna": (25.5941, 85.1376),
            "Vadodara": (22.3072, 73.1812),
            "Ghaziabad": (28.6692, 77.4538),
            "Ludhiana": (30.9010, 75.8573),
            "Agra": (27.1767, 78.0081),
            "Nashik": (19.9975, 73.7898),
            "Faridabad": (28.4089, 77.3178),
            "Meerut": (28.9845, 77.7064),
            "Rajkot": (22.3039, 70.8022),
            "Kalyan": (19.2403, 73.1305),
            "Vasai": (19.4700, 72.8000),
            "Varanasi": (25.3176, 82.9739),
            "Srinagar": (34.0837, 74.7973),
            "Aurangabad": (19.8762, 75.3433),
            "Navi Mumbai": (19.0330, 73.0297),
            "Solapur": (17.6599, 75.9064),
            "Vijayawada": (16.5062, 80.6480),
            "Kolhapur": (16.7050, 74.2433),
            "Amritsar": (31.6340, 74.8723),
            "Noida": (28.5355, 77.3910),
            "Ranchi": (23.3441, 85.3096),
            "Howrah": (22.5958, 88.2636),
            "Coimbatore": (11.0168, 76.9558),
            "Raipur": (21.2514, 81.6296),
            "Jabalpur": (23.1815, 79.9864),
            "Gwalior": (26.2183, 78.1828),
            "Chandigarh": (30.7333, 76.7794),
            "Tiruchirappalli": (10.7905, 78.7047),
            "Mysore": (12.2958, 76.6394),
            "Bhubaneswar": (20.2961, 85.8245),
            "Kochi": (9.9312, 76.2673),
            "Bhavnagar": (21.7645, 72.1519),
            "Salem": (11.6643, 78.1460),
            "Warangal": (18.0000, 79.5833),
            "Guntur": (16.3067, 80.4365),
            "Bhiwandi": (19.3002, 73.0581),
            "Amravati": (20.9374, 77.7796),
            "Nanded": (19.1383, 77.3210),
            "Sangli": (16.8524, 74.5815),
            "Malegaon": (20.5609, 74.5250),
            "Ulhasnagar": (19.2167, 73.1500),
            "Jalgaon": (21.0077, 75.5626),
            "Latur": (18.4088, 76.5604),
            "Ahmadnagar": (19.0946, 74.7384),
            "Dhule": (20.9019, 74.7774),
            "Ichalkaranji": (16.7000, 74.4667),
            "Parbhani": (19.2500, 76.7833),
            "Jalna": (19.8410, 75.8864),
            "Bhusawal": (21.0500, 75.7667),
            "Panvel": (18.9881, 73.1102),
            "Satara": (17.6805, 73.9933),
            "Beed": (18.9894, 75.7560),
            "Yavatmal": (20.4000, 78.1333),
            "Kamptee": (21.2333, 79.2000),
            "Gondia": (21.4500, 80.2000),
            "Barshi": (18.2333, 75.7000),
            "Achalpur": (21.2500, 77.5000),
            "Osmanabad": (18.1667, 76.0500),
            "Nandurbar": (21.3667, 74.2500),
            "Wardha": (20.7500, 78.6000),
            "Udgir": (18.3833, 77.1167),
            "Hinganghat": (20.5500, 78.8333),
            "Akola": (20.7000, 77.0000),
            "Amalner": (20.9333, 75.0667),
            "Chalisgaon": (20.4500, 75.0167),
            "Bhadravati": (19.3000, 75.9000),
            "Sangamner": (19.5667, 74.2167),
            "Lonavla": (18.7500, 73.4000),
            "Deolali": (19.9500, 73.8333),
            "Yeola": (20.0333, 74.4833),
            "Umarkhed": (19.6000, 77.7000),
            "Warud": (21.4667, 78.2667),
            "Pusad": (19.9167, 77.5667),
            "Uran": (18.8833, 72.9500),
            "Malkapur": (20.8833, 76.2000),
            "Mukhed": (18.7000, 77.3667),
            "Mehkar": (20.1500, 76.5667),
            "Yawal": (21.0333, 75.7000),
            "Digras": (20.1000, 77.7167),
            "Anjangaon": (21.1667, 77.3000),
            "Lonar": (19.9833, 76.5167),
            "Deulgaon Raja": (20.0167, 76.0333),
            "Shirpur": (21.3500, 74.8833),
            "Savner": (21.3833, 78.8333),
            "Tasgaon": (17.0333, 74.6000)
        }
        
        # If origin or destination not in major cities, use them as-is
        route_cities = [origin_city]
        
        if origin_city in major_cities and dest_city in major_cities:
            # Calculate intermediate cities based on distance
            origin_coords = major_cities[origin_city]
            dest_coords = major_cities[dest_city]
            
            # Find cities that are roughly on the path
            intermediate_cities = []
            for city, coords in major_cities.items():
                if city != origin_city and city != dest_city:
                    # Calculate if city is roughly on the path (simplified)
                    dist_to_origin = self.calculate_distance(origin_coords, coords)
                    dist_to_dest = self.calculate_distance(coords, dest_coords)
                    total_dist = self.calculate_distance(origin_coords, dest_coords)
                    
                    # If city is roughly on the path (within 20% of direct distance)
                    if dist_to_origin + dist_to_dest <= total_dist * 1.2:
                        intermediate_cities.append((city, dist_to_origin))
            
            # Sort by distance from origin and take up to 3 intermediate cities
            intermediate_cities.sort(key=lambda x: x[1])
            for city, _ in intermediate_cities[:3]:
                route_cities.append(city)
        
        route_cities.append(dest_city)
        return route_cities
    
    def calculate_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """Calculate distance between two coordinates using Haversine formula"""
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        return c * r
    
    def extract_city_name(self, location: str) -> str:
        """Extract city name from location string"""
        # Common city names to look for
        cities = [
            "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad",
            "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
            "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik",
            "Faridabad", "Meerut", "Rajkot", "Kalyan", "Vasai", "Varanasi", "Srinagar",
            "Aurangabad", "Navi Mumbai", "Solapur", "Vijayawada", "Kolhapur", "Amritsar", "Noida",
            "Ranchi", "Howrah", "Coimbatore", "Raipur", "Jabalpur", "Gwalior", "Chandigarh",
            "Tiruchirappalli", "Mysore", "Bhubaneswar", "Kochi", "Bhavnagar", "Salem", "Warangal",
            "Guntur", "Bhiwandi", "Amravati", "Nanded", "Sangli", "Malegaon", "Ulhasnagar",
            "Jalgaon", "Latur", "Ahmadnagar", "Dhule", "Ichalkaranji", "Parbhani", "Jalna",
            "Bhusawal", "Panvel", "Satara", "Beed", "Yavatmal", "Kamptee", "Gondia", "Barshi",
            "Achalpur", "Osmanabad", "Nandurbar", "Wardha", "Udgir", "Hinganghat", "Akola",
            "Amalner", "Chalisgaon", "Bhadravati", "Sangamner", "Lonavla", "Deolali", "Yeola",
            "Umarkhed", "Warud", "Pusad", "Uran", "Malkapur", "Mukhed", "Mehkar", "Yawal",
            "Digras", "Anjangaon", "Lonar", "Deulgaon Raja", "Shirpur", "Savner", "Tasgaon"
        ]
        
        # Check if any city name is in the location string
        for city in cities:
            if city.lower() in location.lower():
                return city
        
        # If no city found, try to extract the first word
        words = location.split()
        if words:
            return words[0]
        
        # Fallback to original location
        return location
    
    def get_enroute_weather(self, origin: str, destination: str) -> Dict[str, Any]:
        """Get weather data for all cities along a shipment route"""
        try:
            # Calculate route cities
            route_cities = self.calculate_route_cities(origin, destination)
            
            # Get weather for all cities along the route
            weather_data = self.get_multiple_cities_weather(route_cities)
            
            # Calculate overall route disruption
            total_disruption = 0
            max_disruption = 0
            severe_weather_cities = []
            
            for city, weather in weather_data.items():
                disruption = self.calculate_disruption_score(weather)
                total_disruption += disruption
                max_disruption = max(max_disruption, disruption)
                
                if disruption > 0.7:
                    severe_weather_cities.append({
                        "city": city,
                        "disruption": disruption,
                        "weather": weather
                    })
            
            avg_disruption = total_disruption / len(weather_data) if weather_data else 0
            
            # Determine overall route status
            if max_disruption > 0.7:
                route_status = "severe_delay"
                delay_days = random.randint(3, 7)
            elif max_disruption > 0.4 or avg_disruption > 0.3:
                route_status = "moderate_delay"
                delay_days = random.randint(1, 3)
            else:
                route_status = "on_time"
                delay_days = 0
            
            return {
                "route_cities": route_cities,
                "weather_data": weather_data,
                "overall_disruption": max_disruption,
                "average_disruption": avg_disruption,
                "route_status": route_status,
                "estimated_delay_days": delay_days,
                "severe_weather_cities": severe_weather_cities,
                "route_summary": {
                    "total_cities": len(route_cities),
                    "severe_weather_count": len(severe_weather_cities),
                    "worst_weather_city": severe_weather_cities[0]["city"] if severe_weather_cities else None
                }
            }
            
        except Exception as e:
            print(f"Enroute weather analysis failed: {str(e)}")
            # Return fallback data
            return {
                "route_cities": [self.extract_city_name(origin), self.extract_city_name(destination)],
                "weather_data": {},
                "overall_disruption": 0.1,
                "average_disruption": 0.1,
                "route_status": "on_time",
                "estimated_delay_days": 0,
                "severe_weather_cities": [],
                "route_summary": {
                    "total_cities": 2,
                    "severe_weather_count": 0,
                    "worst_weather_city": None
                }
            }
    
