import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, StatCard, EmptyState } from "@/components/ui";
import { TrendingUp, BarChart2 } from "lucide-react-native";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.ANALYTICS);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Summary Stats */}
          <View style={styles.statsRow}>
            <StatCard title="Total Applications" value={data?.summary?.total || 0} icon={TrendingUp} />
            <StatCard title="Response Rate" value={`${data?.summary?.responseRate || 0}%`} icon={BarChart2} />
          </View>

          {/* Funnel */}
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Application Funnel</Text>
            <View style={styles.funnelBox}>
              <View style={styles.funnelRow}>
                <Text style={styles.funnelLabel}>Applied</Text>
                <Text style={styles.funnelValue}>{data?.funnel?.applied || 0}</Text>
              </View>
              <View style={styles.funnelRow}>
                <Text style={styles.funnelLabel}>Screening</Text>
                <Text style={styles.funnelValue}>{data?.funnel?.screening || 0}</Text>
              </View>
              <View style={styles.funnelRow}>
                <Text style={styles.funnelLabel}>Interview</Text>
                <Text style={styles.funnelValue}>{data?.funnel?.interview || 0}</Text>
              </View>
              <View style={[styles.funnelRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.funnelLabel}>Offers</Text>
                <Text style={[styles.funnelValue, { color: Colors.success }]}>{data?.funnel?.offer || 0}</Text>
              </View>
            </View>
          </Card>

          {/* Rejection Reasons */}
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback Insights</Text>
            {!data?.rejections?.length ? (
              <EmptyState
                icon={BarChart2}
                title="No feedback data"
                description="Not enough rejections logged to show insights."
                style={{ padding: 16 }}
              />
            ) : (
              data.rejections.map((item: any, idx: number) => (
                <View key={item.reason || idx} style={styles.reasonRow}>
                  <Text style={styles.reasonText}>{item.reason}</Text>
                  <Text style={styles.reasonCount}>{item.count}</Text>
                </View>
              ))
            )}
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Type.h1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120, // Tab bar padding
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Type.h2,
    marginBottom: Spacing.md,
  },
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
  funnelLabel: {
    ...Type.bodyMed,
    color: Colors.textMuted,
  },
  funnelValue: {
    ...Type.h2,
  },
  reasonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reasonText: {
    ...Type.body,
  },
  reasonCount: {
    ...Type.bodyMed,
    color: Colors.textMuted,
  },
});
