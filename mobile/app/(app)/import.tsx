import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "@/constants/theme";

type Mode = "url" | "text";

export default function ImportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("text");
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleImport = async () => {
    if (!inputText.trim()) {
      Alert.alert("Required", `Please enter a job ${mode === "url" ? "URL" : "description"}.`);
      return;
    }
    setLoading(true);
    setParsed(null);

    try {
      // Collect streaming response and parse JSON from it
      let fullText = "";
      let aiSection = "";
      const endpoint = mode === "url" ? API_ENDPOINTS.IMPORT_URL : API_ENDPOINTS.IMPORT_TEXT;
      const body = mode === "url" ? { url: inputText.trim() } : { text: inputText.trim() };

      const { getToken } = await import("@/services/api");
      const token = await getToken();
      const res = await fetch(`${(await import("@/constants/api")).API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) fullText += decoder.decode(value, { stream: true });
      }

      // Split at __AI_START__ separator
      const parts = fullText.split("__AI_START__");
      if (parts.length >= 2) {
        aiSection = parts[1].trim();
      } else {
        aiSection = fullText.trim();
      }

      // Parse JSON from AI section
      const jsonMatch = aiSection.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setParsed(parsed);
      } else {
        throw new Error("Could not parse AI response");
      }
    } catch (err: any) {
      Alert.alert("Import Failed", err.message || "Failed to parse job description.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: parsed.role || "Untitled Role",
        company: parsed.company || "Unknown Company",
        location: parsed.location || undefined,
        employmentType: mapType(parsed.type),
        salary: parsed.salary || undefined,
        url: parsed.link || undefined,
        status: "SAVED",
        priority: "MEDIUM",
        skills: parsed.skills || [],
        notes: parsed.description || undefined,
      };
      if (parsed.deadline) {
        try {
          payload.deadline = new Date(parsed.deadline).toISOString();
        } catch {}
      }
      await apiClient.post(API_ENDPOINTS.OPPORTUNITIES, payload);
      Alert.alert("✅ Saved", "Job added to your tracker!", [
        { text: "View Jobs", onPress: () => router.push("/(app)/opportunities") },
        { text: "Import Another", onPress: () => { setParsed(null); setInputText(""); } },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to save job.");
    } finally {
      setSaving(false);
    }
  };

  function mapType(t: string): string {
    const lower = (t || "").toLowerCase();
    if (lower.includes("intern")) return "INTERNSHIP";
    if (lower.includes("full")) return "FULL_TIME";
    if (lower.includes("part")) return "PART_TIME";
    if (lower.includes("contract")) return "CONTRACT";
    return "FULL_TIME";
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Import Job</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Mode Tabs */}
          <View style={styles.tabsRow}>
            {(["text", "url"] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, mode === m && styles.tabActive]}
                onPress={() => { setMode(m); setParsed(null); setInputText(""); }}
              >
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === "text" ? "📝 Paste Text" : "🔗 From URL"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              {mode === "text"
                ? "Paste the full job description below"
                : "Enter the job listing URL"}
            </Text>
            <TextInput
              style={[styles.input, mode === "text" && styles.textarea]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                mode === "text"
                  ? "Paste job description here...\n\nAt least 50 characters needed for AI to extract info."
                  : "https://linkedin.com/jobs/view/..."
              }
              placeholderTextColor={Colors.textMuted}
              multiline={mode === "text"}
              numberOfLines={mode === "text" ? 8 : 1}
              keyboardType={mode === "url" ? "url" : "default"}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.importBtn, loading && styles.importBtnDisabled]}
            onPress={handleImport}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.importBtnText}>AI Parsing...</Text>
              </View>
            ) : (
              <Text style={styles.importBtnText}>✨ Extract Job Details</Text>
            )}
          </TouchableOpacity>

          {/* Parsed Result */}
          {parsed && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Extracted Job Info</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {parsed.confidence ?? "?"}% match
                  </Text>
                </View>
              </View>

              {[
                { label: "Role", value: parsed.role },
                { label: "Company", value: parsed.company },
                { label: "Location", value: parsed.location },
                { label: "Type", value: parsed.type },
                { label: "Salary", value: parsed.salary },
                { label: "Deadline", value: parsed.deadline },
              ]
                .filter((f) => f.value)
                .map((f) => (
                  <View key={f.label} style={styles.resultRow}>
                    <Text style={styles.resultLabel}>{f.label}</Text>
                    <Text style={styles.resultValue}>{f.value}</Text>
                  </View>
                ))}

              {parsed.skills?.length > 0 && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Skills</Text>
                  <View style={styles.skillsWrap}>
                    {parsed.skills.map((s: string) => (
                      <View key={s} style={styles.skillChip}>
                        <Text style={styles.skillText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {parsed.description && (
                <View style={styles.descBox}>
                  <Text style={styles.descText}>{parsed.description}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.importBtnDisabled]}
                onPress={handleSaveJob}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>💾 Add to Job Tracker</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  backBtnText: { color: Colors.primary, fontSize: FontSize.md },
  pageTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  tabsRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabTextActive: { color: "#fff", fontWeight: FontWeight.semibold },
  inputSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  textarea: { minHeight: 160, textAlignVertical: "top" },
  importBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 15,
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  importBtnDisabled: { opacity: 0.7 },
  importBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  // Result card
  resultCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    borderTopColor: Colors.primary,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  resultTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  confidenceBadge: {
    backgroundColor: Colors.successMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  confidenceText: { color: Colors.success, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  resultRow: {
    marginBottom: 10,
    gap: 4,
  },
  resultLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultValue: { color: Colors.text, fontSize: FontSize.sm },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  skillChip: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  skillText: { color: Colors.primaryLight, fontSize: FontSize.xs },
  descBox: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  descText: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 16 },
  saveBtn: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  saveBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
