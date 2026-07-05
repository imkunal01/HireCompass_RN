import type { TextStyle, ViewStyle } from "react-native";

// Design System — HireCompass Mobile V2 (Light Theme)
// "Bright & Modern" — Clean Light Mode with Vibrant Accents, Sans-Serif only.

export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background: "#F8F9FA",    // Soft light background
  surface: "#FFFFFF",       // Elevated card/surface (Pure White)
  surfaceHighlight: "#F1F5F9", // Slightly darker for hover/borders

  // ── Primary Accent — Violet/Indigo ─────────────────────────────────────
  primary: "#6B46FF",       // Vibrant Violet/Indigo for main brand elements
  primaryMuted: "#6B46FF15",// Low opacity for pills/backgrounds
  primaryLight: "#8B5CF6",  // Lighter variation

  // ── Typography ───────────────────────────────────────────────────────────
  text: "#1E293B",          // Slate 800 for primary text
  textMuted: "#64748B",     // Slate 500 for secondary text
  textFaint: "#94A3B8",     // Slate 400 for micro text

  // ── Structure & Status ───────────────────────────────────────────────────
  border: "#E2E8F0",        // Slate 200 borders
  success: "#10B981",       // Emerald-500
  warning: "#F59E0B",       // Amber-500
  error: "#EF4444",         // Red-500
  
  // Custom Accents for Dashboard
  accentBlue: "#3B82F6",
  accentOrange: "#F59E0B",
  accentGreen: "#10B981",
  accentPurple: "#8B5CF6",
  
  // Legacy Aliases (temporarily mapped so screens don't crash while we migrate)
  ink: "#1E293B",
  inkRaised: "#334155",
  inkOverlay: "#475569",
  brass: "#6B46FF",
  parchment: "#FFFFFF",
  parchmentDim: "#F8F9FA",
  parchmentFaint: "#F1F5F9",
  hairline: "#E2E8F0",
  alarm: "#EF4444",
  caution: "#F59E0B",
  signal: "#10B981",
  bg: "#F8F9FA",
  bgCard: "#FFFFFF",
  bgElevated: "#F1F5F9",
  bgInput: "#F1F5F9",
  textSecondary: "#64748B",
  borderLight: "#E2E8F0",
  primaryMutedLegacy: "#6B46FF15",
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
  md: 14,
  lg: 20,
  pill: 999,
  // Legacy aliases
  full: 999,
};

// ── Typography scale (Inter only) ──────────────────────────────────────────
export const Type: Record<string, TextStyle> = {
  display: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
    color: Colors.text,
  },
  h1: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: Colors.text,
  },
  h2: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    lineHeight: 24,
    color: Colors.text,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
  },
  bodyMed: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
  },
  caption: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
  },
  micro: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: Colors.textMuted,
  },
  stat: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    lineHeight: 32,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
    color: Colors.text,
  },
};

// Legacy font tokens
export const FontSize = {
  xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, xxxl: 30, display: 34,
};
export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

// ── Shadows (Smooth, diffused modern SaaS shadows for light mode) ─────────────────────────
export const Shadows = {
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  pill: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  }
};
