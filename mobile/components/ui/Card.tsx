import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors, BorderRadius } from "@/constants/theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: "default" | "elevated" | "outline";
}

export function Card({ children, style, variant = "default" }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === "default" && styles.default,
        variant === "elevated" && styles.elevated,
        variant === "outline" && styles.outline,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    padding: 16,
    overflow: "hidden",
  },
  default: {
    backgroundColor: Colors.surface,
  },
  elevated: {
    backgroundColor: Colors.surfaceHighlight,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
