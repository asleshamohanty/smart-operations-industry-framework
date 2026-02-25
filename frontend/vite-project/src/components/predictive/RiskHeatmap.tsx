import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const riskData = [
  { area: "Supply Chain", delay: "high", cost: "medium", env: "low" },
  { area: "Operations", delay: "medium", cost: "high", env: "medium" },
  { area: "Logistics", delay: "high", cost: "medium", env: "low" },
  { area: "Manufacturing", delay: "low", cost: "low", env: "high" },
  { area: "Distribution", delay: "medium", cost: "medium", env: "low" },
];

const getRiskColor = (level: string) => {
  switch (level) {
    case "high":
      return "bg-destructive/20 text-destructive border-destructive";
    case "medium":
      return "bg-warning/20 text-warning border-warning";
    case "low":
      return "bg-success/20 text-success border-success";
    default:
      return "bg-muted/20 text-muted-foreground border-muted";
  }
};

const RiskHeatmap = () => {
  return (
    <Card className="glass-panel p-6 fade-in">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground">Risk Probability Heatmap</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Cross-functional risk assessment by business area
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Business Area
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                Delay Risk
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                Cost Risk
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                Environmental Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {riskData.map((row, index) => (
              <tr key={index} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                <td className="py-4 px-4 font-medium text-foreground">{row.area}</td>
                <td className="py-4 px-4 text-center">
                  <Badge variant="outline" className={`${getRiskColor(row.delay)} capitalize`}>
                    {row.delay}
                  </Badge>
                </td>
                <td className="py-4 px-4 text-center">
                  <Badge variant="outline" className={`${getRiskColor(row.cost)} capitalize`}>
                    {row.cost}
                  </Badge>
                </td>
                <td className="py-4 px-4 text-center">
                  <Badge variant="outline" className={`${getRiskColor(row.env)} capitalize`}>
                    {row.env}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center gap-6 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive"></div>
          <span className="text-muted-foreground">High Risk (&gt;60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-warning/20 border border-warning"></div>
          <span className="text-muted-foreground">Medium Risk (30-60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-success/20 border border-success"></div>
          <span className="text-muted-foreground">Low Risk (&lt;30%)</span>
        </div>
      </div>
    </Card>
  );
};

export default RiskHeatmap;
