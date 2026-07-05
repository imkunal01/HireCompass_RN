import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, EmptyState } from "@/components/ui";
import {
  Briefcase,
  Target,
  ExternalLink,
  Code,
  Plus,
  Star,
  ChevronDown,
  ChevronUp,
  ChartBar,
  Zap,
  Compass,
  Puzzle
} from "lucide-react-native";

// Main Projects Screen
export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const { data: projects = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PROJECTS);
      return res.data;
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenLink = async (url: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Error", "Could not open link");
    }
  };

  const getProjectIcon = (name: string) => {
    if (name.toLowerCase().includes("compass")) return <Compass size={28} color="#D97706" />;
    if (name.toLowerCase().includes("track") || name.toLowerCase().includes("leet")) return <Puzzle size={28} color="#65A30D" />;
    return <Zap size={28} color={Colors.primary} />;
  };

  const getIconBg = (name: string) => {
    if (name.toLowerCase().includes("compass")) return "#FEF3C7";
    if (name.toLowerCase().includes("track") || name.toLowerCase().includes("leet")) return "#ECFCCB";
    return Colors.primaryLight + "22";
  };

  const renderHeader = () => {
    const featuredCount = projects.filter((p: any) => p.isFeatured).length;
    const aiSnippetsCount = projects.reduce((acc: number, p: any) => acc + (p.snippets?.length || 0), 0);

    return (
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientHeader, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerTitle}>Projects</Text>
              <Text style={styles.headerSubtitle}>Portfolio • AI snippet generator</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert("Coming Soon", "Manual add coming soon.")}>
              <Plus size={16} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCardGlass}>
              <Text style={styles.statNumberGlass}>{projects.length}</Text>
              <Text style={styles.statLabelGlass}>Projects</Text>
            </View>
            <View style={styles.statCardGlass}>
              <Text style={styles.statNumberGlass}>{featuredCount}</Text>
              <Text style={styles.statLabelGlass}>Featured</Text>
            </View>
            <View style={styles.statCardGlass}>
              <Text style={styles.statNumberGlass}>{aiSnippetsCount}</Text>
              <Text style={styles.statLabelGlass}>AI Snippets</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.bannerContainer}>
          <Card variant="elevated" style={styles.bannerCard}>
            <View style={styles.bannerIconBox}>
              <Target size={24} color="#EF4444" />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Form Kit Ready</Text>
              <Text style={styles.bannerSubtitle}>Match your projects to job requirements instantly</Text>
            </View>
            <TouchableOpacity style={styles.useButton} onPress={() => router.push("/(app)/form-kit")}>
              <Text style={styles.useButtonText}>Use</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isExpanded = expandedProjects.has(item.id);
    const hasGithub = !!item.links?.github;
    const hasLive = !!item.links?.live;
    const snippetCount = item.snippets?.length || 0;
    const impactText = (item.metrics && item.metrics.length > 0) ? item.metrics[0] : null;

    return (
      <Card variant="elevated" style={styles.projectCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.projectIconBox, { backgroundColor: getIconBg(item.name) }]}>
            {getProjectIcon(item.name)}
          </View>
          
          <View style={styles.projectTitleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.projectName}>{item.name}</Text>
              {item.isFeatured && <Star size={16} color="#F59E0B" fill="#F59E0B" style={{ marginLeft: 6 }} />}
            </View>
            {impactText && (
              <View style={styles.impactPill}>
                <ChartBar size={12} color="#4F46E5" style={{ marginRight: 4 }} />
                <Text style={styles.impactText}>{impactText}</Text>
              </View>
            )}
          </View>

          <View style={styles.quickActions}>
            {hasGithub && (
              <TouchableOpacity style={styles.iconButton} onPress={() => handleOpenLink(item.links.github)}>
                <Code size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
            {hasLive && (
              <TouchableOpacity style={styles.iconButton} onPress={() => handleOpenLink(item.links.live)}>
                <ExternalLink size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/(app)/projects/${item.id}`)}>
          <Text style={styles.projectDesc}>{item.description}</Text>
          
          {item.techStack && item.techStack.length > 0 && (
            <View style={styles.tagsRow}>
              {item.techStack.map((tech: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{`<> ${tech}`}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.snippetsHeader} onPress={() => toggleExpand(item.id)}>
          <View style={styles.snippetsHeaderLeft}>
            <Zap size={16} color="#8B5CF6" fill="#8B5CF6" style={{ marginRight: 6 }} />
            <Text style={styles.snippetsTitle}>AI Snippets · {snippetCount} ready</Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={20} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.snippetsList}>
            {snippetCount > 0 ? (
              item.snippets.map((snip: any, idx: number) => (
                <View key={idx} style={styles.snippetItem}>
                  <Text style={styles.snippetRole}>{snip.roleTag} ({snip.length})</Text>
                  <Text style={styles.snippetContent} numberOfLines={2}>{snip.content}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptySnippetText}>No snippets generated yet.</Text>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    backgroundColor: "#F8F9FA",
  },
  headerContainer: {
    marginBottom: Spacing.md,
  },
  gradientHeader: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "#FFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFF",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCardGlass: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  statNumberGlass: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFF",
  },
  statLabelGlass: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  bannerContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: -20,
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#F0FDF4", // Using a very light greenish/blueish tint
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  useButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  useButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFF",
  },
  listContent: {
    paddingBottom: 100,
  },
  projectCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  projectIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  projectTitleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  projectName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  impactPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  impactText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#4F46E5",
  },
  quickActions: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  projectDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  snippetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  snippetsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  snippetsTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#8B5CF6",
  },
  snippetsList: {
    marginTop: 12,
    gap: 8,
  },
  snippetItem: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
  },
  snippetRole: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.text,
    marginBottom: 4,
  },
  snippetContent: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  emptySnippetText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textFaint,
    fontStyle: "italic",
  },
});
