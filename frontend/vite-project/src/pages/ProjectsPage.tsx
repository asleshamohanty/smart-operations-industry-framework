import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Building2,
  MapPin,
  IndianRupee,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Truck,
} from "lucide-react";
import { formatIndianCurrency } from "@/lib/currency";
import { apiService, Project } from "@/lib/api-services";
import { MaterialList } from "@/components/MaterialList";
import { DynamicMaterialsWithPresets, Material } from "@/components/DynamicMaterialsWithPresets";
import { LocationSelector } from "@/components/LocationSelector";
import { SearchableSelect } from "@/components/SearchableSelect";
import { DeleteProjectDialog } from "@/components/DeleteProjectDialog";
import { CURRENCIES, PROJECT_TYPES } from "@/lib/constants";

// Function to format Indian currency (lakhs/crores)
const formatIndianCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    // 1 crore = 10 million
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  } else if (amount >= 100000) {
    // 1 lakh = 100 thousand
    return `₹${(amount / 100000).toFixed(1)} L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  } else {
    return `₹${amount.toLocaleString()}`;
  }
};

export const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    project_name: "",
    location: "",
    project_budget: "",
    currency: "INR",
    project_type: "",
    description: "",
    estimated_duration_days: "",
    team_size: "",
  });
  const [projectMaterials, setProjectMaterials] = useState<Material[]>([]);
  const [projectMaterialsMap, setProjectMaterialsMap] = useState<Map<number, Material[]>>(new Map());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await apiService.getProjects();
      setProjects(data);
      
      // Load materials for each project
      const materialsMap = new Map<number, Material[]>();
      for (const project of data) {
        try {
          const materials = await apiService.getMaterialsByProject(project.project_id);
          materialsMap.set(project.project_id, materials);
        } catch (err) {
          console.error(`Failed to load materials for project ${project.project_id}:`, err);
          materialsMap.set(project.project_id, []);
        }
      }
      setProjectMaterialsMap(materialsMap);
    } catch (err) {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const projectData = {
        ...newProject,
        project_budget: parseFloat(newProject.project_budget) || 0,
        estimated_duration_days:
          parseInt(newProject.estimated_duration_days) || 0,
        team_size: parseInt(newProject.team_size) || 0,
      };

      const project = await apiService.createProject(projectData);

      // Save materials for this project
      if (projectMaterials.length > 0) {
        for (const material of projectMaterials) {
          await apiService.createMaterial({
            ...material,
            project_id: project.project_id,
          });
        }
      }

      setProjects([...projects, project]);
      
      // Update projectMaterialsMap with the newly created materials
      if (projectMaterials.length > 0) {
        setProjectMaterialsMap(prev => {
          const newMap = new Map(prev);
          newMap.set(project.project_id, projectMaterials);
          return newMap;
        });
      }
      
      setIsCreateDialogOpen(false);
      setNewProject({
        project_name: "",
        location: "",
        project_budget: "",
        currency: "INR",
        project_type: "",
        description: "",
        estimated_duration_days: "",
        team_size: "",
      });
      setProjectMaterials([]);
    } catch (err) {
      setError("Failed to create project");
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    try {
      const updatedProject = await apiService.updateProject(
        editingProject.project_id,
        editingProject
      );
      setProjects(
        projects.map((p) =>
          p.project_id === editingProject.project_id ? updatedProject : p
        )
      );
      setIsEditDialogOpen(false);
      setEditingProject(null);
    } catch (err) {
      setError("Failed to update project");
    }
  };

  const handleDeleteProject = (projectId: number) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await apiService.deleteProject(projectToDelete);
      setProjects(projects.filter((p) => p.project_id !== projectToDelete));
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">Manage your infrastructure projects</p>
          </div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project with detailed specifications and ESG goals
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project_name">Project Name *</Label>
                      <Input
                        id="project_name"
                        value={newProject.project_name}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            project_name: e.target.value,
                          })
                        }
                        placeholder="Enter project name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project_type">Project Type</Label>
                      <SearchableSelect
                        options={PROJECT_TYPES}
                        value={newProject.project_type}
                        onChange={(value) =>
                          setNewProject({
                            ...newProject,
                            project_type: value,
                          })
                        }
                        placeholder="Search for project type..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Project Location *</Label>
                    <LocationSelector
                      value={newProject.location}
                      onChange={(location) =>
                        setNewProject({
                          ...newProject,
                          location: location,
                        })
                      }
                      placeholder="Search for project location..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Project Description</Label>
                    <textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe your project..."
                      className="w-full p-2 border border-gray-300 rounded-md resize-none h-20"
                    />
                  </div>
                </div>

                {/* Financial & Timeline */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Financial & Timeline</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget (₹) *</Label>
                      <Input
                        id="budget"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProject.project_budget}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            project_budget: e.target.value,
                          })
                        }
                        placeholder="Enter budget amount in INR"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">
                        Estimated Duration (Days)
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        min="0"
                        value={newProject.estimated_duration_days}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            estimated_duration_days: e.target.value,
                          })
                        }
                        placeholder="Enter duration in days"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team_size">Team Size</Label>
                    <Input
                      id="team_size"
                      type="number"
                      value={newProject.team_size}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          team_size: e.target.value,
                        })
                      }
                      placeholder="Number of team members"
                    />
                  </div>
                </div>

                {/* Raw Materials & Resources */}
                <DynamicMaterialsWithPresets
                  materials={projectMaterials}
                  onChange={setProjectMaterials}
                  projectId={0} // Will be set when project is created
                  projectType={newProject.project_type}
                  onProjectTypeChange={(projectType) => setNewProject({ ...newProject, project_type: projectType })}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject}>Create Project</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Project Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
                <DialogDescription>
                  Update project details and materials
                </DialogDescription>
              </DialogHeader>
              {editingProject && (
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_project_name">
                          Project Name *
                        </Label>
                        <Input
                          id="edit_project_name"
                          value={editingProject.project_name}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              project_name: e.target.value,
                            })
                          }
                          placeholder="Enter project name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit_project_type">Project Type</Label>
                        <SearchableSelect
                          options={PROJECT_TYPES}
                          value={editingProject.project_type || ""}
                          onChange={(value) =>
                            setEditingProject({
                              ...editingProject,
                              project_type: value,
                            })
                          }
                          placeholder="Search for project type..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Project Location *</Label>
                      <LocationSelector
                        value={editingProject.location}
                        onChange={(location) =>
                          setEditingProject({
                            ...editingProject,
                            location: location,
                          })
                        }
                        placeholder="Search for project location..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_description">
                        Project Description
                      </Label>
                      <textarea
                        id="edit_description"
                        value={editingProject.description || ""}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your project..."
                        className="w-full p-2 border border-gray-300 rounded-md resize-none h-20"
                      />
                    </div>
                  </div>

                  {/* Financial & Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Financial & Timeline
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_budget">Budget (₹) *</Label>
                        <Input
                          id="edit_budget"
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingProject.project_budget}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              project_budget: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="Enter budget amount in INR"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit_duration">
                          Estimated Duration (Days)
                        </Label>
                        <Input
                          id="edit_duration"
                          type="number"
                          min="0"
                          value={editingProject.estimated_duration_days || 0}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              estimated_duration_days:
                                parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="Enter duration in days"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_team_size">Team Size</Label>
                      <Input
                        id="edit_team_size"
                        type="number"
                        min="0"
                        value={editingProject.team_size || 0}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            team_size: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="Number of team members"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateProject}>
                      Update Project
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Stats */}
        {projects.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Total Projects</span>
                </div>
                <div className="text-2xl font-bold mt-1">{projects.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Total Budget</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {(() => {
                    const totalBudget = projects.reduce(
                      (sum, p) => sum + p.project_budget,
                      0
                    );
                    return formatIndianCurrency(totalBudget);
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Locations</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {new Set(projects.map((p) => p.location)).size}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
                <div className="text-2xl font-bold mt-1">{projects.length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No projects yet
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first infrastructure project
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.project_id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {project.project_name}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{project.location}</span>
                      </CardDescription>
                    </div>
                    {project.project_type && (
                      <Badge variant="outline">{project.project_type}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Budget</span>
                      <span className="font-medium">
                        {formatIndianCurrency(project.project_budget)}
                      </span>
                    </div>

                    {project.estimated_duration_days && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <span className="font-medium">
                          {project.estimated_duration_days} days
                        </span>
                      </div>
                    )}

                    {project.team_size && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Team Size</span>
                        <span className="font-medium">
                          {project.team_size} members
                        </span>
                      </div>
                    )}

                    {project.description && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                    )}

                    {/* Materials List */}
                    {(() => {
                      const materials = projectMaterialsMap.get(project.project_id) || [];
                      return (
                        <MaterialList
                          projectId={project.project_id}
                          materials={materials}
                        />
                      );
                    })()}

                    <div className="pt-3 border-t">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditProject(project)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            // Store project ID for highlighting in shipments
                            sessionStorage.setItem('highlightProjectId', project.project_id.toString());
                            window.location.href = "/shipments";
                          }}
                        >
                          <Truck className="h-3 w-3 mr-1" />
                          Shipments
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeleteProject(project.project_id)
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>

      {/* Delete Project Dialog */}
      <DeleteProjectDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDeleteProject}
        isLoading={isDeleting}
      />
    </div>
  );
};
