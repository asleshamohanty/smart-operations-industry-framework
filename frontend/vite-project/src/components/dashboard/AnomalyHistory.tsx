import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { anomalyService } from "@/lib/anomalyService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  MapPin,
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Anomaly {
  id: string;
  sensorName: string;
  sensorType: string;
  location: string;
  timestamp: string;
  value: number;
  unit: string;
  normalRange: [number, number];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  resolved: boolean;
}

interface AnomalyHistoryProps {
  anomalies: Anomaly[];
  onAnomalySelect?: (anomaly: Anomaly) => void;
  onAnomalyUpdate?: () => void;
}

export const AnomalyHistory: React.FC<AnomalyHistoryProps> = ({
  anomalies,
  onAnomalySelect,
  onAnomalyUpdate,
}) => {
  const navigate = useNavigate();
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterResolved, setFilterResolved] = useState<string>("all");

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-600 text-white";
      case "medium":
        return "bg-yellow-600 text-white";
      case "low":
        return "bg-blue-600 text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
      case "high":
        return <TrendingUp className="h-4 w-4" />;
      case "medium":
        return <Activity className="h-4 w-4" />;
      case "low":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date),
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const calculateDeviation = (value: number, normalRange: [number, number]) => {
    const [min, max] = normalRange;
    if (value < min) {
      return { type: "below", amount: min - value, percentage: ((min - value) / (max - min)) * 100 };
    } else if (value > max) {
      return { type: "above", amount: value - max, percentage: ((value - max) / (max - min)) * 100 };
    }
    return { type: "normal", amount: 0, percentage: 0 };
  };

  const filteredAnomalies = anomalies.filter((anomaly) => {
    const severityMatch = filterSeverity === "all" || anomaly.severity === filterSeverity;
    const resolvedMatch = filterResolved === "all" || 
      (filterResolved === "resolved" && anomaly.resolved) ||
      (filterResolved === "unresolved" && !anomaly.resolved);
    return severityMatch && resolvedMatch;
  });

  const handleAnomalyClick = (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    onAnomalySelect?.(anomaly);
  };

  const handleViewDetails = (anomaly: Anomaly) => {
    // Pass anomaly data as URL parameter for local state
    const anomalyData = encodeURIComponent(JSON.stringify(anomaly));
    navigate(`/anomaly/${anomaly.id}?data=${anomalyData}`);
  };

  const handleResolveAnomaly = async (anomalyId: string) => {
    try {
      await anomalyService.resolveAnomaly(anomalyId, 'User');
      console.log(`Anomaly ${anomalyId} resolved successfully`);
      // Refresh the anomaly list
      onAnomalyUpdate?.();
    } catch (error) {
      console.error('Error resolving anomaly:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Anomaly History</span>
            <Badge variant="outline" className="ml-2">
              {anomalies.length} Total
            </Badge>
          </CardTitle>
          <CardDescription>
            Historical record of all detected anomalies with detailed analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Severity:</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Status:</label>
              <select
                value={filterResolved}
                onChange={(e) => setFilterResolved(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Anomaly List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAnomalies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p>No anomalies found matching the current filters</p>
              </div>
            ) : (
              filteredAnomalies.map((anomaly) => {
                const timestamp = formatTimestamp(anomaly.timestamp);
                const deviation = calculateDeviation(anomaly.value, anomaly.normalRange);
                
                return (
                  <Card
                    key={anomaly.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedAnomaly?.id === anomaly.id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : "hover:bg-muted"
                    } ${anomaly.resolved ? "opacity-75" : ""}`}
                    onClick={() => handleAnomalyClick(anomaly)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getSeverityColor(anomaly.severity)}>
                              <div className="flex items-center space-x-1">
                                {getSeverityIcon(anomaly.severity)}
                                <span className="capitalize">{anomaly.severity}</span>
                              </div>
                            </Badge>
                            {anomaly.resolved && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {anomaly.confidence}% confidence
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-foreground">
                                {anomaly.sensorName}
                              </h4>
                              <span className="text-sm text-muted-foreground">
                                {anomaly.sensorType}
                              </span>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{anomaly.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{timestamp.relative}</span>
                              </div>
                            </div>

                            <div className="bg-muted p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Current Value
                                </span>
                                <span className={`text-lg font-bold ${
                                  deviation.type === "normal" ? "text-gray-800" : "text-red-600"
                                }`}>
                                  {anomaly.value} {anomaly.unit}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>
                                  Normal Range: {anomaly.normalRange[0]}-{anomaly.normalRange[1]} {anomaly.unit}
                                </div>
                                {deviation.type !== "normal" && (
                                  <div className="text-red-600 font-medium">
                                    Deviation: {deviation.amount.toFixed(1)} {anomaly.unit} {deviation.type} normal range
                                    ({deviation.percentage.toFixed(1)}% beyond normal)
                                  </div>
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {anomaly.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(anomaly);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          {!anomaly.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolveAnomaly(anomaly.id);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Anomaly Details */}
      {selectedAnomaly && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <span>Anomaly Details</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAnomaly(null)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Sensor Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedAnomaly.sensorName}</div>
                    <div><span className="font-medium">Type:</span> {selectedAnomaly.sensorType}</div>
                    <div><span className="font-medium">Location:</span> {selectedAnomaly.location}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Anomaly Details</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Severity:</span> 
                      <Badge className={`ml-2 ${getSeverityColor(selectedAnomaly.severity)}`}>
                        {selectedAnomaly.severity}
                      </Badge>
                    </div>
                    <div><span className="font-medium">Confidence:</span> {selectedAnomaly.confidence}%</div>
                    <div><span className="font-medium">Detected:</span> {formatTimestamp(selectedAnomaly.timestamp).date} at {formatTimestamp(selectedAnomaly.timestamp).time}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Value Analysis</h4>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {selectedAnomaly.value}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Value ({selectedAnomaly.unit})</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">
                        {selectedAnomaly.normalRange[0]}-{selectedAnomaly.normalRange[1]}
                      </div>
                      <div className="text-sm text-muted-foreground">Normal Range ({selectedAnomaly.unit})</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {calculateDeviation(selectedAnomaly.value, selectedAnomaly.normalRange).percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Deviation</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Description</h4>
                <p className="text-sm text-muted-foreground bg-white p-3 rounded-lg border">
                  {selectedAnomaly.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
