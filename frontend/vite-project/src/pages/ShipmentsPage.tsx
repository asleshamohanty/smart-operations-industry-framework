import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Truck,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  CloudRain,
  Sun,
  Zap,
} from "lucide-react";
import ShipmentsCacheService from "@/lib/shipments-cache";
import { apiService, API_BASE_URL } from "@/lib/api-services";

interface Shipment {
  shipment_id: string;
  project_id: number;
  project_name: string;
  material_type: string;
  quantity: number;
  unit: string;
  origin: string;
  destination: string;
  status: string;
  estimated_arrival: string;
  actual_arrival?: string;
  weather_delay_days: number;
  weather_condition: string;
  created_at: string;
  updated_at: string;
}

interface WeatherImpact {
  location: string;
  weather_condition: string;
  temperature: number;
  rain: number;
  wind_speed: number;
  disruption_score: number;
  impact_level: string;
  delay_range: string;
  emoji: string;
  color: string;
  recommendations: string[];
}

export const ShipmentsPage = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherImpacts, setWeatherImpacts] = useState<
    Map<string, WeatherImpact>
  >(new Map());
  const [highlightedProjectId, setHighlightedProjectId] = useState<
    number | null
  >(null);
  const [cacheStatus, setCacheStatus] = useState<{
    isValid: boolean;
    hasData: boolean;
    expiresIn: number;
    dataCount: number;
  } | null>(null);

  useEffect(() => {
    loadShipments();

    // Check if we should highlight a specific project
    const projectId = sessionStorage.getItem("highlightProjectId");
    if (projectId) {
      setHighlightedProjectId(parseInt(projectId));
      // Clear the session storage after reading
      sessionStorage.removeItem("highlightProjectId");

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedProjectId(null);
      }, 3000);
    }
  }, []);

  const loadShipments = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first (unless force refresh is requested)
      if (!forceRefresh) {
        const cacheService = ShipmentsCacheService.getInstance();
        const cachedData = cacheService.getCachedData();

        if (cachedData) {
          console.log("Using cached shipments data");
          setShipments(cachedData);

          // Update cache status
          setCacheStatus(cacheService.getCacheStatus());

          // Load weather impacts for cached data
          const uniqueOrigins = [
            ...new Set(cachedData.map((s: Shipment) => s.origin)),
          ];
          if (uniqueOrigins.length > 0) {
            await loadWeatherImpacts(uniqueOrigins);
          }

          setLoading(false);
          return;
        }
      }

      console.log("Fetching fresh shipments data from API");

      // First check loading status
      const statusResponse = await fetch(
        `${API_BASE_URL}/shipments/loading-status`
      );
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log("Shipments loading status:", statusData);
      }

      // Load shipments with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE_URL}/shipments/`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch shipments: ${response.status}`);
      }

      const data = await response.json();
      setShipments(data);

      // Cache the data
      const cacheService = ShipmentsCacheService.getInstance();
      cacheService.setCachedData(data);

      // Update cache status
      setCacheStatus(cacheService.getCacheStatus());

      // Load weather impacts for each unique origin (import location) - only if needed
      const uniqueOrigins = [
        ...new Set(data.map((s: Shipment) => s.origin)),
      ] as string[];
      if (uniqueOrigins.length > 0) {
        await loadWeatherImpacts(uniqueOrigins);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Shipments loading timed out. Please try again.");
      } else {
        setError(`Failed to load shipments: ${err.message}`);
      }
      console.error("Error loading shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadWeatherImpacts = async (origins: string[]) => {
    const impacts = new Map<string, WeatherImpact>();

    for (const origin of origins) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/shipments/weather/${origin}/impact`
        );
        if (response.ok) {
          const impact = await response.json();
          impacts.set(origin, impact);
        }
      } catch (err) {
        console.error(`Failed to load weather impact for ${origin}:`, err);
      }
    }

    setWeatherImpacts(impacts);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getWeatherEmoji = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return "☀️";
      case "clouds":
        return "☁️";
      case "rain":
        return "🌧️";
      case "drizzle":
        return "🌦️";
      case "thunderstorm":
        return "⛈️";
      case "storm":
        return "⛈️";
      case "snow":
        return "❄️";
      case "fog":
        return "🌫️";
      case "mist":
        return "🌫️";
      case "dust":
        return "🌪️";
      case "haze":
        return "🌫️";
      default:
        return "🌤️";
    }
  };

  const getWeatherWord = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return "Clear";
      case "clouds":
        return "Cloudy";
      case "rain":
        return "Rainy";
      case "drizzle":
        return "Drizzle";
      case "thunderstorm":
        return "Storm";
      case "storm":
        return "Storm";
      case "snow":
        return "Snow";
      case "fog":
        return "Foggy";
      case "mist":
        return "Misty";
      case "dust":
        return "Dusty";
      case "haze":
        return "Hazy";
      default:
        return "Fair";
    }
  };

  const getWeatherCardColor = (impactLevel: string) => {
    switch (impactLevel) {
      case "critical":
        return "border-red-300 bg-red-100";
      case "severe":
        return "border-red-200 bg-red-50";
      case "moderate":
        return "border-orange-200 bg-orange-50";
      case "minor":
        return "border-yellow-200 bg-yellow-50";
      case "minimal":
        return "border-green-200 bg-green-50";
      default:
        return "border-border bg-muted";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="mb-6">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Loading Shipments...
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                Generating shipments from materials and fetching weather data.
                This may take a moment for the first load, but subsequent loads
                will be faster thanks to caching.
              </p>
              <div className="w-full max-w-sm">
                <div className="bg-muted rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full animate-pulse"
                    style={{ width: "60%" }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Optimizing weather data and shipment generation...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Shipments</h1>
            <p className="text-muted-foreground">
              Track material shipments with real-time weather updates
            </p>
          </div>
          <Button
            onClick={() => loadShipments(true)}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Cache Status Indicator */}
        {cacheStatus && cacheStatus.isValid && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <span>
                  Using cached data ({cacheStatus.dataCount} shipments) -
                  expires in {Math.round(cacheStatus.expiresIn / 1000 / 60)}{" "}
                  minutes
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const cacheService = ShipmentsCacheService.getInstance();
                    cacheService.forceRefresh();
                    loadShipments(true);
                  }}
                  className="ml-4"
                >
                  Force Refresh
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Shipments Grid */}
        {shipments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No shipments found
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Shipments will appear here once they are created
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shipments.map((shipment) => {
              const weatherImpact = weatherImpacts.get(shipment.origin);
              return (
                <Card
                  key={shipment.shipment_id}
                  className={`hover:shadow-lg transition-all duration-500 ${
                    highlightedProjectId === shipment.project_id
                      ? "ring-2 ring-blue-500 bg-blue-50 shadow-lg"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {shipment.material_type}
                        </CardTitle>
                        <div className="text-sm text-muted-foreground mt-1">
                          Project: {shipment.project_name}
                        </div>
                        <CardDescription className="flex items-center space-x-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{shipment.origin}</span>
                        </CardDescription>
                        {weatherImpact && (
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-lg">
                              {getWeatherEmoji(weatherImpact.weather_condition)}
                            </span>
                            <span className="text-sm font-medium">
                              {getWeatherWord(weatherImpact.weather_condition)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {weatherImpact.weather_condition} between{" "}
                              {shipment.origin} and {shipment.destination}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getStatusColor(shipment.status)}>
                          {shipment.status.replace("_", " ")}
                        </Badge>
                        {shipment.weather_delay_days > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            +{shipment.weather_delay_days} day
                            {shipment.weather_delay_days > 1 ? "s" : ""} delay
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Quantity</span>
                        <span className="font-medium">
                          {shipment.quantity} {shipment.unit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Origin</span>
                        <span className="font-medium text-sm">
                          {shipment.origin}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Estimated Arrival
                        </span>
                        <span className="font-medium">
                          {formatDate(shipment.estimated_arrival)}
                        </span>
                      </div>

                      {shipment.weather_delay_days > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-600">
                            Weather Delay
                          </span>
                          <span className="font-medium text-red-600">
                            +{shipment.weather_delay_days} days
                          </span>
                        </div>
                      )}

                      {shipment.actual_arrival && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600">
                            Actual Arrival
                          </span>
                          <span className="font-medium text-green-600">
                            {formatDate(shipment.actual_arrival)}
                          </span>
                        </div>
                      )}

                      {/* Weather Status */}
                      {weatherImpact && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">
                                {getWeatherEmoji(
                                  weatherImpact.weather_condition
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {weatherImpact.temperature}°C
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  weatherImpact.impact_level === "critical"
                                    ? "bg-red-100 text-red-700"
                                    : weatherImpact.impact_level === "severe"
                                    ? "bg-red-50 text-red-600"
                                    : weatherImpact.impact_level === "moderate"
                                    ? "bg-orange-50 text-orange-600"
                                    : weatherImpact.impact_level === "minor"
                                    ? "bg-yellow-50 text-yellow-600"
                                    : "bg-green-50 text-green-600"
                                }`}
                              >
                                {weatherImpact.impact_level}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {(weatherImpact.disruption_score * 100).toFixed(
                                  0
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {weatherImpact &&
                        weatherImpact.recommendations.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">
                              Recommendations:
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {weatherImpact.recommendations
                                .slice(0, 2)
                                .map((rec, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start space-x-1"
                                  >
                                    <span className="text-blue-500 mt-0.5">
                                      •
                                    </span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {shipments.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Total Shipments</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {shipments.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Delivered</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {shipments.filter((s) => s.status === "delivered").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Delayed</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {shipments.filter((s) => s.status === "delayed").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">In Transit</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {shipments.filter((s) => s.status === "in_transit").length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
