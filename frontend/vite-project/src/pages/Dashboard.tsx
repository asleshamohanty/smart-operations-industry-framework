import { formatIndianCurrency } from "@/lib/currency";
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
  Leaf,
  Users,
  Shield,
} from "lucide-react";

// Import our custom components
import { GanttChart } from "@/components/GanttChart";
import { ESGProgress } from "@/components/ESGProgress";
import { SDGRadarChart } from "@/components/SDGRadarChart";
import { ScenarioPanel } from "@/components/ScenarioPanel";

// API service
import { apiService } from "@/lib/api-services";

interface Project {
  id: number;
  project_id: number;
  project_name: string;
  location: string;
  project_budget: number;
  project_type: string;
}

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

interface ESGAnalysis {
  environment: number;
  social: number;
  governance: number;
  overall_score: number;
  sdg_alignment: Record<string, number>;
}

export const Dashboard = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [esgData, setEsgData] = useState<ESGAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadWeatherData(selectedProject.location);
      loadESGData(selectedProject.project_id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await apiService.getProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
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

  const loadESGData = async (projectId: number) => {
    try {
      const data = await apiService.getESGAnalysis(projectId);
      setEsgData(data);
    } catch (err) {
      console.error("Failed to load ESG data:", err);
    }
  };

  const getDisruptionColor = (score: number) => {
    if (score < 0.3) return "text-green-600";
    if (score < 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getDisruptionIcon = (score: number) => {
    if (score < 0.3) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score < 0.6)
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Weather-Aware ESG Digital Twin
              </h1>
              <p className="text-gray-600">
                Infrastructure Project Monitoring & Prediction Dashboard
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
        {selectedProject && (
          <>
            {/* Project Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  {weatherData && (
                    <p className="text-xs text-muted-foreground">
                      {weatherData.current_weather.weather_condition}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Weather Disruption
                  </CardTitle>
                  {weatherData &&
                    getDisruptionIcon(weatherData.disruption_score)}
                </CardHeader>
                <CardContent>
                  {weatherData && (
                    <>
                      <div
                        className={`text-2xl font-bold ${getDisruptionColor(
                          weatherData.disruption_score
                        )}`}
                      >
                        {(weatherData.disruption_score * 100).toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Risk Level
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    ESG Score
                  </CardTitle>
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {esgData && (
                    <>
                      <div className="text-2xl font-bold">
                        {(esgData.overall_score * 100).toFixed(1)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Overall Performance
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Weather Details */}
            {weatherData && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CloudRain className="h-5 w-5" />
                    <span>Current Weather Conditions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Temperature:</span>
                      <span>{weatherData.current_weather.temperature}°C</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CloudRain className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Rain:</span>
                      <span>{weatherData.current_weather.rain}mm</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wind className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Wind:</span>
                      <span>{weatherData.current_weather.wind_speed} km/h</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          weatherData.disruption_score < 0.3
                            ? "default"
                            : weatherData.disruption_score < 0.6
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {weatherData.current_weather.weather_condition}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Dashboard Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="esg">ESG Analysis</TabsTrigger>
                <TabsTrigger value="simulation">Simulation</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Timeline</CardTitle>
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
                      <CardTitle>ESG Progress</CardTitle>
                      <CardDescription>
                        Environmental, Social, and Governance metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ESGProgress esgData={esgData} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Schedule & Weather Impact</CardTitle>
                    <CardDescription>
                      Detailed timeline with weather disruption predictions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GanttChart
                      projectId={selectedProject.project_id}
                      showWeatherImpact={true}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="esg" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>ESG Breakdown</CardTitle>
                      <CardDescription>
                        Detailed Environmental, Social, and Governance scores
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ESGProgress esgData={esgData} detailed={true} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>SDG Alignment</CardTitle>
                      <CardDescription>
                        United Nations Sustainable Development Goals alignment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SDGRadarChart esgData={esgData} />
                    </CardContent>
                  </Card>
                </div>
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
        )}
      </div>
    </div>
  );
};
