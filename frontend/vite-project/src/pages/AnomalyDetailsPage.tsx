import React, { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea } from "recharts";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { anomalyService, Anomaly } from "@/lib/anomalyService";
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
  ArrowLeft,
  Clock,
  MapPin,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  BarChart3,
  Calendar,
  Thermometer,
  Wind,
  Droplets,
  Zap,
  Gauge,
} from "lucide-react";

interface AnomalyDisplay {
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

const AnomalyDetailsPage: React.FC = () => {
  const { anomalyId } = useParams<{ anomalyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [anomaly, setAnomaly] = useState<AnomalyDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<Array<{ time: string; value: number }>>([]);
  
  // Get anomaly data from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const anomalyDataParam = urlParams.get('data');

  const handleBack = () => {
    // Navigate back to digital twin anomaly tab specifically
    navigate('/digital-twin?tab=anomaly');
  };

  // Load anomaly data from Supabase or URL parameters
  useEffect(() => {
    const loadAnomaly = async () => {
      if (!anomalyId) {
        setError("No anomaly ID provided");
        setLoading(false);
        return;
      }

      // First, try to get data from URL parameters (for local state)
      if (anomalyDataParam) {
        try {
          const anomalyData = JSON.parse(decodeURIComponent(anomalyDataParam));
          const displayAnomaly: AnomalyDisplay = {
            id: anomalyData.id,
            sensorName: anomalyData.sensorName,
            sensorType: anomalyData.sensorType,
            location: anomalyData.location,
            timestamp: anomalyData.timestamp,
            value: anomalyData.value,
            unit: anomalyData.unit,
            normalRange: anomalyData.normalRange,
            severity: anomalyData.severity,
            confidence: anomalyData.confidence,
            description: anomalyData.description,
            resolved: anomalyData.resolved
          };
          setAnomaly(displayAnomaly);
          setLoading(false);
          return;
        } catch (err) {
          console.error('Error parsing anomaly data from URL:', err);
        }
      }

      // Fallback to Supabase
      try {
        const anomalyData = await anomalyService.getAnomaly(anomalyId);
        if (anomalyData) {
          // Convert Supabase format to display format
          const displayAnomaly: AnomalyDisplay = {
            id: anomalyData.anomaly_id,
            sensorName: anomalyData.sensor_name,
            sensorType: anomalyData.sensor_type,
            location: anomalyData.location,
            timestamp: anomalyData.timestamp,
            value: anomalyData.value,
            unit: anomalyData.unit,
            normalRange: [anomalyData.normal_range_min, anomalyData.normal_range_max],
            severity: anomalyData.severity,
            confidence: anomalyData.confidence,
            description: anomalyData.description,
            resolved: anomalyData.resolved
          };
          setAnomaly(displayAnomaly);
        } else {
          setError("Anomaly not found");
        }
      } catch (err) {
        console.error('Error loading anomaly:', err);
        // If Supabase is not configured, show a mock anomaly
        if (err instanceof Error && err.message.includes('Supabase not configured')) {
          const mockAnomaly: AnomalyDisplay = {
            id: anomalyId,
            sensorName: 'Mock Sensor',
            sensorType: 'Mock Type',
            location: 'Mock Location',
            timestamp: new Date().toISOString(),
            value: 85.5,
            unit: 'Mock Unit',
            normalRange: [70, 90],
            severity: 'medium',
            confidence: 0.8,
            description: 'Mock anomaly for demonstration',
            resolved: false
          };
          setAnomaly(mockAnomaly);
        } else {
          setError("Failed to load anomaly");
        }
      } finally {
        setLoading(false);
      }
    };

    loadAnomaly();
  }, [anomalyId, anomalyDataParam]);

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
        return "bg-gray-600 text-white";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5" />;
      case "high":
        return <TrendingUp className="h-5 w-5" />;
      case "medium":
        return <Activity className="h-5 w-5" />;
      case "low":
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType.toLowerCase()) {
      case "temperature":
        return <Thermometer className="h-6 w-6" />;
      case "wind":
        return <Wind className="h-6 w-6" />;
      case "rainfall":
        return <Droplets className="h-6 w-6" />;
      case "energy":
        return <Zap className="h-6 w-6" />;
      case "pressure":
        return <Gauge className="h-6 w-6" />;
      default:
        return <Activity className="h-6 w-6" />;
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
      return { 
        type: "below", 
        amount: min - value, 
        percentage: ((min - value) / (max - min)) * 100 
      };
    } else if (value > max) {
      return { 
        type: "above", 
        amount: value - max, 
        percentage: ((value - max) / (max - min)) * 100 
      };
    }
    return { type: "normal", amount: 0, percentage: 0 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading anomaly details...</p>
        </div>
      </div>
    );
  }

  if (error || !anomaly) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error || "Anomaly not found"}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Anomaly Detection
          </Button>
        </div>
      </div>
    );
  }

  const deviation = calculateDeviation(anomaly.value, anomaly.normalRange);
  const timestamp = formatTimestamp(anomaly.timestamp);

  const handleResolveAnomaly = async () => {
    if (!anomaly) return;
    
    try {
      await anomalyService.resolveAnomaly(anomaly.id, 'User');
      console.log(`Anomaly ${anomaly.id} resolved successfully`);
      // Update local state
      setAnomaly(prev => prev ? { ...prev, resolved: true } : null);
      // Navigate back to digital twin anomaly tab after resolving
      navigate('/digital-twin?tab=anomaly');
    } catch (error) {
      console.error('Error resolving anomaly:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Anomaly Details
              </h1>
              <p className="text-gray-600">
                Detailed analysis of detected anomaly
              </p>
            </div>
          </div>
            <div className="flex items-center space-x-2">
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
            </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sensor Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getSensorIcon(anomaly.sensorType)}
                  <span>Sensor Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Sensor Name
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {anomaly.sensorName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Sensor Type
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {anomaly.sensorType}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Location
                      </label>
                      <p className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{anomaly.location}</span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Detected At
                      </label>
                      <p className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{timestamp.date}</span>
                      </p>
                      <p className="text-sm text-gray-600 flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{timestamp.time}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {timestamp.relative}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Confidence Level
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {anomaly.confidence}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Value Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Value Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Current Value vs Normal Range */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Current Reading vs Normal Range
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="text-3xl font-bold text-red-600 mb-2">
                          {anomaly.value}
                        </div>
                        <div className="text-sm text-gray-600">
                          Current Value ({anomaly.unit})
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-800 mb-2">
                          {anomaly.normalRange[0]}-{anomaly.normalRange[1]}
                        </div>
                        <div className="text-sm text-gray-600">
                          Normal Range ({anomaly.unit})
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {deviation.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          Deviation
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deviation Details */}
                  <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-4">
                      Deviation Analysis
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-red-700">Deviation Amount:</span>
                        <span className="font-semibold text-red-900">
                          {deviation.amount.toFixed(1)} {anomaly.unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-700">Deviation Direction:</span>
                        <span className="font-semibold text-red-900 capitalize">
                          {deviation.type} normal range
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-700">Severity Ratio:</span>
                        <span className="font-semibold text-red-900">
                          {(deviation.percentage / 100).toFixed(2)}x
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Range Indicator */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Range Visualization
                    </h4>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="relative h-4 rounded-full">
                          {/* Normal range indicator */}
                          <div 
                            className="absolute bg-green-400 h-4 rounded-full"
                            style={{
                              left: '0%',
                              width: '100%'
                            }}
                          ></div>
                          {/* Current value indicator */}
                          <div 
                            className="absolute top-0 h-4 w-2 rounded-full bg-red-600"
                            style={{
                              left: `${Math.min(100, Math.max(0, 
                                ((anomaly.value - anomaly.normalRange[0]) / 
                                 (anomaly.normalRange[1] - anomaly.normalRange[0])) * 100
                              ))}%`
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-2">
                        <span>{anomaly.normalRange[0]} {anomaly.unit}</span>
                        <span className="font-semibold text-red-600">
                          {anomaly.value} {anomaly.unit}
                        </span>
                        <span>{anomaly.normalRange[1]} {anomaly.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {anomaly.description}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Additional Info */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!anomaly.resolved && (
                  <Button
                    onClick={handleResolveAnomaly}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve Anomaly
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (!anomaly) return;
                    const [min, max] = anomaly.normalRange;
                    const mid = (min + max) / 2;
                    const amplitude = (max - min) / 4; // quarter of range
                    const points: Array<{ time: string; value: number }> = [];
                    const now = Date.now();
                    const totalPoints = 60; // last 60 minutes
                    for (let i = totalPoints - 1; i >= 0; i--) {
                      const t = (totalPoints - i) / totalPoints; // 0..1
                      const noise = (Math.random() - 0.5) * amplitude * 0.15;
                      const val = mid + amplitude * Math.sin(2 * Math.PI * t * 1.5) + noise;
                      const ts = new Date(now - i * 60 * 1000);
                      points.push({ time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: Number(val.toFixed(2)) });
                    }
                    // Set last point to actual anomaly value for continuity
                    points[points.length - 1].value = anomaly.value;
                    setHistoryData(points);
                    setShowHistory(true);
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View Sensor History
                </Button>
                {/* Generate Report button removed per request */}
              </CardContent>
            </Card>

            {showHistory && anomaly && (
              <Card>
                <CardHeader>
                  <CardTitle>Sensor History</CardTitle>
                  <CardDescription>Last 60 minutes • simulated sinusoidal history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" minTickGap={20} />
                        <YAxis />
                        <Tooltip />
                        <ReferenceArea y1={anomaly.normalRange[0]} y2={anomaly.normalRange[1]} strokeOpacity={0} fill="#22c55e" fillOpacity={0.08} />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Severity:</span>
                    <Badge className={getSeverityColor(anomaly.severity)}>
                      {anomaly.severity}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <span className="font-semibold">{anomaly.confidence}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`font-semibold ${
                      anomaly.resolved ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {anomaly.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Deviation:</span>
                    <span className="font-semibold text-red-600">
                      {deviation.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Anomalies section removed per request */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetailsPage;
