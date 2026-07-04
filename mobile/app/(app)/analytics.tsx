import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "@/constants/theme";

const { width } = Dimensions.get("window");

interface AnalyticsData {
  funnel: {
    total: number;
    saved: number;
    applied: number;
    interviewed: number;
    offers: number;
    rejected: number;
  };
  conversion: {
    savedToApplied: number;
    appliedToInterview: number;
    interviewToOffer: number;
    overallYield: number;
  };
  weeklyVelocity: { week: string; count: number }[];
  channels: { channel: string; count: number; pct: number }[];
  suggestions: string[];
}

function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={funnelStyles.row}>
      <Text style={funnelStyles.label}>{label}</Text>
      <View style={funnelStyles.barTrack}>
        <View
          style={[funnelStyles.barFill, { width: `${pct}%`, backgroundColor: color }]}
        />
      </View>
      <Text style={[funnelStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

function ConversionPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={[convStyles.pill, { borderColor: color + "40" }]}>
      <Text style={[convStyles.value, { color }]}>{value}%</Text>
      <Text style={convStyles.label}>{label}</Text>
    </View>
  );
}

function WeeklyChart({ data }: { data: { week: string; count: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const chartWidth = width - Spacing.lg * 2 - Spacing.md * 2;
  const barWidth = chartWidth / data.length - 8;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.bars}>
        {data.map((d) => {
          const h = Math.max((d.count / maxVal) * 80, d.count > 0 ? 4 : 2);
          return (
            <View key={d.week} style={chartStyles.barGroup}>
              <Text style={chartStyles.barValue}>{d.count > 0 ? d.count : ""}</Text>
              <View
                style={[
                  chartStyles.bar,
                  {
                    height: h,
                    width: barWidth,
                    backgroundColor: d.count > 0 ? Colors.primary : Colors.border,
                    opacity: d.count > 0 ? 1 : 0.5,
                  },
                ]}
              />
              <Text style={chartStyles.barLabel}>{d.week}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.ANALYTICS);
      setData(res.data);
    } catch (e) {
      console.error("Analytics load error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Analytics</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : !data ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptySubTitle}>Add some jobs to see analytics</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Application Funnel */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Application Funnel</Text>
            <View style={styles.card}>
              <FunnelBar
                label="Total Saved"
                value={data.funnel.total}
                max={data.funnel.total}
                color={Colors.textSecondary}
              />
              <FunnelBar
                label="Applied"
                value={data.funnel.applied}
                max={data.funnel.total}
                color={Colors.info}
              />
              <FunnelBar
                label="Interviewed"
                value={data.funnel.interviewed}
                max={data.funnel.total}
                color={Colors.success}
              />
              <FunnelBar
                label="Offers"
                value={data.funnel.offers}
                max={data.funnel.total}
                color={Colors.warning}
              />
              <FunnelBar
                label="Rejected"
                value={data.funnel.rejected}
                max={data.funnel.total}
                color={Colors.error}
              />
            </View>
          </View>

          {/* Conversion Rates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conversion Rates</Text>
            <View style={styles.conversionGrid}>
              <ConversionPill
                label="Saved → Applied"
                value={data.conversion.savedToApplied}
                color={Colors.info}
              />
              <ConversionPill
                label="Applied → Interview"
                value={data.conversion.appliedToInterview}
                color={Colors.success}
              />
              <ConversionPill
                label="Interview → Offer"
                value={data.conversion.interviewToOffer}
                color={Colors.warning}
              />
              <ConversionPill
                label="Overall Yield"
                value={data.conversion.overallYield}
                color={Colors.primary}
              />
            </View>
          </View>

          {/* Weekly Velocity */}
          {data.weeklyVelocity.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Application Velocity</Text>
              <View style={styles.card}>
                <WeeklyChart data={data.weeklyVelocity} />
              </View>
            </View>
          )}

          {/* Channel Distribution */}
          {data.channels.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Application Channels</Text>
              <View style={styles.card}>
                {data.channels.map((ch, i) => {
                  const colors = [
                    Colors.primary,
                    Colors.info,
                    Colors.success,
                    Colors.warning,
                    Colors.error,
                  ];
                  const color = colors[i % colors.length];
                  return (
                    <View key={ch.channel} style={channelStyles.row}>
                      <View
                        style={[
                          channelStyles.dot,
                          { backgroundColor: color },
                        ]}
                      />
                      <Text style={channelStyles.label} numberOfLines={1}>
                        {ch.channel}
                      </Text>
                      <View style={channelStyles.barTrack}>
                        <View
                          style={[
                            channelStyles.barFill,
                            {
                              width: `${ch.pct}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={channelStyles.count}>{ch.count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* AI Suggestions */}
          {data.suggestions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 AI Suggestions</Text>
              {data.suggestions.map((s, i) => (
                <View key={i} style={suggStyles.card}>
                  <Text style={suggStyles.bullet}>✦</Text>
                  <Text style={suggStyles.text}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pageHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conversionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  emptySubTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 },
});

const funnelStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    width: 80,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.bgElevated,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
  value: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, width: 28, textAlign: "right" },
});

const convStyles = StyleSheet.create({
  pill: {
    minWidth: "45%",
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
  },
  value: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: "center",
    marginTop: 4,
  },
});

const chartStyles = StyleSheet.create({
  container: { paddingTop: 8 },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 110,
  },
  barGroup: { alignItems: "center", gap: 4 },
  bar: { borderRadius: 4 },
  barValue: { color: Colors.textSecondary, fontSize: 9, height: 14 },
  barLabel: { color: Colors.textMuted, fontSize: 9 },
});

const channelStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  label: { color: Colors.textSecondary, fontSize: FontSize.xs, width: 110 },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  count: { color: Colors.textSecondary, fontSize: FontSize.xs, width: 20, textAlign: "right" },
});

const suggStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  bullet: { color: Colors.primary, fontSize: FontSize.md, marginTop: 1 },
  text: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    flex: 1,
  },
});
