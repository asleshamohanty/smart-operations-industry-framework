import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ESGAnalysis } from "@/lib/api-services";

interface SDGRadarChartProps {
  esgData: ESGAnalysis | null;
}

export const SDGRadarChart: React.FC<SDGRadarChartProps> = ({ esgData }) => {
  if (!esgData || !esgData.sdg_alignment) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>SDG alignment data not available</p>
        </div>
      </div>
    );
  }

  // Transform SDG data for radar chart
  const radarData = Object.entries(esgData.sdg_alignment).map(
    ([sdg, score]) => ({
      sdg: sdg.replace("SDG ", ""),
      score: score * 100, // Convert to percentage
      fullName: sdg,
    })
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981"; // green
    if (score >= 60) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const averageScore =
    radarData.reduce((sum, item) => sum + item.score, 0) / radarData.length;

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="sdg" />
            <PolarRadiusAxis
              domain={[0, 100]}
              tickCount={6}
              tickFormatter={(value) => `${value}%`}
            />
            <Radar
              name="SDG Score"
              dataKey="score"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {averageScore.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600 mb-2">Average SDG Alignment</div>
        <Badge
          variant={
            averageScore >= 80
              ? "default"
              : averageScore >= 60
              ? "secondary"
              : "destructive"
          }
          className="text-xs"
        >
          {getScoreLabel(averageScore)}
        </Badge>
      </div>

      {/* SDG Details */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 text-sm">SDG Breakdown</h4>
        <div className="grid grid-cols-2 gap-2">
          {radarData.map((item) => (
            <div
              key={item.fullName}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-gray-600">{item.fullName}</span>
              <div className="flex items-center space-x-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getScoreColor(item.score) }}
                ></div>
                <span className="font-medium">{item.score.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SDG Descriptions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h5 className="font-medium text-blue-900 text-sm mb-2">
          Key SDGs for Infrastructure
        </h5>
        <div className="space-y-1 text-xs text-blue-800">
          <div>
            <strong>SDG 6:</strong> Clean Water & Sanitation
          </div>
          <div>
            <strong>SDG 7:</strong> Affordable & Clean Energy
          </div>
          <div>
            <strong>SDG 9:</strong> Industry, Innovation & Infrastructure
          </div>
          <div>
            <strong>SDG 11:</strong> Sustainable Cities & Communities
          </div>
          <div>
            <strong>SDG 13:</strong> Climate Action
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-900 text-sm mb-2">
          Performance Insights
        </h5>
        <div className="space-y-1 text-xs text-gray-600">
          {averageScore >= 80 && (
            <div className="text-green-600">
              ✅ Excellent alignment with UN Sustainable Development Goals
            </div>
          )}
          {averageScore >= 60 && averageScore < 80 && (
            <div className="text-yellow-600">
              ⚠️ Good progress, but room for improvement in some areas
            </div>
          )}
          {averageScore < 60 && (
            <div className="text-red-600">
              ❌ Significant opportunities to improve SDG alignment
            </div>
          )}

          {Object.entries(esgData.sdg_alignment).map(([sdg, score]) => {
            if (score < 0.5) {
              return (
                <div key={sdg} className="text-orange-600">
                  • Focus on improving {sdg} alignment
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};
