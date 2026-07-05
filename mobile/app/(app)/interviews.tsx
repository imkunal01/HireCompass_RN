import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, EmptyState, Button } from "@/components/ui";
import { CalendarDays, Clock, Video } from "lucide-react-native";

export default function InterviewsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInterviews = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.INTERVIEWS);
      setInterviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  // Group interviews by Upcoming and Past
  const now = new Date();
  const upcoming = interviews.filter((i) => new Date(i.date) >= now);
  const past = interviews.filter((i) => new Date(i.date) < now);

  const sections = [];
  if (upcoming.length > 0) sections.push({ title: "Upcoming", data: upcoming });
  if (past.length > 0) sections.push({ title: "Past", data: past });

  const renderInterview = ({ item }: { item: any }) => {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const timeStr = item.time || date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/(app)/jobs/${item.opportunityId}`)}>
        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.jobInfo}>
              <Text style={styles.jobRole}>{item.role}</Text>
              <Text style={styles.jobCompany}>{item.company}</Text>
            </View>
            <View style={styles.dateBox}>
              <Text style={styles.dateMonth}>{date.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</Text>
              <Text style={styles.dateDay}>{date.getDate()}</Text>
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.infoPill}>
              <Clock size={12} color={Colors.textMuted} />
              <Text style={styles.infoPillText}>{timeStr} ({item.duration || 60}m)</Text>
            </View>
            <View style={styles.infoPill}>
              <Video size={12} color={Colors.textMuted} />
              <Text style={styles.infoPillText}>{item.type}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Interviews</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadInterviews(); }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={CalendarDays}
              title="No interviews scheduled"
              description="Keep applying, you'll land one soon."
              actionLabel="Add Interview"
              onAction={() => router.push("/(app)/import")}
            />
          }
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={renderInterview}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120, // Tab bar padding
  },
  sectionHeader: {
    ...Type.h2,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    color: Colors.text,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  jobInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  jobRole: {
    ...Type.h2,
    marginBottom: 4,
  },
  jobCompany: {
    ...Type.bodyMed,
    color: Colors.textMuted,
  },
  dateBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
  },
  dateMonth: {
    ...Type.micro,
    color: Colors.primaryLight,
  },
  dateDay: {
    ...Type.h2,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  infoPillText: {
    ...Type.caption,
  },
});
