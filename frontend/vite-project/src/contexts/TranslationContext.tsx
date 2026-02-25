import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// Language configuration
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
];

// Translation service interface
export interface TranslationService {
  translateText: (text: string, targetLanguage: string) => Promise<string>;
  translateBatch: (
    texts: string[],
    targetLanguage: string
  ) => Promise<string[]>;
}

// Context type
interface TranslationContextType {
  currentLanguage: string;
  setLanguage: (languageCode: string) => Promise<void>;
  translate: (key: string, fallback?: string) => string;
  translateDynamic: (text: string) => Promise<string>;
  isLoading: boolean;
  supportedLanguages: Language[];
  error: string | null;
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

// Static translations for common UI elements
const STATIC_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.projects": "Project Ops",
    "nav.shipments": "Shipments",
    "nav.digitalTwin": "Digital Twin",
    "nav.resources": "Circular Resources",
    "nav.safety": "Safety Monitor",
    "nav.sustainability": "ESG Dashboard",
    "nav.settings": "Settings",

    // Common actions
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.confirm": "Confirm",
    "common.close": "Close",

    // Settings
    "settings.title": "Settings",
    "settings.subtitle":
      "Manage your application preferences and configuration",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.notifications": "Notifications",
    "settings.security": "Security",
    "settings.display": "Display",
    "settings.saveChanges": "Save Changes",
    "settings.reset": "Reset",
    "settings.saved": "Settings saved successfully!",

    // Project Assistant
    "assistant.title": "Project Assistant",
    "assistant.selectProject": "Which project would you like to discuss?",
    "assistant.availableProjects": "Available projects",
    "assistant.noProjects": "No projects loaded. Check console for errors.",
    "assistant.projectsAvailable": "projects available",
    "assistant.selectProjectPlaceholder": "Select a project...",
    "assistant.changeProject": "Change Project",
    "assistant.quickPrompts": "Quick prompts:",
    "assistant.askAboutProject": "Ask about your project...",
    "assistant.selectProjectFirst": "Select a project first...",
    "assistant.thinking": "Thinking...",

    // Error messages
    "error.loadingProjects": "Failed to load projects",
    "error.loadingProjectDetails": "Failed to load project details",
    "error.aiResponse": "Sorry, I encountered an error. Please try again.",
    "error.unknown": "Unknown error",

    // Dashboard
    "dashboard.title": "Smart Ops Platform",
    "dashboard.subtitle":
      "Intelligent infrastructure project management with AI-driven optimization, circular resource exchange, and real-time ESG monitoring",
    "dashboard.projectOps": "Project Operations Hub",
    "dashboard.projectOpsDesc": "Resource tracking & shipment monitoring",
    "dashboard.activeProjects": "Active Projects",
    "dashboard.resourceAlerts": "Resource Alerts",
    "dashboard.digitalTwin": "Digital Twin Analytics",
    "dashboard.digitalTwinDesc": "Real-time sensor data & anomaly detection",
    "dashboard.circularResources": "Circular Resource Exchange",
    "dashboard.circularResourcesDesc":
      "Material reuse & sustainability tracking",
    "dashboard.esgMonitoring": "ESG Monitoring",
    "dashboard.esgMonitoringDesc": "Environmental & social impact tracking",
    "dashboard.safetyMonitor": "Safety Monitor",
    "dashboard.safetyMonitorDesc": "Worker safety & environmental alerts",
    "dashboard.recentProjects": "Recent Projects",
    "dashboard.viewAllProjects": "View All Projects",
    "dashboard.systemStatus": "System Status",
    "dashboard.allSystemsOperational": "All systems operational",
    "dashboard.weatherAware": "Weather-Aware ESG Digital Twin",
    "dashboard.infrastructureMonitoring":
      "Infrastructure Project Monitoring & Prediction Dashboard",

    // Common dashboard elements
    "common.viewDetails": "View Details",
    "common.viewAll": "View All",
    "common.refresh": "Refresh",
    "common.selectProject": "Select Project",
    "common.noData": "No data available",
    "common.lastUpdated": "Last updated",
    "common.status": "Status",
    "common.active": "Active",
    "common.inactive": "Inactive",
    "common.pending": "Pending",
    "common.completed": "Completed",
    "common.cancelled": "Cancelled",

    // Weather
    "weather.title": "Weather Conditions",
    "weather.temperature": "Temperature",
    "weather.humidity": "Humidity",
    "weather.windSpeed": "Wind Speed",
    "weather.rainfall": "Rainfall",
    "weather.disruptionScore": "Disruption Score",
    "weather.lowRisk": "Low Risk",
    "weather.mediumRisk": "Medium Risk",
    "weather.highRisk": "High Risk",

    // ESG
    "esg.title": "ESG Analysis",
    "esg.environmental": "Environmental",
    "esg.social": "Social",
    "esg.governance": "Governance",
    "esg.overallScore": "Overall Score",
    "esg.sdgAlignment": "SDG Alignment",
    "esg.carbonFootprint": "Carbon Footprint",
    "esg.waterUsage": "Water Usage",
    "esg.wasteReduction": "Waste Reduction",

    // Projects
    "projects.title": "Project Operations",
    "projects.createNew": "Create New Project",
    "projects.projectName": "Project Name",
    "projects.location": "Location",
    "projects.budget": "Budget",
    "projects.type": "Type",
    "projects.status": "Status",
    "projects.progress": "Progress",
    "projects.startDate": "Start Date",
    "projects.endDate": "End Date",
    "projects.description": "Description",

    // Shipments
    "shipments.title": "Shipment Tracking",
    "shipments.trackingNumber": "Tracking Number",
    "shipments.origin": "Origin",
    "shipments.destination": "Destination",
    "shipments.estimatedArrival": "Estimated Arrival",
    "shipments.status": "Status",
    "shipments.inTransit": "In Transit",
    "shipments.delivered": "Delivered",
    "shipments.delayed": "Delayed",

    // Resources
    "resources.title": "Circular Resources",
    "resources.available": "Available Resources",
    "resources.requested": "Requested Resources",
    "resources.exchanged": "Exchanged Resources",
    "resources.materialType": "Material Type",
    "resources.quantity": "Quantity",
    "resources.condition": "Condition",
    "resources.excellent": "Excellent",
    "resources.good": "Good",
    "resources.fair": "Fair",
    "resources.poor": "Poor",

    // Safety
    "safety.title": "Safety Monitor",
    "safety.aqi": "Air Quality Index",
    "safety.temperature": "Temperature",
    "safety.humidity": "Humidity",
    "safety.windSpeed": "Wind Speed",
    "safety.alerts": "Safety Alerts",
    "safety.noAlerts": "No safety alerts",
    "safety.workerCount": "Workers on Site",
    "safety.incidents": "Incidents",
    "safety.training": "Training Required",

    // Settings - Extended
    "settings.generalSettings": "General Settings",
    "settings.translationDemo": "Translation Demo",
    "settings.weatherProviders": "Weather Providers",
    "settings.userProfile": "User Profile",
    "settings.systemPreferences": "System Preferences",
    "settings.notificationSettings": "Notification Settings",
    "settings.securitySettings": "Security Settings",
    "settings.displaySettings": "Display Settings",
    "settings.fullName": "Full Name",
    "settings.emailAddress": "Email Address",
    "settings.role": "Role",
    "settings.projectManager": "Project Manager",
    "settings.siteEngineer": "Site Engineer",
    "settings.admin": "Admin",
    "settings.viewer": "Viewer",
    "settings.emailNotifications": "Email Notifications",
    "settings.pushNotifications": "Push Notifications",
    "settings.weatherAlerts": "Weather Alerts",
    "settings.projectUpdates": "Project Updates",
    "settings.shipmentAlerts": "Shipment Alerts",
    "settings.twoFactorAuth": "Two-Factor Authentication",
    "settings.sessionTimeout": "Session Timeout",
    "settings.passwordExpiry": "Password Expiry",
    "settings.lightTheme": "Light Theme",
    "settings.darkTheme": "Dark Theme",
    "settings.sidebarCollapsed": "Sidebar Collapsed",
    "settings.gridLayout": "Grid Layout",
    "settings.listLayout": "List Layout",
    "settings.receiveUpdatesViaEmail": "Receive updates via email",
    "settings.receivePushNotifications": "Receive push notifications",
    "settings.getWeatherAlerts": "Get weather alerts",
    "settings.getProjectUpdates": "Get project updates",
    "settings.getShipmentAlerts": "Get shipment alerts",
    "settings.enableTwoFactorAuth": "Enable two-factor authentication",
    "settings.sessionTimeoutMinutes": "Session timeout (minutes)",
    "settings.passwordExpiryDays": "Password expiry (days)",
    "settings.selectTheme": "Select theme",
    "settings.collapseSidebar": "Collapse sidebar",
    "settings.selectLayout": "Select layout",

    // Login/Auth
    "auth.login": "Login",
    "auth.logout": "Logout",
    "auth.signIn": "Sign In",
    "auth.signOut": "Sign Out",
    "auth.signInWithGoogle": "Sign in with Google",
    "auth.welcome": "Welcome",
    "auth.welcomeBack": "Welcome back",
    "auth.pleaseSignIn": "Please sign in to continue",
    "auth.notAuthenticated":
      "Not authenticated. Please log in to access features.",
    "auth.loadingUserInfo": "Loading user information...",

    // Digital Twin
    "digitalTwin.title": "Digital Twin",
    "digitalTwin.overview": "Overview",
    "digitalTwin.sensors": "Sensors",
    "digitalTwin.anomalies": "Anomalies",
    "digitalTwin.predictions": "Predictions",
    "digitalTwin.threeDModel": "3D Model",
    "digitalTwin.totalSensors": "Total Sensors",
    "digitalTwin.activeSensors": "Active Sensors",
    "digitalTwin.anomaliesDetected": "Anomalies Detected",
    "digitalTwin.avgConfidence": "Avg Confidence",
    "digitalTwin.systemHealth": "System Health",
    "digitalTwin.sensorData": "Sensor Data",
    "digitalTwin.anomalyHistory": "Anomaly History",
    "digitalTwin.workflowOptimization": "Workflow Optimization",
    "digitalTwin.emissionPriority": "Emission Priority",
    "digitalTwin.costPriority": "Cost Priority",
    "digitalTwin.optimize": "Optimize",
    "digitalTwin.optimizing": "Optimizing...",

    // Time and Date
    "time.today": "Today",
    "time.yesterday": "Yesterday",
    "time.thisWeek": "This Week",
    "time.thisMonth": "This Month",
    "time.thisYear": "This Year",
    "time.january": "January",
    "time.february": "February",
    "time.march": "March",
    "time.april": "April",
    "time.may": "May",
    "time.june": "June",
    "time.july": "July",
    "time.august": "August",
    "time.september": "September",
    "time.october": "October",
    "time.november": "November",
    "time.december": "December",

    // Units
    "units.celsius": "°C",
    "units.fahrenheit": "°F",
    "units.percent": "%",
    "units.kmh": "km/h",
    "units.mph": "mph",
    "units.mm": "mm",
    "units.inches": "in",
    "units.kg": "kg",
    "units.lbs": "lbs",
    "units.meters": "m",
    "units.feet": "ft",
    "units.squareMeters": "m²",
    "units.squareFeet": "ft²",
    "units.cubicMeters": "m³",
    "units.cubicFeet": "ft³",
  },

  // Bengali (বাংলা) - 2nd most spoken language in India
  bn: {
    // Navigation
    "nav.dashboard": "ড্যাশবোর্ড",
    "nav.projects": "প্রজেক্ট অপস",
    "nav.shipments": "শিপমেন্ট",
    "nav.digitalTwin": "ডিজিটাল টুইন",
    "nav.resources": "সার্কুলার রিসোর্স",
    "nav.safety": "নিরাপত্তা মনিটর",
    "nav.sustainability": "ESG ড্যাশবোর্ড",
    "nav.settings": "সেটিংস",

    // Common actions
    "common.save": "সংরক্ষণ",
    "common.cancel": "বাতিল",
    "common.delete": "মুছে ফেলুন",
    "common.edit": "সম্পাদনা",
    "common.add": "যোগ করুন",
    "common.loading": "লোড হচ্ছে...",
    "common.error": "ত্রুটি",
    "common.success": "সফল",
    "common.confirm": "নিশ্চিত করুন",
    "common.close": "বন্ধ",

    // Settings
    "settings.title": "সেটিংস",
    "settings.subtitle":
      "আপনার অ্যাপ্লিকেশন পছন্দ এবং কনফিগারেশন পরিচালনা করুন",
    "settings.language": "ভাষা",
    "settings.saveChanges": "পরিবর্তন সংরক্ষণ",
    "settings.reset": "রিসেট",
    "settings.saved": "সেটিংস সফলভাবে সংরক্ষিত!",

    // Dashboard
    "dashboard.title": "স্মার্ট অপস প্ল্যাটফর্ম",
    "dashboard.subtitle":
      "AI-চালিত অপ্টিমাইজেশন, সার্কুলার রিসোর্স এক্সচেঞ্জ এবং রিয়েল-টাইম ESG মনিটরিং সহ বুদ্ধিমান ইনফ্রাস্ট্রাকচার প্রজেক্ট ম্যানেজমেন্ট",
    "dashboard.projectOps": "প্রজেক্ট অপারেশন হাব",
    "dashboard.activeProjects": "সক্রিয় প্রজেক্ট",
    "dashboard.systemStatus": "সিস্টেম স্ট্যাটাস",
    "dashboard.allSystemsOperational": "সব সিস্টেম কার্যকর",

    // Project Assistant
    "assistant.title": "প্রজেক্ট অ্যাসিস্ট্যান্ট",
    "assistant.selectProject": "আপনি কোন প্রজেক্ট নিয়ে আলোচনা করতে চান?",
    "assistant.availableProjects": "উপলব্ধ প্রজেক্ট",
    "assistant.projectsAvailable": "প্রজেক্ট উপলব্ধ",
    "assistant.selectProjectPlaceholder": "একটি প্রজেক্ট নির্বাচন করুন...",
    "assistant.changeProject": "প্রজেক্ট পরিবর্তন",
    "assistant.quickPrompts": "দ্রুত প্রম্পট:",
    "assistant.askAboutProject": "আপনার প্রজেক্ট সম্পর্কে জিজ্ঞাসা করুন...",
    "assistant.selectProjectFirst": "প্রথমে একটি প্রজেক্ট নির্বাচন করুন...",
    "assistant.thinking": "চিন্তা করছে...",

    // Error messages
    "error.loadingProjects": "প্রজেক্ট লোড করতে ব্যর্থ",
    "error.loadingProjectDetails": "প্রজেক্ট বিবরণ লোড করতে ব্যর্থ",
    "error.aiResponse":
      "দুঃখিত, আমি একটি ত্রুটির সম্মুখীন হয়েছি। আবার চেষ্টা করুন।",
    "error.unknown": "অজানা ত্রুটি",
  },

  // Telugu (తెలుగు) - 3rd most spoken language in India
  te: {
    // Navigation
    "nav.dashboard": "డ్యాష్‌బోర్డ్",
    "nav.projects": "ప్రాజెక్ట్ ఆప్స్",
    "nav.shipments": "షిప్‌మెంట్‌లు",
    "nav.digitalTwin": "డిజిటల్ ట్విన్",
    "nav.resources": "సర్క్యులర్ రిసోర్స్‌లు",
    "nav.safety": "సేఫ్టీ మానిటర్",
    "nav.sustainability": "ESG డ్యాష్‌బోర్డ్",
    "nav.settings": "సెట్టింగ్‌లు",

    // Common actions
    "common.save": "సేవ్ చేయండి",
    "common.cancel": "రద్దు చేయండి",
    "common.delete": "తొలగించండి",
    "common.edit": "సవరించండి",
    "common.add": "జోడించండి",
    "common.loading": "లోడ్ అవుతోంది...",
    "common.error": "లోపం",
    "common.success": "విజయవంతం",
    "common.confirm": "నిర్ధారించండి",
    "common.close": "మూసివేయండి",

    // Settings
    "settings.title": "సెట్టింగ్‌లు",
    "settings.subtitle":
      "మీ అప్లికేషన్ ప్రాధాన్యతలు మరియు కాన్ఫిగరేషన్‌ను నిర్వహించండి",
    "settings.language": "భాష",
    "settings.saveChanges": "మార్పులను సేవ్ చేయండి",
    "settings.reset": "రీసెట్",
    "settings.saved": "సెట్టింగ్‌లు విజయవంతంగా సేవ్ చేయబడ్డాయి!",

    // Dashboard
    "dashboard.title": "స్మార్ట్ ఆప్స్ ప్లాట్‌ఫారమ్",
    "dashboard.subtitle":
      "AI-నడిచే ఆప్టిమైజేషన్, సర్క్యులర్ రిసోర్స్ ఎక్స్ఛేంజ్ మరియు రియల్-టైమ్ ESG మానిటరింగ్‌తో తెలివైన ఇన్‌ఫ్రాస్ట్రక్చర్ ప్రాజెక్ట్ మేనేజ్‌మెంట్",
    "dashboard.projectOps": "ప్రాజెక్ట్ ఆపరేషన్‌లు హబ్",
    "dashboard.activeProjects": "క్రియాశీల ప్రాజెక్ట్‌లు",
    "dashboard.systemStatus": "సిస్టమ్ స్థితి",
    "dashboard.allSystemsOperational": "అన్ని సిస్టమ్‌లు కార్యాచరణలో ఉన్నాయి",

    // Project Assistant
    "assistant.title": "ప్రాజెక్ట్ అసిస్టెంట్",
    "assistant.selectProject":
      "మీరు ఏ ప్రాజెక్ట్ గురించి చర్చించాలనుకుంటున్నారు?",
    "assistant.availableProjects": "అందుబాటులో ఉన్న ప్రాజెక్ట్‌లు",
    "assistant.projectsAvailable": "ప్రాజెక్ట్‌లు అందుబాటులో ఉన్నాయి",
    "assistant.selectProjectPlaceholder": "ఒక ప్రాజెక్ట్‌ను ఎంచుకోండి...",
    "assistant.changeProject": "ప్రాజెక్ట్‌ను మార్చండి",
    "assistant.quickPrompts": "త్వరిత ప్రాంప్ట్‌లు:",
    "assistant.askAboutProject": "మీ ప్రాజెక్ట్ గురించి అడగండి...",
    "assistant.selectProjectFirst": "మొదట ఒక ప్రాజెక్ట్‌ను ఎంచుకోండి...",
    "assistant.thinking": "ఆలోచిస్తోంది...",

    // Error messages
    "error.loadingProjects": "ప్రాజెక్ట్‌లను లోడ్ చేయడంలో విఫలం",
    "error.loadingProjectDetails": "ప్రాజెక్ట్ వివరాలను లోడ్ చేయడంలో విఫలం",
    "error.aiResponse":
      "క్షమించండి, నేను లోపాన్ని ఎదుర్కొన్నాను. దయచేసి మళ్లీ ప్రయత్నించండి.",
    "error.unknown": "తెలియని లోపం",
  },

  // Tamil (தமிழ்) - 4th most spoken language in India
  ta: {
    // Navigation
    "nav.dashboard": "டாஷ்போர்டு",
    "nav.projects": "திட்ட செயல்பாடுகள்",
    "nav.shipments": "கப்பல் சரக்குகள்",
    "nav.digitalTwin": "டிஜிட்டல் இரட்டை",
    "nav.resources": "வட்டார வளங்கள்",
    "nav.safety": "பாதுகாப்பு கண்காணிப்பு",
    "nav.sustainability": "ESG டாஷ்போர்டு",
    "nav.settings": "அமைப்புகள்",

    // Common actions
    "common.save": "சேமி",
    "common.cancel": "ரத்து செய்",
    "common.delete": "நீக்கு",
    "common.edit": "திருத்து",
    "common.add": "சேர்",
    "common.loading": "ஏற்றப்படுகிறது...",
    "common.error": "பிழை",
    "common.success": "வெற்றி",
    "common.confirm": "உறுதிப்படுத்து",
    "common.close": "மூடு",

    // Settings
    "settings.title": "அமைப்புகள்",
    "settings.subtitle":
      "உங்கள் பயன்பாட்டு விருப்பங்கள் மற்றும் கட்டமைப்பை நிர்வகிக்கவும்",
    "settings.language": "மொழி",
    "settings.saveChanges": "மாற்றங்களை சேமி",
    "settings.reset": "மீட்டமை",
    "settings.saved": "அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன!",

    // Dashboard
    "dashboard.title": "ஸ்மார்ட் ஆப்ஸ் தளம்",
    "dashboard.subtitle":
      "AI-இயக்கப்படும் மேம்படுத்தல், வட்டார வள பரிமாற்றம் மற்றும் நேரடி நேர ESG கண்காணிப்புடன் புத்திசாலித்தனமான உள்கட்டமைப்பு திட்ட மேலாண்மை",
    "dashboard.projectOps": "திட்ட செயல்பாடு மையம்",
    "dashboard.activeProjects": "செயலில் உள்ள திட்டங்கள்",
    "dashboard.systemStatus": "கணினி நிலை",
    "dashboard.allSystemsOperational": "அனைத்து கணினிகளும் செயல்பாட்டில் உள்ளன",

    // Project Assistant
    "assistant.title": "திட்ட உதவியாளர்",
    "assistant.selectProject":
      "நீங்கள் எந்த திட்டத்தைப் பற்றி விவாதிக்க விரும்புகிறீர்கள்?",
    "assistant.availableProjects": "கிடைக்கும் திட்டங்கள்",
    "assistant.projectsAvailable": "திட்டங்கள் கிடைக்கின்றன",
    "assistant.selectProjectPlaceholder":
      "ஒரு திட்டத்தைத் தேர்ந்தெடுக்கவும்...",
    "assistant.changeProject": "திட்டத்தை மாற்று",
    "assistant.quickPrompts": "விரைவு கேள்விகள்:",
    "assistant.askAboutProject": "உங்கள் திட்டத்தைப் பற்றி கேளுங்கள்...",
    "assistant.selectProjectFirst":
      "முதலில் ஒரு திட்டத்தைத் தேர்ந்தெடுக்கவும்...",
    "assistant.thinking": "சிந்திக்கிறது...",

    // Error messages
    "error.loadingProjects": "திட்டங்களை ஏற்ற முடியவில்லை",
    "error.loadingProjectDetails": "திட்ட விவரங்களை ஏற்ற முடியவில்லை",
    "error.aiResponse":
      "மன்னிக்கவும், நான் ஒரு பிழையை எதிர்கொண்டேன். மீண்டும் முயற்சிக்கவும்.",
    "error.unknown": "தெரியாத பிழை",
  },

  hi: {
    // Navigation
    "nav.dashboard": "डैशबोर्ड",
    "nav.projects": "प्रोजेक्ट ऑप्स",
    "nav.shipments": "शिपमेंट",
    "nav.digitalTwin": "डिजिटल ट्विन",
    "nav.resources": "सर्कुलर रिसोर्सेज",
    "nav.safety": "सेफ्टी मॉनिटर",
    "nav.sustainability": "ईएसजी डैशबोर्ड",
    "nav.settings": "सेटिंग्स",

    // Common actions
    "common.save": "सेव करें",
    "common.cancel": "रद्द करें",
    "common.delete": "डिलीट करें",
    "common.edit": "एडिट करें",
    "common.add": "जोड़ें",
    "common.loading": "लोड हो रहा है...",
    "common.error": "त्रुटि",
    "common.success": "सफलता",
    "common.confirm": "पुष्टि करें",
    "common.close": "बंद करें",

    // Settings
    "settings.title": "सेटिंग्स",
    "settings.subtitle":
      "अपनी एप्लिकेशन प्राथमिकताएं और कॉन्फ़िगरेशन प्रबंधित करें",
    "settings.language": "भाषा",
    "settings.theme": "थीम",
    "settings.notifications": "सूचनाएं",
    "settings.security": "सुरक्षा",
    "settings.display": "डिस्प्ले",
    "settings.saveChanges": "परिवर्तन सेव करें",
    "settings.reset": "रीसेट करें",
    "settings.saved": "सेटिंग्स सफलतापूर्वक सेव हो गईं!",

    // Project Assistant
    "assistant.title": "प्रोजेक्ट असिस्टेंट",
    "assistant.selectProject":
      "आप किस प्रोजेक्ट के बारे में चर्चा करना चाहते हैं?",
    "assistant.availableProjects": "उपलब्ध प्रोजेक्ट",
    "assistant.noProjects":
      "कोई प्रोजेक्ट लोड नहीं हुए। त्रुटियों के लिए कंसोल जांचें।",
    "assistant.projectsAvailable": "प्रोजेक्ट उपलब्ध",
    "assistant.selectProjectPlaceholder": "एक प्रोजेक्ट चुनें...",
    "assistant.changeProject": "प्रोजेक्ट बदलें",
    "assistant.quickPrompts": "त्वरित प्रॉम्प्ट:",
    "assistant.askAboutProject": "अपने प्रोजेक्ट के बारे में पूछें...",
    "assistant.selectProjectFirst": "पहले एक प्रोजेक्ट चुनें...",
    "assistant.thinking": "सोच रहा है...",

    // Error messages
    "error.loadingProjects": "प्रोजेक्ट लोड करने में विफल",
    "error.loadingProjectDetails": "प्रोजेक्ट विवरण लोड करने में विफल",
    "error.aiResponse":
      "क्षमा करें, मुझे एक त्रुटि का सामना करना पड़ा। कृपया पुनः प्रयास करें।",
    "error.unknown": "अज्ञात त्रुटि",

    // Dashboard
    "dashboard.title": "स्मार्ट ऑप्स प्लेटफॉर्म",
    "dashboard.subtitle":
      "AI-संचालित अनुकूलन, सर्कुलर रिसोर्स एक्सचेंज और रियल-टाइम ESG मॉनिटरिंग के साथ बुद्धिमान इन्फ्रास्ट्रक्चर प्रोजेक्ट प्रबंधन",
    "dashboard.projectOps": "प्रोजेक्ट ऑपरेशंस हब",
    "dashboard.projectOpsDesc": "रिसोर्स ट्रैकिंग और शिपमेंट मॉनिटरिंग",
    "dashboard.activeProjects": "सक्रिय प्रोजेक्ट",
    "dashboard.resourceAlerts": "रिसोर्स अलर्ट",
    "dashboard.digitalTwin": "डिजिटल ट्विन एनालिटिक्स",
    "dashboard.digitalTwinDesc": "रियल-टाइम सेंसर डेटा और एनोमली डिटेक्शन",
    "dashboard.circularResources": "सर्कुलर रिसोर्स एक्सचेंज",
    "dashboard.circularResourcesDesc": "सामग्री पुन: उपयोग और स्थिरता ट्रैकिंग",
    "dashboard.esgMonitoring": "ESG मॉनिटरिंग",
    "dashboard.esgMonitoringDesc": "पर्यावरणीय और सामाजिक प्रभाव ट्रैकिंग",
    "dashboard.safetyMonitor": "सेफ्टी मॉनिटर",
    "dashboard.safetyMonitorDesc": "कार्यकर्ता सुरक्षा और पर्यावरणीय अलर्ट",
    "dashboard.recentProjects": "हाल के प्रोजेक्ट",
    "dashboard.viewAllProjects": "सभी प्रोजेक्ट देखें",
    "dashboard.systemStatus": "सिस्टम स्थिति",
    "dashboard.allSystemsOperational": "सभी सिस्टम कार्यात्मक",
    "dashboard.weatherAware": "मौसम-जागरूक ESG डिजिटल ट्विन",
    "dashboard.infrastructureMonitoring":
      "इन्फ्रास्ट्रक्चर प्रोजेक्ट मॉनिटरिंग और भविष्यवाणी डैशबोर्ड",

    // Common dashboard elements
    "common.viewDetails": "विवरण देखें",
    "common.viewAll": "सभी देखें",
    "common.refresh": "रिफ्रेश करें",
    "common.selectProject": "प्रोजेक्ट चुनें",
    "common.noData": "कोई डेटा उपलब्ध नहीं",
    "common.lastUpdated": "अंतिम अपडेट",
    "common.status": "स्थिति",
    "common.active": "सक्रिय",
    "common.inactive": "निष्क्रिय",
    "common.pending": "लंबित",
    "common.completed": "पूर्ण",
    "common.cancelled": "रद्द",

    // Weather
    "weather.title": "मौसम की स्थिति",
    "weather.temperature": "तापमान",
    "weather.humidity": "आर्द्रता",
    "weather.windSpeed": "हवा की गति",
    "weather.rainfall": "वर्षा",
    "weather.disruptionScore": "अवरोध स्कोर",
    "weather.lowRisk": "कम जोखिम",
    "weather.mediumRisk": "मध्यम जोखिम",
    "weather.highRisk": "उच्च जोखिम",

    // ESG
    "esg.title": "ESG विश्लेषण",
    "esg.environmental": "पर्यावरणीय",
    "esg.social": "सामाजिक",
    "esg.governance": "शासन",
    "esg.overallScore": "समग्र स्कोर",
    "esg.sdgAlignment": "SDG संरेखण",
    "esg.carbonFootprint": "कार्बन फुटप्रिंट",
    "esg.waterUsage": "जल उपयोग",
    "esg.wasteReduction": "अपशिष्ट कमी",

    // Projects
    "projects.title": "प्रोजेक्ट ऑपरेशंस",
    "projects.createNew": "नया प्रोजेक्ट बनाएं",
    "projects.projectName": "प्रोजेक्ट नाम",
    "projects.location": "स्थान",
    "projects.budget": "बजट",
    "projects.type": "प्रकार",
    "projects.status": "स्थिति",
    "projects.progress": "प्रगति",
    "projects.startDate": "प्रारंभ तिथि",
    "projects.endDate": "समाप्ति तिथि",
    "projects.description": "विवरण",

    // Shipments
    "shipments.title": "शिपमेंट ट्रैकिंग",
    "shipments.trackingNumber": "ट्रैकिंग नंबर",
    "shipments.origin": "उत्पत्ति",
    "shipments.destination": "गंतव्य",
    "shipments.estimatedArrival": "अनुमानित आगमन",
    "shipments.status": "स्थिति",
    "shipments.inTransit": "पारगमन में",
    "shipments.delivered": "डिलीवर",
    "shipments.delayed": "देर से",

    // Resources
    "resources.title": "सर्कुलर रिसोर्सेज",
    "resources.available": "उपलब्ध रिसोर्सेज",
    "resources.requested": "अनुरोधित रिसोर्सेज",
    "resources.exchanged": "एक्सचेंज किए गए रिसोर्सेज",
    "resources.materialType": "सामग्री प्रकार",
    "resources.quantity": "मात्रा",
    "resources.condition": "स्थिति",
    "resources.excellent": "उत्कृष्ट",
    "resources.good": "अच्छा",
    "resources.fair": "ठीक",
    "resources.poor": "खराब",

    // Safety
    "safety.title": "सेफ्टी मॉनिटर",
    "safety.aqi": "वायु गुणवत्ता सूचकांक",
    "safety.temperature": "तापमान",
    "safety.humidity": "आर्द्रता",
    "safety.windSpeed": "हवा की गति",
    "safety.alerts": "सुरक्षा अलर्ट",
    "safety.noAlerts": "कोई सुरक्षा अलर्ट नहीं",
    "safety.workerCount": "साइट पर कार्यकर्ता",
    "safety.incidents": "घटनाएं",
    "safety.training": "प्रशिक्षण आवश्यक",

    // Settings - Extended
    "settings.generalSettings": "सामान्य सेटिंग्स",
    "settings.translationDemo": "अनुवाद डेमो",
    "settings.weatherProviders": "मौसम प्रदाता",
    "settings.userProfile": "उपयोगकर्ता प्रोफ़ाइल",
    "settings.systemPreferences": "सिस्टम प्राथमिकताएं",
    "settings.notificationSettings": "सूचना सेटिंग्स",
    "settings.securitySettings": "सुरक्षा सेटिंग्स",
    "settings.displaySettings": "डिस्प्ले सेटिंग्स",
    "settings.fullName": "पूरा नाम",
    "settings.emailAddress": "ईमेल पता",
    "settings.role": "भूमिका",
    "settings.projectManager": "प्रोजेक्ट मैनेजर",
    "settings.siteEngineer": "साइट इंजीनियर",
    "settings.admin": "एडमिन",
    "settings.viewer": "दर्शक",
    "settings.emailNotifications": "ईमेल सूचनाएं",
    "settings.pushNotifications": "पुश सूचनाएं",
    "settings.weatherAlerts": "मौसम अलर्ट",
    "settings.projectUpdates": "प्रोजेक्ट अपडेट",
    "settings.shipmentAlerts": "शिपमेंट अलर्ट",
    "settings.twoFactorAuth": "दो-कारक प्रमाणीकरण",
    "settings.sessionTimeout": "सत्र समय सीमा",
    "settings.passwordExpiry": "पासवर्ड समाप्ति",
    "settings.lightTheme": "लाइट थीम",
    "settings.darkTheme": "डार्क थीम",
    "settings.sidebarCollapsed": "साइडबार संकुचित",
    "settings.gridLayout": "ग्रिड लेआउट",
    "settings.listLayout": "सूची लेआउट",
    "settings.receiveUpdatesViaEmail": "ईमेल के माध्यम से अपडेट प्राप्त करें",
    "settings.receivePushNotifications": "पुश सूचनाएं प्राप्त करें",
    "settings.getWeatherAlerts": "मौसम अलर्ट प्राप्त करें",
    "settings.getProjectUpdates": "प्रोजेक्ट अपडेट प्राप्त करें",
    "settings.getShipmentAlerts": "शिपमेंट अलर्ट प्राप्त करें",
    "settings.enableTwoFactorAuth": "दो-कारक प्रमाणीकरण सक्षम करें",
    "settings.sessionTimeoutMinutes": "सत्र समय सीमा (मिनट)",
    "settings.passwordExpiryDays": "पासवर्ड समाप्ति (दिन)",
    "settings.selectTheme": "थीम चुनें",
    "settings.collapseSidebar": "साइडबार संकुचित करें",
    "settings.selectLayout": "लेआउट चुनें",

    // Login/Auth
    "auth.login": "लॉगिन",
    "auth.logout": "लॉगआउट",
    "auth.signIn": "साइन इन",
    "auth.signOut": "साइन आउट",
    "auth.signInWithGoogle": "Google के साथ साइन इन करें",
    "auth.welcome": "स्वागत है",
    "auth.welcomeBack": "वापस स्वागत है",
    "auth.pleaseSignIn": "जारी रखने के लिए कृपया साइन इन करें",
    "auth.notAuthenticated":
      "प्रमाणित नहीं। सुविधाओं तक पहुंचने के लिए कृपया लॉग इन करें।",
    "auth.loadingUserInfo": "उपयोगकर्ता जानकारी लोड हो रही है...",

    // Digital Twin
    "digitalTwin.title": "डिजिटल ट्विन",
    "digitalTwin.overview": "अवलोकन",
    "digitalTwin.sensors": "सेंसर",
    "digitalTwin.anomalies": "असामान्यताएं",
    "digitalTwin.predictions": "भविष्यवाणियां",
    "digitalTwin.threeDModel": "3D मॉडल",
    "digitalTwin.totalSensors": "कुल सेंसर",
    "digitalTwin.activeSensors": "सक्रिय सेंसर",
    "digitalTwin.anomaliesDetected": "पता चली असामान्यताएं",
    "digitalTwin.avgConfidence": "औसत आत्मविश्वास",
    "digitalTwin.systemHealth": "सिस्टम स्वास्थ्य",
    "digitalTwin.sensorData": "सेंसर डेटा",
    "digitalTwin.anomalyHistory": "असामान्यता इतिहास",
    "digitalTwin.workflowOptimization": "वर्कफ्लो अनुकूलन",
    "digitalTwin.emissionPriority": "उत्सर्जन प्राथमिकता",
    "digitalTwin.costPriority": "लागत प्राथमिकता",
    "digitalTwin.optimize": "अनुकूलित करें",
    "digitalTwin.optimizing": "अनुकूलित कर रहे हैं...",

    // Time and Date
    "time.today": "आज",
    "time.yesterday": "कल",
    "time.thisWeek": "इस सप्ताह",
    "time.thisMonth": "इस महीने",
    "time.thisYear": "इस साल",
    "time.january": "जनवरी",
    "time.february": "फरवरी",
    "time.march": "मार्च",
    "time.april": "अप्रैल",
    "time.may": "मई",
    "time.june": "जून",
    "time.july": "जुलाई",
    "time.august": "अगस्त",
    "time.september": "सितंबर",
    "time.october": "अक्टूबर",
    "time.november": "नवंबर",
    "time.december": "दिसंबर",

    // Units
    "units.celsius": "°C",
    "units.fahrenheit": "°F",
    "units.percent": "%",
    "units.kmh": "किमी/घंटा",
    "units.mph": "मील/घंटा",
    "units.mm": "मिमी",
    "units.inches": "इंच",
    "units.kg": "किलो",
    "units.lbs": "पाउंड",
    "units.meters": "मी",
    "units.feet": "फीट",
    "units.squareMeters": "वर्ग मी",
    "units.squareFeet": "वर्ग फीट",
    "units.cubicMeters": "घन मी",
    "units.cubicFeet": "घन फीट",
  },
};

// Provider props
interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translationService, setTranslationService] =
    useState<TranslationService | null>(null);

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem("app-language") || "en";
    setCurrentLanguage(savedLanguage);
  }, []);

  // Initialize translation service
  useEffect(() => {
    const initTranslationService = async () => {
      try {
        // Dynamic import to avoid loading translation service if not needed
        const { createTranslationService } = await import(
          "../lib/translation-service"
        );
        const service = await createTranslationService();
        setTranslationService(service);
      } catch (err) {
        console.warn("Translation service not available:", err);
        setError("Translation service unavailable");
      }
    };

    initTranslationService();
  }, []);

  const setLanguage = async (languageCode: string) => {
    if (!SUPPORTED_LANGUAGES.find((lang) => lang.code === languageCode)) {
      throw new Error(`Unsupported language: ${languageCode}`);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Save to localStorage
      localStorage.setItem("app-language", languageCode);
      setCurrentLanguage(languageCode);

      // Save to app settings
      const appSettings = JSON.parse(
        localStorage.getItem("app-settings") || "{}"
      );
      appSettings.language = languageCode;
      localStorage.setItem("app-settings", JSON.stringify(appSettings));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change language"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const translate = (key: string, fallback?: string): string => {
    const translations = STATIC_TRANSLATIONS[currentLanguage];
    if (translations && translations[key]) {
      return translations[key];
    }

    // Fallback to English if not found
    if (currentLanguage !== "en") {
      const englishTranslations = STATIC_TRANSLATIONS.en;
      if (englishTranslations && englishTranslations[key]) {
        return englishTranslations[key];
      }
    }

    return fallback || key;
  };

  const translateDynamic = async (text: string): Promise<string> => {
    if (!translationService || currentLanguage === "en") {
      return text;
    }

    try {
      setIsLoading(true);
      const translated = await translationService.translateText(
        text,
        currentLanguage
      );
      return translated;
    } catch (err) {
      console.error("Dynamic translation failed:", err);
      return text; // Return original text if translation fails
    } finally {
      setIsLoading(false);
    }
  };

  const value: TranslationContextType = {
    currentLanguage,
    setLanguage,
    translate,
    translateDynamic,
    isLoading,
    supportedLanguages: SUPPORTED_LANGUAGES,
    error,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};
