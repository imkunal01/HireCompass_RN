import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Type } from "@/constants/theme";
import { LucideIcon } from "lucide-react-native";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {Icon && (
        <View style={styles.iconBox}>
          <Icon size={32} color={Colors.primary} strokeWidth={1.5} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          variant="secondary"
          size="sm"
          onPress={onAction}
          style={{ marginTop: 16 }}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    ...Type.h2,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    ...Type.body,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
