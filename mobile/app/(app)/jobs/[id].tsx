import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { ArrowLeft, Building2, MapPin, DollarSign, Calendar, ExternalLink, Clock } from "lucide-react-native";
import { Card, Button } from "@/components/ui";
import { RouteTracker } from "@/components/ui/RouteTracker";

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await apiClient.get(`${API_ENDPOINTS.JOBS}/${id}`);
        setJob(res.data);
      } catch (error) {
        console.error("Failed to load job details:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Job not found.</Text>
        <Button variant="outline" onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Info Card */}
        <Card variant="elevated" style={styles.mainCard}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{job.employmentType}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: Colors.surfaceHighlight }]}>
              <Text style={styles.badgeText}>{job.isRemote ? "Remote" : "On-site"}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: Colors.surfaceHighlight }]}>
              <Text style={styles.badgeText}>{job.priority} Priority</Text>
            </View>
          </View>
        </Card>

        {/* Status Tracker */}
        <Card variant="outline" style={styles.section}>
          <Text style={styles.sectionTitle}>Application Status</Text>
          <RouteTracker stage={job.status} />
        </Card>

        {/* Details Grid */}
        <Card variant="outline" style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <MapPin size={18} color={Colors.textMuted} />
            <Text style={styles.detailText}>{job.location || "Location not specified"}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <DollarSign size={18} color={Colors.textMuted} />
            <Text style={styles.detailText}>{job.salary || "Salary not specified"}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Calendar size={18} color={Colors.textMuted} />
            <Text style={styles.detailText}>
              {job.deadline ? `Deadline: ${new Date(job.deadline).toLocaleDateString()}` : "No deadline"}
            </Text>
          </View>
        </Card>

        {/* Timeline History */}
        {job.timeline && job.timeline.length > 0 && (
          <Card variant="outline" style={styles.section}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: Spacing.md }}>
              <Clock size={18} color={Colors.primaryLight} />
              <Text style={styles.sectionTitle}>Timeline History</Text>
            </View>
            
            <View style={styles.timelineContainer}>
              {job.timeline.slice().reverse().map((event: any, idx: number, arr: any[]) => (
                <View key={idx} style={styles.timelineRow}>
                  <View style={styles.timelineLineContainer}>
                    <View style={styles.timelineDot} />
                    {idx < arr.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineEvent}>{event.event}</Text>
                    <Text style={styles.timelineDesc}>{event.description}</Text>
                    <Text style={styles.timelineDate}>
                      {new Date(event.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Actions */}
        {job.url && (
          <Button 
            variant="primary" 
            onPress={() => Linking.openURL(job.url)}
            style={styles.actionBtn}
          >
            <ExternalLink size={18} color={Colors.surface} style={{ marginRight: 8 }} />
            View Original Posting
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...Type.h2,
  },
  errorText: {
    ...Type.body,
    color: Colors.textMuted,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  mainCard: {
    marginBottom: Spacing.lg,
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  jobTitle: {
    ...Type.h1,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  company: {
    ...Type.h3,
    color: Colors.primaryLight,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Type.caption,
    color: Colors.text,
    fontWeight: "600",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Type.h3,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  detailText: {
    ...Type.body,
    color: Colors.text,
  },
  actionBtn: {
    marginTop: Spacing.md,
  },
  timelineContainer: {
    paddingLeft: Spacing.xs,
  },
  timelineRow: {
    flexDirection: "row",
  },
  timelineLineContainer: {
    alignItems: "center",
    marginRight: Spacing.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryLight,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.lg,
  },
  timelineEvent: {
    ...Type.bodyMed,
    color: Colors.text,
  },
  timelineDesc: {
    ...Type.body,
    color: Colors.textMuted,
    marginTop: 2,
  },
  timelineDate: {
    ...Type.micro,
    color: Colors.primaryLight,
    marginTop: 4,
  },
});
