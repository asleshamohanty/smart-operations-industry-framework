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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Plus,
  TestTube,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Bug,
  Star,
} from "lucide-react";
import {
  WeatherProviderConfig,
  PREDEFINED_PROVIDERS,
  PredefinedProviderName,
  WeatherData,
} from "@/lib/weather-provider-types";
import { weatherProviderService } from "@/lib/weather-provider-service";

interface WeatherProviderManagerProps {
  onProviderAdded?: (providerId: string) => void;
  onWeatherData?: (data: WeatherData) => void;
}

export const WeatherProviderManager: React.FC<WeatherProviderManagerProps> = ({
  onProviderAdded,
  onWeatherData,
}) => {
  const [providers, setProviders] = useState<Record<string, any>>({});
  const [predefined, setPredefined] = useState<string[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Custom provider form state
  const [customConfig, setCustomConfig] = useState<WeatherProviderConfig>({
    name: "",
    base_url: "",
    key_param: "",
    key: "",
    city_param: "",
    temperature_path: "",
    humidity_path: "",
    description_path: "",
    wind_speed_path: "",
    pressure_path: "",
    method: "GET",
    headers: {},
    additional_params: {},
  });

  // Predefined provider state
  const [selectedPredefined, setSelectedPredefined] = useState<
    PredefinedProviderName | ""
  >("");
  const [apiKey, setApiKey] = useState("");

  // Test state
  const [testLocation, setTestLocation] = useState("London");
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await weatherProviderService.getProviders();
      setProviders(data.providers);
      setPredefined(data.predefined);

      // Load active provider
      const activeProvider = await weatherProviderService.getActiveProvider();
      if (activeProvider.success) {
        setActiveProviderId(activeProvider.provider_id || null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomProvider = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate configuration
      const validation = weatherProviderService.validateConfig(customConfig);
      if (!validation.valid) {
        setError(`Validation failed: ${validation.errors.join(", ")}`);
        return;
      }

      const response = await weatherProviderService.addCustomProvider(
        customConfig
      );
      setSuccess(`Provider "${response.name}" added successfully!`);

      // Reset form
      setCustomConfig({
        name: "",
        base_url: "",
        key_param: "",
        key: "",
        city_param: "",
        temperature_path: "",
        humidity_path: "",
        description_path: "",
        wind_speed_path: "",
        pressure_path: "",
        method: "GET",
        headers: {},
        additional_params: {},
      });

      // Reload providers
      await loadProviders();

      if (onProviderAdded) {
        onProviderAdded(response.provider_id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPredefinedProvider = async () => {
    if (!selectedPredefined) {
      setError("Please select a provider");
      return;
    }

    // Check if API key is required for this provider
    const providerInfo =
      PREDEFINED_PROVIDERS[
        selectedPredefined as keyof typeof PREDEFINED_PROVIDERS
      ];
    if (providerInfo && providerInfo.key_param !== "" && !apiKey) {
      setError("Please enter your API key");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await weatherProviderService.addPredefinedProvider(
        selectedPredefined,
        apiKey || "" // Send empty string for IMD providers
      );

      setSuccess(`Provider "${response.name}" added successfully!`);
      setSelectedPredefined("");
      setApiKey("");

      // Reload providers
      await loadProviders();

      if (onProviderAdded) {
        onProviderAdded(response.provider_id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    try {
      setLoading(true);
      const result = await weatherProviderService.testProvider(
        providerId,
        testLocation
      );
      setTestResults({ ...testResults, [providerId]: result });

      if (result.success && result.test_data && onWeatherData) {
        onWeatherData(result.test_data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProvider = async (providerId: string) => {
    try {
      setLoading(true);
      await weatherProviderService.removeProvider(providerId);
      setSuccess("Provider removed successfully!");
      await loadProviders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveProvider = async (providerId: string) => {
    try {
      setLoading(true);

      const result = await weatherProviderService.setActiveProvider(providerId);
      setActiveProviderId(providerId);
      setSuccess(result.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPredefinedTemplate = async (providerName: string) => {
    try {
      const template = await weatherProviderService.getPredefinedProviderConfig(
        providerName
      );
      if (template?.config) {
        setCustomConfig(template.config);
      }
    } catch (err: any) {
      setError(`Failed to load template: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            Weather Provider Configuration
          </h2>
          <p className="text-muted-foreground">
            Add and manage custom weather API providers
          </p>
        </div>
        <Button onClick={loadProviders} variant="outline" disabled={loading}>
          <Loader2
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="predefined" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predefined">Predefined Providers</TabsTrigger>
          <TabsTrigger value="custom">Custom Provider</TabsTrigger>
          <TabsTrigger value="manage">Manage Providers</TabsTrigger>
        </TabsList>

        {/* Predefined Providers Tab */}
        <TabsContent value="predefined" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Predefined Provider</CardTitle>
              <CardDescription>
                Choose from popular weather API providers and add your API key
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="predefined-provider">Select Provider</Label>
                <Select
                  value={selectedPredefined}
                  onValueChange={(value: PredefinedProviderName) =>
                    setSelectedPredefined(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {predefined.map((providerKey) => {
                      // Get provider info from backend or fallback to hardcoded
                      const providerInfo = PREDEFINED_PROVIDERS[
                        providerKey as keyof typeof PREDEFINED_PROVIDERS
                      ] || {
                        name: providerKey
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase()),
                        description: `${providerKey} weather provider`,
                        website: "#",
                      };

                      return (
                        <SelectItem key={providerKey} value={providerKey}>
                          <div className="flex items-center justify-between w-full">
                            <span>{providerInfo.name}</span>
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedPredefined && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">
                    {(() => {
                      const providerInfo = PREDEFINED_PROVIDERS[
                        selectedPredefined as keyof typeof PREDEFINED_PROVIDERS
                      ] || {
                        name: selectedPredefined
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase()),
                        description: `${selectedPredefined} weather provider`,
                        website: "#",
                      };
                      return providerInfo.name;
                    })()}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {(() => {
                      const providerInfo = PREDEFINED_PROVIDERS[
                        selectedPredefined as keyof typeof PREDEFINED_PROVIDERS
                      ] || {
                        description: `${selectedPredefined} weather provider`,
                      };
                      return providerInfo.description;
                    })()}
                  </p>

                  {/* IMD-specific information */}
                  {selectedPredefined.startsWith("imd_") && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="text-yellow-800 font-medium mb-1">
                            IMD API Requirements:
                          </p>
                          <ul className="text-yellow-700 text-xs space-y-1">
                            <li>• IMD APIs require IP whitelisting</li>
                            <li>• Contact IMD to whitelist your server IP</li>
                            <li>
                              • Test with Indian city IDs (e.g., 42182 for
                              Delhi)
                            </li>
                            <li>
                              • Some endpoints may not be publicly accessible
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <a
                    href={(() => {
                      const providerInfo = PREDEFINED_PROVIDERS[
                        selectedPredefined as keyof typeof PREDEFINED_PROVIDERS
                      ] || {
                        website: "#",
                      };
                      return providerInfo.website;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Get API Key →
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="api-key">
                  API Key
                  {(() => {
                    const providerInfo =
                      PREDEFINED_PROVIDERS[
                        selectedPredefined as keyof typeof PREDEFINED_PROVIDERS
                      ];
                    if (providerInfo && providerInfo.key_param === "") {
                      return (
                        <span className="text-green-600 ml-2">
                          (Not Required)
                        </span>
                      );
                    }
                    return (
                      <span className="text-red-600 ml-2">(Required)</span>
                    );
                  })()}
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={(() => {
                    const providerInfo =
                      PREDEFINED_PROVIDERS[
                        selectedPredefined as keyof typeof PREDEFINED_PROVIDERS
                      ];
                    if (providerInfo && providerInfo.key_param === "") {
                      return "No API key required for this provider";
                    }
                    return "Enter your API key...";
                  })()}
                  disabled={(() => {
                    const providerInfo =
                      PREDEFINED_PROVIDERS[
                        selectedPredefined as keyof typeof PREDEFINED_PROVIDERS
                      ];
                    return providerInfo && providerInfo.key_param === "";
                  })()}
                />
              </div>

              <Button
                onClick={handleAddPredefinedProvider}
                disabled={
                  loading ||
                  !selectedPredefined ||
                  (() => {
                    const providerInfo =
                      PREDEFINED_PROVIDERS[
                        selectedPredefined as keyof typeof PREDEFINED_PROVIDERS
                      ];
                    return (
                      providerInfo && providerInfo.key_param !== "" && !apiKey
                    );
                  })()
                }
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Provider Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Custom Provider</CardTitle>
              <CardDescription>
                Configure your own weather API provider with custom endpoints
                and mappings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-name">Provider Name</Label>
                  <Input
                    id="provider-name"
                    value={customConfig.name}
                    onChange={(e) =>
                      setCustomConfig({ ...customConfig, name: e.target.value })
                    }
                    placeholder="My Weather API"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base-url">Base URL</Label>
                  <Input
                    id="base-url"
                    value={customConfig.base_url}
                    onChange={(e) =>
                      setCustomConfig({
                        ...customConfig,
                        base_url: e.target.value,
                      })
                    }
                    placeholder="https://api.example.com/weather"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="key-param">Key Parameter Name</Label>
                  <Input
                    id="key-param"
                    value={customConfig.key_param}
                    onChange={(e) =>
                      setCustomConfig({
                        ...customConfig,
                        key_param: e.target.value,
                      })
                    }
                    placeholder="appid, key, api_key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key-custom">API Key</Label>
                  <Input
                    id="api-key-custom"
                    type="password"
                    value={customConfig.key}
                    onChange={(e) =>
                      setCustomConfig({ ...customConfig, key: e.target.value })
                    }
                    placeholder="Your API key"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city-param">City Parameter Name</Label>
                <Input
                  id="city-param"
                  value={customConfig.city_param}
                  onChange={(e) =>
                    setCustomConfig({
                      ...customConfig,
                      city_param: e.target.value,
                    })
                  }
                  placeholder="q, location, city"
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Response Field Mappings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temp-path">Temperature Path</Label>
                    <Input
                      id="temp-path"
                      value={customConfig.temperature_path}
                      onChange={(e) =>
                        setCustomConfig({
                          ...customConfig,
                          temperature_path: e.target.value,
                        })
                      }
                      placeholder="main.temp, current.temp_c"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="humidity-path">Humidity Path</Label>
                    <Input
                      id="humidity-path"
                      value={customConfig.humidity_path}
                      onChange={(e) =>
                        setCustomConfig({
                          ...customConfig,
                          humidity_path: e.target.value,
                        })
                      }
                      placeholder="main.humidity, current.humidity"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="desc-path">Description Path</Label>
                    <Input
                      id="desc-path"
                      value={customConfig.description_path}
                      onChange={(e) =>
                        setCustomConfig({
                          ...customConfig,
                          description_path: e.target.value,
                        })
                      }
                      placeholder="weather.0.description, current.condition.text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wind-path">
                      Wind Speed Path (Optional)
                    </Label>
                    <Input
                      id="wind-path"
                      value={customConfig.wind_speed_path || ""}
                      onChange={(e) =>
                        setCustomConfig({
                          ...customConfig,
                          wind_speed_path: e.target.value,
                        })
                      }
                      placeholder="wind.speed, current.wind_kph"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddCustomProvider}
                  disabled={loading}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Provider
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Load Template</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Load Predefined Template</DialogTitle>
                      <DialogDescription>
                        Choose a predefined provider template to use as a
                        starting point
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      {Object.entries(PREDEFINED_PROVIDERS).map(
                        ([key, provider]) => (
                          <Button
                            key={key}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => loadPredefinedTemplate(key)}
                          >
                            {provider.name}
                          </Button>
                        )
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Providers Tab */}
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Providers</CardTitle>
              <CardDescription>
                Manage your configured weather providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(providers).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No providers configured yet
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(providers).map(([providerId, provider]) => (
                    <div key={providerId} className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{provider.name}</h4>
                            <Badge
                              variant={
                                provider.has_key ? "default" : "secondary"
                              }
                            >
                              {provider.has_key ? "Configured" : "No Key"}
                            </Badge>
                            {activeProviderId === providerId && (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {provider.base_url}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Test location"
                            value={testLocation}
                            onChange={(e) => setTestLocation(e.target.value)}
                            className="w-32"
                          />

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestProvider(providerId)}
                            disabled={loading}
                            title="Test Provider"
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant={
                              activeProviderId === providerId
                                ? "default"
                                : "outline"
                            }
                            onClick={() => handleSetActiveProvider(providerId)}
                            disabled={loading}
                            title={
                              activeProviderId === providerId
                                ? "Currently Active Provider"
                                : providerId.startsWith("imd_")
                                ? "Set as Active Provider (IMD - Requires IP Whitelisting)"
                                : "Set as Active Provider"
                            }
                            className={
                              providerId.startsWith("imd_")
                                ? "border-yellow-500 hover:border-yellow-600"
                                : ""
                            }
                          >
                            <Star
                              className={`h-4 w-4 ${
                                activeProviderId === providerId
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                            {providerId.startsWith("imd_") && (
                              <AlertTriangle className="h-3 w-3 ml-1 text-yellow-600" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveProvider(providerId)}
                            disabled={loading}
                            title="Remove Provider"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* IMD Warning Box - Show below IMD provider when active */}
                      {providerId.startsWith("imd_") &&
                        activeProviderId === providerId && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <h5 className="font-medium text-yellow-800 mb-2 text-sm">
                                  IMD API Requirements
                                </h5>
                                <div className="text-xs text-yellow-700 space-y-1">
                                  <p>
                                    <strong>IP Whitelisting:</strong> Contact
                                    IMD to whitelist your server IP
                                  </p>
                                  <p>
                                    <strong>City Codes:</strong> Use Indian city
                                    IDs (e.g., 42182 for Delhi)
                                  </p>
                                  <p>
                                    <strong>Access:</strong> Some endpoints may
                                    not be publicly accessible
                                  </p>
                                  <p>
                                    <strong>Docs:</strong>{" "}
                                    <a
                                      href="https://mausam.imd.gov.in/imd_latest/contents/api.pdf"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline hover:text-yellow-800"
                                    >
                                      IMD API documentation
                                    </a>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(testResults).map(([providerId, result]) => (
                    <div
                      key={providerId}
                      className={`p-4 rounded-lg ${
                        result.success
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          {providers[providerId]?.name} - {result.test_location}
                        </span>
                      </div>
                      <p className="text-sm">{result.message}</p>
                      {result.test_data && (
                        <div className="mt-2 text-sm">
                          <p>Temperature: {result.test_data.temperature}°C</p>
                          <p>Humidity: {result.test_data.humidity}%</p>
                          <p>Description: {result.test_data.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
