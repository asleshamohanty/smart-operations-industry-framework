import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CloudRain,
  Thermometer,
  Wind,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  IndianRupee,
  Users,
  Shield,
  BarChart3,
  Activity,
  FileText,
  Calendar,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";

// Import our custom components
import { GanttChart } from "@/components/GanttChart";
import { ScenarioPanel } from "@/components/ScenarioPanel";
import { AnomalyHistory } from "@/components/dashboard/AnomalyHistory";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSensorStore } from "@/state/sensors";
import { getSensorZone } from "@/lib/layout3d";
import { Sensor3D } from "@/types/sensor3d";

import { formatIndianCurrency } from "@/lib/currency";
import { apiService, Project } from "@/lib/api-services";
import {
  hybridAIService,
  WorkflowOptimizationResult,
} from "@/lib/hybrid-ai-service";
import { anomalyService, Anomaly } from "@/lib/anomalyService";

interface WeatherData {
  location: string;
  current_weather: {
    temperature: number;
    weather_condition: string;
    rain: number;
    wind_speed: number;
  };
  disruption_score: number;
}

export const DigitalTwinPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Anomaly detection states
  const [anomalyStatus, setAnomalyStatus] = useState<any>(null);
  const [anomalySummary, setAnomalySummary] = useState<any>(null);
  const [anomalyMetrics, setAnomalyMetrics] = useState<any>(null);
  const [anomalyResults, setAnomalyResults] = useState<any>(null);
  const [anomalyAlerts, setAnomalyAlerts] = useState<any>(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [projectSummary, setProjectSummary] = useState<any>(null);

  // Real-time sensor data
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [sensorMetrics, setSensorMetrics] = useState({
    totalSensors: 0,
    activeSensors: 0,
    anomaliesDetected: 0,
    avgConfidence: 0,
    systemHealth: 0,
  });

  // Anomaly history tracking
  const [anomalyHistory, setAnomalyHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // 3D Twin WebSocket connection (only when on 3d-twin tab)
  const { isConnected: wsConnected } = useWebSocket({
    enabled: activeTab === "3d-twin",
  });
  const sensorsCount = useSensorStore((state) => state.sensorArray.length);
  const updateSensors3D = useSensorStore((state) => state.updateSensors);

  // AI Workflow Optimizer states
  const [workflowOptimization, setWorkflowOptimization] =
    useState<WorkflowOptimizationResult | null>(null);
  const [emissionPriority, setEmissionPriority] = useState(80);
  const [costPriority, setCostPriority] = useState(70);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [sliderOptimizing, setSliderOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(
    null
  );
  const [isOptimizing, setIsOptimizing] = useState(false); // Prevent multiple simultaneous calls
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadWeatherData(selectedProject.location);
      loadAnomalyData();
      loadProjectData();
      // Don't call optimizeWorkflow here - only when slider changes
    }
  }, [selectedProject]);

  // Debounced optimization for emission priority changes
  useEffect(() => {
    if (selectedProject) {
      setSliderOptimizing(true);
      const timeoutId = setTimeout(() => {
        optimizeWorkflow().finally(() => {
          setSliderOptimizing(false);
        });
      }, 500); // Wait 500ms after user stops moving slider

      return () => {
        clearTimeout(timeoutId);
        setSliderOptimizing(false);
      };
    }
  }, [emissionPriority]);

  const loadProjects = async () => {
    try {
      const data = await apiService.getProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
        // Trigger initial workflow optimization after project is set
        setTimeout(() => {
          optimizeWorkflow();
        }, 1000); // Small delay to ensure all data is loaded
      }
    } catch (err) {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const loadWeatherData = async (location: string) => {
    try {
      const data = await apiService.getWeatherData(location);
      setWeatherData(data);
    } catch (err) {
      console.error("Failed to load weather data:", err);
    }
  };

  const loadAnomalyData = async () => {
    try {
      // Check status first
      const statusData = await apiService.getAnomalyStatus();
      setAnomalyStatus(statusData);

      if (statusData.status === "completed") {
        // Load summary and metrics once
        const [summaryData, metricsData] = await Promise.all([
          apiService.getAnomalySummary(),
          apiService.getAnomalyMetrics(),
        ]);

        setAnomalySummary(summaryData);
        setAnomalyMetrics(metricsData);

        // Start streaming results
        loadStreamingResults(0);
      }
    } catch (err) {
      console.error("Failed to load anomaly detection data:", err);
    }
  };

  const loadProjectData = async () => {
    if (!selectedProject) return;

    try {
      const [tasksData, summaryData] = await Promise.all([
        apiService.getProjectTasks(selectedProject.project_id),
        apiService.getProjectSummary(selectedProject.project_id),
      ]);

      setProjectTasks(tasksData);
      setProjectSummary(summaryData);
    } catch (error) {
      console.error("Failed to load project data:", error);
    }
  };

  // Real-time sensor data generation
  const generateSensorData = () => {
    const sensors = [
      {
        name: "Temperature_Probe_Sensor",
        type: "Temperature",
        unit: "°C",
        normalRange: [20, 35],
        location: "Construction Site",
      },
      {
        name: "Rainfall_Gauge_Sensor",
        type: "Precipitation",
        unit: "mm",
        normalRange: [0, 50],
        location: "Weather Station",
      },
      {
        name: "Wind_Speed_Anemometer_Sensor",
        type: "Wind Speed",
        unit: "km/h",
        normalRange: [5, 25],
        location: "Weather Station",
      },
      {
        name: "Carbon_Footprint_Tracker_Sensor",
        type: "Carbon Emissions",
        unit: "kg CO₂",
        normalRange: [100, 500],
        location: "Equipment Zone",
      },
      {
        name: "Water_Consumption_Meter_Sensor",
        type: "Water Usage",
        unit: "m³",
        normalRange: [10, 100],
        location: "Water Treatment",
      },
      {
        name: "Energy_Consumption_Meter_Sensor",
        type: "Energy Usage",
        unit: "kWh",
        normalRange: [50, 300],
        location: "Power Station",
      },
    ];

    const newData = sensors.map((sensor, i) => {
      const isAnomaly = Math.random() < 0.15; // 15% chance of anomaly
      const status = isAnomaly ? "Anomaly" : "Normal";
      const confidence = Math.random() * 0.4 + 0.6; // 60-100% confidence

      // Generate realistic values based on sensor type
      let value;
      const [min, max] = sensor.normalRange;

      if (isAnomaly) {
        // Generate anomalous values outside normal range
        const anomalyFactor = Math.random() > 0.5 ? 1.5 : 0.3;
        if (anomalyFactor > 1) {
          // High anomaly - above normal range
          value = Math.round(max + Math.random() * (max * 0.5));
        } else {
          // Low anomaly - below normal range
          value = Math.round(Math.max(0, min - Math.random() * (min * 0.5)));
        }
      } else {
        // Generate normal values within range
        value = Math.round(min + Math.random() * (max - min));
      }

      // Validate anomaly detection - only flag as anomaly if value is actually outside range
      const actualAnomaly = value < min || value > max;

      return {
        id: `SENSOR_${String(i + 1).padStart(3, "0")}`,
        name: sensor.name,
        timestamp: new Date().toLocaleTimeString(),
        sensorType: sensor.type,
        location: sensor.location,
        status: actualAnomaly ? "Anomaly" : "Normal",
        confidence: Math.round(confidence * 100),
        value: value,
        unit: sensor.unit,
        normalRange: sensor.normalRange,
        isAnomaly: actualAnomaly,
      };
    });

    // Sync with 3D store
    const sensors3D: Sensor3D[] = newData.map((sensor) => {
      const location3D = getSensorZone(sensor.sensorType);
      const severityMap: {
        [key: string]: "low" | "medium" | "high" | "critical";
      } = {
        Anomaly: "medium",
      };

      // Calculate severity based on deviation
      let severity: "low" | "medium" | "high" | "critical" = "low";
      if (sensor.isAnomaly) {
        const [min, max] = sensor.normalRange;
        const deviation =
          sensor.value < min ? min - sensor.value : sensor.value - max;
        const severityRatio = deviation / (max - min);

        if (severityRatio > 2) severity = "critical";
        else if (severityRatio > 1) severity = "high";
        else if (severityRatio > 0.5) severity = "medium";
        else severity = "low";
      }

      return {
        id: sensor.id,
        name: sensor.name,
        type: sensor.sensorType,
        unit: sensor.unit,
        value: sensor.value,
        normalRange: sensor.normalRange,
        location: location3D,
        status: sensor.isAnomaly ? "anomaly" : "normal",
        severity: sensor.isAnomaly ? severity : undefined,
        updatedAt: new Date().toISOString(),
      };
    });

    updateSensors3D(sensors3D);

    return newData;
  };

  const updateSensorMetrics = (data: any[]) => {
    const totalSensors = data.length;
    const activeSensors = data.filter((s) => s.status === "Normal").length;
    const anomaliesDetected = data.filter((s) => s.isAnomaly).length;
    const avgConfidence =
      data.reduce((sum, s) => sum + s.confidence, 0) / totalSensors;
    const systemHealth = Math.round(
      ((activeSensors / totalSensors) * 100 + avgConfidence) / 2
    );

    setSensorMetrics({
      totalSensors,
      activeSensors,
      anomaliesDetected,
      avgConfidence: Math.round(avgConfidence),
      systemHealth,
    });
  };

  const trackAnomalies = async (data: any[]) => {
    const newAnomalies = data.filter((sensor) => sensor.isAnomaly);

    if (newAnomalies.length > 0) {
      const anomalyRecords = newAnomalies.map((sensor) => {
        const [rangeMin, rangeMax] = sensor.normalRange;
        const deviation =
          sensor.value < rangeMin
            ? rangeMin - sensor.value
            : sensor.value - rangeMax;
        const severityRatio = deviation / (rangeMax - rangeMin);

        let severity = "low";
        if (severityRatio > 2) severity = "critical";
        else if (severityRatio > 1) severity = "high";
        else if (severityRatio > 0.5) severity = "medium";

        return {
          anomaly_id: `anomaly_${Date.now()}_${sensor.id}`,
          sensor_name: sensor.name,
          sensor_type: sensor.sensorType,
          location: sensor.location,
          value: sensor.value,
          unit: sensor.unit,
          normal_range_min: rangeMin,
          normal_range_max: rangeMax,
          severity: severity,
          confidence: sensor.confidence,
          description: `Anomaly detected in ${sensor.sensorType} sensor. Current value ${sensor.value} ${sensor.unit} is outside normal range of ${rangeMin}-${rangeMax} ${sensor.unit}. Deviation: ${deviation} ${sensor.unit}.`,
          project_id: selectedProject?.id,
          deviation_amount: deviation,
          deviation_percentage: (deviation / (rangeMax - rangeMin)) * 100,
        };
      });

      // Save anomalies to Supabase
      try {
        const savedAnomalies = [];
        for (const anomalyRecord of anomalyRecords) {
          const savedAnomaly = await anomalyService.createAnomaly(
            anomalyRecord
          );
          savedAnomalies.push(savedAnomaly);
        }

        // Reload anomaly history from Supabase
        await loadAnomalyHistory();
      } catch (error) {
        console.error("Error saving anomalies to Supabase:", error);
        // Show error to user
        alert(
          "Failed to save anomalies to database. Please check your Supabase configuration."
        );
      }

      // Only add to local state if Supabase fails (fallback)
      // When Supabase is working, loadAnomalyHistory() will handle the state update
    }
  };

  const loadAnomalyHistory = async () => {
    try {
      const anomalies = await anomalyService.getAnomalies({
        limit: 10,
        project_id: selectedProject?.id,
      });

      // Convert Supabase format to frontend format
      const formattedAnomalies = anomalies.map((anomaly) => ({
        id: anomaly.anomaly_id,
        sensorName: anomaly.sensor_name,
        sensorType: anomaly.sensor_type,
        location: anomaly.location,
        timestamp: anomaly.timestamp,
        value: anomaly.value,
        unit: anomaly.unit,
        normalRange: [anomaly.normal_range_min, anomaly.normal_range_max],
        severity: anomaly.severity,
        confidence: anomaly.confidence,
        description: anomaly.description,
        resolved: anomaly.resolved,
      }));

      // Update state with latest 10 anomalies
      setAnomalyHistory(formattedAnomalies.slice(0, 10));
    } catch (error) {
      console.error("Error loading anomaly history:", error);
      // Show error to user
      alert(
        "Failed to load anomaly history. Please check your Supabase configuration."
      );
    }
  };

  const loadStreamingResults = async (offset: number) => {
    try {
      const resultsData = await apiService.getAnomalyResults(10, offset);
      setAnomalyResults(resultsData);
      setCurrentOffset(offset);
    } catch (err) {
      console.error("Failed to load results:", err);
    }
  };

  const optimizeWorkflow = async () => {
    if (!selectedProject || isOptimizing) return; // Prevent multiple simultaneous calls

    setIsOptimizing(true);
    setOptimizationLoading(true);
    setOptimizationError(null);

    try {
      const optimizationRequest = {
        projectId: selectedProject.project_id,
        projectName: selectedProject.project_name,
        projectType: selectedProject.project_type || "Infrastructure",
        location: selectedProject.location,
        budget: selectedProject.project_budget,
        duration: selectedProject.estimated_duration_days || 30,
        materials: {
          steel: selectedProject.steel_quantity,
          wood: selectedProject.wood_quantity,
          concrete: selectedProject.concrete_quantity,
          glass: selectedProject.glass_quantity,
          plastic: selectedProject.plastic_quantity,
        },
        teamSize: selectedProject.team_size || 10,
        emissionPriority: emissionPriority,
        costPriority: costPriority,
      };

      const result = await hybridAIService.optimizeWorkflow(
        optimizationRequest
      );
      setWorkflowOptimization(result);
    } catch (err) {
      console.error("Failed to optimize workflow:", err);
      setOptimizationError(
        "Failed to optimize workflow. Please check your AI service configuration."
      );
    } finally {
      setOptimizationLoading(false);
      setIsOptimizing(false); // Reset the flag
      setSliderOptimizing(false); // Reset slider optimizing state
    }
  };

  // Debounced optimization function to prevent too many API calls
  const debouncedOptimizeWorkflow = () => {
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      optimizeWorkflow();
    }, 1500); // 1.5 second delay

    setDebounceTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["overview", "3d-twin", "anomaly", "simulation"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load anomaly history when project changes
  useEffect(() => {
    if (selectedProject) {
      loadAnomalyHistory();
    }
  }, [selectedProject]);

  // Real-time sensor data updates
  useEffect(() => {
    if (selectedProject) {
      // Generate initial sensor data
      const initialData = generateSensorData();
      setSensorData(initialData);
      updateSensorMetrics(initialData);
      trackAnomalies(initialData);

      // Update sensor data every 5-10 seconds (random interval)
      const interval = setInterval(() => {
        const newData = generateSensorData();
        setSensorData(newData);
        updateSensorMetrics(newData);
        trackAnomalies(newData);
      }, Math.random() * 5000 + 5000); // Random interval between 5-10 seconds

      return () => clearInterval(interval);
    }
  }, [selectedProject]);

  const getDisruptionColor = (score: number) => {
    if (score < 0.3) return "text-success";
    if (score < 0.6) return "text-warning";
    return "text-destructive";
  };

  const getDisruptionIcon = (score: number) => {
    if (score < 0.3) return <CheckCircle className="h-4 w-4 text-success" />;
    if (score < 0.6)
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                <span>Digital Twin Simulation & AI Workflow Optimizer</span>
              </h1>
              <p className="text-muted-foreground">
                AI-driven emission forecasting, workflow optimization, and
                real-time simulation
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select
                value={selectedProject?.project_id.toString()}
                onValueChange={(value) => {
                  const project = projects.find(
                    (p) => p.project_id.toString() === value
                  );
                  setSelectedProject(project || null);
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem
                      key={project.project_id}
                      value={project.project_id.toString()}
                    >
                      {project.project_name} - {project.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedProject ? (
          <>
            {/* Project Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Project Budget
                  </CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatIndianCurrency(selectedProject.project_budget)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedProject.project_type}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Location
                  </CardTitle>
                  <CloudRain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {selectedProject.location}
                  </div>
                  <p className="text-xs text-muted-foreground">Project Site</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Workflow Optimizer */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>AI Workflow Optimizer</span>
                  {optimizationLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  )}
                </CardTitle>
                <CardDescription>
                  AI-powered workflow optimization for emissions vs cost
                  trade-offs using Gemini LLM
                </CardDescription>
              </CardHeader>
              <CardContent>
                {optimizationError && (
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{optimizationError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Current vs Optimized Plan */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Current Plan vs AI Optimized Plan
                    </h3>
                    {workflowOptimization ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Current Workflow</p>
                            <p className="text-sm text-muted-foreground">
                              {workflowOptimization.currentWorkflow.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-destructive">
                              {workflowOptimization.currentWorkflow.emissions.toFixed(
                                1
                              )}
                              t CO₂
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ₹
                              {workflowOptimization.currentWorkflow.cost.toFixed(
                                1
                              )}
                              L
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50/10 border-green-200/20">
                          <div>
                            <p className="font-medium">AI Optimized</p>
                            <p className="text-sm text-muted-foreground">
                              {
                                workflowOptimization.optimizedWorkflow
                                  .description
                              }
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-success">
                              {workflowOptimization.optimizedWorkflow.emissions.toFixed(
                                1
                              )}
                              t CO₂
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ₹
                              {workflowOptimization.optimizedWorkflow.cost.toFixed(
                                1
                              )}
                              L
                            </p>
                          </div>
                        </div>

                        {/* Improvements */}
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">
                            Key Improvements:
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {(
                              workflowOptimization.optimizedWorkflow
                                .improvements || []
                            ).map((improvement, index) => (
                              <li
                                key={index}
                                className="flex items-start space-x-2"
                              >
                                <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{improvement}</span>
                              </li>
                            ))}
                            {(!workflowOptimization.optimizedWorkflow
                              .improvements ||
                              workflowOptimization.optimizedWorkflow
                                .improvements.length === 0) && (
                              <li className="text-muted-foreground italic">
                                AI optimization analysis in progress...
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {optimizationLoading
                          ? "Analyzing project with AI..."
                          : "Set to slider to see AI optimization"}
                      </div>
                    )}
                  </div>

                  {/* Optimization Priorities */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Optimization Priorities
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">
                          Emission Reduction Priority
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={emissionPriority}
                          onChange={(e) => {
                            setEmissionPriority(parseInt(e.target.value));
                            setSliderOptimizing(true);
                            debouncedOptimizeWorkflow();
                          }}
                          className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {emissionPriority}% Priority
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Cost Optimization Priority
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={costPriority}
                          onChange={(e) => {
                            setCostPriority(parseInt(e.target.value));
                            setSliderOptimizing(true);
                            debouncedOptimizeWorkflow();
                          }}
                          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {costPriority}% Priority
                        </div>
                      </div>
                    </div>

                    {workflowOptimization && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 border rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {sliderOptimizing ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                            ) : (
                              <>
                                {workflowOptimization.tradeOffAnalysis
                                  .emissionReduction > 0
                                  ? "-"
                                  : "+"}
                                {Math.abs(
                                  workflowOptimization.tradeOffAnalysis
                                    .emissionReduction
                                ).toFixed(1)}
                                %
                              </>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">Emissions</p>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">
                            {sliderOptimizing ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                            ) : (
                              <>
                                {workflowOptimization.tradeOffAnalysis
                                  .costIncrease > 0
                                  ? "+"
                                  : "-"}
                                {Math.abs(
                                  workflowOptimization.tradeOffAnalysis
                                    .costIncrease
                                ).toFixed(1)}
                                %
                              </>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">Cost</p>
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {workflowOptimization && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">
                          AI Recommendations:
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              Material Substitutions:
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(
                                workflowOptimization.recommendations
                                  ?.materialSubstitutions || []
                              ).map((rec, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {typeof rec === "string"
                                    ? rec
                                    : (rec as any)?.action ||
                                      (rec as any)?.material ||
                                      JSON.stringify(rec)}
                                </Badge>
                              ))}
                              {(!workflowOptimization.recommendations
                                ?.materialSubstitutions ||
                                workflowOptimization.recommendations
                                  .materialSubstitutions.length === 0) && (
                                <span className="text-xs text-muted-foreground italic">
                                  Loading...
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              Process Optimizations:
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(
                                workflowOptimization.recommendations
                                  ?.processOptimizations || []
                              ).map((rec, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {typeof rec === "string"
                                    ? rec
                                    : (rec as any)?.action ||
                                      (rec as any)?.process ||
                                      JSON.stringify(rec)}
                                </Badge>
                              ))}
                              {(!workflowOptimization.recommendations
                                ?.processOptimizations ||
                                workflowOptimization.recommendations
                                  .processOptimizations.length === 0) && (
                                <span className="text-xs text-muted-foreground italic">
                                  Loading...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Dashboard Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="3d-twin">3D Twin</TabsTrigger>
                <TabsTrigger value="anomaly">Anomaly Detection</TabsTrigger>
                <TabsTrigger value="simulation">Simulation</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span>Project Timeline</span>
                      </CardTitle>
                      <CardDescription>
                        Gantt chart showing project tasks and dependencies
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <GanttChart projectId={selectedProject.project_id} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span>Project Progress</span>
                      </CardTitle>
                      <CardDescription>
                        Current project status and completion metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Overall Progress
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {projectSummary?.completion_percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${
                                projectSummary?.completion_percentage || 0
                              }%`,
                            }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Budget Utilization
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            ₹
                            {projectSummary?.total_cost?.toLocaleString() ||
                              "0"}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                ((projectSummary?.total_cost || 0) /
                                  (selectedProject.project_budget || 1)) *
                                  100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Time Elapsed
                          </span>
                          <span className="text-sm font-bold text-orange-600">
                            {projectSummary?.total_duration ||
                              selectedProject.estimated_duration_days ||
                              30}{" "}
                            days
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                ((projectSummary?.total_duration || 0) /
                                  (selectedProject.estimated_duration_days ||
                                    30)) *
                                  100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        <span>Team Performance</span>
                      </CardTitle>
                      <CardDescription>
                        Team productivity and resource allocation
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-purple-50/10 rounded-lg border border-purple-200/20">
                          <div className="text-2xl font-bold text-purple-600">
                            {selectedProject.team_size || 10}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Team Members
                          </div>
                        </div>
                        <div className="text-center p-3 bg-green-50/10 rounded-lg border border-green-200/20">
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round(
                              (projectTasks.filter(
                                (task) => task.status === "completed"
                              ).length /
                                Math.max(projectTasks.length, 1)) *
                                100
                            )}
                            %
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Productivity
                          </div>
                        </div>
                        <div className="text-center p-3 bg-blue-50/10 rounded-lg border border-blue-200/20">
                          <div className="text-2xl font-bold text-blue-600">
                            {
                              projectTasks.filter(
                                (task) => task.status === "in-progress"
                              ).length
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Active Tasks
                          </div>
                        </div>
                        <div className="text-center p-3 bg-orange-50/10 rounded-lg border border-orange-200/20">
                          <div className="text-2xl font-bold text-orange-600">
                            {
                              projectTasks.filter(
                                (task) => task.status === "delayed"
                              ).length
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">Delays</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                        <span>Resource Allocation</span>
                      </CardTitle>
                      <CardDescription>
                        Material usage and resource distribution
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Steel</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    ((selectedProject.steel_quantity || 0) /
                                      100) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {selectedProject.steel_quantity || 0} tons
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Concrete</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    ((selectedProject.concrete_quantity || 0) /
                                      200) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {selectedProject.concrete_quantity || 0} m³
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Wood</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    ((selectedProject.wood_quantity || 0) /
                                      50) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {selectedProject.wood_quantity || 0} m³
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Glass</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    ((selectedProject.glass_quantity || 0) /
                                      30) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {selectedProject.glass_quantity || 0} m²
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="3d-twin" className="space-y-6">
                <Card className="h-[800px]">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>3D Digital Twin Visualization</span>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={wsConnected ? "default" : "secondary"}
                          className={wsConnected ? "bg-green-600" : ""}
                        >
                          <Activity className="h-3 w-3 mr-1" />
                          {wsConnected ? "Live" : "Disconnected"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {sensorsCount} Sensors Active
                        </span>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Real-time 3D building model with sensor network. Green =
                      Normal, Red = Anomaly. Click on anomalous sensors for
                      details. Drag to rotate, scroll to zoom.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-100px)]">
                    <div className="relative h-full">
                      <SceneCanvas />
                      {/* Legend */}
                      <div className="absolute top-4 left-4 bg-gray-900/80 text-white p-4 rounded-lg backdrop-blur-sm">
                        <h4 className="font-semibold mb-2">Legend</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>Normal</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>Anomaly</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-green-500/30"></div>
                            <span>Connection</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <p className="text-xs text-gray-400">
                            Use mouse to rotate, scroll to zoom
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="anomaly" className="space-y-6">
                {anomalyStatus?.status === "completed" ? (
                  <>
                    {/* Real-time Alerts */}
                    {anomalyAlerts && anomalyAlerts.alerts?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <span>Real-time Alerts</span>
                            <Badge variant="destructive">
                              {anomalyAlerts.alert_count}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Active alerts requiring immediate attention
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {anomalyAlerts.alerts.map(
                              (alert: any, index: number) => (
                                <Alert
                                  key={index}
                                  className={
                                    alert.severity === "high"
                                      ? "border-red-200 bg-red-50"
                                      : alert.severity === "medium"
                                      ? "border-yellow-200 bg-yellow-50"
                                      : "border-blue-200 bg-blue-50"
                                  }
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">
                                          {alert.message}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          Action Required:{" "}
                                          {alert.action_required}
                                        </p>
                                      </div>
                                      <Badge
                                        variant={
                                          alert.severity === "high"
                                            ? "destructive"
                                            : alert.severity === "medium"
                                            ? "secondary"
                                            : "outline"
                                        }
                                      >
                                        {alert.severity}
                                      </Badge>
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Real-time Sensor Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            System Health
                          </CardTitle>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {sensorMetrics.systemHealth}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Overall system status
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Anomalies Detected
                          </CardTitle>
                          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">
                            {sensorMetrics.anomaliesDetected}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Real-time alerts
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Avg Confidence
                          </CardTitle>
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">
                            {sensorMetrics.avgConfidence}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Detection accuracy
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Real-Time Monitoring Feed */}
                    <Card className="border-2 border-gray-800 shadow-xl">
                      <CardHeader className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="flex items-center space-x-3 text-xl">
                              <div className="relative">
                                <Activity className="h-6 w-6 text-red-500 animate-pulse" />
                                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></div>
                              </div>
                              <span>Real-Time Sensor Monitoring</span>
                            </CardTitle>
                            <CardDescription className="text-gray-300 mt-1">
                              Live data stream from{" "}
                              {selectedProject.project_name}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full">
                              <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                              <span className="text-sm font-semibold">
                                LIVE
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-gray-300 bg-gray-100">
                                <th className="text-left p-3 font-semibold text-gray-700">
                                  Time
                                </th>
                                <th className="text-left p-3 font-semibold text-gray-700">
                                  Sensor Name
                                </th>
                                <th className="text-left p-3 font-semibold text-gray-700">
                                  Values
                                </th>
                                <th className="text-left p-3 font-semibold text-gray-700">
                                  Status
                                </th>
                                <th className="text-left p-3 font-semibold text-gray-700">
                                  Confidence
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {sensorData.map((sensor, idx) => {
                                const statusColor = sensor.isAnomaly
                                  ? "text-red-600"
                                  : "text-green-600";

                                return (
                                  <tr
                                    key={idx}
                                    className={`border-b transition-all duration-300 ${
                                      sensor.isAnomaly
                                        ? "bg-red-50 hover:bg-red-100"
                                        : "hover:bg-gray-50"
                                    }`}
                                  >
                                    <td className="p-3">
                                      <span className="font-mono text-xs text-muted-foreground">
                                        {sensor.timestamp}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <div className="space-y-1">
                                        <span className="text-sm font-semibold text-gray-800">
                                          {sensor.name}
                                        </span>
                                        <div className="text-xs text-muted-foreground">
                                          {sensor.sensorType} •{" "}
                                          {sensor.location}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <span
                                            className={`text-lg font-bold ${
                                              sensor.isAnomaly
                                                ? "text-red-600"
                                                : "text-gray-800"
                                            }`}
                                          >
                                            {sensor.value}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {sensor.unit}
                                          </span>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-xs text-muted-foreground">
                                            <span>
                                              Normal: {sensor.normalRange[0]}-
                                              {sensor.normalRange[1]}{" "}
                                              {sensor.unit}
                                            </span>
                                            {sensor.isAnomaly && (
                                              <span className="text-red-600 font-semibold">
                                                • Anomaly: {sensor.value}{" "}
                                                {sensor.unit}
                                              </span>
                                            )}
                                          </div>
                                          <div className="w-full bg-muted rounded-full h-1.5">
                                            <div className="relative h-1.5 rounded-full">
                                              {/* Normal range indicator */}
                                              <div
                                                className="absolute bg-green-400 h-1.5 rounded-full"
                                                style={{
                                                  left: "0%",
                                                  width: "100%",
                                                }}
                                              ></div>
                                              {/* Current value indicator */}
                                              <div
                                                className={`absolute top-0 h-1.5 w-1 rounded-full ${
                                                  sensor.isAnomaly
                                                    ? "bg-red-600"
                                                    : "bg-blue-600"
                                                }`}
                                                style={{
                                                  left: `${Math.min(
                                                    100,
                                                    Math.max(
                                                      0,
                                                      ((sensor.value -
                                                        sensor.normalRange[0]) /
                                                        (sensor.normalRange[1] -
                                                          sensor
                                                            .normalRange[0])) *
                                                        100
                                                    )
                                                  )}%`,
                                                }}
                                              ></div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      {sensor.isAnomaly ? (
                                        <div className="flex items-center space-x-2">
                                          <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></div>
                                          <Badge className="bg-red-600 hover:bg-red-700">
                                            Anomaly
                                          </Badge>
                                        </div>
                                      ) : (
                                        <div className="flex items-center space-x-2">
                                          <div className="h-2 w-2 rounded-full bg-green-600"></div>
                                          <Badge className="bg-green-600 hover:bg-green-700">
                                            Normal
                                          </Badge>
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-16 bg-muted rounded-full h-2">
                                          <div
                                            className={`h-2 rounded-full transition-all ${
                                              sensor.isAnomaly
                                                ? "bg-red-600"
                                                : "bg-green-600"
                                            }`}
                                            style={{
                                              width: `${sensor.confidence}%`,
                                            }}
                                          ></div>
                                        </div>
                                        <span className="text-xs font-semibold">
                                          {sensor.confidence}%
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* System Status Footer */}
                        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>System: Online</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Activity className="h-3 w-3 text-blue-600" />
                              <span>Monitoring: Active</span>
                            </span>
                          </div>
                          <span className="font-mono">Monitoring: Active</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Anomaly History Component */}
                    <AnomalyHistory
                      anomalies={anomalyHistory}
                      onAnomalySelect={(anomaly) => {
                        console.log("Selected anomaly:", anomaly);
                      }}
                      onAnomalyUpdate={loadAnomalyHistory}
                    />
                  </>
                ) : (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        <CardTitle>Anomaly Detection System Offline</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">
                        The anomaly detection system needs to be initialized.
                      </p>
                      <Alert>
                        <AlertDescription>
                          <strong>To initialize:</strong>
                          <pre className="mt-2 p-3 bg-gray-800 text-white rounded overflow-x-auto">
                            cd backend{"\n"}python anomaly_detection.py
                          </pre>
                        </AlertDescription>
                      </Alert>
                      <div className="mt-4">
                        <Button
                          onClick={loadAnomalyData}
                          className="flex items-center space-x-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Check System Status</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="simulation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>What-If Scenarios</CardTitle>
                    <CardDescription>
                      Simulate different materials, resources, and weather
                      conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScenarioPanel projectId={selectedProject.project_id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No projects available
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Create a project first to use the Digital Twin feature
              </p>
              <Button onClick={() => (window.location.href = "/projects")}>
                Go to Projects
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
