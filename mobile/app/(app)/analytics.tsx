import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, StatCard } from "@/components/ui";
import { TrendingUp, BarChart2, Lightbulb } from "lucide-react-native";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.ANALYTICS);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const funnel = data?.funnel || {};
  const conversion = data?.conversion || {};
  const channels = data?.channels || [];
  const suggestions = data?.suggestions || [];
  const weeklyVelocity = data?.weeklyVelocity || [];
  const maxCount = weeklyVelocity.length > 0
    ? Math.max(...weeklyVelocity.map((w: any) => w.count), 1)
    : 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
      >
        {/* Summary StatCards */}
        <View style={styles.statsRow}>
          <StatCard title="Total Tracked" value={funnel.total || 0} icon={TrendingUp} />
          <StatCard title="Response Rate" value={`${conversion.appliedToInterview || 0}%`} icon={BarChart2} />
        </View>

        {/* Funnel Breakdown */}
        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Application Funnel</Text>
          <View style={styles.funnelBox}>
            {[
              { label: "Saved / Interested", value: funnel.saved || 0, color: Colors.textMuted },
              { label: "Applied",            value: funnel.applied || 0, color: Colors.primaryLight },
              { label: "Interviews",         value: funnel.interviewed || 0, color: Colors.primary },
              { label: "Offers",             value: funnel.offers || 0, color: "#16a34a" },
              { label: "Rejected",           value: funnel.rejected || 0, color: Colors.error },
            ].map((row, idx, arr) => (
              <View
                key={row.label}
                style={[styles.funnelRow, idx === arr.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color }} />
                  <Text style={styles.funnelLabel}>{row.label}</Text>
                </View>
                <Text style={[styles.funnelValue, { color: row.color }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Conversion Rates */}
        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Conversion Rates</Text>
          {[
            { label: "Saved → Applied",    value: `${conversion.savedToApplied || 0}%` },
            { label: "Applied → Interview", value: `${conversion.appliedToInterview || 0}%` },
            { label: "Interview → Offer",   value: `${conversion.interviewToOffer || 0}%` },
            { label: "Overall Yield",       value: `${conversion.overallYield || 0}%` },
          ].map((row, idx, arr) => (
            <View
              key={row.label}
              style={[styles.funnelRow, idx === arr.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}
            >
              <Text style={styles.funnelLabel}>{row.label}</Text>
              <Text style={styles.funnelValue}>{row.value}</Text>
            </View>
          ))}
        </Card>

        {/* Weekly Velocity – native bar chart using View heights */}
        {weeklyVelocity.length > 0 && (
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Application Velocity</Text>
            <View style={styles.velocityRow}>
              {weeklyVelocity.map((w: any) => (
                <View key={w.week} style={styles.velocityCol}>
                  <View
                    style={[
                      styles.velocityBar,
                      { height: Math.max(4, Math.round((w.count / maxCount) * 60)) },
                    ]}
                  />
                  <Text style={styles.velocityLabel}>{w.week}</Text>
                  <Text style={styles.velocityValue}>{w.count}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Source Channels */}
        {channels.length > 0 && (
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Application Sources</Text>
            {channels.map((ch: any, idx: number, arr: any[]) => (
              <View
                key={ch.channel}
                style={[styles.funnelRow, idx === arr.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}
              >
                <Text style={styles.funnelLabel}>{ch.channel}</Text>
                <Text style={styles.funnelValue}>{ch.count} ({ch.pct}%)</Text>
              </View>
            ))}
          </Card>
        )}

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <Card variant="elevated" style={[styles.section, { borderLeftWidth: 4, borderLeftColor: Colors.primary }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: Spacing.md }}>
              <Lightbulb size={18} color={Colors.primaryLight} />
              <Text style={styles.sectionTitle}>AI Suggestions</Text>
            </View>
            {suggestions.map((s: string, idx: number) => (
              <Text key={idx} style={styles.suggestionText}>• {s}</Text>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: { ...Type.h1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },
  statsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Type.h2, marginBottom: Spacing.md },
  funnelBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  funnelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  funnelLabel: { ...Type.body, color: Colors.textMuted },
  funnelValue: { ...Type.h2 },
  velocityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 90,
    paddingBottom: 24,
  },
  velocityCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  velocityBar: {
    width: "60%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginBottom: 4,
  },
  velocityLabel: { ...Type.micro, color: Colors.textMuted, textAlign: "center" },
  velocityValue: { ...Type.micro, color: Colors.primaryLight, fontWeight: "700", marginTop: 2 },
  suggestionText: {
    ...Type.body,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
});
