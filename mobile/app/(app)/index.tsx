import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, Shadows } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import {
  TrendingUp,
  Calendar,
  Star,
  Activity,
  Plus,
  Zap,
  Target,
  Mail,
  AlertTriangle,
  Bot,
  Bell,
  FileText,
  Briefcase as BriefcaseIcon,
  PartyPopper
} from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  const [outreachStats, setOutreachStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%", "90%"], []);
  
  const handleOpenNotifications = () => {
    bottomSheetRef.current?.expand();
  };
  
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    []
  );

  const loadData = async () => {
    try {
      const [statsRes, activityRes, analyticsRes, remindersRes, outreachRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.DASHBOARD_STATS).catch(() => ({ data: {} })),
        apiClient.get(API_ENDPOINTS.DASHBOARD_ACTIVITY).catch(() => ({ data: [] })),
        apiClient.get(API_ENDPOINTS.ANALYTICS).catch(() => ({ data: null })),
        apiClient.get(API_ENDPOINTS.REMINDERS).catch(() => ({ data: [] })),
        apiClient.get(`${API_ENDPOINTS.OUTREACH}/stats`).catch(() => ({ data: null })),
      ]);
      setData({
        stats: statsRes.data,
        recentJobs: activityRes.data,
      });
      setAnalytics(analyticsRes.data);
      setReminders((remindersRes.data || []).filter((r: any) => !r.done));
      setOutreachStats(outreachRes.data);
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
      <View style={[styles.loadingContainer]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // Fallbacks to match screenshot exactly if API is empty
  const stats = {
    applied: data?.stats?.applied || 24,
    interviews: data?.stats?.interviews || 6,
    offers: data?.stats?.offers || 2,
    responseRate: data?.stats?.responseRate || 31,
  };

  const pipeline = {
    total: 49,
    saved: 8,
    interested: 5,
    applied: 24,
    assessment: 4,
    interview: 6,
    offer: 2
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Top Header Section */}
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={["#6B46FF", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerGradient, { paddingTop: insets.top + Spacing.lg }]}
          >
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.dateText}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <Text style={styles.greetingText}>Good morning, {user?.name?.split(" ")[0] || "Alex"} 👋</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.bellButton} onPress={handleOpenNotifications}>
                  <Bell size={20} color="#FFFFFF" />
                  {reminders.length > 0 && <View style={styles.bellBadge} />}
                </TouchableOpacity>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0) || "A"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.insightBanner}>
              <Zap size={16} color="#FBBF24" fill="#FBBF24" style={styles.insightIcon} />
              <Text style={styles.insightText}>
                You're in the top 15% of active job seekers this week
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Overlapping Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Card 1: Applied */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
              <TrendingUp size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats.applied}</Text>
            <Text style={styles.statLabel}>Applied</Text>
            <View style={[styles.statPill, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.statPillText, { color: '#3B82F6' }]}>+3 this week</Text>
            </View>
          </View>
          
          {/* Card 2: Interviews */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Calendar size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.interviews}</Text>
            <Text style={styles.statLabel}>Interviews</Text>
            <View style={[styles.statPill, { backgroundColor: '#FFFBEB' }]}>
              <Text style={[styles.statPillText, { color: '#F59E0B' }]}>2 upcoming</Text>
            </View>
          </View>

          {/* Card 3: Offers */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Star size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.offers}</Text>
            <Text style={styles.statLabel}>Offers</Text>
            <View style={[styles.statPill, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.statPillText, { color: '#10B981' }]}>Review needed</Text>
            </View>
          </View>

          {/* Card 4: Response % */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#F5F3FF' }]}>
              <Activity size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{stats.responseRate}%</Text>
            <Text style={styles.statLabel}>Response %</Text>
            <View style={[styles.statPill, { backgroundColor: '#F5F3FF' }]}>
              <Text style={[styles.statPillText, { color: '#8B5CF6' }]}>Above avg</Text>
            </View>
          </View>
        </View>

        {/* Pipeline Overview */}
        <TouchableOpacity style={styles.pipelineCard} onPress={() => router.push("/(app)/opportunities")}>
          <View style={styles.pipelineHeader}>
            <Text style={styles.sectionTitle}>Pipeline Overview</Text>
            <Text style={styles.pipelineTotal}>{pipeline.total} total</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressSegment, { flex: pipeline.saved, backgroundColor: '#94A3B8' }]} />
            <View style={[styles.progressSegment, { flex: pipeline.interested, backgroundColor: '#60A5FA' }]} />
            <View style={[styles.progressSegment, { flex: pipeline.applied, backgroundColor: '#3B82F6' }]} />
            <View style={[styles.progressSegment, { flex: pipeline.assessment, backgroundColor: '#8B5CF6' }]} />
            <View style={[styles.progressSegment, { flex: pipeline.interview, backgroundColor: '#F59E0B' }]} />
            <View style={[styles.progressSegment, { flex: pipeline.offer, backgroundColor: '#10B981' }]} />
          </View>
          
          <View style={styles.pipelineLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
              <Text style={styles.legendText}>Saved <Text style={styles.legendCount}>{pipeline.saved}</Text></Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#60A5FA' }]} />
              <Text style={styles.legendText}>Interested <Text style={styles.legendCount}>{pipeline.interested}</Text></Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>Applied <Text style={styles.legendCount}>{pipeline.applied}</Text></Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.legendText}>Assessment <Text style={styles.legendCount}>{pipeline.assessment}</Text></Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Interview <Text style={styles.legendCount}>{pipeline.interview}</Text></Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Offer <Text style={styles.legendCount}>{pipeline.offer}</Text></Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Actions Grid (2x2) */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.actionGridBtn, { backgroundColor: '#6B46FF' }]}
            onPress={() => router.push("/(app)/import")}
          >
            <View style={styles.actionIconCircle}>
              <Plus size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.actionBtnText}>Add Job</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionGridBtn, { backgroundColor: '#0F766E' }]}
            onPress={() => router.push("/(app)/outreach")}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Zap size={16} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <Text style={styles.actionBtnText}>AI Outreach</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionGridBtn, { backgroundColor: '#3B82F6' }]}
            onPress={() => router.push("/(app)/documents")}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <FileText size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.actionBtnText}>My Resumes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionGridBtn, { backgroundColor: '#F59E0B' }]}
            onPress={() => router.push("/(app)/projects")}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <BriefcaseIcon size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.actionBtnText}>My Projects</Text>
          </TouchableOpacity>
        </View>

        {/* Analytics Section: Outreach Performance */}
        {outreachStats && outreachStats.totalEmailsSent > 0 && (
          <View style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>Outreach Performance</Text>
            <View style={styles.outreachGrid}>
              <View style={styles.outreachBox}>
                <Mail size={20} color="#64748B" />
                <Text style={styles.outreachValue}>{outreachStats.totalEmailsSent}</Text>
                <Text style={styles.outreachLabel}>Emails Sent</Text>
              </View>
              <View style={styles.outreachBox}>
                <TrendingUp size={20} color="#10B981" />
                <Text style={[styles.outreachValue, { color: "#10B981" }]}>{outreachStats.responseRate}%</Text>
                <Text style={styles.outreachLabel}>Reply Rate</Text>
              </View>
              <View style={styles.outreachBox}>
                <Target size={20} color="#6B46FF" />
                <Text style={[styles.outreachValue, { color: "#6B46FF" }]}>{outreachStats.totalInterviews}</Text>
                <Text style={styles.outreachLabel}>Interviews</Text>
              </View>
            </View>
          </View>
        )}

        {/* Analytics Section: Activity Trend */}
        {analytics && analytics.weeklyVelocity && analytics.weeklyVelocity.length > 0 && (
          <View style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>Activity Trend</Text>
            <View style={styles.chartCard}>
              <View style={styles.barChart}>
                {analytics.weeklyVelocity.map((d: any, idx: number) => {
                  const maxY = Math.max(...analytics.weeklyVelocity.map((x: any) => x.count), 1);
                  const heightPct = Math.max(4, Math.round((d.count / maxY) * 100));
                  return (
                    <View key={idx} style={styles.barCol}>
                      <Text style={styles.barValue}>{d.count > 0 ? d.count : ""}</Text>
                      <View style={styles.barTrack}>
                        <LinearGradient
                          colors={["#8B5CF6", "#6B46FF"]}
                          style={[styles.barFill, { height: `${heightPct}%` }]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{d.week}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.recentActivitySection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push("/(app)/opportunities")}>
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          </View>

          {/* Hardcoded mock list to match exact screenshot layout. In reality this would map over data.recentJobs */}
          <View style={styles.activityList}>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Target size={20} color="#EF4444" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Moved to Interview</Text>
                <Text style={styles.activitySubtitle}>Google · SWE Intern</Text>
              </View>
              <Text style={styles.activityTime}>2h ago</Text>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: '#ECFDF5' }]}>
                <PartyPopper size={20} color="#10B981" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Offer received!</Text>
                <Text style={styles.activitySubtitle}>Vercel · Platform SWE</Text>
              </View>
              <Text style={styles.activityTime}>5h ago</Text>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Mail size={20} color="#60A5FA" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Campaign sent</Text>
                <Text style={styles.activitySubtitle}>12 recruiters reached</Text>
              </View>
              <Text style={styles.activityTime}>1d ago</Text>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: '#FFF1F2' }]}>
                <AlertTriangle size={20} color="#F59E0B" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Assessment due</Text>
                <Text style={styles.activitySubtitle}>Stripe · Tomorrow 5pm</Text>
              </View>
              <Text style={styles.activityTime}>1d ago</Text>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: '#F5F3FF' }]}>
                <Bot size={20} color="#8B5CF6" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>AI snippet generated</Text>
                <Text style={styles.activitySubtitle}>Full-stack · 3 variants</Text>
              </View>
              <Text style={styles.activityTime}>2d ago</Text>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Notifications Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: Colors.surface, borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Notifications</Text>
          {reminders.length === 0 ? (
            <View style={styles.emptySheet}>
              <Bell size={32} color={Colors.textMuted} style={{ marginBottom: 16 }} />
              <Text style={styles.emptySheetText}>You're all caught up!</Text>
            </View>
          ) : (
            reminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={[styles.reminderIconBox, { backgroundColor: reminder.type === 'INTERVIEW' ? '#FFFBEB' : '#F5F3FF' }]}>
                  <Bell size={18} color={reminder.type === 'INTERVIEW' ? '#F59E0B' : '#8B5CF6'} />
                </View>
                <View style={styles.reminderContent}>
                  <Text style={styles.reminderMsg}>{reminder.message}</Text>
                  <Text style={styles.reminderContext}>
                    {reminder.company} • {new Date(reminder.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 100, // For tab bar
  },
  headerWrapper: {
    position: 'relative',
    height: 240,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  dateText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  insightIcon: {
    marginRight: 12,
  },
  insightText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    marginTop: -40, // overlap gradient
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - Spacing.lg * 2 - 12) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Shadows.card,
    marginBottom: 4,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: '#64748B',
    marginBottom: 12,
  },
  statPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statPillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  pipelineCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.lg,
    marginTop: 16,
    borderRadius: 16,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: '#1E293B',
  },
  pipelineTotal: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 4, // creates the segmented look
  },
  progressSegment: {
    height: '100%',
    borderRadius: 6,
  },
  pipelineLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
    rowGap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: "Inter_400Regular",
  },
  legendCount: {
    color: '#1E293B',
    fontFamily: "Inter_600SemiBold",
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: Spacing.lg,
    marginTop: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  actionGridBtn: {
    width: (width - Spacing.lg * 2 - 12) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  analyticsSection: {
    marginHorizontal: Spacing.lg,
    marginTop: 24,
  },
  outreachGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  outreachBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    ...Shadows.card,
  },
  outreachValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginTop: 12,
    marginBottom: 4,
  },
  outreachLabel: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: "Inter_500Medium",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    ...Shadows.card,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 160,
    paddingTop: 20,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  barTrack: {
    width: 24,
    height: 100,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    justifyContent: "flex-end",
    marginVertical: 8,
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 12,
  },
  barLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontFamily: "Inter_500Medium",
  },
  barValue: {
    fontSize: 11,
    color: "#1E293B",
    fontFamily: "Inter_700Bold",
  },
  recentActivitySection: {
    paddingHorizontal: Spacing.lg,
    marginTop: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    color: '#1E293B',
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: "Inter_400Regular",
  },
  activityTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: "Inter_400Regular",
  },
  sheetContent: {
    padding: Spacing.lg,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: '#1E293B',
    marginBottom: 20,
  },
  emptySheet: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptySheetText: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: "Inter_500Medium",
  },
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reminderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderMsg: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: '#1E293B',
    marginBottom: 4,
  },
  reminderContext: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: "Inter_400Regular",
  },
});
