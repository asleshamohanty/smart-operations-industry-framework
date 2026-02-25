import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Leaf, IndianRupee } from "lucide-react";

interface Material {
  id: number;
  name: string;
  category: string;
  quantity: string;
  location: string;
  co2Savings: string;
  price: string;
  vendor: string;
  status: string;
}

interface MaterialCardProps {
  material: Material;
}

const MaterialCard = ({ material }: MaterialCardProps) => {
  return (
    <Card className="glass-panel p-5 hover:border-primary/50 transition-all fade-in">
      <div className="flex items-start justify-between mb-3">
        <Badge
          variant={material.status === "available" ? "outline" : "secondary"}
          className={
            material.status === "available"
              ? "bg-success/10 text-success border-success"
              : "bg-warning/10 text-warning border-warning"
          }
        >
          {material.status}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {material.category}
        </Badge>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {material.name}
      </h3>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{material.quantity}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{material.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-success">
          <Leaf className="h-4 w-4" />
          <span>Saves {material.co2Savings}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-1 text-lg font-bold text-foreground">
          <IndianRupee className="h-5 w-5" />
          <span>₹{material.price.replace("₹", "")}</span>
        </div>
        <Button
          size="sm"
          className="bg-primary"
          disabled={material.status !== "available"}
        >
          {material.status === "available" ? "Request" : "Reserved"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Vendor: {material.vendor}
      </p>
    </Card>
  );
};

export default MaterialCard;
