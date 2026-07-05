import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, Shadows } from "@/constants/theme";
import { Search, SlidersHorizontal, MapPin, Clock } from "lucide-react-native";
import { EmptyState } from "@/components/ui";

const FILTER_TABS = ["All", "Saved", "Interested", "Applied", "Assessment", "Interview", "Offer", "Rejected"];

export default function OpportunitiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");

  const { data: jobs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.JOBS);
      return res.data;
    },
  });

  const filteredJobs = jobs.filter(
    (job: any) => activeTab === "All" || job.status.toLowerCase() === activeTab.toLowerCase()
  );

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "INTERVIEW": return { bg: "#FFFBEB", color: "#F59E0B" }; // Orange
      case "APPLIED": return { bg: "#EFF6FF", color: "#3B82F6" }; // Blue
      case "ASSESSMENT": return { bg: "#F5F3FF", color: "#8B5CF6" }; // Purple
      case "OFFER": return { bg: "#ECFDF5", color: "#10B981" }; // Green
      case "REJECTED": return { bg: "#FEF2F2", color: "#EF4444" }; // Red
      default: return { bg: "#F1F5F9", color: "#64748B" }; // Gray (Saved/Interested)
    }
  };

  const getLocationConfig = (location: string = "") => {
    const loc = location.toLowerCase();
    if (loc.includes("remote")) return { bg: "#ECFDF5", color: "#10B981" };
    if (loc.includes("hybrid")) return { bg: "#FFFBEB", color: "#F59E0B" };
    return { bg: "#FEF2F2", color: "#EF4444" }; // Onsite
  };

  const getCompanyColor = (companyName: string) => {
    const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#0F172A"];
    const charCode = companyName.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  const renderJobCard = ({ item }: { item: any }) => {
    const statusConfig = getStatusConfig(item.status);
    const locConfig = getLocationConfig(item.location || item.isRemote ? "Remote" : "Onsite");
    const companyColor = getCompanyColor(item.company);

    return (
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => router.push(`/(app)/jobs/${item.id}`)}
        style={styles.card}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.companyIconBox, { backgroundColor: companyColor }]}>
              <Text style={styles.companyIconText}>{item.company.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.companyName}>{item.company}</Text>
              <Text style={styles.roleName}>{item.title}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardBottom}>
          <Text style={styles.salaryText}>$ {item.salary || "N/A"}</Text>
          
          <View style={[styles.locationTag, { backgroundColor: locConfig.bg }]}>
            <MapPin size={10} color={locConfig.color} style={{ marginRight: 4 }} />
            <Text style={[styles.locationText, { color: locConfig.color }]}>
              {item.location || (item.isRemote ? "Remote" : "Onsite")}
            </Text>
          </View>

          <View style={styles.timeTag}>
            <Clock size={12} color="#94A3B8" style={{ marginRight: 4 }} />
            <Text style={styles.timeText}>
               {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Just now"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pipeline</Text>
          <Text style={styles.subtitle}>{jobs.length} opportunities tracked</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Search size={20} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <SlidersHorizontal size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count = tab === "All" ? "" : jobs.filter((j: any) => j.status.toLowerCase() === tab.toLowerCase()).length;
            
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{tab}</Text>
                {count !== "" && count > 0 && (
                  <Text style={[styles.filterCount, isActive && styles.filterCountActive]}> {count}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={"No jobs tracked yet"}
              description={"Start tracking your first application."}
              actionLabel={"Add Job"}
              onAction={() => router.push("/(app)/import")}
            />
          }
          renderItem={renderJobCard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#94A3B8",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  filtersContainer: {
    marginBottom: Spacing.md,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // white background as per UI
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: "#6B46FF",
  },
  filterText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#64748B",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  filterCount: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#94A3B8",
  },
  filterCountActive: {
    color: "rgba(255,255,255,0.7)",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120, // Tab bar padding
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Shadows.card,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  companyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  companyIconText: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#1E293B",
  },
  roleName: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  salaryText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#94A3B8",
  },
  locationTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
  },
});
