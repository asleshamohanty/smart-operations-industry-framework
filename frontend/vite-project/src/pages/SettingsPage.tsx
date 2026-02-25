import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTranslation,
  SUPPORTED_LANGUAGES,
} from "@/contexts/TranslationContext";
import { useTheme } from "@/contexts/ThemeContext";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  User,
  Database,
  Bell,
  Shield,
  Globe,
  Palette,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Cloud,
  Languages,
  Loader2,
} from "lucide-react";
import { WeatherProviderManager } from "@/components/WeatherProviderManager";
import { WeatherData } from "@/lib/weather-provider-types";

export const SettingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    currentLanguage,
    setLanguage,
    translate,
    isLoading: translationLoading,
    error: translationError,
    supportedLanguages,
  } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState({
    // User Profile Settings
    userName: "",
    email: "",
    role: "Project Manager",

    // System Settings
    language: currentLanguage,

    // Notification Settings
    emailNotifications: true,
    pushNotifications: false,
    weatherAlerts: true,
    projectUpdates: true,
    shipmentAlerts: true,

    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordExpiry: "90",

    // Display Settings
    sidebarCollapsed: false,
    dashboardLayout: "grid",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  // Update user data when auth state changes
  useEffect(() => {
    if (user) {
      setSettings((prev) => ({
        ...prev,
        userName:
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        role: user.user_metadata?.role || "Project Manager",
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Save to localStorage or send to backend
      localStorage.setItem("app-settings", JSON.stringify(settings));

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to default settings
    setSettings({
      userName: "Admin User",
      email: "admin@infrastructurehub.com",
      role: "Project Manager",
      language: "en",
      emailNotifications: true,
      pushNotifications: false,
      weatherAlerts: true,
      projectUpdates: true,
      shipmentAlerts: true,
      twoFactorAuth: false,
      sessionTimeout: "30",
      passwordExpiry: "90",
      sidebarCollapsed: false,
      dashboardLayout: "grid",
    });
    // Reset theme to light
    setTheme("light");
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await setLanguage(languageCode);
      updateSetting("language", languageCode);
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  };

  const handleWeatherData = (data: WeatherData) => {
    console.log("Weather data received:", data);
    // You can add logic here to handle weather data
  };

  const handleProviderAdded = (providerId: string) => {
    console.log("Provider added:", providerId);
    // You can add logic here to handle provider addition
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-8 w-8 text-blue-600" />
              {translate("settings.title")}
            </h1>
            <p className="text-muted-foreground">{translate("settings.subtitle")}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {translate("settings.reset")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {translate("settings.saveChanges")}
            </Button>
          </div>
        </div>

        {/* User Info Section */}
        {authLoading ? (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="text-blue-800">Loading user information...</span>
          </div>
        ) : !user ? (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">
              Not authenticated. Please log in to access weather provider
              features.
            </span>
          </div>
        ) : null}

        {/* Save Status */}
        {saveStatus === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Settings saved successfully!</span>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">
              Failed to save settings. Please try again.
            </span>
          </div>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              {translate("settings.generalSettings")}
            </TabsTrigger>
            <TabsTrigger value="weather">
              {translate("settings.weatherProviders")}
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    {translate("settings.userProfile")}
                  </CardTitle>
                  <CardDescription>
                    {translate("settings.subtitle")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName">
                      {translate("settings.fullName")}
                    </Label>
                    <Input
                      id="userName"
                      value={settings.userName}
                      onChange={(e) =>
                        updateSetting("userName", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {translate("settings.emailAddress")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting("email", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">{translate("settings.role")}</Label>
                    <Select
                      value={settings.role}
                      onValueChange={(value) => updateSetting("role", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Project Manager">
                          {translate("settings.projectManager")}
                        </SelectItem>
                        <SelectItem value="Site Engineer">
                          {translate("settings.siteEngineer")}
                        </SelectItem>
                        <SelectItem value="Admin">
                          {translate("settings.admin")}
                        </SelectItem>
                        <SelectItem value="Viewer">
                          {translate("settings.viewer")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-green-600" />
                    {translate("settings.language")}
                  </CardTitle>
                  <CardDescription>
                    {translate("settings.subtitle")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">
                      {translate("settings.language")}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={currentLanguage}
                        onValueChange={handleLanguageChange}
                        disabled={translationLoading}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedLanguages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <div className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span>{lang.nativeName}</span>
                                <span className="text-muted-foreground">
                                  ({lang.name})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {translationLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      )}
                    </div>

                    {/* Current Language Info */}
                    <div className="text-xs text-muted-foreground">
                      Current:{" "}
                      {
                        supportedLanguages.find(
                          (l) => l.code === currentLanguage
                        )?.nativeName
                      }{" "}
                      (
                      {
                        supportedLanguages.find(
                          (l) => l.code === currentLanguage
                        )?.name
                      }
                      )
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-yellow-600" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates via email
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) =>
                        updateSetting("emailNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotifications">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Browser push notifications
                      </p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) =>
                        updateSetting("pushNotifications", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weatherAlerts">Weather Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Severe weather warnings
                      </p>
                    </div>
                    <Switch
                      id="weatherAlerts"
                      checked={settings.weatherAlerts}
                      onCheckedChange={(checked) =>
                        updateSetting("weatherAlerts", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="projectUpdates">Project Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Project status changes
                      </p>
                    </div>
                    <Switch
                      id="projectUpdates"
                      checked={settings.projectUpdates}
                      onCheckedChange={(checked) =>
                        updateSetting("projectUpdates", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="shipmentAlerts">Shipment Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Delivery and delay notifications
                      </p>
                    </div>
                    <Switch
                      id="shipmentAlerts"
                      checked={settings.shipmentAlerts}
                      onCheckedChange={(checked) =>
                        updateSetting("shipmentAlerts", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Security
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactorAuth">
                        Two-Factor Authentication
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security
                      </p>
                    </div>
                    <Switch
                      id="twoFactorAuth"
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        updateSetting("twoFactorAuth", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">
                      Session Timeout (minutes)
                    </Label>
                    <Select
                      value={settings.sessionTimeout}
                      onValueChange={(value) =>
                        updateSetting("sessionTimeout", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiry">
                      Password Expiry (days)
                    </Label>
                    <Select
                      value={settings.passwordExpiry}
                      onValueChange={(value) =>
                        updateSetting("passwordExpiry", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Display Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-indigo-600" />
                    Display Settings
                  </CardTitle>
                  <CardDescription>
                    Customize the appearance and layout of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={theme}
                      onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sidebarCollapsed">
                        Collapsed Sidebar
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Start with sidebar minimized
                      </p>
                    </div>
                    <Switch
                      id="sidebarCollapsed"
                      checked={settings.sidebarCollapsed}
                      onCheckedChange={(checked) =>
                        updateSetting("sidebarCollapsed", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dashboardLayout">Dashboard Layout</Label>
                    <Select
                      value={settings.dashboardLayout}
                      onValueChange={(value) =>
                        updateSetting("dashboardLayout", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid Layout</SelectItem>
                        <SelectItem value="list">List Layout</SelectItem>
                        <SelectItem value="compact">Compact Layout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    System Status
                  </CardTitle>
                  <CardDescription>
                    Current system health and connection status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Backend API</span>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Connected
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database</span>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Online
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weather Service</span>
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-yellow-700 border-yellow-200"
                    >
                      Limited
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Services</span>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Weather Providers Tab */}
          <TabsContent value="weather" className="space-y-6">
            <WeatherProviderManager
              onProviderAdded={handleProviderAdded}
              onWeatherData={handleWeatherData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
