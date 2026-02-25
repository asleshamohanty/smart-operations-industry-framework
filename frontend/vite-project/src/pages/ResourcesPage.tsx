import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/api-services";
import {
  RefreshCw,
  Package,
  TrendingUp,
  Leaf,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Calendar,
  Scale,
  Zap,
  TrendingDown,
} from "lucide-react";
import { apiService } from "@/lib/api-services";

interface MaterialResource {
  material_id: number;
  material_name: string;
  current_quantity: number;
  unit: string;
  project_id: number;
  project_name: string;
  project_location: string;
  created_at: string;
  expiry_date?: string;
  days_until_expiry?: number;
  status: "available" | "surplus" | "near_expiry" | "urgent" | "shortage";
  material_type: "surplus" | "shortage";
  surplus_quantity?: number;
  surplus_percentage?: number;
  shortage_quantity?: number;
  shortage_percentage?: number;
  exchange_priority?: number;
  urgency_level?: string;
}

interface CircularRecommendation {
  delayed_material: string;
  delayed_project_id: number;
  delayed_project_name: string;
  alternatives: Array<{
    project_id: number;
    project_name: string;
    material_name: string;
    quantity_available: number;
    unit: string;
    distance_km: number;
    expiry_date: string;
    feasibility_score: number;
    recommendation_message: string;
    co2_emissions_kg: number;
    days_until_expiry: number;
  }>;
  total_alternatives_found: number;
  recommendation_summary: string;
}

interface SustainabilityMetrics {
  total_materials_available: number;
  total_projects: number;
  materials_nearing_expiry: number;
  potential_co2_savings_kg: number;
  circular_exchange_potential: string;
}

export const ResourcesPage: React.FC = () => {
  const [allMaterials, setAllMaterials] = useState<MaterialResource[]>([]);
  const [surplusMaterials, setSurplusMaterials] = useState<MaterialResource[]>(
    []
  );
  const [shortageMaterials, setShortageMaterials] = useState<
    MaterialResource[]
  >([]);
  const [nearExpiryMaterials, setNearExpiryMaterials] = useState<
    MaterialResource[]
  >([]);
  const [sustainabilityMetrics, setSustainabilityMetrics] =
    useState<SustainabilityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<MaterialResource | null>(null);
  const [transferQuantity, setTransferQuantity] = useState<number>(0);
  const [selectedDestinationProject, setSelectedDestinationProject] =
    useState<string>("");
  const [selectedSourceProject, setSelectedSourceProject] =
    useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [dialogMode, setDialogMode] = useState<"transfer-to" | "transfer-from">(
    "transfer-to"
  );
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [transferWarning, setTransferWarning] = useState<string>("");
  const [sourceProjectData, setSourceProjectData] = useState<any>(null);
  const [destinationProjectData, setDestinationProjectData] =
    useState<any>(null);
  const [sourceMaterialData, setSourceMaterialData] = useState<any>(null);
  const [destinationMaterialData, setDestinationMaterialData] =
    useState<any>(null);
  const [presetWarning, setPresetWarning] = useState<string>("");
  const [dashboardMetrics, setDashboardMetrics] = useState<{
    total_materials: number;
    near_expiry: number;
    co2_savings_kg: number;
    exchange_potential: string;
    surplus_count: number;
    shortage_count: number;
    total_projects: number;
  } | null>(null);

  useEffect(() => {
    loadResourcesData();
  }, []);

  const calculateTransferWarning = async (
    quantity: number,
    projectId: string,
    materialName: string
  ) => {
    if (!quantity || !projectId || !materialName) {
      setTransferWarning("");
      return;
    }

    try {
      // Fetch project materials to check current quantities
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/materials`
      );
      if (response.ok) {
        const materials = await response.json();
        const material = materials.find((m: any) => m.name === materialName);

        if (material) {
          const currentQuantity = material.quantity;
          const remainingQuantity = currentQuantity - quantity;

          // Check if this would create a shortage (below 0 or very low)
          if (remainingQuantity < 0) {
            setTransferWarning(
              `⚠️ Warning: This transfer would create a shortage of ${Math.abs(
                remainingQuantity
              )} ${material.unit} in the source project.`
            );
          } else if (remainingQuantity < currentQuantity * 0.1) {
            // Less than 10% remaining
            setTransferWarning(
              `⚠️ Caution: This transfer would leave only ${remainingQuantity} ${
                material.unit
              } (${((remainingQuantity / currentQuantity) * 100).toFixed(
                1
              )}%) in the source project.`
            );
          } else {
            setTransferWarning("");
          }
        }
      }
    } catch (error) {
      console.error("Error calculating transfer warning:", error);
    }
  };

  const fetchProjectData = async (projectId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
    }
    return null;
  };

  const fetchMaterialPresets = async (projectType: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/circular-exchange/material-presets/${projectType}`
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Error fetching material presets:", error);
    }
    return [];
  };

  const calculatePresetWarning = (
    currentQuantity: number,
    presetQuantity: number,
    projectName: string,
    materialName: string
  ) => {
    if (presetQuantity && currentQuantity < presetQuantity) {
      const shortage = presetQuantity - currentQuantity;
      const percentage = ((shortage / presetQuantity) * 100).toFixed(1);
      return `⚠️ ${projectName} will be ${percentage}% below preset for ${materialName} (${shortage.toFixed(
        1
      )} units short)`;
    }
    return "";
  };

  const calculatePresetWarnings = async () => {
    if (!selectedMaterial || transferQuantity <= 0) {
      setPresetWarning("");
      return;
    }

    try {
      let warnings = [];

      if (dialogMode === "transfer-to") {
        // Transferring FROM selectedMaterial.project_id TO selectedDestinationProject
        if (
          selectedDestinationProject &&
          sourceMaterialData &&
          destinationMaterialData
        ) {
          // Check source project (FROM) - will have less after transfer
          const sourceProject = await fetchProjectData(
            selectedMaterial.project_id.toString()
          );
          if (sourceProject) {
            const presets = await fetchMaterialPresets(
              sourceProject.project_type
            );
            const preset = presets.find(
              (p: any) => p.material_name === selectedMaterial.material_name
            );
            if (preset) {
              const newSourceQuantity =
                (sourceMaterialData.quantity || 0) - transferQuantity;
              const sourceWarning = calculatePresetWarning(
                newSourceQuantity,
                preset.quantity,
                sourceProject.project_name,
                preset.material_name
              );
              if (sourceWarning) warnings.push(sourceWarning);
            }
          }

          // Check destination project (TO) - will have more after transfer
          const destProject = await fetchProjectData(
            selectedDestinationProject
          );
          if (destProject) {
            const presets = await fetchMaterialPresets(
              destProject.project_type
            );
            const preset = presets.find(
              (p: any) => p.material_name === selectedMaterial.material_name
            );
            if (preset) {
              const newDestQuantity =
                (destinationMaterialData.quantity || 0) + transferQuantity;
              const destWarning = calculatePresetWarning(
                newDestQuantity,
                preset.quantity,
                destProject.project_name,
                preset.material_name
              );
              if (destWarning) warnings.push(destWarning);
            }
          }
        }
      } else {
        // Transferring FROM selectedSourceProject TO selectedMaterial.project_id
        if (
          selectedSourceProject &&
          sourceMaterialData &&
          destinationMaterialData
        ) {
          // Check source project (FROM) - will have less after transfer
          const sourceProject = await fetchProjectData(selectedSourceProject);
          if (sourceProject) {
            const presets = await fetchMaterialPresets(
              sourceProject.project_type
            );
            const preset = presets.find(
              (p: any) => p.material_name === selectedMaterial.material_name
            );
            if (preset) {
              const newSourceQuantity =
                (sourceMaterialData.quantity || 0) - transferQuantity;
              const sourceWarning = calculatePresetWarning(
                newSourceQuantity,
                preset.quantity,
                sourceProject.project_name,
                preset.material_name
              );
              if (sourceWarning) warnings.push(sourceWarning);
            }
          }

          // Check destination project (TO) - will have more after transfer
          const destProject = await fetchProjectData(
            selectedMaterial.project_id.toString()
          );
          if (destProject) {
            const presets = await fetchMaterialPresets(
              destProject.project_type
            );
            const preset = presets.find(
              (p: any) => p.material_name === selectedMaterial.material_name
            );
            if (preset) {
              const newDestQuantity =
                (destinationMaterialData.quantity || 0) + transferQuantity;
              const destWarning = calculatePresetWarning(
                newDestQuantity,
                preset.quantity,
                destProject.project_name,
                preset.material_name
              );
              if (destWarning) warnings.push(destWarning);
            }
          }
        }
      }

      setPresetWarning(warnings.join("\n"));
    } catch (error) {
      console.error("Error calculating preset warnings:", error);
    }
  };

  const fetchMaterialData = async (projectId: string, materialName: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/materials`
      );
      if (response.ok) {
        const materials = await response.json();
        return materials.find((m: any) => m.name === materialName);
      }
    } catch (error) {
      console.error("Error fetching material data:", error);
    }
    return null;
  };

  const handleQuantityChange = async (quantity: number) => {
    setTransferQuantity(quantity);

    try {
      if (dialogMode === "transfer-to") {
        // Transferring FROM selectedMaterial.project_id TO selectedDestinationProject
        if (selectedDestinationProject) {
          await calculateTransferWarning(
            quantity,
            selectedMaterial?.project_id.toString() || "",
            selectedMaterial?.material_name || ""
          );
          const destData = await fetchProjectData(selectedDestinationProject);
          setDestinationProjectData(destData);

          // Fetch material data for both projects
          const sourceMaterial = await fetchMaterialData(
            selectedMaterial?.project_id.toString() || "",
            selectedMaterial?.material_name || ""
          );
          const destMaterial = await fetchMaterialData(
            selectedDestinationProject,
            selectedMaterial?.material_name || ""
          );
          setSourceMaterialData(sourceMaterial);
          setDestinationMaterialData(destMaterial);
        }
      } else {
        // Transferring FROM selectedSourceProject TO selectedMaterial.project_id
        if (selectedSourceProject) {
          await calculateTransferWarning(
            quantity,
            selectedSourceProject,
            selectedMaterial?.material_name || ""
          );
          const sourceData = await fetchProjectData(selectedSourceProject);
          setSourceProjectData(sourceData);

          // Fetch material data for both projects
          const sourceMaterial = await fetchMaterialData(
            selectedSourceProject,
            selectedMaterial?.material_name || ""
          );
          const destMaterial = await fetchMaterialData(
            selectedMaterial?.project_id.toString() || "",
            selectedMaterial?.material_name || ""
          );
          setSourceMaterialData(sourceMaterial);
          setDestinationMaterialData(destMaterial);
        }
      }

      // Calculate preset warnings after material data is updated
      await calculatePresetWarnings();
    } catch (error) {
      console.error("Error in handleQuantityChange:", error);
      // Don't crash the UI, just log the error
    }
  };

  const handleProjectSelectionChange = async (projectId: string) => {
    try {
      if (dialogMode === "transfer-to") {
        setSelectedDestinationProject(projectId);
        if (projectId && transferQuantity > 0) {
          await calculateTransferWarning(
            transferQuantity,
            selectedMaterial?.project_id.toString() || "",
            selectedMaterial?.material_name || ""
          );
          const destData = await fetchProjectData(projectId);
          setDestinationProjectData(destData);

          // Fetch material data for both projects
          const sourceMaterial = await fetchMaterialData(
            selectedMaterial?.project_id.toString() || "",
            selectedMaterial?.material_name || ""
          );
          const destMaterial = await fetchMaterialData(
            projectId,
            selectedMaterial?.material_name || ""
          );
          setSourceMaterialData(sourceMaterial);
          setDestinationMaterialData(destMaterial);
        }
      } else {
        setSelectedSourceProject(projectId);
        if (projectId && transferQuantity > 0) {
          await calculateTransferWarning(
            transferQuantity,
            projectId,
            selectedMaterial?.material_name || ""
          );
          const sourceData = await fetchProjectData(projectId);
          setSourceProjectData(sourceData);

          // Fetch material data for both projects
          const sourceMaterial = await fetchMaterialData(
            projectId,
            selectedMaterial?.material_name || ""
          );
          const destMaterial = await fetchMaterialData(
            selectedMaterial?.project_id.toString() || "",
            selectedMaterial?.material_name || ""
          );
          setSourceMaterialData(sourceMaterial);
          setDestinationMaterialData(destMaterial);
        }
      }

      // Calculate preset warnings after material data is updated
      await calculatePresetWarnings();
    } catch (error) {
      console.error("Error in handleProjectSelectionChange:", error);
      // Don't crash the UI, just log the error
    }
  };

  const handleRequestExchange = (
    material: MaterialResource,
    mode: "transfer-to" | "transfer-from"
  ) => {
    setSelectedMaterial(material);
    setTransferQuantity(0);
    setSelectedDestinationProject("");
    setSelectedSourceProject("");
    setDialogMode(mode);
    setTransferWarning("");
    setPresetWarning("");
    setSourceProjectData(null);
    setDestinationProjectData(null);
    setSourceMaterialData(null);
    setDestinationMaterialData(null);
    setExchangeDialogOpen(true);
  };

  const handleTransferMaterial = async () => {
    if (!selectedMaterial || transferQuantity <= 0) {
      alert("Please fill in all fields");
      return;
    }

    let fromProjectId: number;
    let toProjectId: number;

    if (dialogMode === "transfer-to") {
      // Surplus material: transfer FROM current project TO selected project
      if (!selectedDestinationProject) {
        alert("Please select a destination project");
        return;
      }
      fromProjectId = selectedMaterial.project_id;
      toProjectId = parseInt(selectedDestinationProject);
    } else {
      // Shortage material: transfer FROM selected project TO current project
      if (!selectedSourceProject) {
        alert("Please select a source project");
        return;
      }
      fromProjectId = parseInt(selectedSourceProject);
      toProjectId = selectedMaterial.project_id;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/circular-exchange/transfer-material`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from_project_id: fromProjectId,
            to_project_id: toProjectId,
            material_name: selectedMaterial.material_name,
            transfer_quantity: transferQuantity,
            unit: selectedMaterial.unit,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(result.message);
        setSuccessDialogOpen(true);
        setExchangeDialogOpen(false);
        loadResourcesData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Transfer failed: ${error.detail}`);
      }
    } catch (error) {
      console.error("Transfer error:", error);
      alert("Transfer failed. Please try again.");
    }
  };

  const loadResourcesData = async () => {
    try {
      setLoading(true);

      // Load all materials from all projects
      const allMaterialsResponse = await fetch(
        `${API_BASE_URL}/circular-exchange/all-project-materials`
      );
      const allMaterialsData = await allMaterialsResponse.json();

      // Load surplus materials
      const surplusResponse = await fetch(
        `${API_BASE_URL}/circular-exchange/surplus-materials`
      );
      const surplusData = await surplusResponse.json();

      // Load shortage materials
      const shortageResponse = await fetch(
        `${API_BASE_URL}/circular-exchange/shortage-materials`
      );
      const shortageData = await shortageResponse.json();

      // Load surplus summary
      const summaryResponse = await fetch(
        `${API_BASE_URL}/circular-exchange/surplus-summary`
      );
      const summaryData = await summaryResponse.json();

      // Load proactive recommendations
      const recommendationsResponse = await fetch(
        `${API_BASE_URL}/circular-exchange/proactive-recommendations`
      );
      const recommendationsData = await recommendationsResponse.json();

      // Load projects for transfer dialog
      const projectsResponse = await fetch(`${API_BASE_URL}/projects/`);
      const projectsData = await projectsResponse.json();

      // Load dashboard metrics
      const metricsResponse = await fetch(
        `${API_BASE_URL}/circular-exchange/dashboard-metrics`
      );
      const metricsData = await metricsResponse.json();

      setAllMaterials(allMaterialsData);
      setSurplusMaterials(surplusData);
      setShortageMaterials(shortageData);
      setNearExpiryMaterials(
        allMaterialsData.filter(
          (material: MaterialResource) =>
            material.days_until_expiry && material.days_until_expiry <= 30
        )
      );
      setSustainabilityMetrics(summaryData);
      setProjects(projectsData);
      setDashboardMetrics(metricsData);
    } catch (err) {
      setError("Failed to load resources data");
      console.error("Error loading resources:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: MaterialResource["status"]) => {
    switch (status) {
      case "urgent":
        return "destructive";
      case "near_expiry":
        return "destructive";
      case "surplus":
        return "default";
      case "available":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: MaterialResource["status"]) => {
    switch (status) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4" />;
      case "near_expiry":
        return <AlertTriangle className="h-4 w-4" />;
      case "surplus":
        return <TrendingUp className="h-4 w-4" />;
      case "available":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: MaterialResource["status"]) => {
    switch (status) {
      case "urgent":
        return "Urgent - Expires Soon";
      case "near_expiry":
        return "Near Expiry";
      case "surplus":
        return "Surplus Available";
      case "available":
        return "Available";
      default:
        return "Available";
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading circular resources...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Circular Resources Exchange
          </h1>
          <p className="text-muted-foreground mt-2">
            Inter-project resource sharing and waste reduction platform
          </p>
        </div>
        <Button onClick={loadResourcesData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Dashboard Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Materials Card */}
        <Card className="bg-background border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Materials
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {dashboardMetrics?.total_materials || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Near Expiry Card */}
        <Card className="bg-background border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Near Expiry</p>
                <p className="text-2xl font-bold text-foreground">
                  {dashboardMetrics?.near_expiry || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CO₂ Savings Card */}
        <Card className="bg-background border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CO₂ Savings</p>
                <p className="text-2xl font-bold text-foreground">
                  {dashboardMetrics?.co2_savings_kg || 0}
                </p>
                <p className="text-xs text-muted-foreground">kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Potential Card */}
        <Card className="bg-background border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Exchange Potential
                </p>
                <p className="text-lg font-bold text-foreground">
                  {dashboardMetrics?.exchange_potential || "Low"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="all-materials" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all-materials">All Materials</TabsTrigger>
          <TabsTrigger value="surplus">Surplus Available</TabsTrigger>
          <TabsTrigger value="presets">Shortages</TabsTrigger>
          <TabsTrigger value="near-expiry">Near Expiry</TabsTrigger>
          <TabsTrigger value="recommendations">
            Smart Recommendations
          </TabsTrigger>
        </TabsList>

        {/* All Materials Tab */}
        <TabsContent value="all-materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                All Available Materials
              </CardTitle>
              <CardDescription>
                Complete inventory of materials available for circular exchange
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMaterials.map((material) => (
                  <Card
                    key={material.material_id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {material.material_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {material.project_name}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(material.status)}>
                          {getStatusIcon(material.status)}
                          <span className="ml-1">
                            {getStatusText(material.status)}
                          </span>
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Scale className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {material.current_quantity} {material.unit}
                          </span>
                          {material.material_type === "surplus" &&
                            material.surplus_quantity && (
                              <span className="ml-2 text-green-600">
                                (+{material.surplus_quantity} surplus)
                              </span>
                            )}
                          {material.material_type === "shortage" &&
                            material.shortage_quantity && (
                              <span className="ml-2 text-red-600">
                                (-{material.shortage_quantity} shortage)
                              </span>
                            )}
                        </div>

                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{material.project_location.split(",")[0]}</span>
                        </div>

                        {material.days_until_expiry && (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>
                              {material.days_until_expiry} days until expiry
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => {
                          if (material.material_type === "surplus") {
                            handleRequestExchange(material, "transfer-to");
                          } else if (material.material_type === "shortage") {
                            handleRequestExchange(material, "transfer-from");
                          } else {
                            // Normal material - let user choose
                            const choice = confirm(
                              `Transfer ${material.material_name}?\n\nClick OK to transfer TO another project\nClick Cancel to transfer FROM another project`
                            );
                            handleRequestExchange(
                              material,
                              choice ? "transfer-to" : "transfer-from"
                            );
                          }
                        }}
                      >
                        Request Exchange
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Surplus Materials Tab */}
        <TabsContent value="surplus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Surplus Materials
              </CardTitle>
              <CardDescription>
                Materials available in excess quantities for immediate exchange
              </CardDescription>
            </CardHeader>
            <CardContent>
              {surplusMaterials.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No surplus materials available at the moment
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {surplusMaterials.map((material) => (
                    <Card
                      key={material.material_id}
                      className="border-green-200 bg-green-50"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {material.material_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {material.project_name}
                            </p>
                          </div>
                          <Badge variant="default" className="bg-green-600">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Surplus
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Scale className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">
                              {material.current_quantity} {material.unit}
                            </span>
                            <span className="text-green-600 ml-2">
                              (+{material.surplus_quantity})
                            </span>
                          </div>

                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>
                              {material.project_location.split(",")[0]}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="default"
                          size="sm"
                          className="w-full mt-3 bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            handleRequestExchange(material, "transfer-to")
                          }
                        >
                          Exchange Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shortages Tab */}
        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="h-5 w-5 mr-2" />
                Shortages
              </CardTitle>
              <CardDescription>
                Materials that are below recommended quantities and need
                replenishment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shortageMaterials.map((material) => (
                  <Card
                    key={material.material_id}
                    className="hover:shadow-md transition-shadow border-red-200"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {material.material_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {material.project_name}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span className="ml-1">Shortage</span>
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Scale className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {material.current_quantity} {material.unit}
                          </span>
                          <span className="ml-2 text-red-600">
                            (-{material.shortage_quantity} shortage)
                          </span>
                        </div>

                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{material.project_location.split(",")[0]}</span>
                        </div>

                        <div className="flex items-center text-sm">
                          <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
                          <span className="text-red-600">
                            {material.shortage_percentage?.toFixed(1)}% below
                            recommended
                          </span>
                        </div>

                        <div className="flex items-center text-sm">
                          <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                          <span className="text-orange-600">
                            Urgency: {material.urgency_level}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() =>
                          handleRequestExchange(material, "transfer-from")
                        }
                      >
                        Request Exchange
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {shortageMaterials.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No shortage materials found</p>
                  <p className="text-sm">
                    All projects have adequate material quantities
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Near Expiry Tab */}
        <TabsContent value="near-expiry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Materials Near Expiry
              </CardTitle>
              <CardDescription>
                Materials that need immediate attention to prevent waste
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nearExpiryMaterials.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No materials near expiry - great job managing inventory!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nearExpiryMaterials.map((material) => (
                    <Alert
                      key={material.material_id}
                      variant={
                        material.status === "urgent" ? "destructive" : "default"
                      }
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <strong>{material.material_name}</strong> from{" "}
                            {material.project_name}({material.current_quantity}{" "}
                            {material.unit}) -
                            <span
                              className={
                                material.status === "urgent"
                                  ? "text-red-600 font-bold"
                                  : "text-orange-600"
                              }
                            >
                              {material.days_until_expiry} days until expiry
                            </span>
                          </div>
                          <Button size="sm" variant="outline">
                            Find Exchange Partner
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Smart Recommendations
              </CardTitle>
              <CardDescription>
                AI-powered suggestions for optimal resource allocation and waste
                prevention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Smart recommendations will appear here based on:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Leaf className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="font-medium">Waste Prevention</p>
                    <p className="text-muted-foreground">
                      Prioritize materials nearing expiry
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="font-medium">Distance Optimization</p>
                    <p className="text-muted-foreground">
                      Minimize transport emissions
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <p className="font-medium">Surplus Utilization</p>
                    <p className="text-muted-foreground">
                      Maximize resource efficiency
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              Transfer Successful
            </DialogTitle>
            <DialogDescription>
              Material transfer has been completed successfully
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-foreground">{successMessage}</p>
          </div>

          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Exchange Dialog */}
      <Dialog open={exchangeDialogOpen} onOpenChange={setExchangeDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "transfer-to"
                ? "Transfer Material TO"
                : "Transfer Material FROM"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "transfer-to"
                ? `Transfer ${selectedMaterial?.material_name} from ${selectedMaterial?.project_name} to another project`
                : `Transfer ${selectedMaterial?.material_name} from another project to ${selectedMaterial?.project_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Material Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="material" className="text-right">
                Material
              </Label>
              <div className="col-span-3">
                <Input
                  id="material"
                  value={selectedMaterial?.material_name || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Transfer Quantity */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Transfer Quantity
              </Label>
              <div className="col-span-3">
                <Input
                  id="quantity"
                  type="number"
                  value={transferQuantity || ""}
                  onChange={(e) =>
                    handleQuantityChange(parseFloat(e.target.value) || 0)
                  }
                  placeholder="Enter quantity to transfer"
                  step="0.1"
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {dialogMode === "transfer-to"
                    ? `Available: ${selectedMaterial?.current_quantity} ${selectedMaterial?.unit}`
                    : `Needed: ${selectedMaterial?.shortage_quantity} ${selectedMaterial?.unit}`}
                </p>
              </div>
            </div>

            {/* Project Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">
                {dialogMode === "transfer-to" ? "To Project" : "From Project"}
              </Label>
              <div className="col-span-3">
                <Select
                  value={
                    dialogMode === "transfer-to"
                      ? selectedDestinationProject
                      : selectedSourceProject
                  }
                  onValueChange={handleProjectSelectionChange}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={`Select ${
                        dialogMode === "transfer-to" ? "destination" : "source"
                      } project`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {projects
                      .filter(
                        (project) =>
                          project.project_id !== selectedMaterial?.project_id
                      )
                      .map((project) => (
                        <SelectItem
                          key={project.project_id}
                          value={project.project_id.toString()}
                        >
                          {project.project_name} (
                          {project.location.split(",")[0]})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Side-by-Side Material Cards */}
            {(sourceMaterialData || destinationMaterialData) &&
              transferQuantity > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {/* FROM Project Card - Always Left */}
                  <Card className="border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-2 text-red-600" />
                        FROM Project
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {dialogMode === "transfer-to"
                              ? selectedMaterial?.project_name
                              : sourceProjectData?.project_name ||
                                "Select project"}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs border-red-300 text-red-700"
                          >
                            FROM
                          </Badge>
                        </div>

                        <div className="text-lg font-bold text-red-600">
                          {dialogMode === "transfer-to"
                            ? `${(
                                (sourceMaterialData?.quantity || 0) -
                                transferQuantity
                              ).toFixed(1)} ${selectedMaterial?.unit || ""}`
                            : `${(
                                (sourceMaterialData?.quantity || 0) -
                                transferQuantity
                              ).toFixed(1)} ${selectedMaterial?.unit || ""}`}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Current:{" "}
                          {dialogMode === "transfer-to"
                            ? sourceMaterialData?.quantity || 0
                            : sourceMaterialData?.quantity || 0}{" "}
                          {selectedMaterial?.unit || ""}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Transfer: -{transferQuantity}{" "}
                          {selectedMaterial?.unit || ""}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* TO Project Card - Always Right */}
                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                        TO Project
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {dialogMode === "transfer-to"
                              ? destinationProjectData?.project_name ||
                                "Select project"
                              : selectedMaterial?.project_name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs border-blue-300 text-blue-700"
                          >
                            TO
                          </Badge>
                        </div>

                        <div className="text-lg font-bold text-blue-600">
                          {dialogMode === "transfer-to"
                            ? `${(
                                (destinationMaterialData?.quantity || 0) +
                                transferQuantity
                              ).toFixed(1)} ${selectedMaterial?.unit || ""}`
                            : `${(
                                (destinationMaterialData?.quantity || 0) +
                                transferQuantity
                              ).toFixed(1)} ${selectedMaterial?.unit || ""}`}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Current:{" "}
                          {dialogMode === "transfer-to"
                            ? destinationMaterialData?.quantity || 0
                            : destinationMaterialData?.quantity || 0}{" "}
                          {selectedMaterial?.unit || ""}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Transfer: +{transferQuantity}{" "}
                          {selectedMaterial?.unit || ""}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            {/* Warnings */}
            {(transferWarning || presetWarning) && (
              <div className="space-y-2">
                {transferWarning && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">{transferWarning}</p>
                  </div>
                )}
                {presetWarning && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <div className="text-sm text-orange-800 whitespace-pre-line">
                      {presetWarning}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExchangeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransferMaterial}
              disabled={
                !selectedMaterial ||
                transferQuantity <= 0 ||
                (!selectedDestinationProject && dialogMode === "transfer-to") ||
                (!selectedSourceProject && dialogMode === "transfer-from")
              }
            >
              {dialogMode === "transfer-to"
                ? "Transfer TO Project"
                : "Transfer FROM Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
