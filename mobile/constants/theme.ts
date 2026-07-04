import type { TextStyle, ViewStyle } from "react-native";

// Design System — HireCompass Mobile V2
// "Glass & Indigo" — Pure Dark Mode, Electric Indigo Accent, Sans-Serif only.

export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background: "#050505",    // Pure dark background
  surface: "#121212",       // Elevated card/surface
  surfaceHighlight: "#1C1C1C", // Slightly higher elevation (borders/hover states)

  // ── Primary Accent — Electric Indigo ─────────────────────────────────────
  primary: "#4F46E5",       // Core vibrant accent (Electric Indigo)
  primaryMuted: "#4F46E520",// 12% opacity for pills/active backgrounds
  primaryLight: "#818CF8",  // Lighter for dark mode visibility

  // ── Typography ───────────────────────────────────────────────────────────
  text: "#FFFFFF",          // Primary stark white text
  textMuted: "#A1A1AA",     // Zinc-400 for secondary text
  textFaint: "#71717A",     // Zinc-500 for micro text

  // ── Structure & Status ───────────────────────────────────────────────────
  border: "#27272A",        // Zinc-800 borders
  success: "#10B981",       // Emerald-500
  warning: "#F59E0B",       // Amber-500
  error: "#EF4444",         // Red-500
  
  // Legacy Aliases (temporarily mapped so screens don't crash while we migrate)
  ink: "#050505",
  inkRaised: "#121212",
  inkOverlay: "#1C1C1C",
  brass: "#4F46E5",
  parchment: "#FFFFFF",
  parchmentDim: "#A1A1AA",
  parchmentFaint: "#71717A",
  hairline: "#27272A",
  alarm: "#EF4444",
  caution: "#F59E0B",
  signal: "#10B981",
  bg: "#050505",
  bgCard: "#121212",
  bgElevated: "#1C1C1C",
  bgInput: "#1C1C1C",
  textSecondary: "#A1A1AA",
  borderLight: "#27272A",
  primaryMutedLegacy: "#4F46E520",
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

// ── Shadows (Smooth, diffused modern SaaS shadows) ─────────────────────────
export const Shadows = {
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pill: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  }
};
