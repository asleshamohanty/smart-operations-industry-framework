import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export API_BASE_URL for use in other components
export { API_BASE_URL };

export interface Project {
  id: number;
  project_id: number;
  project_name: string;
  location: string;
  project_budget: number;
  currency: string;
  project_type?: string;
  description?: string;
  estimated_duration_days?: number;
  team_size?: number;
}

export interface Task {
  id: number;
  task_id: number;
  task_name: string;
  planned_start_date: string;
  planned_end_date: string;
  duration_days: number;
  labor_count: number;
  labor_cost_per_day: number;
  equipment_cost_per_day: number;
  material: string;
  material_quantity: number;
  material_unit_cost: number;
  planned_task_cost: number;
  e_score: number;
  s_score: number;
  g_score: number;
  carbon_footprint_kg: number;
  water_usage_m3: number;
  energy_usage_kwh: number;
  sdg_alignment_score: number;
  predicted_delay_days: number;
  predicted_task_cost: number;
  predicted_esg_score: number;
  profit_impact: number;
  project_id: number;
}

export interface WeatherData {
  location: string;
  current_weather: {
    temperature: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    weather_condition: string;
    rain: number;
  };
  forecast: Array<{
    datetime: string;
    temperature: number;
    humidity: number;
    wind_speed: number;
    weather_condition: string;
    rain: number;
  }>;
  disruption_score: number;
}

export interface ESGAnalysis {
  environment: number;
  social: number;
  governance: number;
  overall_score: number;
  sdg_alignment: Record<string, number>;
}

export interface SimulationRequest {
  project_id: number;
  alternative_materials?: string[];
  alternative_resources?: Record<string, number>;
  weather_scenario?: string;
}

export interface SimulationResult {
  original_cost: number;
  predicted_cost: number;
  original_duration: number;
  predicted_duration: number;
  esg_impact: ESGAnalysis;
  weather_impact: number;
  weather_data?: {
    location: string;
    temperature: number;
    humidity: number;
    wind_speed: number;
    weather_condition: string;
    weather_description: string;
    timestamp: string;
  };
  recommendations: string[];
}

class ApiService {
  // Project endpoints
  async getProjects(): Promise<Project[]> {
    const response = await api.get('/projects');
    return response.data;
  }

  async createProject(project: Omit<Project, 'id' | 'project_id'>): Promise<Project> {
    const response = await api.post('/projects', project);
    return response.data;
  }

  async updateProject(projectId: number, project: Partial<Project>): Promise<Project> {
    // Remove fields that shouldn't be updated
    const { id, project_id, ...updateData } = project;
    const response = await api.put(`/projects/${projectId}`, updateData);
    return response.data;
  }

  async deleteProject(projectId: number): Promise<void> {
    await api.delete(`/projects/${projectId}`);
  }

  async getProject(projectId: number): Promise<Project> {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  }

  async getProjectTasks(projectId: number): Promise<Task[]> {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  }

  async getProjectSummary(projectId: number): Promise<any> {
    const response = await api.get(`/projects/${projectId}/summary`);
    return response.data;
  }

  // Weather endpoints
  async getWeatherData(location: string): Promise<WeatherData> {
    const response = await api.get(`/weather/${location}`);
    return response.data;
  }

  async getDisruptionScore(location: string): Promise<any> {
    const response = await api.get(`/weather/${location}/disruption-score`);
    return response.data;
  }

  async getWeatherForecast(location: string, days: number = 5): Promise<any> {
    const response = await api.get(`/weather/${location}/forecast/${days}`);
    return response.data;
  }

  // ESG endpoints
  async getESGAnalysis(projectId: number): Promise<ESGAnalysis> {
    const response = await api.get(`/esg/project/${projectId}`);
    return response.data;
  }

  // Deprecated; dashboard now uses CSV-based endpoints via /api
  async getESGDashboard(projectId: number): Promise<any> {
    const response = await api.get(`/esg/scores`);
    return response.data;
  }

  async getSDGAlignment(projectId: number): Promise<any> {
    const response = await api.get(`/esg/project/${projectId}/sdg-alignment`);
    return response.data;
  }

  async getESGRecommendations(projectId: number): Promise<any> {
    const response = await api.get(`/esg/project/${projectId}/recommendations`);
    return response.data;
  }

  async compareProjectsESG(projectIds: number[]): Promise<any> {
    const idsString = projectIds.join(',');
    const response = await api.get(`/esg/comparison?project_ids=${idsString}`);
    return response.data;
  }

  // Simulation endpoint
  async simulateProject(simulationRequest: SimulationRequest): Promise<SimulationResult> {
    console.log("🚀 Sending simulation request:", simulationRequest);
    const response = await api.post('/projects/simulate', simulationRequest);
    console.log("📥 Simulation response:", response.data);
    return response.data;
  }

  // Anomaly Detection endpoints
  async getAnomalyStatus(): Promise<any> {
    const response = await api.get('/anomaly/status');
    return response.data;
  }

  async getAnomalyMetrics(): Promise<any> {
    const response = await api.get('/anomaly/metrics');
    return response.data;
  }

  async getAnomalyResults(limit = 100, offset = 0): Promise<any> {
    const response = await api.get(`/anomaly/results?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  async getAnomalySummary(): Promise<any> {
    const response = await api.get('/anomaly/summary');
    return response.data;
  }

  async analyzeProjectAnomalies(projectId: number): Promise<any> {
    const response = await api.post(`/anomaly/analyze/${projectId}`);
    return response.data;
  }

  async getProjectAlerts(projectId: number): Promise<any> {
    const response = await api.get(`/anomaly/alerts/${projectId}`);
    return response.data;
  }

  async getProjectRecommendations(projectId: number): Promise<any> {
    const response = await api.post(`/anomaly/recommendations/${projectId}`);
    return response.data;
  }

  getAnomalyVisualizationUrl(): string {
    return `${API_BASE_URL}/anomaly/visualization`;
  }

  async getAnomalyReport(): Promise<any> {
    const response = await api.get('/anomaly/report');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await api.get('/health');
    return response.data;
  }

  // Shipment endpoints
  async getShipments(): Promise<any[]> {
    const response = await api.get('/shipments');
    return response.data;
  }

  async getShipmentsByProject(projectId: number): Promise<any[]> {
    const response = await api.get(`/shipments/project/${projectId}`);
    return response.data;
  }

  async getWeatherImpact(location: string): Promise<any> {
    const response = await api.get(`/shipments/weather/${location}/impact`);
    return response.data;
  }

  // Material endpoints
  async getMaterials(): Promise<any[]> {
    const response = await api.get('/shipments/materials');
    return response.data;
  }

  async getMaterialsByProject(projectId: number): Promise<any[]> {
    const response = await api.get(`/shipments/materials/project/${projectId}`);
    return response.data;
  }

  async createMaterial(material: any): Promise<any> {
    const response = await api.post(`/projects/${material.project_id}/materials`, material);
    return response.data;
  }
}

export const apiService = new ApiService();