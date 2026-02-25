import React from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, CheckCircle, AlertTriangle } from "lucide-react";

export const TranslationDemo: React.FC = () => {
  const {
    currentLanguage,
    translate,
    translateDynamic,
    isLoading,
    error,
    supportedLanguages,
  } = useTranslation();

  const [dynamicText, setDynamicText] = React.useState("");
  const [translatedText, setTranslatedText] = React.useState("");
  const [isTranslating, setIsTranslating] = React.useState(false);

  const handleDynamicTranslation = async () => {
    if (!dynamicText.trim()) return;

    setIsTranslating(true);
    try {
      const translated = await translateDynamic(dynamicText);
      setTranslatedText(translated);
    } catch (error) {
      console.error("Translation failed:", error);
      setTranslatedText("Translation failed");
    } finally {
      setIsTranslating(false);
    }
  };

  const currentLang = supportedLanguages.find(
    (lang) => lang.code === currentLanguage
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Translation System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Current Language:</span>
            <Badge variant="outline" className="flex items-center gap-1">
              <span>{currentLang?.flag}</span>
              <span>{currentLang?.nativeName}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Translation Service:</span>
            {error ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Offline
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Active
              </Badge>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Static Translation Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Navigation:</span>
              <div className="text-gray-600">
                {translate("nav.dashboard")} • {translate("nav.settings")}
              </div>
            </div>
            <div>
              <span className="font-medium">Actions:</span>
              <div className="text-gray-600">
                {translate("common.save")} • {translate("common.cancel")}
              </div>
            </div>
            <div>
              <span className="font-medium">Assistant:</span>
              <div className="text-gray-600">
                {translate("assistant.title")} •{" "}
                {translate("assistant.thinking")}
              </div>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <div className="text-gray-600">
                {translate("common.loading")} • {translate("common.success")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dynamic Translation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Enter text to translate:
            </label>
            <textarea
              className="w-full p-2 border rounded-md"
              rows={3}
              value={dynamicText}
              onChange={(e) => setDynamicText(e.target.value)}
              placeholder="Type something to translate..."
            />
          </div>

          <Button
            onClick={handleDynamicTranslation}
            disabled={!dynamicText.trim() || isTranslating}
            className="w-full"
          >
            {isTranslating ? "Translating..." : "Translate"}
          </Button>

          {translatedText && (
            <div className="p-3 bg-gray-50 border rounded-md">
              <div className="text-sm font-medium mb-1">
                Translated to {currentLang?.nativeName}:
              </div>
              <div className="text-gray-700">{translatedText}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
