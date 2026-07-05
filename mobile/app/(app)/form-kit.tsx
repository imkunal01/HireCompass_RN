import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, Button, EmptyState } from "@/components/ui";
import { ArrowLeft, Target, Copy, Zap } from "lucide-react-native";
import Clipboard from "@react-native-clipboard/clipboard";

export default function FormKitScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);

  const { data: opportunities = [], isLoading: oppsLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.OPPORTUNITIES);
      return res.data;
    },
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["form-kit", selectedOpportunityId],
    queryFn: async () => {
      if (!selectedOpportunityId) return null;
      const res = await apiClient.get(`${API_ENDPOINTS.API_BASE}/form-kit?opportunityId=${selectedOpportunityId}`);
      return res.data;
    },
    enabled: !!selectedOpportunityId,
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#16a34a"; // Green
    if (score >= 50) return "#d97706"; // Yellow
    return Colors.error; // Red
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Form Kit</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>1. Select Target Role</Text>
        
        {oppsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : opportunities.length === 0 ? (
          <Text style={styles.emptyText}>No saved jobs found. Save a job first.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.oppsScroll}>
            {opportunities.map((opp: any) => (
              <TouchableOpacity
                key={opp.id}
                style={[
                  styles.oppCard,
                  selectedOpportunityId === opp.id && styles.oppCardSelected
                ]}
                onPress={() => setSelectedOpportunityId(opp.id)}
              >
                <Text style={[styles.oppCompany, selectedOpportunityId === opp.id && { color: Colors.primary }]}>
                  {opp.company}
                </Text>
                <Text style={styles.oppTitle} numberOfLines={1}>{opp.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {selectedOpportunityId && (
          <View style={{ marginTop: Spacing.xl }}>
            <View style={styles.titleRow}>
              <Zap size={20} color={Colors.primaryLight} />
              <Text style={styles.sectionTitle}>2. Best Project Matches</Text>
            </View>

            {matchesLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : !matches || matches.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No projects found"
                description="Add projects with tech stacks to see matches."
              />
            ) : (
              matches.map((match: any, index: number) => (
                <Card key={match.projectId} variant="elevated" style={styles.matchCard}>
                  <View style={styles.matchHeader}>
                    <Text style={styles.projectName}>
                      #{index + 1} {match.projectName}
                    </Text>
                    <View style={styles.scoreBadge}>
                      <Text style={[styles.scoreText, { color: getScoreColor(match.matchScore) }]}>
                        {match.matchScore}% Match
                      </Text>
                    </View>
                  </View>

                  {match.matchedSkills?.length > 0 && (
                    <View style={styles.skillsRow}>
                      <Text style={styles.label}>Matched Skills:</Text>
                      {match.matchedSkills.map((skill: string) => (
                        <View key={skill} style={styles.skillTag}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {!match.hasAnySnippet ? (
                    <View style={styles.noSnippetsBox}>
                      <Text style={styles.noSnippetsText}>
                        No AI snippets generated for this project yet. Go to Projects to generate some!
                      </Text>
                      <Button variant="secondary" size="sm" style={{ marginTop: 8 }} onPress={() => router.push(`/(app)/projects/${match.projectId}`)}>
                        Generate Snippets
                      </Button>
                    </View>
                  ) : (
                    <View style={styles.snippetsContainer}>
                      <Text style={styles.label}>Copy Snippet for Form</Text>
                      
                      {match.snippets?.short && (
                        <View style={styles.snippetRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.snippetLabel}>Short (Resume/Form Bullet)</Text>
                            <Text style={styles.snippetPreview} numberOfLines={2}>{match.snippets.short.text}</Text>
                          </View>
                          <TouchableOpacity style={styles.copyBtn} onPress={() => {
                            Clipboard.setString(match.snippets.short.text);
                            Alert.alert("Copied!", "Short snippet copied to clipboard.");
                          }}>
                            <Copy size={16} color={Colors.primary} />
                          </TouchableOpacity>
                        </View>
                      )}

                      {match.snippets?.medium && (
                        <View style={styles.snippetRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.snippetLabel}>Medium (Cover Letter Paragraph)</Text>
                            <Text style={styles.snippetPreview} numberOfLines={2}>{match.snippets.medium.text}</Text>
                          </View>
                          <TouchableOpacity style={styles.copyBtn} onPress={() => {
                            Clipboard.setString(match.snippets.medium.text);
                            Alert.alert("Copied!", "Medium snippet copied to clipboard.");
                          }}>
                            <Copy size={16} color={Colors.primary} />
                          </TouchableOpacity>
                        </View>
                      )}

                      {match.snippets?.long && (
                        <View style={styles.snippetRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.snippetLabel}>Long (Detailed Narrative)</Text>
                            <Text style={styles.snippetPreview} numberOfLines={2}>{match.snippets.long.text}</Text>
                          </View>
                          <TouchableOpacity style={styles.copyBtn} onPress={() => {
                            Clipboard.setString(match.snippets.long.text);
                            Alert.alert("Copied!", "Long snippet copied to clipboard.");
                          }}>
                            <Copy size={16} color={Colors.primary} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm },
  title: { ...Type.h2 },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  sectionTitle: { ...Type.h3, marginBottom: Spacing.md },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: Spacing.sm },
  emptyText: { ...Type.body, color: Colors.textMuted },
  
  oppsScroll: { gap: Spacing.sm, paddingRight: Spacing.xl },
  oppCard: {
    width: 160,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  oppCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  oppCompany: { ...Type.bodyMed, marginBottom: 4 },
  oppTitle: { ...Type.caption, color: Colors.textMuted },

  matchCard: { marginBottom: Spacing.lg, padding: Spacing.md },
  matchHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  projectName: { ...Type.h3, flex: 1 },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: Colors.surfaceHighlight, borderRadius: BorderRadius.sm },
  scoreText: { ...Type.micro, fontWeight: "700" },

  label: { ...Type.micro, color: Colors.textMuted, textTransform: "uppercase", marginBottom: 8 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: Spacing.lg },
  skillTag: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  skillText: { ...Type.micro, color: Colors.primaryLight },

  noSnippetsBox: { backgroundColor: Colors.surfaceHighlight, padding: Spacing.md, borderRadius: BorderRadius.md },
  noSnippetsText: { ...Type.caption, color: Colors.textMuted },
  
  snippetsContainer: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  snippetRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md },
  snippetLabel: { ...Type.caption, fontWeight: "600", color: Colors.text, marginBottom: 2 },
  snippetPreview: { ...Type.micro, color: Colors.textMuted },
  copyBtn: { padding: 10, backgroundColor: Colors.surfaceHighlight, borderRadius: BorderRadius.sm, marginLeft: Spacing.md },
});
