import { Platform } from "react-native";

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
  DASHBOARD: "/api/dashboard", // we might need to change index.tsx instead of using this
  DASHBOARD_STATS: "/api/dashboard/stats",
  DASHBOARD_ACTIVITY: "/api/dashboard/activity",

  // Opportunities / Jobs
  JOBS: "/api/opportunities", // In opportunities.tsx we used API_ENDPOINTS.JOBS

  // Interviews
  INTERVIEWS: "/api/interviews",

  // Reminders
  REMINDERS: "/api/reminders",

  // Documents
  DOCUMENTS: "/api/documents",

  // Analytics
  ANALYTICS: "/api/analytics",

  // Outreach / Network
  OUTREACH: "/api/outreach", // Used in outreach.tsx

  // Projects
  PROJECTS: "/api/projects", // Used in projects.tsx

  // AI
  AI_GENERATE: "/api/ai/generate", // Used in ai-tools.tsx
  AI_GENERATE_EMAIL: "/api/ai/generate-email",
  AI_MATCH_SCORE: "/api/ai/match-score",
  AI_LEARNING_PLAN: "/api/ai/learning-plan",
  AI_GENERATE_SNIPPET: "/api/ai/generate-snippet",

  // Import
  JOBS_IMPORT: "/api/import", // Used in import.tsx
};

export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};
