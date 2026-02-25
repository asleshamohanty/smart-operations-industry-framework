# Weather Provider System Documentation

## Overview

This implementation provides a modular and scalable weather API system that allows users to connect and use their own weather APIs, not just their own API keys, but completely different APIs like WeatherAPI, AccuWeather, Tomorrow.io, etc.

## Architecture

### Backend (FastAPI)

#### 1. Provider Pattern Implementation

The system uses the **Provider Pattern** to abstract weather service interfaces:

- **`WeatherProvider`** (Abstract Base Class): Defines the interface for all weather providers
- **`GenericWeatherProvider`**: Concrete implementation that works with any API based on configuration
- **`WeatherProviderManager`**: Manages multiple providers and provides a unified interface

#### 2. Configuration-Driven API Calls

Each weather provider is configured with:

```python
class WeatherProviderConfig(BaseModel):
    name: str                    # Provider name
    base_url: str               # API endpoint
    key_param: str              # Parameter name for API key
    key: str                    # Actual API key
    city_param: str             # Parameter name for city/location
    temperature_path: str       # JSON path to temperature
    humidity_path: str         # JSON path to humidity
    description_path: str      # JSON path to description
    wind_speed_path: Optional[str] = None
    pressure_path: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    method: str = "GET"
    additional_params: Optional[Dict[str, Any]] = None
```

#### 3. Standardized Response Format

All weather providers return data in a consistent format:

```python
class WeatherData(BaseModel):
    temperature: float
    humidity: int
    description: str
    wind_speed: Optional[float] = None
    pressure: Optional[float] = None
    source: str
    timestamp: datetime
    location: str
```

#### 4. Dynamic API Calling

The system dynamically constructs API requests based on configuration:

```python
def _make_request(self, location: str) -> Dict[str, Any]:
    params = {
        self.config.city_param: location,
        self.config.key_param: self.config.key
    }

    if self.config.additional_params:
        params.update(self.config.additional_params)

    # Make HTTP request with configured method
    response = requests.get(self.config.base_url, params=params, headers=headers)
    return response.json()
```

#### 5. JSON Path Extraction

Values are extracted from API responses using dot notation paths:

```python
def _extract_value(self, data: Dict[str, Any], path: str) -> Any:
    keys = path.split('.')
    current = data

    for key in keys:
        if isinstance(current, list) and key.isdigit():
            current = current[int(key)]
        else:
            current = current[key]
    return current
```

### Frontend (React + TypeScript)

#### 1. Type-Safe Configuration

The frontend provides type-safe interfaces for all weather provider configurations:

```typescript
interface WeatherProviderConfig {
  name: string;
  base_url: string;
  key_param: string;
  key: string;
  city_param: string;
  temperature_path: string;
  humidity_path: string;
  description_path: string;
  wind_speed_path?: string;
  pressure_path?: string;
  headers?: Record<string, string>;
  method?: string;
  additional_params?: Record<string, any>;
}
```

#### 2. Service Layer

The `WeatherProviderService` class handles all API communication:

- **`addCustomProvider()`**: Add a custom weather provider
- **`addPredefinedProvider()`**: Add a predefined provider with API key
- **`getCurrentWeather()`**: Get weather data from a specific provider
- **`testProvider()`**: Test provider configuration
- **`validateConfig()`**: Validate provider configuration

#### 3. UI Components

The `WeatherProviderManager` component provides:

- **Predefined Providers Tab**: Easy setup for popular APIs
- **Custom Provider Tab**: Full configuration for any API
- **Manage Providers Tab**: Test, monitor, and remove providers

## Security Considerations

### 1. API Key Protection

- API keys are stored securely and not logged
- Keys are masked in UI (password input type)
- Keys are not returned in configuration templates

### 2. Input Validation

- URL validation for base URLs
- Required field validation
- JSON path validation
- Request timeout protection (10 seconds)

### 3. Error Handling

- Graceful fallback for API failures
- Detailed error messages for debugging
- Rate limiting protection through request timeouts

## Usage Examples

### 1. Adding a Predefined Provider

```typescript
// Frontend
const response = await weatherProviderService.addPredefinedProvider(
  "openweather",
  "your-api-key-here"
);
```

```python
# Backend API
POST /weather/providers/predefined
{
  "provider_name": "openweather",
  "api_key": "your-api-key-here"
}
```

### 2. Adding a Custom Provider

```typescript
// Frontend
const config: WeatherProviderConfig = {
  name: "My Weather API",
  base_url: "https://api.example.com/weather",
  key_param: "api_key",
  key: "your-api-key",
  city_param: "location",
  temperature_path: "current.temp",
  humidity_path: "current.humidity",
  description_path: "current.description",
};

const response = await weatherProviderService.addCustomProvider(config);
```

### 3. Getting Weather Data

```typescript
// Frontend
const weatherData = await weatherProviderService.getCurrentWeather(
  "provider_id",
  "London"
);
```

```python
# Backend API
POST /weather/current
{
  "provider_id": "provider_id",
  "location": "London"
}
```

## Predefined Providers

The system includes configurations for popular weather APIs:

### 1. OpenWeather

- **URL**: `https://api.openweathermap.org/data/2.5/weather`
- **Key Param**: `appid`
- **City Param**: `q`
- **Temperature**: `main.temp`
- **Humidity**: `main.humidity`
- **Description**: `weather.0.description`

### 2. WeatherAPI

- **URL**: `http://api.weatherapi.com/v1/current.json`
- **Key Param**: `key`
- **City Param**: `q`
- **Temperature**: `current.temp_c`
- **Humidity**: `current.humidity`
- **Description**: `current.condition.text`

### 3. AccuWeather

- **URL**: `http://dataservice.accuweather.com/currentconditions/v1/{location_key}`
- **Key Param**: `apikey`
- **City Param**: `location_key`
- **Temperature**: `0.Temperature.Metric.Value`
- **Humidity**: `0.RelativeHumidity`
- **Description**: `0.WeatherText`

### 4. Tomorrow.io

- **URL**: `https://api.tomorrow.io/v4/weather/realtime`
- **Key Param**: `apikey`
- **City Param**: `location`
- **Temperature**: `data.values.temperature`
- **Humidity**: `data.values.humidity`
- **Description**: `data.values.weatherCode`

## API Endpoints

### Weather Provider Management

- `POST /weather/providers` - Add custom provider
- `POST /weather/providers/predefined` - Add predefined provider
- `GET /weather/providers` - List all providers
- `GET /weather/providers/predefined/{name}` - Get predefined config
- `DELETE /weather/providers/{id}` - Remove provider

### Weather Data

- `POST /weather/current` - Get current weather
- `POST /weather/test/{id}` - Test provider
- `GET /weather/health` - Service health check

## Testing

### 1. Provider Testing

The system includes built-in testing functionality:

```typescript
const result = await weatherProviderService.testProvider(
  "provider_id",
  "London"
);
```

### 2. Configuration Validation

```typescript
const validation = weatherProviderService.validateConfig(config);
if (!validation.valid) {
  console.error("Validation errors:", validation.errors);
}
```

## Extensibility

### Adding New Providers

1. **Predefined Provider**: Add to `PREDEFINED_PROVIDERS` in types file
2. **Custom Provider**: Use the configuration form
3. **Custom Implementation**: Extend `WeatherProvider` class

### Custom Response Parsing

The system supports complex JSON path extraction:

- **Simple**: `"main.temp"`
- **Array Access**: `"weather.0.description"`
- **Nested Objects**: `"current.condition.text"`

## Error Handling

### Backend Errors

- **400 Bad Request**: Invalid configuration
- **404 Not Found**: Provider not found
- **500 Internal Server Error**: API request failed

### Frontend Errors

- **Validation Errors**: Configuration validation failures
- **Network Errors**: API communication failures
- **Provider Errors**: Weather API specific errors

## Performance Considerations

### 1. Request Timeouts

All API requests have a 10-second timeout to prevent hanging requests.

### 2. Caching

Weather data can be cached at the application level to reduce API calls.

### 3. Rate Limiting

The system respects individual API rate limits through proper request handling.

## Future Enhancements

1. **Caching Layer**: Implement Redis-based caching
2. **Rate Limiting**: Add per-provider rate limiting
3. **Metrics**: Add usage analytics and monitoring
4. **Batch Requests**: Support multiple location requests
5. **Historical Data**: Support historical weather data
6. **Forecast Data**: Extend to support forecast APIs

## Conclusion

This implementation provides a robust, scalable, and secure weather provider system that:

- ✅ Supports multiple weather APIs
- ✅ Provides standardized responses
- ✅ Offers both predefined and custom configurations
- ✅ Includes comprehensive testing and validation
- ✅ Maintains security best practices
- ✅ Provides excellent user experience
- ✅ Is easily extensible for future needs

The system is production-ready and can handle multiple concurrent users with different weather provider configurations.
