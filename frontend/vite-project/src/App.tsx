import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TranslationProvider } from "./contexts/TranslationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Navigation } from "./components/Navigation";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProjectAssistant } from "./components/ProjectAssistant";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ShipmentsPage } from "./pages/ShipmentsPage";
import { DigitalTwinPage } from "./pages/DigitalTwinPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { LoginPage } from "./pages/LoginPage";
import AnomalyDetailsPage from "./pages/AnomalyDetailsPage";
import { SettingsPage } from "./pages/SettingsPage";
import ESGDashboardPage from "./pages/ESGDashboardPage";
import SafetyMonitoringPage from "./pages/SafetyMonitoringPage";
import { useState } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navigation />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shipments"
                element={
                  <ProtectedRoute>
                    <ShipmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/digital-twin"
                element={
                  <ProtectedRoute>
                    <DigitalTwinPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/anomaly/:anomalyId"
                element={
                  <ProtectedRoute>
                    <AnomalyDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resources"
                element={
                  <ProtectedRoute>
                    <ResourcesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/safety"
                element={
                  <ProtectedRoute>
                    <SafetyMonitoringPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sustainability"
                element={
                  <ProtectedRoute>
                    <ESGDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Redirect unauthenticated users to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>

            {/* AI Project Assistant - visible on all pages for authenticated users */}
            {user && (
              <ProjectAssistant
                isOpen={isChatbotOpen}
                onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
              />
            )}
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TranslationProvider>
          <AppContent />
        </TranslationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
