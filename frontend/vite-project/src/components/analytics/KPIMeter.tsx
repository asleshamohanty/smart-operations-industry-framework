import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface KPIMeterProps {
  title: string;
  value: number;
  target: number;
  unit: string;
  trend: "up" | "down";
  change: number;
}

const KPIMeter = ({ title, value, target, unit, trend, change }: KPIMeterProps) => {
  const percentage = (value / target) * 100;
  const isOnTrack = value >= target * 0.9;

  return (
    <Card className="glass-panel p-5 fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Badge
          variant="outline"
          className={isOnTrack ? "bg-success/10 text-success border-success" : "bg-warning/10 text-warning border-warning"}
        >
          {isOnTrack ? "On Track" : "Monitor"}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">Target: {target} {unit}</p>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {trend === "up" ? (
              <TrendingUp className={`h-4 w-4 ${change > 0 ? "text-success" : "text-destructive"}`} />
            ) : (
              <TrendingDown className={`h-4 w-4 ${change < 0 ? "text-success" : "text-destructive"}`} />
            )}
            <span className={change > 0 ? "text-success font-medium" : "text-destructive font-medium"}>
              {Math.abs(change)}%
            </span>
          </div>
        </div>

        <Progress value={Math.min(percentage, 100)} className="h-2" />
      </div>
    </Card>
  );
};

export default KPIMeter;
