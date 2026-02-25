import { Card } from "@/components/ui/card";
import { ArrowRight, Recycle, Package, RefreshCw } from "lucide-react";

const CircularFlow = () => {
  const flowSteps = [
    { icon: Package, label: "Source", description: "Collect materials", color: "text-primary" },
    { icon: Recycle, label: "Recycle", description: "Process & clean", color: "text-success" },
    { icon: RefreshCw, label: "Repurpose", description: "New applications", color: "text-accent" },
    { icon: Package, label: "Reuse", description: "Back to market", color: "text-primary" },
  ];

  return (
    <Card className="glass-panel p-6 fade-in">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Recycle className="h-5 w-5 text-primary" />
          Circular Economy Flow
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Material lifecycle in sustainable supply chain
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
        {flowSteps.map((step, index) => (
          <>
            <div
              key={step.label}
              className="glass-panel p-6 rounded-lg border border-border/50 text-center col-span-1 md:col-span-1 lg:col-span-1"
            >
              <div className={`mx-auto mb-3 ${step.color}`}>
                <step.icon className="h-10 w-10 mx-auto" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">{step.label}</h4>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {index < flowSteps.length - 1 && (
              <div
                key={`arrow-${index}`}
                className="hidden md:flex items-center justify-center col-span-1"
              >
                <ArrowRight className="h-6 w-6 text-primary animate-pulse" />
              </div>
            )}
          </>
        ))}
      </div>

      <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-sm text-foreground">
          <strong>Impact:</strong> By participating in the circular marketplace, your organization has
          prevented <strong className="text-primary">3.1 tons of CO₂</strong> emissions and diverted{" "}
          <strong className="text-primary">8.5 tons</strong> of materials from landfills.
        </p>
      </div>
    </Card>
  );
};

export default CircularFlow;
