import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, TrendingDown, Package } from "lucide-react";

const mockAlerts = [
  {
    id: 1,
    title: "Port Congestion - Los Angeles",
    impact: "high",
    time: "5 min ago",
    affected: 12,
  },
  {
    id: 2,
    title: "Weather Delay - North Atlantic",
    impact: "medium",
    time: "23 min ago",
    affected: 3,
  },
  {
    id: 3,
    title: "Carbon Credits Alert",
    impact: "low",
    time: "1 hour ago",
    affected: 0,
  },
  {
    id: 4,
    title: "Supplier Compliance Update",
    impact: "medium",
    time: "2 hours ago",
    affected: 5,
  },
];

const AlertsFeed = () => {
  return (
    <Card className="glass-panel p-6 h-[500px] fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent" />
            Live Alerts
          </h3>
          <p className="text-sm text-muted-foreground">Real-time event monitoring</p>
        </div>
        <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
          {mockAlerts.length} New
        </Badge>
      </div>

      <ScrollArea className="h-[380px]">
        <div className="space-y-3">
          {mockAlerts.map((alert) => (
            <div
              key={alert.id}
              className="glass-panel p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={alert.impact === "high" ? "destructive" : "outline"}
                      className={
                        alert.impact === "low"
                          ? "bg-success/10 text-success border-success"
                          : alert.impact === "medium"
                          ? "bg-warning/10 text-warning border-warning"
                          : ""
                      }
                    >
                      {alert.impact}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                  <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                </div>
              </div>
              {alert.affected > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Package className="h-3 w-3" />
                  {alert.affected} shipments affected
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default AlertsFeed;
