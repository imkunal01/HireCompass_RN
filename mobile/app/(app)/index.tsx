import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/store/authStore";
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from "@/constants/theme";

interface Stats {
  totalSaved: number;
  applicationsSent: number;
  interviewsScheduled: number;
  responseRate: number;
  followUpsDue: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  company: string;
  role: string;
}

const TYPE_EMOJI: Record<string, string> = {
  JOB_ADDED: "➕",
  STATUS_CHANGED: "🔄",
  EMAIL_SENT: "📧",
  INTERVIEW_SCHEDULED: "🗓️",
  NOTE_ADDED: "📝",
};

function StatCard({ label, value, emoji, color }: { label: string; value: string | number; emoji: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "30" }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.DASHBOARD_STATS),
        apiClient.get(API_ENDPOINTS.DASHBOARD_ACTIVITY),
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data);
    } catch (e) {
      console.error("Dashboard load error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()}, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Here's your job search overview</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push("/(app)/more")}
          >
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                label="Total Saved"
                value={stats?.totalSaved ?? 0}
                emoji="💼"
                color={Colors.primary}
              />
              <StatCard
                label="Applied"
                value={stats?.applicationsSent ?? 0}
                emoji="📤"
                color={Colors.info}
              />
              <StatCard
                label="Interviews"
                value={stats?.interviewsScheduled ?? 0}
                emoji="🗓️"
                color={Colors.success}
              />
              <StatCard
                label="Response %"
                value={`${stats?.responseRate ?? 0}%`}
                emoji="📈"
                color={Colors.warning}
              />
            </View>

            {/* Follow-up alert */}
            {(stats?.followUpsDue ?? 0) > 0 && (
              <TouchableOpacity
                style={styles.alertBanner}
                onPress={() => router.push("/(app)/opportunities")}
                activeOpacity={0.85}
              >
                <Text style={styles.alertEmoji}>⚠️</Text>
                <View style={styles.alertTextCol}>
                  <Text style={styles.alertTitle}>
                    {stats!.followUpsDue} follow-up{stats!.followUpsDue > 1 ? "s" : ""} due
                  </Text>
                  <Text style={styles.alertSub}>
                    Applied jobs with no update in 7+ days
                  </Text>
                </View>
                <Text style={styles.alertArrow}>›</Text>
              </TouchableOpacity>
            )}

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => router.push("/(app)/opportunities")}
                activeOpacity={0.8}
              >
                <Text style={styles.quickBtnEmoji}>➕</Text>
                <Text style={styles.quickBtnLabel}>Add Job</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => router.push("/(app)/interviews")}
                activeOpacity={0.8}
              >
                <Text style={styles.quickBtnEmoji}>📅</Text>
                <Text style={styles.quickBtnLabel}>Schedule Interview</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => router.push("/(app)/more")}
                activeOpacity={0.8}
              >
                <Text style={styles.quickBtnEmoji}>🔔</Text>
                <Text style={styles.quickBtnLabel}>Reminders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => router.push("/(app)/analytics")}
                activeOpacity={0.8}
              >
                <Text style={styles.quickBtnEmoji}>📊</Text>
                <Text style={styles.quickBtnLabel}>Analytics</Text>
              </TouchableOpacity>
            </View>

            {/* Activity Feed */}
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {activity.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Text style={styles.emptyEmoji}>🗂️</Text>
                <Text style={styles.emptyText}>No activity yet</Text>
                <Text style={styles.emptySubText}>
                  Add your first job to get started
                </Text>
              </View>
            ) : (
              <View style={styles.activityList}>
                {activity.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.activityItem,
                      idx === activity.length - 1 && styles.activityItemLast,
                    ]}
                  >
                    <View style={styles.activityIcon}>
                      <Text style={styles.activityEmoji}>
                        {TYPE_EMOJI[item.type] ?? "📌"}
                      </Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        {item.description}
                      </Text>
                      <Text style={styles.activityMeta}>
                        {item.company} · {timeAgo(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subGreeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 2,
    borderColor: Colors.primary + "50",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    ...Shadow.sm,
  },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // Alert
  alertBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.warningMuted,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  alertEmoji: { fontSize: 20 },
  alertTextCol: { flex: 1 },
  alertTitle: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  alertSub: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  alertArrow: { color: Colors.warning, fontSize: 20 },

  // Section title
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },

  // Quick actions
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  quickBtnEmoji: { fontSize: 20 },
  quickBtnLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
    fontWeight: FontWeight.medium,
  },

  // Activity
  activityList: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  activityItemLast: { borderBottomWidth: 0 },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  activityEmoji: { fontSize: 16 },
  activityContent: { flex: 1 },
  activityTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  activityMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },

  // Empty & Loading
  emptyActivity: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyEmoji: { fontSize: 36, marginBottom: Spacing.sm },
  emptyText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  emptySubText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 4,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
});
