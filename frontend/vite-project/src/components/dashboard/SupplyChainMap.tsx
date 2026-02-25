import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, Package } from "lucide-react";

const mockShipments = [
  { id: "SH-001", status: "active", risk: "low", from: "Shanghai", to: "Los Angeles", co2: 2.4 },
  { id: "SH-002", status: "delayed", risk: "high", from: "Rotterdam", to: "New York", co2: 3.1 },
  { id: "SH-003", status: "active", risk: "medium", from: "Singapore", to: "Sydney", co2: 1.8 },
];

const SupplyChainMap = () => {
  return (
    <Card className="glass-panel p-6 h-[500px] fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Live Supply Chain Map
          </h3>
          <p className="text-sm text-muted-foreground">Real-time shipment tracking</p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
          {mockShipments.length} Active
        </Badge>
      </div>

      <div className="relative h-[350px] bg-muted/30 rounded-lg overflow-hidden border border-border/50">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Package className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground text-sm">Interactive map visualization</p>
            <p className="text-xs text-muted-foreground">Connect map provider for live tracking</p>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          {mockShipments.map((shipment) => (
            <div
              key={shipment.id}
              className={`glass-panel p-3 rounded-lg border ${
                shipment.risk === "high" ? "border-destructive pulse-alert" : "border-border/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={shipment.risk === "low" ? "outline" : "destructive"}
                    className={
                      shipment.risk === "low"
                        ? "bg-success/10 text-success border-success"
                        : shipment.risk === "medium"
                        ? "bg-warning/10 text-warning border-warning"
                        : ""
                    }
                  >
                    {shipment.risk}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{shipment.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {shipment.from} → {shipment.to}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {shipment.co2}t CO₂
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default SupplyChainMap;
