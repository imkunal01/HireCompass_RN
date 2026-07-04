import { Platform } from "react-native";

// ============================================================
// API Configuration
// ============================================================
// Change this to your local network IP when testing on a 
// physical device (find it with `ipconfig` on Windows).
// e.g. "http://192.168.1.5:5000"
// For emulator/simulator, use "http://10.0.2.2:5000" (Android)
// or "http://localhost:5000" (iOS Simulator)
// ============================================================

export const API_BASE_URL = Platform.OS === "android" 
  ? "http://10.0.2.2:5000" 
  : "http://localhost:5000";

export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/api/auth/login",
  SIGNUP: "/api/auth/signup",
  LOGOUT: "/api/auth/logout",
  ME: "/api/auth/me",
  PROFILE: "/api/auth/profile",
  PASSWORD: "/api/auth/password",

  // Dashboard
  DASHBOARD_STATS: "/api/dashboard/stats",
  DASHBOARD_ACTIVITY: "/api/dashboard/activity",

  // Opportunities
  OPPORTUNITIES: "/api/opportunities",

  // Interviews
  INTERVIEWS: "/api/interviews",

  // Reminders
  REMINDERS: "/api/reminders",

  // Documents
  DOCUMENTS: "/api/documents",

  // Analytics
  ANALYTICS: "/api/analytics",

  // AI
  AI_GENERATE_EMAIL: "/api/ai/generate-email",
  AI_MATCH_SCORE: "/api/ai/match-score",
  AI_LEARNING_PLAN: "/api/ai/learning-plan",
  AI_GENERATE_SNIPPET: "/api/ai/generate-snippet",

  // Outreach
  OUTREACH_CAMPAIGNS: "/api/outreach/campaigns",
  OUTREACH_RECORDS: "/api/outreach/records",
  OUTREACH_PROFILE: "/api/outreach/profile",
  OUTREACH_EXTRACT: "/api/outreach/extract",
  OUTREACH_GENERATE_EMAILS: "/api/outreach/generate-emails",
  OUTREACH_SEND: "/api/outreach/send",
  OUTREACH_FOLLOWUP: "/api/outreach/followup",
  OUTREACH_STATS: "/api/outreach/stats",

  // Projects
  PROJECTS: "/api/projects",

  // Form Kit
  FORM_KIT: "/api/form-kit",

  // Import
  IMPORT_TEXT: "/api/import/text",
  IMPORT_URL: "/api/import/url",
};
