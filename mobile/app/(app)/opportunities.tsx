import React, { useState, useEffect } from "react";
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
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, EmptyState, RouteTracker, Input } from "@/components/ui";
import { Search, Briefcase } from "lucide-react-native";

export default function OpportunitiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadJobs = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.JOBS);
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter(
    (job) =>
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

      {loading ? (
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
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadJobs();
              }}
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
                <RouteTracker stage={item.status} />
              </Card>
            </TouchableOpacity>
          )}
        />
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
});
