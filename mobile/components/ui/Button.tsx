import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from "react-native";
import { Colors, BorderRadius, Type, Shadows } from "@/constants/theme";

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  style,
  textStyle,
  disabled,
  ...rest
}: ButtonProps) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  const getBgColor = () => {
    if (disabled) return Colors.surfaceHighlight;
    if (isPrimary) return Colors.primary;
    if (isSecondary) return Colors.surfaceHighlight;
    if (isGhost) return "transparent";
    return "transparent";
  };

  const getBorderColor = () => {
    if (disabled) return Colors.border;
    if (isOutline) return Colors.border;
    if (isSecondary) return Colors.border;
    return "transparent";
  };

  const getTextColor = () => {
    if (disabled) return Colors.textFaint;
    if (isPrimary) return Colors.text;
    return Colors.text;
  };

  const height = size === "sm" ? 36 : size === "md" ? 48 : 56;
  const paddingHorizontal = size === "sm" ? 16 : size === "md" ? 24 : 32;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: getBgColor(),
          borderColor: getBorderColor(),
          borderWidth: isOutline || isSecondary ? 1 : 0,
          height,
          paddingHorizontal,
        },
        isPrimary && !disabled && Shadows.glow,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.pill,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  text: {
    ...Type.bodyMed,
  },
});
