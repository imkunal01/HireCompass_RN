import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, EmptyState, RouteTracker, Input } from "@/components/ui";
import { Search, Briefcase, ChevronRight } from "lucide-react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

const STATUSES = [
  { id: "SAVED", label: "Saved" },
  { id: "INTERESTED", label: "Interested" },
  { id: "APPLIED", label: "Applied" },
  { id: "ASSESSMENT", label: "Assessment" },
  { id: "INTERVIEW", label: "Interview" },
  { id: "OFFER", label: "Offer" },
  { id: "REJECTED", label: "Rejected" },
];

export default function OpportunitiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Bottom Sheet state
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Fetch Jobs
  const { data: jobs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.JOBS);
      return res.data;
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.JOBS}/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      bottomSheetModalRef.current?.dismiss();
    },
  });

  const handleStatusChange = (status: string) => {
    if (selectedJob) {
      updateStatusMutation.mutate({ id: selectedJob.id, status });
    }
  };

  const openBottomSheet = (job: any) => {
    setSelectedJob(job);
    bottomSheetModalRef.current?.present();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const filteredJobs = jobs.filter(
    (job: any) =>
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Jobs</Text>
        <Input
          placeholder="Search jobs or companies..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={{ marginBottom: 0 }}
          style={{ paddingLeft: 40 }}
        />
        <View style={styles.searchIcon}>
          <Search size={18} color={Colors.textFaint} />
        </View>
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
              icon={Briefcase}
              title={searchQuery ? "No matches found" : "No jobs tracked yet"}
              description={searchQuery ? "Try a different search term" : "Start tracking your first application."}
              actionLabel={searchQuery ? undefined : "Add Job"}
              onAction={() => router.push("/(app)/import")}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/(app)/jobs/${item.id}`)}>
              <Card variant="elevated" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobRole}>{item.title}</Text>
                    <Text style={styles.jobCompany}>{item.company}</Text>
                  </View>
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>{item.employmentType}</Text>
                  </View>
                </View>
                
                <View style={styles.statusActionRow}>
                  <View style={{ flex: 1 }}>
                    <RouteTracker stage={item.status} />
                  </View>
                  <TouchableOpacity
                    style={styles.updateStatusBtn}
                    onPress={() => openBottomSheet(item)}
                  >
                    <Text style={styles.updateStatusText}>Move</Text>
                    <ChevronRight size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={["50%"]}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: Colors.surfaceHighlight }}
        handleIndicatorStyle={{ backgroundColor: Colors.border }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Update Status</Text>
          <Text style={styles.sheetSubtitle}>
            {selectedJob?.title} at {selectedJob?.company}
          </Text>
          <View style={styles.sheetOptions}>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.sheetOption,
                  selectedJob?.status === s.id && styles.sheetOptionSelected,
                ]}
                onPress={() => handleStatusChange(s.id)}
              >
                <Text
                  style={[
                    styles.sheetOptionText,
                    selectedJob?.status === s.id && styles.sheetOptionTextSelected,
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
    marginBottom: Spacing.lg,
  },
  searchIcon: {
    position: "absolute",
    left: Spacing.lg + 12,
    bottom: Spacing.md + 14,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120, // Tab bar padding
    paddingTop: Spacing.md,
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
  typePill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typePillText: {
    ...Type.micro,
    color: Colors.textSecondary,
  },
  statusActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  updateStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  updateStatusText: {
    ...Type.micro,
    color: Colors.primary,
    marginRight: 4,
    fontWeight: "600",
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
