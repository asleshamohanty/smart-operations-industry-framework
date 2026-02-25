import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Thermometer,
  Volume2,
  Wind,
  AlertTriangle,
  Shield,
  Clock,
  MapPin,
  Activity,
  Eye,
  Zap,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-services";

interface SafetyMetrics {
  aqi: number;
  noise_level: number;
  temperature: number;
  humidity: number;
  co2_level: number;
  pm25: number;
  pm10: number;
  last_updated: string;
}

interface SafetyAlert {
  id: string;
  project_id: number;
  project_name: string;
  location: string;
  priority: "high" | "medium" | "low";
  hazard_type: string;
  current_reading: number;
  unit: string;
  threshold: number;
  danger_description: string;
  recommended_action: string;
  detected_at: string;
  status: "active" | "resolved";
}

interface Project {
  project_id: number;
  project_name: string;
  location: string;
  project_type: string;
}

const SafetyMonitoringPage: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [safetyMetrics, setSafetyMetrics] = useState<SafetyMetrics | null>(null);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(false);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load safety data when project changes
  useEffect(() => {
    if (selectedProject) {
      loadSafetyData(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/safety/projects`);
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded projects:', data); // Debug log
        setProjects(data.projects || []);
        if (data.projects && data.projects.length > 0) {
          setSelectedProject(data.projects[0].project_id);
        }
      } else {
        console.error('Failed to load projects:', response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadSafetyData = async (projectId: number) => {
    setLoading(true);
    console.log('Loading safety data for project:', projectId); // Debug log
    try {
      const [metricsResponse, alertsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/safety/metrics/${projectId}`),
        fetch(`${API_BASE_URL}/safety/alerts/${projectId}`),
      ]);

      console.log('Metrics response status:', metricsResponse.status); // Debug log
      console.log('Alerts response status:', alertsResponse.status); // Debug log

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        console.log('Loaded metrics:', metricsData); // Debug log
        setSafetyMetrics(metricsData);
      } else {
        console.error('Failed to load metrics:', metricsResponse.status, metricsResponse.statusText);
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        console.log('Loaded alerts:', alertsData); // Debug log
        setSafetyAlerts(alertsData.alerts || []);
      } else {
        console.error('Failed to load alerts:', alertsResponse.status, alertsResponse.statusText);
      }
    } catch (error) {
      console.error("Error loading safety data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { status: "Good", color: "text-green-600", bg: "bg-green-50" };
    if (aqi <= 100) return { status: "Moderate", color: "text-yellow-600", bg: "bg-yellow-50" };
    if (aqi <= 150) return { status: "Unhealthy for Sensitive", color: "text-orange-600", bg: "bg-orange-50" };
    if (aqi <= 200) return { status: "Unhealthy", color: "text-red-600", bg: "bg-red-50" };
    return { status: "Hazardous", color: "text-red-800", bg: "bg-red-100" };
  };

  const getNoiseStatus = (noise: number) => {
    if (noise <= 70) return { status: "Safe", color: "text-green-600", bg: "bg-green-50" };
    if (noise <= 85) return { status: "Caution", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { status: "Dangerous", color: "text-red-600", bg: "bg-red-50" };
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp <= 25) return { status: "Safe", color: "text-green-600", bg: "bg-green-50" };
    if (temp <= 35) return { status: "Caution", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { status: "Dangerous", color: "text-red-600", bg: "bg-red-50" };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-orange-500 text-white";
      case "low": return "bg-yellow-500 text-white";
      default: return "bg-muted text-foreground";
    }
  };

  // Project logos/emojis mapping
  const getProjectLogo = (projectName: string): string => {
    const logoMap: { [key: string]: string } = {
      "Flyover": "🛣️",
      "Bridge": "🌉", 
      "Highway": "🛣️",
      "Building": "🏢",
      "Industrial": "🏭",
      "Residential": "🏠",
      "Commercial": "🏬",
      "Infrastructure": "🏗️",
      "Road": "🛣️",
      "Tunnel": "🚇",
      "Airport": "✈️",
      "Railway": "🚂",
      "Metro": "🚇",
      "Port": "🚢",
      "Dam": "🏔️",
      "Power Plant": "⚡",
      "Hospital": "🏥",
      "School": "🏫",
      "Mall": "🏬",
      "Office": "🏢"
    };
    
    // Try exact match first
    if (logoMap[projectName]) {
      return logoMap[projectName];
    }
    
    // Try partial match
    for (const [key, emoji] of Object.entries(logoMap)) {
      if (projectName.toLowerCase().includes(key.toLowerCase())) {
        return emoji;
      }
    }
    
    // Default fallback
    return "🏗️";
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const selectedProjectData = projects.find(p => p.project_id === selectedProject);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Safety Monitoring</h1>
          <p className="text-muted-foreground">Real-time environmental and worker safety tracking</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedProject?.toString()} onValueChange={(value) => setSelectedProject(parseInt(value))}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.project_id} value={project.project_id.toString()}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getProjectLogo(project.project_name)}</span>
                    <span>{project.project_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProject ? (
        <>
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">{getProjectLogo(selectedProjectData?.project_name || "")}</span>
                <span>{selectedProjectData?.project_name}</span>
                <Badge variant="outline">{selectedProjectData?.project_type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{selectedProjectData?.location}</span>
              </div>
            </CardContent>
          </Card>

          {/* Safety Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AQI Card */}
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Air Quality Index (PM2.5)</CardTitle>
                  <Wind className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                ) : safetyMetrics ? (
                  <>
                    <div className="text-2xl font-bold text-foreground">{safetyMetrics.aqi} AQI</div>
                    <div className={`text-sm font-medium ${getAQIStatus(safetyMetrics.aqi).color}`}>
                      {getAQIStatus(safetyMetrics.aqi).status}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">Safe: &lt;100 AQI</div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getAQIStatus(safetyMetrics.aqi).bg.replace('bg-', 'bg-').replace('-50', '-500')}`}
                          style={{ width: `${Math.min((safetyMetrics.aqi / 200) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      PM2.5 Sensor • Live Data
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Noise Level Card */}
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Noise Level (SLM)</CardTitle>
                  <Volume2 className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                ) : safetyMetrics ? (
                  <>
                    <div className="text-2xl font-bold text-foreground">{safetyMetrics.noise_level} dB</div>
                    <div className={`text-sm font-medium ${getNoiseStatus(safetyMetrics.noise_level).color}`}>
                      {getNoiseStatus(safetyMetrics.noise_level).status}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">Safe: &lt;85 dB (SLM)</div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getNoiseStatus(safetyMetrics.noise_level).bg.replace('bg-', 'bg-').replace('-50', '-500')}`}
                          style={{ width: `${Math.min((safetyMetrics.noise_level / 100) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Sound Level Meter (SLM) • Live Data
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Temperature Card */}
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Temperature (Digital Twin)</CardTitle>
                  <Thermometer className="h-5 w-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                ) : safetyMetrics ? (
                  <>
                    <div className="text-2xl font-bold text-foreground">{safetyMetrics.temperature} °C</div>
                    <div className={`text-sm font-medium ${getTemperatureStatus(safetyMetrics.temperature).color}`}>
                      {getTemperatureStatus(safetyMetrics.temperature).status}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">Safe: &lt;35°C</div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getTemperatureStatus(safetyMetrics.temperature).bg.replace('bg-', 'bg-').replace('-50', '-500')}`}
                          style={{ width: `${Math.min((safetyMetrics.temperature / 50) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Temperature Probe Sensor • Digital Twin
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* CO2 Level Card */}
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">CO2 Level</CardTitle>
                  <Activity className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                ) : safetyMetrics ? (
                  <>
                    <div className="text-2xl font-bold text-foreground">{safetyMetrics.co2_level} ppm</div>
                    <div className={`text-sm font-medium ${safetyMetrics.co2_level > 1000 ? 'text-red-600' : 'text-green-600'}`}>
                      {safetyMetrics.co2_level > 1000 ? 'High' : 'Normal'}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">Safe: &lt;1000</div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${safetyMetrics.co2_level > 1000 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min((safetyMetrics.co2_level / 2000) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Safety Alerts Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span>Active Safety Alerts</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Requiring immediate attention</p>
                </div>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {safetyAlerts.filter(alert => alert.priority === 'high').length} Critical
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : safetyAlerts.length > 0 ? (
                <div className="space-y-4">
                  {safetyAlerts.map((alert) => (
                    <Alert key={alert.id} className={`border-l-4 ${
                      alert.priority === 'high' ? 'border-red-500 bg-red-50' :
                      alert.priority === 'medium' ? 'border-orange-500 bg-orange-50' :
                      'border-yellow-500 bg-yellow-50'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getPriorityColor(alert.priority)}>
                                {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)} Priority
                              </Badge>
                              <span className="text-sm text-muted-foreground">{alert.location}</span>
                            </div>
                            <h4 className="font-semibold text-foreground mb-1">{alert.danger_description}</h4>
                            <p className="text-sm text-gray-700 mb-2">
                              Current: <span className="font-medium">{alert.current_reading} {alert.unit}</span> 
                              (Threshold: {alert.threshold} {alert.unit})
                            </p>
                            <p className="text-sm text-gray-800 font-medium">
                              <Zap className="h-4 w-4 inline mr-1" />
                              Recommended Action: {alert.recommended_action}
                            </p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimeAgo(alert.detected_at)}</span>
                            </div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">All Clear!</h3>
                  <p className="text-muted-foreground">No active safety alerts for this project.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Last Updated */}
          {safetyMetrics && (
            <div className="text-center text-sm text-muted-foreground">
              Last updated: {new Date(safetyMetrics.last_updated).toLocaleString()}
              <br />
              <span className="text-xs text-muted-foreground">
                Data updates every 2 minutes • Refresh to see latest readings
              </span>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Select a Project</h3>
            <p className="text-muted-foreground">Choose a project from the dropdown above to view safety monitoring data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SafetyMonitoringPage;
