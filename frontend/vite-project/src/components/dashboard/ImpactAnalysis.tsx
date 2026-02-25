import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  AlertCircle,
  IndianRupee,
  Clock,
  ArrowRight,
} from "lucide-react";

const mockImpacts = [
  {
    id: 1,
    shipmentId: "SH-002",
    route: "Rotterdam → New York",
    delay: "+3 days",
    cost: "₹1.24L",
    risk: "high",
    recommendation: "Reroute via Port of Hamburg",
  },
  {
    id: 2,
    shipmentId: "SH-003",
    route: "Singapore → Sydney",
    delay: "+1 day",
    cost: "₹42K",
    risk: "medium",
    recommendation: "Monitor weather conditions",
  },
];

const ImpactAnalysis = () => {
  return (
    <Card className="glass-panel p-6 fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-accent" />
            Impact Analysis & Recommendations
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered risk assessment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockImpacts.map((impact) => (
          <div
            key={impact.id}
            className={`glass-panel p-5 rounded-lg border ${
              impact.risk === "high"
                ? "border-destructive/50"
                : "border-warning/50"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge
                  variant={impact.risk === "high" ? "destructive" : "outline"}
                  className={
                    impact.risk === "medium"
                      ? "bg-warning/10 text-warning border-warning"
                      : ""
                  }
                >
                  {impact.risk} risk
                </Badge>
                <h4 className="text-lg font-semibold mt-2">
                  {impact.shipmentId}
                </h4>
                <p className="text-sm text-muted-foreground">{impact.route}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Delay</p>
                  <p className="text-sm font-medium">{impact.delay}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Impact</p>
                  <p className="text-sm font-medium">{impact.cost}</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-lg p-3 mb-3">
              <p className="text-xs text-muted-foreground mb-1">
                Recommended Action
              </p>
              <p className="text-sm font-medium text-primary">
                {impact.recommendation}
              </p>
            </div>

            <Button variant="outline" size="sm" className="w-full">
              View Details
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ImpactAnalysis;
