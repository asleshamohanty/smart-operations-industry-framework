import axios from 'axios';
import { supabase } from './supabase';
import {
  WeatherProviderConfig,
  WeatherData,
  WeatherProviderResponse,
  WeatherProviderListResponse,
  PredefinedProviderRequest,
  WeatherRequest
} from './weather-provider-types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor to include Supabase JWT token
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }
  return config;
});

class WeatherProviderService {
  /**
   * Add a custom weather provider configuration
   * @param config Weather provider configuration
   * @returns Provider response with ID
   */
  async addCustomProvider(config: WeatherProviderConfig): Promise<WeatherProviderResponse> {
    try {
      const response = await api.post('/weather-providers/providers', { config });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to add custom provider: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Add a predefined weather provider with API key
   * @param providerName Name of predefined provider
   * @param apiKey User's API key (optional for providers that don't need keys)
   * @returns Provider response with ID
   */
  async addPredefinedProvider(providerName: string, apiKey: string = ""): Promise<WeatherProviderResponse> {
    try {
      const request: PredefinedProviderRequest = {
        provider_name: providerName,
        api_key: apiKey
      };
      const response = await api.post('/weather-providers/providers/predefined', request);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to add predefined provider: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Get list of all available weather providers
   * @returns List of providers and predefined templates
   */
  async getProviders(): Promise<WeatherProviderListResponse> {
    try {
      const response = await api.get('/weather-providers/providers');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get providers: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Get configuration template for a predefined provider
   * @param providerName Name of predefined provider
   * @returns Configuration template
   */
  async getPredefinedProviderConfig(providerName: string): Promise<any> {
    try {
      const response = await api.get(`/weather-providers/providers/predefined/${providerName}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get provider config: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Get current weather data from a specific provider
   * @param providerId ID of the weather provider
   * @param location Location to get weather for
   * @returns Standardized weather data
   */
  async getCurrentWeather(providerId: string, location: string): Promise<WeatherData> {
    try {
      const request: WeatherRequest = {
        provider_id: providerId,
        location: location
      };
      const response = await api.post('/weather-providers/current', request);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get weather data: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Remove a weather provider
   * @param providerId ID of provider to remove
   * @returns Success message
   */
  async removeProvider(providerId: string): Promise<{ message: string; provider_id: string }> {
    try {
      const response = await api.delete(`/weather-providers/providers/${providerId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to remove provider: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Test a weather provider with sample data
   * @param providerId ID of provider to test
   * @param location Test location (default: London)
   * @returns Test results
   */
  async testProvider(providerId: string, location: string = 'London'): Promise<{
    success: boolean;
    message: string;
    test_data?: WeatherData;
    test_location: string;
  }> {
    try {
      const response = await api.post(`/weather-providers/test/${providerId}?location=${location}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to test provider: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Debug a weather provider by showing raw API response
   * @param providerId ID of provider to debug
   * @param location Test location (default: London)
   * @returns Debug results with raw API response
   */
  async debugProvider(providerId: string, location: string = 'London'): Promise<{
    success: boolean;
    provider_name: string;
    test_location: string;
    raw_api_response: any;
    configuration: any;
    extracted_values: any;
    message?: string;
  }> {
    try {
      const response = await api.post(`/weather-providers/debug/${providerId}?location=${location}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to debug provider: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Check weather service health
   * @returns Health status
   */
  async getHealthStatus(): Promise<{
    status: string;
    active_providers: number;
    predefined_templates: number;
    message: string;
  }> {
    try {
      const response = await api.get('/weather-providers/health');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get health status: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Validate weather provider configuration
   * @param config Configuration to validate
   * @returns Validation result
   */
  validateConfig(config: WeatherProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name?.trim()) {
      errors.push('Provider name is required');
    }

    if (!config.base_url?.trim()) {
      errors.push('Base URL is required');
    } else if (!this.isValidUrl(config.base_url)) {
      errors.push('Base URL must be a valid URL');
    }

    if (!config.key_param?.trim()) {
      errors.push('Key parameter name is required');
    }

    if (!config.key?.trim()) {
      errors.push('API key is required');
    }

    if (!config.city_param?.trim()) {
      errors.push('City parameter name is required');
    }

    if (!config.temperature_path?.trim()) {
      errors.push('Temperature path is required');
    }

    if (!config.humidity_path?.trim()) {
      errors.push('Humidity path is required');
    }

    if (!config.description_path?.trim()) {
      errors.push('Description path is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Set the active weather provider
   * @param providerId ID of provider to set as active
   * @returns Success response
   */
  async setActiveProvider(providerId: string): Promise<SetActiveProviderResponse> {
    try {
      const response = await api.post(`/weather-providers/active/${providerId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to set active provider: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Get the currently active weather provider
   * @returns Active provider information
   */
  async getActiveProvider(): Promise<ActiveProviderResponse> {
    try {
      const response = await api.get('/weather-providers/active');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get active provider: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Get weather data from the active provider
   * @param location Location to get weather for
   * @returns Weather data from active provider
   */
  async getWeatherFromActiveProvider(location: string): Promise<WeatherData> {
    try {
      const response = await api.get(`/weather-providers/weather/active?location=${encodeURIComponent(location)}`);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      throw new Error(`Failed to get weather from active provider: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Check if URL is valid
   * @param url URL to validate
   * @returns True if valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const weatherProviderService = new WeatherProviderService();
