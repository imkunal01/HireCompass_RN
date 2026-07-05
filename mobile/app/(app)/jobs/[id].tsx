import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Shadows, Type, BorderRadius } from "@/constants/theme";
import { 
  X, Send, Calendar as CalendarIcon, FileText, 
  ClipboardList, Clock, CheckSquare, Mail, MapPin, 
  DollarSign, Briefcase, ChevronDown 
} from "lucide-react-native";

const STATUSES = [
  { id: "SAVED", label: "Saved" },
  { id: "INTERESTED", label: "Interested" },
  { id: "APPLIED", label: "Applied" },
  { id: "ASSESSMENT", label: "Assessment" },
  { id: "INTERVIEW", label: "Interview" },
  { id: "OFFER", label: "Offer" },
  { id: "REJECTED", label: "Rejected" },
];

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

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

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.JOBS}/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      fetchJob();
      bottomSheetModalRef.current?.dismiss();
    },
  });

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

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
        <TouchableOpacity onPress={() => router.replace("/(app)/opportunities")} style={styles.closeBtn}>
          <X size={20} color="#64748B" />
        </TouchableOpacity>
      </View>
    );
  }

  const skills = job.skills || [
    "Java", "Python", "JavaScript", "TypeScript", "SQL", "Spring Boot",
    "Node.js", "React", "REST APIs", "Microservices", "Selenium", 
    "Playwright", "Appium", "TestNG", "Postman", "JMeter", "Docker",
    "Kubernetes", "AWS", "Azure", "Google Cloud", "MySQL", "PostgreSQL",
    "MongoDB", "Redis", "ChatGPT", "Claude", "Gemini", "GitHub Copilot",
    "Cursor", "Windsurf", "Grok", "Perplexity"
  ];

  const getCompanyColor = (companyName: string) => {
    const colors = ["#F97316", "#3B82F6", "#8B5CF6", "#10B981", "#EF4444", "#0F172A"];
    const charCode = companyName.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header Row with Close Button */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => router.replace("/(app)/opportunities")} style={styles.closeBtn}>
          <X size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.companyIconBox, { backgroundColor: getCompanyColor(job.company) }]}>
            <Text style={styles.companyIconText}>{job.company.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.companyName}>{job.company}</Text>
              
              <TouchableOpacity 
                style={styles.statusPill}
                onPress={() => bottomSheetModalRef.current?.present()}
              >
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{job.status.charAt(0).toUpperCase() + job.status.slice(1).toLowerCase()}</Text>
                <ChevronDown size={14} color="#3B82F6" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
              
            </View>
            <Text style={styles.jobRole}>{job.title}</Text>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{job.priority?.toUpperCase() || "MED"}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: "#EFF6FF" }]}
            onPress={() => updateStatusMutation.mutate("APPLIED")}
          >
            <Send size={16} color="#3B82F6" />
            <Text style={[styles.actionBtnText, { color: "#3B82F6" }]}>Mark Applied</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#F5F3FF" }]}>
            <CalendarIcon size={16} color="#8B5CF6" />
            <Text style={[styles.actionBtnText, { color: "#8B5CF6" }]}>Schedule Interview</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs Row */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {["Overview", "Notes", "Timeline", "Checklist", "Emails"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                onPress={() => setActiveTab(tab)}
              >
                {tab === "Overview" && <FileText size={16} color={activeTab === tab ? "#6B46FF" : "#64748B"} />}
                {tab === "Notes" && <FileText size={16} color={activeTab === tab ? "#6B46FF" : "#64748B"} />}
                {tab === "Timeline" && <Clock size={16} color={activeTab === tab ? "#6B46FF" : "#64748B"} />}
                {tab === "Checklist" && <CheckSquare size={16} color={activeTab === tab ? "#6B46FF" : "#64748B"} />}
                {tab === "Emails" && <Mail size={16} color={activeTab === tab ? "#6B46FF" : "#64748B"} />}
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.tabDivider} />

        {/* Tab Content */}
        {activeTab === "Overview" && (
          <View style={styles.tabContent}>
            {/* Grid 2x2 */}
            <View style={styles.gridContainer}>
              <View style={styles.gridCard}>
                <View style={styles.gridCardHeader}>
                  <MapPin size={14} color="#64748B" />
                  <Text style={styles.gridCardTitle}>LOCATION</Text>
                </View>
                <Text style={styles.gridCardValue}>{job.location || (job.isRemote ? "Remote" : "Onsite") || "Hyderabad"}</Text>
              </View>

              <View style={styles.gridCard}>
                <View style={styles.gridCardHeader}>
                  <DollarSign size={14} color="#64748B" />
                  <Text style={styles.gridCardTitle}>SALARY/STIPEND</Text>
                </View>
                <Text style={styles.gridCardValue}>{job.salary || "INR 25,000 per month"}</Text>
              </View>

              <View style={styles.gridCard}>
                <View style={styles.gridCardHeader}>
                  <Briefcase size={14} color="#64748B" />
                  <Text style={styles.gridCardTitle}>TYPE</Text>
                </View>
                <Text style={styles.gridCardValue}>{(job.employmentType || "INTERNSHIP").toUpperCase()}</Text>
              </View>

              <View style={styles.gridCard}>
                <View style={styles.gridCardHeader}>
                  <Clock size={14} color="#64748B" />
                  <Text style={styles.gridCardTitle}>DEADLINE</Text>
                </View>
                <Text style={styles.gridCardValue}>
                  {job.deadline ? new Date(job.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Jun 24, 2026"}
                </Text>
              </View>

              <View style={[styles.gridCard, { width: '48%' }]}>
                <View style={styles.gridCardHeader}>
                  <CalendarIcon size={14} color="#64748B" />
                  <Text style={styles.gridCardTitle}>ADDED</Text>
                </View>
                <Text style={styles.gridCardValue}>
                  {job.createdAt ? new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Jun 22, 2026"}
                </Text>
              </View>
            </View>

            {/* Skills */}
            <Text style={styles.sectionHeading}>SKILLS REQUIRED</Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill: string, idx: number) => (
                <View key={idx} style={styles.skillPill}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <ClipboardList size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={["50%"]}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#FFFFFF", borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: Colors.border }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Update Status</Text>
          <Text style={styles.sheetSubtitle}>
            {job.title} at {job.company}
          </Text>
          <View style={styles.sheetOptions}>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.sheetOption,
                  job.status === s.id && styles.sheetOptionSelected,
                ]}
                onPress={() => updateStatusMutation.mutate(s.id)}
              >
                <Text
                  style={[
                    styles.sheetOptionText,
                    job.status === s.id && styles.sheetOptionTextSelected,
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#64748B",
    fontFamily: "Inter_500Medium",
    marginBottom: 20,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingBottom: 120,
  },
  profileHeader: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: 24,
    gap: 16,
  },
  companyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  companyIconText: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  companyName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3B82F6",
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#3B82F6",
  },
  jobRole: {
    fontSize: 16,
    color: "#64748B",
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
  tagPill: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  tabsContainer: {
    width: "100%",
  },
  tabsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 24,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: "#6B46FF",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#6B46FF",
  },
  tabDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    width: "100%",
    marginTop: -1,
    marginBottom: 24,
  },
  tabContent: {
    paddingHorizontal: Spacing.lg,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  gridCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Shadows.card,
  },
  gridCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  gridCardTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#64748B",
  },
  gridCardValue: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#0F172A",
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#64748B",
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillPill: {
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: "#8B5CF6",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  fab: {
    position: "absolute",
    bottom: 110,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.card,
  },
  sheetContent: {
    flex: 1,
    padding: Spacing.xl,
  },
  sheetTitle: {
    ...Type.h2,
    marginBottom: 4,
  },
  sheetSubtitle: {
    ...Type.body,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  sheetOptions: {
    gap: 8,
  },
  sheetOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetOptionSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  sheetOptionText: {
    ...Type.bodyMed,
  },
  sheetOptionTextSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
