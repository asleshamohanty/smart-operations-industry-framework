import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIndianCurrency } from "@/lib/currency";
import { apiService, Task } from "@/lib/api-services";
import { Calendar, Clock, IndianRupee, AlertTriangle } from "lucide-react";

interface GanttChartProps {
  projectId: number;
  showWeatherImpact?: boolean;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  projectId,
  showWeatherImpact = false,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      const data = await apiService.getProjectTasks(projectId);
      setTasks(data);
    } catch (err) {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTaskStatus = (task: Task) => {
    const now = new Date();
    const startDate = new Date(task.planned_start_date);
    const endDate = new Date(task.planned_end_date);

    if (now < startDate) return "upcoming";
    if (now > endDate) return "completed";
    return "in-progress";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-blue-500";
      case "upcoming":
        return "bg-muted";
      default:
        return "bg-muted";
    }
  };

  const getWeatherImpactColor = (delayDays: number) => {
    if (delayDays <= 2) return "text-green-600";
    if (delayDays <= 5) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <span className="font-medium">Task Timeline</span>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-muted rounded"></div>
            <span>Upcoming</span>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const status = getTaskStatus(task);
          const progress =
            status === "completed" ? 100 : status === "in-progress" ? 50 : 0;

          return (
            <div
              key={task.task_id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-foreground">
                    {task.task_name}
                  </h4>
                  <Badge variant="outline">{task.material}</Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(task.planned_start_date)} -{" "}
                      {formatDate(task.planned_end_date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{task.duration_days} days</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <IndianRupee className="h-4 w-4" />
                    <span>{formatIndianCurrency(task.planned_task_cost)}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(
                      status
                    )}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Weather Impact */}
              {showWeatherImpact && task.predicted_delay_days > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground">Weather Impact:</span>
                  <span
                    className={`font-medium ${getWeatherImpactColor(
                      task.predicted_delay_days
                    )}`}
                  >
                    +{task.predicted_delay_days} days delay
                  </span>
                  <span className="text-muted-foreground">
                    (
                    {formatIndianCurrency(
                      task.predicted_task_cost - task.planned_task_cost
                    )}{" "}
                    cost increase)
                  </span>
                </div>
              )}

              {/* ESG Scores */}
              <div className="flex items-center space-x-4 text-sm mt-2">
                <div className="flex items-center space-x-1">
                  <span className="text-muted-foreground">ESG:</span>
                  <span className="text-green-600">
                    E:{(task.e_score * 100).toFixed(0)}
                  </span>
                  <span className="text-blue-600">
                    S:{(task.s_score * 100).toFixed(0)}
                  </span>
                  <span className="text-purple-600">
                    G:{(task.g_score * 100).toFixed(0)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-muted-foreground">Carbon:</span>
                  <span className="text-foreground">
                    {task.carbon_footprint_kg.toFixed(0)}kg
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-muted-foreground">Water:</span>
                  <span className="text-foreground">
                    {task.water_usage_m3.toFixed(1)}m³
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Tasks:</span>
            <span className="ml-2 font-medium">{tasks.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Duration:</span>
            <span className="ml-2 font-medium">
              {tasks.reduce((sum, task) => sum + task.duration_days, 0)} days
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Cost:</span>
            <span className="ml-2 font-medium">
              {formatIndianCurrency(
                tasks.reduce((sum, task) => sum + task.planned_task_cost, 0)
              )}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg ESG Score:</span>
            <span className="ml-2 font-medium">
              {(
                (tasks.reduce(
                  (sum, task) => sum + task.predicted_esg_score,
                  0
                ) /
                  tasks.length) *
                100
              ).toFixed(0)}
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
