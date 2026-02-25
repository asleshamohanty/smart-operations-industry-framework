import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Material } from "./DynamicMaterials";
import { API_BASE_URL } from "@/lib/api-services";

interface MaterialWeatherStatus {
  material: string;
  quantity: number;
  unit: string;
  status: "on_time" | "delayed" | "delivered";
  weather_condition: string;
  delay_days: number;
  emoji: string;
}

interface MaterialWeatherProps {
  projectId: number;
  location: string;
  materials: Material[];
}

export const MaterialWeatherStatus: React.FC<MaterialWeatherProps> = ({
  projectId,
  location,
  materials,
}) => {
  const [materialStatuses, setMaterialStatuses] = useState<
    MaterialWeatherStatus[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterialWeatherStatus();
  }, [projectId, location]);

  const loadMaterialWeatherStatus = async () => {
    try {
      setLoading(true);

      // Get shipments for this project
      const shipmentsResponse = await fetch(
        `${API_BASE_URL}/shipments/project/${projectId}`
      );
      if (!shipmentsResponse.ok) {
        throw new Error("Failed to fetch shipments");
      }
      const shipments = await shipmentsResponse.json();

      // Get weather impact for the location
      const weatherResponse = await fetch(
        `${API_BASE_URL}/shipments/weather/${location}/impact`
      );
      if (!weatherResponse.ok) {
        throw new Error("Failed to fetch weather impact");
      }
      const weatherImpact = await weatherResponse.json();

      // Create material statuses based on materials array
      const statuses: MaterialWeatherStatus[] = [];

      for (const material of materials) {
        // Find corresponding shipment
        const shipment = shipments.find(
          (s: any) =>
            s.material_type.toLowerCase() === material.name.toLowerCase()
        );

        let status: "on_time" | "delayed" | "delivered" = "on_time";
        let delay_days = 0;
        let weather_condition = weatherImpact.weather_condition;

        if (shipment) {
          status =
            shipment.status === "delivered"
              ? "delivered"
              : shipment.status === "delayed"
              ? "delayed"
              : "on_time";
          delay_days = shipment.weather_delay_days || 0;
          weather_condition =
            shipment.weather_summary || shipment.weather_condition || "Unknown";
        } else {
          // If no shipment found, determine status based on weather
          if (weatherImpact.impact_level === "severe") {
            status = "delayed";
            delay_days = 3;
          } else if (weatherImpact.impact_level === "moderate") {
            status = "delayed";
            delay_days = 1;
          }
        }

        statuses.push({
          material: material.name,
          quantity: material.quantity,
          unit: material.unit,
          status,
          weather_condition,
          delay_days,
          emoji: getWeatherEmoji(weather_condition),
        });
      }

      setMaterialStatuses(statuses);
    } catch (error) {
      console.error("Error loading material weather status:", error);
      // Fallback to basic material display
      const fallbackStatuses: MaterialWeatherStatus[] = [];

      for (const material of materials) {
        fallbackStatuses.push({
          material: material.name,
          quantity: material.quantity,
          unit: material.unit,
          status: "on_time",
          weather_condition: "Unknown",
          delay_days: 0,
          emoji: "🌤️",
        });
      }
      setMaterialStatuses(fallbackStatuses);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherEmoji = (condition: string) => {
    const conditionLower = condition.toLowerCase();

    // Handle weather summary format like "Severe weather in Kolkata between..."
    if (
      conditionLower.includes("severe weather") ||
      conditionLower.includes("thunderstorm")
    ) {
      return "⛈️";
    } else if (conditionLower.includes("rain")) {
      return "🌧️";
    } else if (conditionLower.includes("clear weather")) {
      return "☀️";
    } else if (conditionLower.includes("cloud")) {
      return "☁️";
    } else if (conditionLower.includes("drizzle")) {
      return "🌦️";
    } else if (conditionLower.includes("snow")) {
      return "❄️";
    } else if (conditionLower.includes("fog")) {
      return "🌫️";
    } else {
      return "🌤️";
    }
  };

  const getWeatherSummary = (condition: string) => {
    const conditionLower = condition.toLowerCase();

    if (
      conditionLower.includes("severe weather") ||
      conditionLower.includes("thunderstorm")
    ) {
      return "Storm";
    } else if (conditionLower.includes("rain")) {
      return "Rain";
    } else if (conditionLower.includes("clear weather")) {
      return "Clear";
    } else if (conditionLower.includes("cloud")) {
      return "Cloudy";
    } else if (conditionLower.includes("drizzle")) {
      return "Drizzle";
    } else if (conditionLower.includes("snow")) {
      return "Snow";
    } else if (conditionLower.includes("fog")) {
      return "Fog";
    } else {
      return "Unknown";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "delayed":
        return "bg-red-50 text-red-700 border-red-200";
      case "on_time":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-3 w-3 text-emerald-600" />;
      case "delayed":
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case "on_time":
        return <Clock className="h-3 w-3 text-blue-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="pt-2 border-t">
        <p className="text-xs text-gray-500 mb-1">Materials:</p>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (materialStatuses.length === 0) {
    return null;
  }

  return (
    <div className="pt-2 border-t">
      <p className="text-xs text-gray-500 mb-2">Materials & Weather Status:</p>
      <div className="space-y-2">
        {materialStatuses.map((material, index) => (
          <Card
            key={index}
            className={`p-2 ${getStatusColor(material.status)}`}
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{material.emoji}</span>
                  <span className="text-xs font-medium">
                    {material.material}: {material.quantity}
                    {material.unit}
                  </span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {getWeatherSummary(material.weather_condition)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(material.status)}
                  <span className="text-xs capitalize">
                    {material.status.replace("_", " ")}
                  </span>
                </div>
              </div>
              {material.delay_days > 0 && (
                <div className="mt-1 text-xs text-red-600">
                  ⚠️ Delayed by {material.delay_days} day
                  {material.delay_days > 1 ? "s" : ""} -{" "}
                  {material.weather_condition}
                </div>
              )}
              {material.status === "delivered" && (
                <div className="mt-1 text-xs text-green-600">
                  ✅ Delivered successfully
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
