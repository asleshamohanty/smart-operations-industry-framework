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
import {
  Building2,
  BarChart3,
  CloudRain,
  Leaf,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiService, Project } from "@/lib/api-services";
import { useTranslation } from "@/contexts/TranslationContext";

export const DashboardPage = () => {
  const { translate } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await apiService.getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const recentProjects = projects.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {translate("dashboard.title")}
          </h1>
          <p className="text-muted-foreground">{translate("dashboard.subtitle")}</p>
        </div>

        {/* Smart Ops Modules Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold">
                    Project Operations Hub
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Resource tracking & shipment monitoring
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Projects</span>
                  <span className="font-medium">{projects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Resource Alerts</span>
                  <span className="font-medium text-orange-600">3</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <RefreshCw className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold">Circular Resources</h3>
                  <p className="text-sm text-gray-600">
                    Material exchange & waste reduction
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Available Materials
                  </span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">CO₂ Saved</span>
                  <span className="font-medium text-green-600">2.3t</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold">Safety Monitor</h3>
                  <p className="text-sm text-gray-600">
                    AQI monitoring & health alerts
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">AQI Level</span>
                  <span className="font-medium text-green-600">Good</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Alerts</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold">Digital Twin</h3>
                  <p className="text-sm text-gray-600">
                    AI workflow optimization
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Simulations</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Emission Reduction
                  </span>
                  <span className="font-medium text-green-600">15%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Leaf className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold">ESG Dashboard</h3>
                  <p className="text-sm text-gray-600">
                    Sustainability scoring & reporting
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Overall Score</span>
                  <span className="font-medium text-green-600">87/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">SDG Alignment</span>
                  <span className="font-medium">5 Goals</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CloudRain className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold">
                    Weather Intelligence
                  </h3>
                  <p className="text-sm text-gray-600">
                    Real-time weather monitoring
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Monitored Locations
                  </span>
                  <span className="font-medium">
                    {new Set(projects.map((p) => p.location)).size}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Disruption Risk</span>
                  <span className="font-medium text-yellow-600">Low</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>
                    Your latest infrastructure projects
                  </CardDescription>
                </div>
                <Link to="/projects">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No projects yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get started by creating your first project
                  </p>
                  <Link to="/projects">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div
                      key={project.project_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        <div>
                          <h4 className="font-medium">
                            {project.project_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {project.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{project.project_type}</Badge>
                        <Link
                          to={`/digital-twin?project=${project.project_id}`}
                        >
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <Link to="/projects">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <Plus className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">Create New Project</div>
                        <div className="text-sm text-gray-600">
                          Add a new infrastructure project
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link to="/digital-twin">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <div className="font-medium">Digital Twin Analysis</div>
                        <div className="text-sm text-gray-600">
                          Weather-aware ESG monitoring
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link to="/weather">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <CloudRain className="h-5 w-5 text-blue-500" />
                      <div className="text-left">
                        <div className="font-medium">Weather Monitoring</div>
                        <div className="text-sm text-gray-600">
                          Real-time weather data
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link to="/esg">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <Leaf className="h-5 w-5 text-green-500" />
                      <div className="text-left">
                        <div className="font-medium">ESG Analysis</div>
                        <div className="text-sm text-gray-600">
                          Sustainability metrics
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Digital Twin Technology</CardTitle>
                <CardDescription>
                  Real-time project monitoring with predictive analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Weather-aware predictions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Cost and schedule forecasting</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Risk assessment</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Leaf className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>ESG Integration</CardTitle>
                <CardDescription>
                  Comprehensive environmental, social, and governance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>SDG alignment tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Carbon footprint monitoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Sustainability reporting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CloudRain className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle>Weather Intelligence</CardTitle>
                <CardDescription>
                  Live weather data integration for project planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Real-time weather monitoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Disruption prediction</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Forecast analysis</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
