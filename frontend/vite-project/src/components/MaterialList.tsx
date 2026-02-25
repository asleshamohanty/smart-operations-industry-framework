import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  import_location: string;
}

interface MaterialListProps {
  projectId: number;
  materials: Material[];
}

export const MaterialList: React.FC<MaterialListProps> = ({
  projectId,
  materials,
}) => {
  if (!materials || materials.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Package className="h-8 w-8 text-muted-foreground mr-3" />
            <span className="text-muted-foreground">No materials added yet</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center mb-3">
            <Package className="h-5 w-5 text-muted-foreground mr-2" />
            <h3 className="text-sm font-medium text-foreground">Materials</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
              >
                <div className="flex-1">
                  <div className="font-medium text-foreground text-sm">
                    {material.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {material.quantity} {material.unit}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {material.import_location}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            {materials.length} material{materials.length !== 1 ? 's' : ''} total
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
