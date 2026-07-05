import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, Button, Input } from "@/components/ui";
import { ArrowLeft, Wand2, Copy, Trash2, CheckCircle } from "lucide-react-native";
import Clipboard from "@react-native-clipboard/clipboard";

const SNIPPET_LENGTHS = ["short", "medium", "long"];

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [roleTag, setRoleTag] = useState("");
  const [selectedLength, setSelectedLength] = useState("short");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await apiClient.get(`${API_ENDPOINTS.PROJECTS}/${id}`);
      return res.data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      // 1. Generate snippet
      const generateRes = await apiClient.post(`${API_ENDPOINTS.AI}/generate-snippet`, {
        projectName: project.name,
        description: project.description,
        techStack: project.techStack,
        roleCategories: project.roleCategories,
        metrics: project.metrics,
        links: project.links,
        roleTag,
        length: selectedLength,
      });

      const newSnippet = {
        id: `snip_${Date.now()}`,
        roleTag,
        length: selectedLength,
        text: generateRes.data.snippet,
        createdAt: new Date().toISOString(),
      };

      const updatedSnippets = [...(project.snippets || []), newSnippet];

      // 2. Save snippet back to project
      await apiClient.patch(`${API_ENDPOINTS.PROJECTS}/${id}`, { snippets: updatedSnippets });
      return newSnippet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      setRoleTag("");
      Alert.alert("Success", "AI snippet generated and saved!");
    },
    onError: (err: any) => {
      Alert.alert("Generation Failed", err?.response?.data?.error || err.message);
    },
  });

  const deleteSnippetMutation = useMutation({
    mutationFn: async (snippetId: string) => {
      const updatedSnippets = (project.snippets || []).filter((s: any) => s.id !== snippetId);
      await apiClient.patch(`${API_ENDPOINTS.PROJECTS}/${id}`, { snippets: updatedSnippets });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{project.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Project Details */}
        <Card variant="default" style={styles.card}>
          <Text style={styles.sectionTitle}>Master Description</Text>
          <Text style={styles.bodyText}>{project.description || "No description provided."}</Text>

          {project.techStack?.length > 0 && (
            <View style={styles.tagsContainer}>
              {project.techStack.map((tech: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tech}</Text>
                </View>
              ))}
            </View>
          )}

          {project.metrics?.length > 0 && (
            <View style={{ marginTop: Spacing.md }}>
              <Text style={styles.sectionTitle}>Metrics / Impact</Text>
              {project.metrics.map((m: string, i: number) => (
                <Text key={i} style={styles.bodyText}>• {m}</Text>
              ))}
            </View>
          )}
        </Card>

        {/* AI Snippet Generator */}
        <Card variant="elevated" style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: Spacing.md }}>
            <Wand2 size={20} color={Colors.primaryLight} />
            <Text style={styles.sectionTitle}>Generate AI Snippet</Text>
          </View>
          
          <Input
            label="Role Tag (e.g. Frontend Intern)"
            placeholder="What role is this for?"
            value={roleTag}
            onChangeText={setRoleTag}
          />

          <Text style={styles.label}>Length</Text>
          <View style={styles.lengthsRow}>
            {SNIPPET_LENGTHS.map((len) => (
              <TouchableOpacity
                key={len}
                style={[styles.lengthBtn, selectedLength === len && styles.lengthBtnActive]}
                onPress={() => setSelectedLength(len)}
              >
                <Text style={[styles.lengthText, selectedLength === len && styles.lengthTextActive]}>
                  {len.charAt(0).toUpperCase() + len.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            variant="primary"
            disabled={!roleTag.trim()}
            loading={generateMutation.isPending}
            onPress={() => generateMutation.mutate()}
            style={{ marginTop: Spacing.lg }}
          >
            Generate & Save
          </Button>
        </Card>

        {/* Saved Snippets */}
        <Text style={[styles.sectionTitle, { marginLeft: 4, marginTop: Spacing.md }]}>
          Saved Snippets ({project.snippets?.length || 0})
        </Text>
        
        {project.snippets?.map((snip: any) => (
          <Card key={snip.id} variant="default" style={styles.snippetCard}>
            <View style={styles.snippetHeader}>
              <View style={styles.snippetMeta}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{snip.roleTag}</Text>
                </View>
                <Text style={styles.metaText}>{snip.length}</Text>
              </View>
              <TouchableOpacity onPress={() => {
                Alert.alert("Delete", "Remove this snippet?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deleteSnippetMutation.mutate(snip.id) }
                ]);
              }}>
                <Trash2 size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.bodyText}>{snip.text}</Text>
            
            <Button
              variant="secondary"
              size="sm"
              style={{ marginTop: Spacing.md }}
              onPress={() => {
                Clipboard.setString(snip.text);
                Alert.alert("Copied", "Snippet copied to clipboard.");
              }}
            >
              <Copy size={14} color={Colors.text} />
              Copy
            </Button>
          </Card>
        ))}

        {(!project.snippets || project.snippets.length === 0) && (
          <Text style={styles.emptyText}>No snippets generated yet.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  title: { ...Type.h2, flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  card: { marginBottom: Spacing.lg, padding: Spacing.lg },
  sectionTitle: { ...Type.h3, marginBottom: Spacing.sm },
  bodyText: { ...Type.body, color: Colors.text, lineHeight: 22 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: Spacing.md },
  tag: { backgroundColor: Colors.surfaceHighlight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  tagText: { ...Type.micro, color: Colors.textMuted },
  label: { ...Type.caption, color: Colors.textMuted, marginBottom: 8, marginTop: Spacing.sm },
  lengthsRow: { flexDirection: "row", gap: Spacing.sm },
  lengthBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  lengthBtnActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  lengthText: { ...Type.bodyMed, color: Colors.textMuted },
  lengthTextActive: { color: Colors.primary },
  snippetCard: { marginBottom: Spacing.md, padding: Spacing.md, backgroundColor: Colors.surfaceHighlight },
  snippetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.md },
  snippetMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.sm },
  badgeText: { ...Type.micro, color: "#FFF", fontWeight: "700" },
  metaText: { ...Type.micro, color: Colors.textMuted, textTransform: "capitalize" },
  errorText: { ...Type.body, color: Colors.error, textAlign: "center", marginTop: 40 },
  emptyText: { ...Type.caption, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.lg },
});
