import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import apiClient from "@/services/api";
import { streamFetch } from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "@/constants/theme";

interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  roleCategories: string[];
  metrics: string[];
  links: { github?: string; live?: string };
  snippets: Snippet[];
  createdAt: string;
}

interface Snippet {
  roleTag: string;
  length: "short" | "medium" | "long";
  text: string;
  createdAt: string;
}

function ProjectCard({
  project,
  onPress,
}: {
  project: Project;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{project.name}</Text>
        <View style={styles.snippetCount}>
          <Text style={styles.snippetCountText}>{project.snippets.length} snippets</Text>
        </View>
      </View>
      {project.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{project.description}</Text>
      ) : null}
      {project.techStack.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.techRow}>
          {project.techStack.slice(0, 5).map((t) => (
            <View key={t} style={styles.techChip}>
              <Text style={styles.techText}>{t}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      {(project.links.github || project.links.live) && (
        <View style={styles.linksRow}>
          {project.links.github && <Text style={styles.link}>🐙 GitHub</Text>}
          {project.links.live && <Text style={styles.link}>🌐 Live</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

function AddProjectModal({
  visible,
  onClose,
  onSave,
  initial,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
  initial?: Partial<Project>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [techRaw, setTechRaw] = useState((initial?.techStack ?? []).join(", "));
  const [metricsRaw, setMetricsRaw] = useState((initial?.metrics ?? []).join(", "));
  const [github, setGithub] = useState(initial?.links?.github ?? "");
  const [live, setLive] = useState(initial?.links?.live ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setTechRaw((initial?.techStack ?? []).join(", "));
      setMetricsRaw((initial?.metrics ?? []).join(", "));
      setGithub(initial?.links?.github ?? "");
      setLive(initial?.links?.live ?? "");
    }
  }, [visible, initial]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Required", "Project name is required."); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        techStack: techRaw.split(",").map((s) => s.trim()).filter(Boolean),
        metrics: metricsRaw.split(",").map((s) => s.trim()).filter(Boolean),
        links: { github: github.trim() || undefined, live: live.trim() || undefined },
      });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bgModal }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose}><Text style={modalStyles.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={modalStyles.title}>{initial?.id ? "Edit Project" : "Add Project"}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.primary} size="small" /> : <Text style={modalStyles.save}>Save</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {[
            { label: "Project Name *", value: name, onChangeText: setName, placeholder: "e.g. Creolink" },
            { label: "Description", value: description, onChangeText: setDescription, placeholder: "What does this project do?", multiline: true },
            { label: "Tech Stack (comma-separated)", value: techRaw, onChangeText: setTechRaw, placeholder: "React, Node.js, PostgreSQL" },
            { label: "Metrics (comma-separated)", value: metricsRaw, onChangeText: setMetricsRaw, placeholder: "30% latency reduction, 1k+ users" },
            { label: "GitHub URL", value: github, onChangeText: setGithub, placeholder: "https://github.com/..." },
            { label: "Live URL", value: live, onChangeText: setLive, placeholder: "https://..." },
          ].map((f) => (
            <View key={f.label} style={{ marginBottom: Spacing.md }}>
              <Text style={modalStyles.label}>{f.label}</Text>
              <TextInput
                style={[modalStyles.input, f.multiline && modalStyles.textarea]}
                value={f.value}
                onChangeText={f.onChangeText}
                placeholder={f.placeholder}
                placeholderTextColor={Colors.textMuted}
                multiline={f.multiline}
                autoCapitalize={f.label.includes("URL") ? "none" : "sentences"}
              />
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SnippetModal({
  visible,
  onClose,
  project,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  project: Project;
  onSave: (snippetText: string, roleTag: string, length: string) => void;
}) {
  const [roleTag, setRoleTag] = useState("Full-Stack Developer");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const lengths = ["short", "medium", "long"] as const;

  const handleGenerate = async () => {
    setOutput("");
    setLoading(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.AI_GENERATE_SNIPPET, {
        projectName: project.name,
        description: project.description,
        techStack: project.techStack,
        roleCategories: project.roleCategories,
        metrics: project.metrics,
        links: project.links,
        roleTag,
        length,
      });
      setOutput(res.data.snippet ?? "");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.bgModal }}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose}><Text style={modalStyles.cancel}>Close</Text></TouchableOpacity>
          <Text style={modalStyles.title}>Generate Snippet</Text>
          {output ? (
            <TouchableOpacity onPress={() => { onSave(output, roleTag, length); onClose(); }}>
              <Text style={modalStyles.save}>Save</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}
        </View>
        <ScrollView style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }} showsVerticalScrollIndicator={false}>
          <Text style={styles.snippetProjectName}>{project.name}</Text>
          <View style={{ marginBottom: Spacing.md }}>
            <Text style={modalStyles.label}>Role Tag</Text>
            <TextInput style={modalStyles.input} value={roleTag} onChangeText={setRoleTag}
              placeholder="e.g. Backend Developer" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={{ marginBottom: Spacing.md }}>
            <Text style={modalStyles.label}>Length</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {lengths.map((l) => (
                <TouchableOpacity key={l} style={[styles.lengthChip, length === l && styles.lengthChipActive]}
                  onPress={() => setLength(l)}>
                  <Text style={[styles.lengthChipText, length === l && styles.lengthChipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={[styles.generateBtn, loading && { opacity: 0.7 }]}
            onPress={handleGenerate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> :
              <Text style={styles.generateBtnText}>✨ Generate Snippet</Text>}
          </TouchableOpacity>
          {output !== "" && (
            <View style={styles.outputBox}>
              <Text style={styles.outputText}>{output}</Text>
            </View>
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<Project | undefined>();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showSnippetModal, setShowSnippetModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.PROJECTS);
      setProjects(res.data);
    } catch (e) { console.error("Projects load error", e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Partial<Project>) => {
    try {
      if (editItem?.id) {
        await apiClient.patch(`${API_ENDPOINTS.PROJECTS}/${editItem.id}`, data);
      } else {
        await apiClient.post(API_ENDPOINTS.PROJECTS, data);
      }
      setEditItem(undefined);
      load();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to save.");
      throw err;
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Project", "Remove this project?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await apiClient.delete(`${API_ENDPOINTS.PROJECTS}/${id}`); setSelectedProject(null); load(); }
        catch { Alert.alert("Error", "Delete failed."); }
      }},
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Projects</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setEditItem(undefined); setShowAddModal(true); }}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <ProjectCard project={item} onPress={() => {
              Alert.alert(item.name, item.description || "No description", [
                { text: "Generate Snippet", onPress: () => { setSelectedProject(item); setShowSnippetModal(true); } },
                { text: "Edit", onPress: () => { setEditItem(item); setShowAddModal(true); } },
                { text: "Delete", style: "destructive", onPress: () => handleDelete(item.id) },
                { text: "Close", style: "cancel" },
              ]);
            }} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🛠️</Text>
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
                <Text style={styles.emptyBtnText}>+ Add Project</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <AddProjectModal visible={showAddModal} onClose={() => { setShowAddModal(false); setEditItem(undefined); }}
        onSave={handleSave} initial={editItem} />

      {selectedProject && (
        <SnippetModal visible={showSnippetModal} onClose={() => setShowSnippetModal(false)}
          project={selectedProject}
          onSave={async (text, roleTag, length) => {
            // Snippets stored within the project - post a PATCH to add snippet
            // Backend stores snippets as array in project doc
            try {
              const proj = selectedProject;
              const newSnippets = [...(proj.snippets || []), { roleTag, length, text, createdAt: new Date().toISOString() }];
              await apiClient.patch(`${API_ENDPOINTS.PROJECTS}/${proj.id}`, { snippets: newSnippets });
              load();
            } catch { Alert.alert("Error", "Failed to save snippet."); }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pageHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  backBtn: { padding: 4 },
  backBtnText: { color: Colors.primary, fontSize: FontSize.md },
  pageTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: BorderRadius.full },
  addBtnText: { color: "#fff", fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold, flex: 1 },
  snippetCount: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.sm },
  snippetCountText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  cardDesc: { color: Colors.textSecondary, fontSize: FontSize.xs, marginBottom: 8, lineHeight: 16 },
  techRow: { marginBottom: 6 },
  techChip: { backgroundColor: Colors.bgElevated, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.sm, marginRight: 6 },
  techText: { color: Colors.textMuted, fontSize: FontSize.xs },
  linksRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  link: { color: Colors.primary, fontSize: FontSize.xs },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginBottom: Spacing.md },
  emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: 12, borderRadius: BorderRadius.md },
  emptyBtnText: { color: "#fff", fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
  snippetProjectName: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  lengthChip: {
    flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, alignItems: "center",
  },
  lengthChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  lengthChipText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  lengthChipTextActive: { color: Colors.primaryLight, fontWeight: FontWeight.semibold },
  generateBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: "center", marginBottom: Spacing.md },
  generateBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  outputBox: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  outputText: { color: Colors.text, fontSize: FontSize.sm, lineHeight: 20 },
});

const modalStyles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cancel: { color: Colors.textSecondary, fontSize: FontSize.md },
  title: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  save: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: 6 },
  input: {
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 13,
    color: Colors.text, fontSize: FontSize.sm,
  },
  textarea: { minHeight: 70, textAlignVertical: "top" },
});
