import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/TranslationContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  Home,
  Plus,
  BarChart3,
  CloudRain,
  Leaf,
  Settings,
  Building2,
  RefreshCw,
  Shield,
  Truck,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

export const Navigation = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { translate } = useTranslation();
  const { theme, setTheme, actualTheme } = useTheme();

  // Don't show navigation on login page
  if (location.pathname === "/login") {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
      // Still redirect even if signOut fails
      window.location.href = "/login";
    }
  };

  const handleThemeToggle = () => {
    if (actualTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const navItems = [
    { path: "/", label: translate("nav.dashboard"), icon: Home },
    { path: "/projects", label: translate("nav.projects"), icon: Building2 },
    { path: "/shipments", label: translate("nav.shipments"), icon: Truck },
    {
      path: "/digital-twin",
      label: translate("nav.digitalTwin"),
      icon: BarChart3,
    },
    { path: "/resources", label: translate("nav.resources"), icon: RefreshCw },
    { path: "/safety", label: translate("nav.safety"), icon: Shield },
    {
      path: "/sustainability",
      label: translate("nav.sustainability"),
      icon: Leaf,
    },
    { path: "/settings", label: translate("nav.settings"), icon: Settings },
  ];

  return (
    <nav className="bg-background shadow-sm border-b sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <Building2 className="h-7 w-7 text-blue-600" />
              <span className="text-lg font-bold text-foreground">
                InfrastructureHub
              </span>
            </div>
          </div>

          {/* Navigation Links - Centered */}
          <div className="hidden lg:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Section - Theme Toggle & Sign Out */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleThemeToggle}
              className="h-9 w-9 p-0 rounded-full hover:bg-accent transition-colors"
              title={actualTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {actualTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            {/* Sign Out Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-destructive border-destructive/20 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden ml-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden border-t bg-muted/50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-start flex items-center space-x-2 px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
