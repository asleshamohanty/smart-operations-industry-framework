import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Leaf, Users, Shield, TrendingUp, TrendingDown } from "lucide-react";
import { ESGAnalysis } from "@/lib/api-services";

interface ESGProgressProps {
  esgData: ESGAnalysis | null;
  detailed?: boolean;
}

export const ESGProgress: React.FC<ESGProgressProps> = ({
  esgData,
  detailed = false,
}) => {
  if (!esgData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Leaf className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>ESG data not available</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 0.8) return "default";
    if (score >= 0.6) return "secondary";
    return "destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return "Excellent";
    if (score >= 0.6) return "Good";
    if (score >= 0.4) return "Fair";
    return "Poor";
  };

  const esgMetrics = [
    {
      name: "Environmental",
      score: esgData.environment,
      icon: Leaf,
      color: "text-green-600",
      description: "Environmental impact and sustainability practices",
    },
    {
      name: "Social",
      score: esgData.social,
      icon: Users,
      color: "text-blue-600",
      description: "Social responsibility and community impact",
    },
    {
      name: "Governance",
      score: esgData.governance,
      icon: Shield,
      color: "text-purple-600",
      description: "Governance practices and transparency",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall ESG Score */}
      <div className="text-center">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {(esgData.overall_score * 100).toFixed(1)}
        </div>
        <div className="text-lg text-gray-600 mb-4">Overall ESG Score</div>
        <Progress value={esgData.overall_score * 100} className="h-3 mb-2" />
        <Badge
          variant={getScoreBadgeVariant(esgData.overall_score)}
          className="text-sm"
        >
          {getScoreLabel(esgData.overall_score)}
        </Badge>
      </div>

      {/* Individual ESG Metrics */}
      <div className="space-y-4">
        {esgMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                  <span className="font-medium text-gray-900">
                    {metric.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-medium ${getScoreColor(
                      metric.score
                    )}`}
                  >
                    {(metric.score * 100).toFixed(1)}%
                  </span>
                  <Badge
                    variant={getScoreBadgeVariant(metric.score)}
                    className="text-xs"
                  >
                    {getScoreLabel(metric.score)}
                  </Badge>
                </div>
              </div>
              <Progress value={metric.score * 100} className="h-2" />
              {detailed && (
                <p className="text-xs text-gray-500">{metric.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* SDG Alignment */}
      {detailed && esgData.sdg_alignment && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">SDG Alignment</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(esgData.sdg_alignment).map(([sdg, score]) => (
              <div
                key={sdg}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">{sdg}</span>
                <div className="flex items-center space-x-2">
                  <Progress value={score * 100} className="h-1 w-16" />
                  <span className={`font-medium ${getScoreColor(score)}`}>
                    {(score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Indicators */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">
          Performance Indicators
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Environmental</span>
            <div className="flex items-center space-x-1">
              {esgData.environment >= 0.7 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={getScoreColor(esgData.environment)}>
                {(esgData.environment * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Social</span>
            <div className="flex items-center space-x-1">
              {esgData.social >= 0.7 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={getScoreColor(esgData.social)}>
                {(esgData.social * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Governance</span>
            <div className="flex items-center space-x-1">
              {esgData.governance >= 0.7 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={getScoreColor(esgData.governance)}>
                {(esgData.governance * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Overall</span>
            <div className="flex items-center space-x-1">
              {esgData.overall_score >= 0.7 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={getScoreColor(esgData.overall_score)}>
                {(esgData.overall_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
