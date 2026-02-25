import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package, X } from "lucide-react";
import { CONSTRUCTION_MATERIALS_WITH_UNITS, WEIGHT_UNITS } from "@/lib/constants";
import { LocationSelector } from "@/components/LocationSelector";

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  import_location: string;
}

interface DynamicMaterialsProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  projectId: number;
}

export const DynamicMaterials: React.FC<DynamicMaterialsProps> = ({
  materials,
  onChange,
  projectId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: "",
    quantity: "",
    unit: "tonnes",
    import_location: ""
  });

  const addMaterial = () => {
    if (
      newMaterial.name &&
      newMaterial.quantity &&
      parseFloat(newMaterial.quantity as string) > 0 &&
      newMaterial.import_location
    ) {
      const material: Material = {
        id: `material-${Date.now()}`,
        name: newMaterial.name,
        quantity: parseFloat(newMaterial.quantity as string),
        unit: newMaterial.unit || "tonnes",
        import_location: newMaterial.import_location
      };

      onChange([...materials, material]);
      setNewMaterial({
        name: "",
        quantity: "",
        unit: "tonnes",
        import_location: ""
      });
      setIsExpanded(false);
    }
  };

  const removeMaterial = (id: string) => {
    onChange(materials.filter(m => m.id !== id));
  };

  const updateMaterial = (id: string, field: keyof Material, value: any) => {
    onChange(
      materials.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Raw Materials & Resources</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {materials.length} material{materials.length !== 1 ? "s" : ""}
          </Badge>
          <Button
            onClick={() => setIsExpanded(true)}
            className="flex items-center space-x-2"
            disabled={isExpanded}
          >
            <Plus className="h-4 w-4" />
            <span>Add Material</span>
          </Button>
        </div>
      </div>

      {/* Expandable Add Material Form */}
      {isExpanded && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add New Material</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material_name">Material Name *</Label>
                <Select
                  value={newMaterial.name}
                  onValueChange={(value) => {
                    const selectedMaterial = CONSTRUCTION_MATERIALS_WITH_UNITS.find(m => m.name === value);
                    setNewMaterial({ 
                      ...newMaterial, 
                      name: value,
                      unit: selectedMaterial?.unit || "pieces"
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {CONSTRUCTION_MATERIALS_WITH_UNITS.map((material) => (
                      <SelectItem key={material.name} value={material.name}>
                        {material.name} ({material.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material_quantity">Quantity *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="material_quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMaterial.quantity || ""}
                    onChange={(e) =>
                      setNewMaterial({
                        ...newMaterial,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="Enter quantity"
                    className="flex-1"
                  />
                  <Select
                    value={newMaterial.unit}
                    onValueChange={(value) =>
                      setNewMaterial({ ...newMaterial, unit: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEIGHT_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Import Location *</Label>
              <LocationSelector
                value={newMaterial.import_location || ""}
                onChange={(location) =>
                  setNewMaterial({ ...newMaterial, import_location: location })
                }
                placeholder="Search for import location..."
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={addMaterial}
                disabled={
                  !newMaterial.name ||
                  !newMaterial.quantity ||
                  parseFloat(newMaterial.quantity as string) <= 0 ||
                  !newMaterial.import_location
                }
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsExpanded(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Materials List */}
      {materials.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Added Materials</h4>
          <div className="space-y-2">
            {materials.map((material) => (
              <Card key={material.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">{material.name}</div>
                      <div className="text-xs text-gray-500">
                        {material.quantity} {material.unit} • {material.import_location}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMaterial(material.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {materials.length === 0 && (
        <Card className="p-6 text-center">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            No materials added yet. Add materials to track shipments and weather delays.
          </p>
        </Card>
      )}
    </div>
  );
};
