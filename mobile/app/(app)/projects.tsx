import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, EmptyState, Button } from "@/components/ui";
import { Briefcase, ArrowLeft, ExternalLink, Github } from "lucide-react-native";

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: projects = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PROJECTS);
      return res.data;
    },
  });

  const renderItem = ({ item }: { item: any }) => (
    <Card variant="elevated" style={styles.card}>
      <Text style={styles.projName}>{item.name}</Text>
      <Text style={styles.projDesc}>{item.description}</Text>
      
      {item.techStack && item.techStack.length > 0 && (
        <View style={styles.tagsRow}>
          {item.techStack.map((tech: string, i: number) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tech}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        {item.repoUrl && (
          <Button variant="secondary" size="sm" style={styles.actionBtn}>
            <Github size={16} color={Colors.text} />
            Code
          </Button>
        )}
        {item.liveUrl && (
          <Button variant="secondary" size="sm" style={styles.actionBtn}>
            <ExternalLink size={16} color={Colors.text} />
            Live
          </Button>
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Projects</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={Briefcase}
              title="No projects added"
              description="Showcase your best work to include in applications."
              actionLabel="Add Project"
              onAction={() => Alert.alert("Coming Soon", "Manual add coming soon.")}
            />
          }
          renderItem={renderItem}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  title: {
    ...Type.h2,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  card: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  projName: {
    ...Type.h2,
    marginBottom: Spacing.xs,
  },
  projDesc: {
    ...Type.body,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  tag: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    ...Type.micro,
    color: Colors.primaryLight,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
