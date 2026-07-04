import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, BorderRadius, Type } from "@/constants/theme";
import { LucideIcon } from "lucide-react-native";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  style?: ViewStyle;
}

export function StatCard({ title, value, icon: Icon, style }: StatCardProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {Icon && <Icon size={16} color={Colors.primary} strokeWidth={2.5} />}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 140,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    ...Type.caption,
    color: Colors.textMuted,
  },
  value: {
    ...Type.stat,
    fontSize: 24,
    lineHeight: 28,
  },
});
