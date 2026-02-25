import { TranslationService } from "../contexts/TranslationContext";

// Free Translation API Options
export enum TranslationProvider {
  GOOGLE_FREE = "google_free",
  LIBRE_TRANSLATE = "libre_translate", 
  MYMEMORY = "mymemory",
  DEEPL_FREE = "deepl_free",
}

interface TranslationConfig {
  provider: TranslationProvider;
  apiKey?: string;
  baseUrl?: string;
}

// Google Translate (Free tier: 500,000 characters/month)
class GoogleTranslateService implements TranslationService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Google Translate API key required");
    }

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
          format: "text",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  }

  async translateBatch(texts: string[], targetLanguage: string): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error("Google Translate API key required");
    }

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: texts,
          target: targetLanguage,
          format: "text",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.translations.map((t: any) => t.translatedText);
  }
}

// LibreTranslate (Completely free, open source)
class LibreTranslateService implements TranslationService {
  private baseUrl: string;

  constructor(baseUrl: string = "https://libretranslate.de") {
    this.baseUrl = baseUrl;
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: targetLanguage,
        format: "text",
      }),
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.translatedText;
  }

  async translateBatch(texts: string[], targetLanguage: string): Promise<string[]> {
    // LibreTranslate doesn't support batch, so we'll do individual requests
    const promises = texts.map(text => this.translateText(text, targetLanguage));
    return Promise.all(promises);
  }
}

// MyMemory (Free tier: 1000 requests/day)
class MyMemoryService implements TranslationService {
  async translateText(text: string, targetLanguage: string): Promise<string> {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLanguage}`
    );

    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.responseStatus !== 200) {
      throw new Error(`MyMemory API error: ${data.responseDetails || "Unknown error"}`);
    }

    return data.responseData.translatedText;
  }

  async translateBatch(texts: string[], targetLanguage: string): Promise<string[]> {
    const promises = texts.map(text => this.translateText(text, targetLanguage));
    return Promise.all(promises);
  }
}

// DeepL Free (500,000 characters/month)
class DeepLFreeService implements TranslationService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("DeepL API key required");
    }

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        text: text,
        target_lang: targetLanguage.toUpperCase(),
        source_lang: "EN",
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.translations[0].text;
  }

  async translateBatch(texts: string[], targetLanguage: string): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error("DeepL API key required");
    }

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        text: texts.join("\n"),
        target_lang: targetLanguage.toUpperCase(),
        source_lang: "EN",
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.translations.map((t: any) => t.text);
  }
}

// Fallback service that uses static translations
class FallbackTranslationService implements TranslationService {
  async translateText(text: string, targetLanguage: string): Promise<string> {
    // For fallback, we'll just return the original text
    // In a real implementation, you might want to use a local translation library
    console.warn(`Translation not available for ${targetLanguage}, returning original text`);
    return text;
  }

  async translateBatch(texts: string[], targetLanguage: string): Promise<string[]> {
    return texts.map(text => this.translateText(text, targetLanguage));
  }
}

// Factory function to create translation service
export async function createTranslationService(config?: TranslationConfig): Promise<TranslationService> {
  // Check environment variables for API keys
  const googleApiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
  const deeplApiKey = import.meta.env.VITE_DEEPL_API_KEY;

  // Priority order optimized for Indian languages:
  // 1. Google Translate (Best for Indian languages, requires API key)
  // 2. MyMemory (Fallback, no API key needed)
  // 3. DeepL Free (Limited Indian language support)

  try {
    // Try Google Translate first (Best for Indian languages)
    if (googleApiKey && (!config || config.provider === TranslationProvider.GOOGLE_FREE)) {
      const service = new GoogleTranslateService(googleApiKey);
      await service.translateText("test", "hi"); // Test with Hindi
      console.log("✅ Using Google Translate service (Optimized for Indian languages)");
      return service;
    }
  } catch (error) {
    console.warn("Google Translate not available:", error);
  }

  try {
    // Try MyMemory (Fallback)
    if (!config || config.provider === TranslationProvider.MYMEMORY) {
      const service = new MyMemoryService();
      await service.translateText("test", "hi"); // Test with Hindi
      console.log("✅ Using MyMemory service");
      return service;
    }
  } catch (error) {
    console.warn("MyMemory not available:", error);
  }

  try {
    // Try DeepL Free (Limited Indian language support)
    if (deeplApiKey && (!config || config.provider === TranslationProvider.DEEPL_FREE)) {
      const service = new DeepLFreeService(deeplApiKey);
      await service.translateText("test", "hi"); // Test with Hindi
      console.log("✅ Using DeepL Free service");
      return service;
    }
  } catch (error) {
    console.warn("DeepL Free not available:", error);
  }

  // Fallback to static translations only
  console.warn("No translation service available, using fallback");
  return new FallbackTranslationService();
}

// Utility function to get translation provider info
export function getTranslationProviderInfo(provider: TranslationProvider) {
  const info = {
    [TranslationProvider.GOOGLE_FREE]: {
      name: "Google Translate",
      freeLimit: "500,000 characters/month",
      requiresApiKey: true,
      setupUrl: "https://console.cloud.google.com/apis/credentials",
    },
    [TranslationProvider.LIBRE_TRANSLATE]: {
      name: "LibreTranslate",
      freeLimit: "Unlimited (community server)",
      requiresApiKey: false,
      setupUrl: "https://libretranslate.de",
    },
    [TranslationProvider.MYMEMORY]: {
      name: "MyMemory",
      freeLimit: "1,000 requests/day",
      requiresApiKey: false,
      setupUrl: "https://mymemory.translated.net",
    },
    [TranslationProvider.DEEPL_FREE]: {
      name: "DeepL Free",
      freeLimit: "500,000 characters/month",
      requiresApiKey: true,
      setupUrl: "https://www.deepl.com/pro-api",
    },
  };

  return info[provider];
}
