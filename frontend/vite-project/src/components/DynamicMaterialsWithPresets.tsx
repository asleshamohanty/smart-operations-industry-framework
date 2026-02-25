import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Package, X, Zap, Info, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-services";
import { CONSTRUCTION_MATERIALS_WITH_UNITS } from "@/lib/constants";
import { LocationSelector } from "@/components/LocationSelector";

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  import_location: string;
  preset_quantity?: number; // Recommended quantity from preset
  is_preset?: boolean; // Whether this material came from preset
}

interface MaterialPreset {
  material_name: string;
  recommended_quantity: number;
  unit: string;
  priority: number;
  description: string;
  typical_supplier_location: string;
}

interface DynamicMaterialsWithPresetsProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  projectId: number;
  projectType: string;
  onProjectTypeChange?: (projectType: string) => void;
}

export const DynamicMaterialsWithPresets: React.FC<
  DynamicMaterialsWithPresetsProps
> = ({ materials, onChange, projectId, projectType, onProjectTypeChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [materialPresets, setMaterialPresets] = useState<MaterialPreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [presetsLoaded, setPresetsLoaded] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: "",
    quantity: 0,
    unit: "tonnes",
    import_location: "",
  });

  // Load material presets when project type changes
  useEffect(() => {
    if (projectType && projectType !== "") {
      loadMaterialPresets(projectType);
    }
  }, [projectType]);

  const loadMaterialPresets = async (projectType: string) => {
    try {
      setLoadingPresets(true);
      const response = await fetch(
        `${API_BASE_URL}/circular-exchange/material-presets/${projectType}`
      );

      if (response.ok) {
        const presets = await response.json();
        setMaterialPresets(presets);
        setPresetsLoaded(true);

        // Auto-populate materials with presets if no materials exist yet
        if (materials.length === 0) {
          const presetMaterials: Material[] = presets.map(
            (preset: MaterialPreset) => ({
              id: `preset-${preset.material_name}-${Date.now()}`,
              name: preset.material_name,
              quantity: preset.recommended_quantity,
              unit: preset.unit,
              import_location: preset.typical_supplier_location,
              preset_quantity: preset.recommended_quantity,
              is_preset: true,
            })
          );

          onChange(presetMaterials);
        }
      } else {
        console.error("Failed to load material presets");
      }
    } catch (error) {
      console.error("Error loading material presets:", error);
    } finally {
      setLoadingPresets(false);
    }
  };

  const addMaterial = () => {
    if (
      newMaterial.name &&
      newMaterial.quantity &&
      newMaterial.quantity > 0 &&
      newMaterial.import_location
    ) {
      const material: Material = {
        id: `material-${Date.now()}`,
        name: newMaterial.name,
        quantity: newMaterial.quantity,
        unit: newMaterial.unit || "tonnes",
        import_location: newMaterial.import_location,
        is_preset: false,
      };

      onChange([...materials, material]);
      setNewMaterial({
        name: "",
        quantity: 0,
        unit: "tonnes",
        import_location: "",
      });
      setIsExpanded(false);
    }
  };

  const removeMaterial = (id: string) => {
    onChange(materials.filter((m) => m.id !== id));
  };

  const updateMaterial = (id: string, field: keyof Material, value: any) => {
    onChange(
      materials.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const addPresetMaterial = (preset: MaterialPreset) => {
    // Check if material already exists
    const existingMaterial = materials.find(
      (m) => m.name.toLowerCase() === preset.material_name.toLowerCase()
    );

    if (!existingMaterial) {
      const material: Material = {
        id: `preset-${preset.material_name}-${Date.now()}`,
        name: preset.material_name,
        quantity: preset.recommended_quantity,
        unit: preset.unit,
        import_location: preset.typical_supplier_location,
        preset_quantity: preset.recommended_quantity,
        is_preset: true,
      };

      onChange([...materials, material]);
    }
  };

  const resetToPresets = () => {
    if (materialPresets.length > 0) {
      const presetMaterials: Material[] = materialPresets.map(
        (preset: MaterialPreset) => ({
          id: `preset-${preset.material_name}-${Date.now()}`,
          name: preset.material_name,
          quantity: preset.recommended_quantity,
          unit: preset.unit,
          import_location: preset.typical_supplier_location,
          preset_quantity: preset.recommended_quantity,
          is_preset: true,
        })
      );

      onChange(presetMaterials);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "destructive"; // Essential
      case 2:
        return "default"; // Important
      case 3:
        return "secondary"; // Optional
      default:
        return "secondary";
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1:
        return "Essential";
      case 2:
        return "Important";
      case 3:
        return "Optional";
      default:
        return "Optional";
    }
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

      {/* Material Presets Section */}
      {projectType && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Zap className="h-4 w-4 mr-2 text-blue-600" />
              Material Presets for {projectType}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingPresets ? (
              <div className="text-sm text-gray-600">Loading presets...</div>
            ) : presetsLoaded && materialPresets.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Recommended materials based on project type. Click to add or
                    adjust quantities.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToPresets}
                    className="text-xs"
                  >
                    Reset to Presets
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {materialPresets.map((preset, index) => {
                    const existingMaterial = materials.find(
                      (m) =>
                        m.name.toLowerCase() ===
                        preset.material_name.toLowerCase()
                    );
                    const isAdded = !!existingMaterial;

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isAdded
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => !isAdded && addPresetMaterial(preset)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">
                                {preset.material_name}
                              </span>
                              <Badge
                                variant={getPriorityColor(preset.priority)}
                                className="text-xs"
                              >
                                {getPriorityText(preset.priority)}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Recommended: {preset.recommended_quantity}{" "}
                              {preset.unit}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {preset.description}
                            </p>
                          </div>
                          {isAdded && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                Select a project type to see recommended materials
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Materials */}
      {materials.length > 0 && (
        <div className="space-y-3">
          {materials.map((material) => (
            <Card
              key={material.id}
              className={`${
                material.is_preset
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{material.name}</span>
                    {material.is_preset && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Preset
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMaterial(material.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quantity with Preset Comparison */}
                  <div className="space-y-2">
                    <Label
                      htmlFor={`quantity-${material.id}`}
                      className="text-sm"
                    >
                      Quantity{" "}
                      {material.preset_quantity && (
                        <span className="text-gray-500 text-xs">
                          (Preset: {material.preset_quantity} {material.unit})
                        </span>
                      )}
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id={`quantity-${material.id}`}
                        type="number"
                        value={material.quantity}
                        onChange={(e) =>
                          updateMaterial(
                            material.id,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="flex-1"
                        min="0"
                        step="0.1"
                      />
                      <Select
                        value={material.unit}
                        onValueChange={(value) =>
                          updateMaterial(material.id, "unit", value)
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tonnes">tonnes</SelectItem>
                          <SelectItem value="cubic meters">m³</SelectItem>
                          <SelectItem value="bags">bags</SelectItem>
                          <SelectItem value="units">units</SelectItem>
                          <SelectItem value="meters">meters</SelectItem>
                          <SelectItem value="square meters">m²</SelectItem>
                          <SelectItem value="liters">liters</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity comparison indicator */}
                    {material.preset_quantity && (
                      <div className="text-xs">
                        {material.quantity > material.preset_quantity ? (
                          <span className="text-orange-600">
                            +
                            {(
                              ((material.quantity - material.preset_quantity) /
                                material.preset_quantity) *
                              100
                            ).toFixed(1)}
                            % above preset
                          </span>
                        ) : material.quantity < material.preset_quantity ? (
                          <span className="text-blue-600">
                            -
                            {(
                              ((material.preset_quantity - material.quantity) /
                                material.preset_quantity) *
                              100
                            ).toFixed(1)}
                            % below preset
                          </span>
                        ) : (
                          <span className="text-green-600">Matches preset</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Import Location */}
                  <div className="space-y-2">
                    <Label
                      htmlFor={`location-${material.id}`}
                      className="text-sm"
                    >
                      Import Location
                    </Label>
                    <LocationSelector
                      value={material.import_location}
                      onChange={(value) =>
                        updateMaterial(material.id, "import_location", value)
                      }
                      placeholder="Select location"
                    />
                  </div>

                  {/* Material Info */}
                  <div className="space-y-2">
                    <Label className="text-sm">Material Info</Label>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>ID: {material.id}</div>
                      {material.is_preset && (
                        <div className="text-green-600">
                          ✓ From project preset
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Material Form */}
      {isExpanded && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Add Custom Material</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-name">Material Name</Label>
                <Select
                  value={newMaterial.name}
                  onValueChange={(value) =>
                    setNewMaterial({ ...newMaterial, name: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSTRUCTION_MATERIALS_WITH_UNITS.map((material) => (
                      <SelectItem key={material.name} value={material.name}>
                        {material.name} ({material.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="quantity"
                    type="number"
                    value={newMaterial.quantity}
                    onChange={(e) =>
                      setNewMaterial({
                        ...newMaterial,
                        quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Enter quantity"
                    min="0"
                    step="0.1"
                  />
                  <Select
                    value={newMaterial.unit}
                    onValueChange={(value) =>
                      setNewMaterial({ ...newMaterial, unit: value })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tonnes">tonnes</SelectItem>
                      <SelectItem value="cubic meters">m³</SelectItem>
                      <SelectItem value="bags">bags</SelectItem>
                      <SelectItem value="units">units</SelectItem>
                      <SelectItem value="meters">meters</SelectItem>
                      <SelectItem value="square meters">m²</SelectItem>
                      <SelectItem value="liters">liters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-location">Import Location</Label>
              <LocationSelector
                value={newMaterial.import_location}
                onChange={(value) =>
                  setNewMaterial({ ...newMaterial, import_location: value })
                }
                placeholder="Select import location"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsExpanded(false)}>
                Cancel
              </Button>
              <Button onClick={addMaterial}>Add Material</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      {materials.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Materials with preset quantities will be used for circular resource
            exchange recommendations. You can adjust quantities manually while
            maintaining the preset reference for surplus detection.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
