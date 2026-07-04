// Design System — HireCompass Mobile
// Deep navy dark theme with indigo primary accent

export const Colors = {
  // Backgrounds
  bg: "#0A0E1A",
  bgCard: "#111827",
  bgElevated: "#1A2035",
  bgInput: "#1E2740",
  bgModal: "#141C2E",

  // Primary — Electric Indigo
  primary: "#6366F1",
  primaryLight: "#818CF8",
  primaryDark: "#4F46E5",
  primaryMuted: "#6366F120",

  // Semantic Colors
  success: "#10B981",
  successMuted: "#10B98120",
  warning: "#F59E0B",
  warningMuted: "#F59E0B20",
  error: "#EF4444",
  errorMuted: "#EF444420",
  info: "#3B82F6",
  infoMuted: "#3B82F620",

  // Text
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
  textDisabled: "#334155",

  // Border
  border: "#1E2740",
  borderLight: "#2D3A55",

  // Status Colors
  status: {
    SAVED: { bg: "#1E2740", text: "#94A3B8", dot: "#64748B" },
    WISHLIST: { bg: "#1E2740", text: "#94A3B8", dot: "#64748B" },
    APPLIED: { bg: "#1E40AF20", text: "#60A5FA", dot: "#3B82F6" },
    ASSESSMENT: { bg: "#7C3AED20", text: "#A78BFA", dot: "#8B5CF6" },
    INTERVIEW: { bg: "#065F4620", text: "#34D399", dot: "#10B981" },
    INTERVIEWING: { bg: "#065F4620", text: "#34D399", dot: "#10B981" },
    OFFER: { bg: "#D97706120", text: "#FCD34D", dot: "#F59E0B" },
    REJECTED: { bg: "#7F1D1D20", text: "#FCA5A5", dot: "#EF4444" },
    WITHDRAWN: { bg: "#1E2740", text: "#94A3B8", dot: "#64748B" },
  },

  // Priority Colors
  priority: {
    LOW: { text: "#34D399", bg: "#065F4620" },
    MEDIUM: { text: "#FCD34D", bg: "#D9770620" },
    HIGH: { text: "#FCA5A5", bg: "#7F1D1D20" },
    URGENT: { text: "#F87171", bg: "#991B1B30" },
  },

  // Tab bar
  tabActive: "#6366F1",
  tabInactive: "#475569",
  tabBg: "#0D1220",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};
