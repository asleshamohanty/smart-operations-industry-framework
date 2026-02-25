// Weather Provider Types
export interface WeatherProviderConfig {
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

export interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  wind_speed?: number;
  pressure?: number;
  source: string;
  timestamp: string;
  location: string;
}

export interface WeatherProviderResponse {
  provider_id: string;
  name: string;
  message: string;
}

export interface WeatherProviderListResponse {
  providers: Record<string, {
    name: string;
    base_url: string;
    has_key: boolean;
  }>;
  predefined: string[];
}

export interface PredefinedProviderRequest {
  provider_name: string;
  api_key?: string; // Optional for providers that don't need API keys
}

export interface WeatherRequest {
  provider_id: string;
  location: string;
}

export interface ActiveProviderResponse {
  success: boolean;
  provider_id?: string;
  provider_name?: string;
  base_url?: string;
  has_key?: boolean;
  message?: string;
}

export interface SetActiveProviderResponse {
  success: boolean;
  message: string;
  provider_id: string;
  provider_name: string;
}

// Predefined provider configurations
export const PREDEFINED_PROVIDERS = {
  openweather: {
    name: "OpenWeather",
    description: "Free weather API with comprehensive data",
    base_url: "https://api.openweathermap.org/data/2.5/weather",
    key_param: "appid",
    city_param: "q",
    temperature_path: "main.temp",
    humidity_path: "main.humidity",
    description_path: "weather.0.description",
    wind_speed_path: "wind.speed",
    pressure_path: "main.pressure",
    website: "https://openweathermap.org/api"
  },
  weatherapi: {
    name: "WeatherAPI",
    description: "High-performance weather API",
    base_url: "http://api.weatherapi.com/v1/current.json",
    key_param: "key",
    city_param: "q",
    temperature_path: "current.temp_c",
    humidity_path: "current.humidity",
    description_path: "current.condition.text",
    wind_speed_path: "current.wind_kph",
    pressure_path: "current.pressure_mb",
    website: "https://www.weatherapi.com/"
  },
  accuweather: {
    name: "AccuWeather",
    description: "Professional weather data provider",
    base_url: "http://dataservice.accuweather.com/currentconditions/v1/{location_key}",
    key_param: "apikey",
    city_param: "location_key",
    temperature_path: "0.Temperature.Metric.Value",
    humidity_path: "0.RelativeHumidity",
    description_path: "0.WeatherText",
    wind_speed_path: "0.Wind.Speed.Metric.Value",
    pressure_path: "0.Pressure.Metric.Value",
    website: "https://developer.accuweather.com/"
  },
  tomorrow: {
    name: "Tomorrow.io",
    description: "AI-powered weather intelligence",
    base_url: "https://api.tomorrow.io/v4/weather/realtime",
    key_param: "apikey",
    city_param: "location",
    temperature_path: "data.values.temperature",
    humidity_path: "data.values.humidity",
    description_path: "data.values.weatherCode",
    wind_speed_path: "data.values.windSpeed",
    pressure_path: "data.values.pressureSurfaceLevel",
    additional_params: { units: "metric" },
    website: "https://www.tomorrow.io/weather-api"
  },
  imd_current: {
    name: "IMD Current Weather",
    description: "Official Indian Meteorological Department current weather data",
    base_url: "https://mausam.imd.gov.in/api/current_wx_api.php",
    key_param: "",
    city_param: "id",
    temperature_path: "CURR_TEMP",
    humidity_path: "RH",
    description_path: "MEATHER_CODE",
    wind_speed_path: "WIND_SPEED",
    pressure_path: "MSLP",
    website: "https://mausam.imd.gov.in/"
  },
  imd_forecast: {
    name: "IMD 7-Day Forecast",
    description: "Official IMD 7-day weather forecast for Indian cities (Requires IP whitelisting)",
    base_url: "https://city.imd.gov.in/api/cityweather.php",
    key_param: "",
    city_param: "id",
    temperature_path: "Todays_Forecast_Max_Temp",
    humidity_path: "Relative_Humidity_at_0830",
    description_path: "Todays_Forecast",
    wind_speed_path: "",
    pressure_path: "",
    website: "https://city.imd.gov.in/"
  },
  imd_nowcast: {
    name: "IMD District Nowcast",
    description: "IMD short-term weather forecast for Indian districts",
    base_url: "https://mausam.imd.gov.in/api/nowcast_district_api.php",
    key_param: "",
    city_param: "id",
    temperature_path: "",
    humidity_path: "",
    description_path: "",
    wind_speed_path: "",
    pressure_path: "",
    website: "https://mausam.imd.gov.in/"
  },
  imd_rainfall: {
    name: "IMD District Rainfall",
    description: "IMD rainfall data for Indian districts",
    base_url: "https://mausam.imd.gov.in/api/districtwise_rainfall_api.php",
    key_param: "",
    city_param: "",
    temperature_path: "",
    humidity_path: "",
    description_path: "",
    wind_speed_path: "",
    pressure_path: "",
    website: "https://mausam.imd.gov.in/"
  },
  imd_warnings: {
    name: "IMD District Warnings",
    description: "IMD weather warnings for Indian districts",
    base_url: "https://mausam.imd.gov.in/api/warnings_district_api.php",
    key_param: "",
    city_param: "id",
    temperature_path: "",
    humidity_path: "",
    description_path: "",
    wind_speed_path: "",
    pressure_path: "",
    website: "https://mausam.imd.gov.in/"
  }
} as const;

export type PredefinedProviderName = keyof typeof PREDEFINED_PROVIDERS;
