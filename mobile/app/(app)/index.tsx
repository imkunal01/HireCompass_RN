import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type } from "@/constants/theme";
import { StatCard, Card, EmptyState, Button } from "@/components/ui";
import { RouteTracker } from "@/components/ui/RouteTracker";
import { Activity, Briefcase, Bell, CheckCircle } from "lucide-react-native";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.DASHBOARD_STATS),
        apiClient.get(API_ENDPOINTS.DASHBOARD_ACTIVITY),
      ]);
      setData({
        stats: statsRes.data,
        recentJobs: activityRes.data,
      });
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

  if (loading && !data) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hey, {user?.name?.split(" ")[0] || "there"}</Text>
          <Text style={styles.subtitle}>Here is your job search overview</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <Button variant="primary" style={{ flex: 1 }} onPress={() => router.push("/(app)/import")}>
            + Add Job
          </Button>
          <Button variant="secondary" style={{ flex: 1 }} onPress={() => router.push("/(app)/ai-tools")}>
            Generate Email
          </Button>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard title="Active Applications" value={data?.stats?.activeJobs || 0} icon={Briefcase} />
          <StatCard title="Upcoming Interviews" value={data?.stats?.upcomingInterviews || 0} icon={CheckCircle} />
        </View>

        {/* Recent Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.sectionLink} onPress={() => router.push("/(app)/opportunities")}>View All</Text>
          </View>
          
          {!data?.recentJobs?.length ? (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Start tracking your applications to see them here."
              actionLabel="Add Application"
              onAction={() => router.push("/(app)/import")}
            />
          ) : (
            data.recentJobs.map((event: any) => (
              <Card key={event.id} variant="elevated" style={styles.jobCard}>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobRole}>{event.title}</Text>
                  <Text style={styles.jobCompany}>{event.role} @ {event.company}</Text>
                </View>
                <Text style={{ ...Type.caption, color: Colors.textMuted }}>
                  {new Date(event.timestamp).toLocaleDateString()}
                </Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100, // Account for floating tab bar
  },
  header: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Type.h1,
    marginBottom: 4,
  },
  subtitle: {
    ...Type.body,
    color: Colors.textMuted,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Type.h2,
  },
  sectionLink: {
    ...Type.caption,
    color: Colors.primaryLight,
  },
  jobCard: {
    marginBottom: Spacing.sm,
  },
  jobInfo: {
    marginBottom: Spacing.md,
  },
  jobRole: {
    ...Type.bodyMed,
    marginBottom: 2,
  },
  jobCompany: {
    ...Type.caption,
  },
});
