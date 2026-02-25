import { useState } from "react";
import { formatIndianCurrency } from "@/lib/currency";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Clock,
  IndianRupee,
  AlertTriangle,
  CheckCircle,
  CloudRain,
} from "lucide-react";
import {
  apiService,
  SimulationRequest,
  SimulationResult,
} from "@/lib/api-services";

interface ScenarioPanelProps {
  projectId: number;
}

export const ScenarioPanel: React.FC<ScenarioPanelProps> = ({ projectId }) => {
  const [simulationRequest, setSimulationRequest] = useState<SimulationRequest>(
    {
      project_id: projectId,
      alternative_materials: [],
      alternative_resources: {},
      weather_scenario: undefined,
    }
  );

  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const materialOptions = [
    "Concrete",
    "Steel",
    "Recycled Materials",
    "Sustainable Materials",
    "Low-Carbon Materials",
    "Bamboo",
    "Cross-Laminated Timber",
  ];

  const weatherScenarios = [
    { value: "current", label: "Current Weather" },
    { value: "forecast_3d", label: "3-Day Forecast" },
    { value: "forecast_7d", label: "7-Day Forecast" },
    { value: "severe", label: "Severe Weather Simulation" },
  ];

  const handleMaterialChange = (materials: string[]) => {
    setSimulationRequest((prev) => ({
      ...prev,
      alternative_materials: materials,
    }));
  };

  const handleResourceChange = (resource: string, value: number) => {
    setSimulationRequest((prev) => ({
      ...prev,
      alternative_resources: {
        ...prev.alternative_resources,
        [resource]: value,
      },
    }));
  };

  const handleWeatherChange = (scenario: string) => {
    setSimulationRequest((prev) => ({
      ...prev,
      weather_scenario: scenario,
    }));
  };

  const runSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Add timestamp to ensure fresh data
      const requestWithTimestamp = {
        ...simulationRequest,
        timestamp: Date.now(),
      };

      console.log("🚀 Running simulation with request:", requestWithTimestamp);
      const result = await apiService.simulateProject(requestWithTimestamp);
      console.log("🔍 Simulation result received:", result);
      console.log(
        "🔍 Recommendations count:",
        result.recommendations?.length || 0
      );
      console.log(
        "🔍 First recommendation:",
        result.recommendations?.[0]?.substring(0, 100) || "None"
      );
      setSimulationResult(result);
    } catch (err) {
      console.error("❌ Simulation error:", err);
      setError("Failed to run simulation");
    } finally {
      setLoading(false);
    }
  };

  const getCostChangeColor = (original: number, predicted: number) => {
    const change = ((predicted - original) / original) * 100;
    if (change > 5) return "text-red-600";
    if (change < -5) return "text-green-600";
    return "text-gray-600";
  };

  const getDurationChangeColor = (original: number, predicted: number) => {
    const change = ((predicted - original) / original) * 100;
    if (change > 10) return "text-red-600";
    if (change < -10) return "text-green-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>What-If Scenario Simulation</span>
          </CardTitle>
          <CardDescription>
            Simulate different materials, resources, and weather conditions to
            predict project outcomes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alternative Materials */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Alternative Materials</Label>
            <div className="flex flex-wrap gap-2">
              {materialOptions.map((material) => {
                const isSelected =
                  simulationRequest.alternative_materials?.includes(material);
                return (
                  <Button
                    key={material}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const current =
                        simulationRequest.alternative_materials || [];
                      const updated = isSelected
                        ? current.filter((m) => m !== material)
                        : [...current, material];
                      handleMaterialChange(updated);
                    }}
                  >
                    {material}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Resource Adjustments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Labor Multiplier</Label>
              <div className="space-y-2">
                <Slider
                  value={[
                    simulationRequest.alternative_resources?.labor || 1.0,
                  ]}
                  onValueChange={(value) =>
                    handleResourceChange("labor", value[0])
                  }
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0.5x (50% reduction)</span>
                  <span className="font-medium text-gray-700">
                    {(
                      simulationRequest.alternative_resources?.labor || 1.0
                    ).toFixed(1)}
                    x
                  </span>
                  <span>2.0x (100% increase)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Equipment Multiplier
              </Label>
              <div className="space-y-2">
                <Slider
                  value={[
                    simulationRequest.alternative_resources?.equipment || 1.0,
                  ]}
                  onValueChange={(value) =>
                    handleResourceChange("equipment", value[0])
                  }
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0.5x (50% reduction)</span>
                  <span className="font-medium text-gray-700">
                    {(
                      simulationRequest.alternative_resources?.equipment || 1.0
                    ).toFixed(1)}
                    x
                  </span>
                  <span>2.0x (100% increase)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Scenario */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Weather Scenario</Label>
            <Select
              value={simulationRequest.weather_scenario || "current"}
              onValueChange={handleWeatherChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select weather scenario" />
              </SelectTrigger>
              <SelectContent>
                {weatherScenarios.map((scenario) => (
                  <SelectItem key={scenario.value} value={scenario.value}>
                    {scenario.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Run Simulation Button */}
          <Button onClick={runSimulation} disabled={loading} className="w-full">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Running Simulation...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Run Simulation</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {simulationResult && (
        <div className="space-y-4">
          {/* Cost & Duration Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <IndianRupee className="h-5 w-5" />
                  <span>Cost Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Original Cost</span>
                  <span className="font-medium">
                    {formatIndianCurrency(simulationResult.original_cost)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Predicted Cost</span>
                  <span
                    className={`font-medium ${getCostChangeColor(
                      simulationResult.original_cost,
                      simulationResult.predicted_cost
                    )}`}
                  >
                    {formatIndianCurrency(simulationResult.predicted_cost)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Change</span>
                  <div className="flex items-center space-x-1">
                    {simulationResult.predicted_cost >
                    simulationResult.original_cost ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    )}
                    <span
                      className={`font-medium ${getCostChangeColor(
                        simulationResult.original_cost,
                        simulationResult.predicted_cost
                      )}`}
                    >
                      {(
                        ((simulationResult.predicted_cost -
                          simulationResult.original_cost) /
                          simulationResult.original_cost) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Duration Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Original Duration
                  </span>
                  <span className="font-medium">
                    {simulationResult.original_duration} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Predicted Duration
                  </span>
                  <span
                    className={`font-medium ${getDurationChangeColor(
                      simulationResult.original_duration,
                      simulationResult.predicted_duration
                    )}`}
                  >
                    {simulationResult.predicted_duration} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Change</span>
                  <div className="flex items-center space-x-1">
                    {simulationResult.predicted_duration >
                    simulationResult.original_duration ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    )}
                    <span
                      className={`font-medium ${getDurationChangeColor(
                        simulationResult.original_duration,
                        simulationResult.predicted_duration
                      )}`}
                    >
                      {(
                        ((simulationResult.predicted_duration -
                          simulationResult.original_duration) /
                          simulationResult.original_duration) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weather Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CloudRain className="h-5 w-5" />
                <span>Weather Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    Weather Impact Factor
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {(simulationResult.weather_impact * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {simulationResult.weather_impact > 1.0
                      ? "Cost Increase"
                      : "Cost Reduction"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    Weather Scenario
                  </div>
                  <div className="text-lg font-medium">
                    {simulationRequest.weather_scenario === "current"
                      ? "Current Weather"
                      : simulationRequest.weather_scenario === "forecast_3d"
                      ? "3-Day Forecast"
                      : simulationRequest.weather_scenario === "forecast_7d"
                      ? "7-Day Forecast"
                      : "Severe Weather Simulation"}
                  </div>
                </div>
              </div>

              {/* Selected Weather Data */}
              {simulationResult.weather_data && (
                <div className="mt-6 pt-6 border-t">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    Selected Weather Conditions
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {simulationResult.weather_data.temperature.toFixed(1)}°C
                      </div>
                      <div className="text-xs text-gray-500">Temperature</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {simulationResult.weather_data.humidity}%
                      </div>
                      <div className="text-xs text-gray-500">Humidity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {simulationResult.weather_data.wind_speed.toFixed(1)}{" "}
                        m/s
                      </div>
                      <div className="text-xs text-gray-500">Wind Speed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {simulationResult.weather_data.weather_condition}
                      </div>
                      <div className="text-xs text-gray-500">Condition</div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Description:</strong>{" "}
                    {simulationResult.weather_data.weather_description}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Location: {simulationResult.weather_data.location} •
                    Updated:{" "}
                    {new Date(
                      simulationResult.weather_data.timestamp
                    ).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>AI-Powered Recommendations</span>
                <Badge variant="outline" className="ml-2">
                  {simulationResult.recommendations.length} suggestions
                </Badge>
              </CardTitle>
              <CardDescription>
                Generated using advanced AI analysis of your project parameters
                and weather conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {simulationResult.recommendations.map(
                  (recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">
                        {recommendation}
                      </span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
