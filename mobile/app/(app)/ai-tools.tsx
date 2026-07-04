import React, { useState, useEffect, useCallback } from "react";
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
import { streamFetch } from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import apiClient from "@/services/api";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "@/constants/theme";

type AITool = "email" | "cover" | "match" | "learning";

export default function AIToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<AITool>("email");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>AI Tools</Text>
      </View>

      {/* Tool tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContent}
      >
        {(
          [
            { id: "email", emoji: "📧", label: "Cold Email" },
            { id: "cover", emoji: "✉️", label: "Cover Letter" },
            { id: "match", emoji: "🎯", label: "Match Score" },
            { id: "learning", emoji: "📚", label: "Learning Plan" },
          ] as { id: AITool; emoji: string; label: string }[]
        ).map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, activeTool === t.id && styles.tabActive]}
            onPress={() => setActiveTool(t.id)}
          >
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text
              style={[
                styles.tabLabel,
                activeTool === t.id && styles.tabLabelActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.toolArea}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTool === "email" && <EmailGenerator type="email" />}
          {activeTool === "cover" && <EmailGenerator type="cover" />}
          {activeTool === "match" && <MatchScoreTool />}
          {activeTool === "learning" && <LearningPlanTool />}
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Email / Cover Letter Generator ──────────────────────────────────────────
function EmailGenerator({ type }: { type: "email" | "cover" }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [tone, setTone] = useState("Professional");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const tones = ["Professional", "Friendly", "Formal", "Enthusiastic"];

  const handleGenerate = async () => {
    if (!company.trim() || !role.trim()) {
      Alert.alert("Required", "Company and role are required.");
      return;
    }
    setOutput("");
    setLoading(true);

    await streamFetch(
      API_ENDPOINTS.AI_GENERATE_EMAIL,
      {
        job: { company: company.trim(), title: role.trim() },
        userProfile: {},
        templateType: tone,
        type,
      },
      (chunk) => setOutput((prev) => prev + chunk),
      () => setLoading(false),
      (err) => {
        setLoading(false);
        Alert.alert("AI Error", err);
      }
    );
  };

  return (
    <View style={toolStyles.section}>
      <Text style={toolStyles.toolTitle}>
        {type === "email" ? "📧 Cold Email Generator" : "✉️ Cover Letter Generator"}
      </Text>
      <Text style={toolStyles.toolSubtitle}>
        AI-generated, personalized outreach in seconds
      </Text>

      <View style={toolStyles.fieldGroup}>
        <Text style={toolStyles.label}>Target Company</Text>
        <TextInput
          style={toolStyles.input}
          value={company}
          onChangeText={setCompany}
          placeholder="e.g. Stripe"
          placeholderTextColor={Colors.textMuted}
        />
      </View>
      <View style={toolStyles.fieldGroup}>
        <Text style={toolStyles.label}>Role</Text>
        <TextInput
          style={toolStyles.input}
          value={role}
          onChangeText={setRole}
          placeholder="e.g. Software Engineer Intern"
          placeholderTextColor={Colors.textMuted}
        />
      </View>
      <View style={toolStyles.fieldGroup}>
        <Text style={toolStyles.label}>Tone</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={toolStyles.chipRow}>
            {tones.map((t) => (
              <TouchableOpacity
                key={t}
                style={[toolStyles.chip, tone === t && toolStyles.chipActive]}
                onPress={() => setTone(t)}
              >
                <Text
                  style={[
                    toolStyles.chipText,
                    tone === t && toolStyles.chipTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[toolStyles.generateBtn, loading && toolStyles.generateBtnDisabled]}
        onPress={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={toolStyles.generateBtnText}>
            ✨ Generate {type === "email" ? "Email" : "Cover Letter"}
          </Text>
        )}
      </TouchableOpacity>

      {output !== "" && (
        <View style={toolStyles.outputBox}>
          <Text style={toolStyles.outputLabel}>Generated Output</Text>
          <Text style={toolStyles.outputText}>{output}</Text>
          {loading && (
            <Text style={toolStyles.streamingIndicator}>
              ▋ Generating...
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Match Score Tool ─────────────────────────────────────────────────────────
function MatchScoreTool() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [userSkills, setUserSkills] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!company.trim() || !role.trim()) {
      Alert.alert("Required", "Company and role are required.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await apiClient.post(API_ENDPOINTS.AI_MATCH_SCORE, {
        job: {
          company: company.trim(),
          title: role.trim(),
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        },
        user: {
          skills: userSkills.split(",").map((s) => s.trim()).filter(Boolean),
        },
      });
      setResult(res.data);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    result?.score >= 75
      ? Colors.success
      : result?.score >= 50
      ? Colors.warning
      : Colors.error;

  return (
    <View style={toolStyles.section}>
      <Text style={toolStyles.toolTitle}>🎯 Match Score Analyzer</Text>
      <Text style={toolStyles.toolSubtitle}>
        AI evaluates how well you fit a role
      </Text>

      <View style={toolStyles.fieldGroup}>
        <Text style={toolStyles.label}>Company</Text>
        <TextInput style={toolStyles.input} value={company} onChangeText={setCompany}
          placeholder="e.g. Google" placeholderTextColor={Colors.textMuted} />
      </View>
      <View style={toolStyles.fieldGroup}>
        <Text style={toolStyles.label}>Role</Text>
        <TextInput style={toolStyles.input} value={role} onChangeText={setRole}
          placeholder="e.g. Backend Engineer" placeholderTextColor={Colors.textMuted} />
      </View>
      <View style={toolStyles.fieldGroup}>
        <Text style={toolStyles.label}>Job Skills (comma-separated)</Text>
        <TextInput style={toolStyles.input} value={skills} onChangeText={setSkills}
          placeholder="React, Node.js, PostgreSQL" placeholderTextColor={Colors.textMuted} />
      </View>
      <View style={toolStyles.fieldGroup}>
        <Text style={toolStyles.label}>Your Skills (comma-separated)</Text>
        <TextInput style={toolStyles.input} value={userSkills} onChangeText={setUserSkills}
          placeholder="React, Next.js, TypeScript" placeholderTextColor={Colors.textMuted} />
      </View>

      <TouchableOpacity
        style={[toolStyles.generateBtn, loading && toolStyles.generateBtnDisabled]}
        onPress={handleAnalyze}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={toolStyles.generateBtnText}>🎯 Analyze Match</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={toolStyles.outputBox}>
          {/* Score */}
          <View style={toolStyles.scoreRow}>
            <View style={[toolStyles.scoreBadge, { backgroundColor: scoreColor + "20", borderColor: scoreColor + "50" }]}>
              <Text style={[toolStyles.scoreValue, { color: scoreColor }]}>
                {result.score}
              </Text>
              <Text style={[toolStyles.scoreGrade, { color: scoreColor }]}>
                {result.grade}
              </Text>
            </View>
            <Text style={toolStyles.summary}>{result.summary}</Text>
          </View>

          {/* Matched */}
          {result.matched?.length > 0 && (
            <View style={toolStyles.resultSection}>
              <Text style={[toolStyles.resultHeader, { color: Colors.success }]}>
                ✅ Matched Skills
              </Text>
              {result.matched.map((m: any, i: number) => (
                <Text key={i} style={toolStyles.resultItem}>
                  • {m.skill}
                </Text>
              ))}
            </View>
          )}

          {/* Missing */}
          {result.missing?.length > 0 && (
            <View style={toolStyles.resultSection}>
              <Text style={[toolStyles.resultHeader, { color: Colors.error }]}>
                ❌ Missing Skills
              </Text>
              {result.missing.map((m: any, i: number) => (
                <Text key={i} style={toolStyles.resultItem}>
                  • {m.skill} ({m.importance}, ~{m.learnTime})
                </Text>
              ))}
            </View>
          )}

          {/* Suggestions */}
          {result.suggestions?.length > 0 && (
            <View style={toolStyles.resultSection}>
              <Text style={[toolStyles.resultHeader, { color: Colors.primary }]}>
                💡 Suggestions
              </Text>
              {result.suggestions.map((s: any, i: number) => (
                <Text key={i} style={toolStyles.resultItem}>
                  • {s.action}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Learning Plan Tool ───────────────────────────────────────────────────────
function LearningPlanTool() {
  const [skillsInput, setSkillsInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (skills.length === 0) {
      Alert.alert("Required", "Enter at least one skill to learn.");
      return;
    }
    setOutput("");
    setLoading(true);

    await streamFetch(
      API_ENDPOINTS.AI_LEARNING_PLAN,
      {
        missingSkills: skills.map((s) => ({
          skill: s,
          importance: "must-have",
          learnTime: "2-4 weeks",
        })),
      },
      (chunk) => setOutput((prev) => prev + chunk),
      () => setLoading(false),
      (err) => {
        setLoading(false);
        Alert.alert("AI Error", err);
      }
    );
  };

  return (
    <View style={toolStyles.section}>
      <Text style={toolStyles.toolTitle}>📚 Learning Plan Generator</Text>
      <Text style={toolStyles.toolSubtitle}>
        Get a personalized roadmap to upskill
      </Text>

      <View style={toolStyles.fieldGroup}>
        <Text style={toolStyles.label}>Skills to Learn (comma-separated)</Text>
        <TextInput
          style={[toolStyles.input, toolStyles.textarea]}
          value={skillsInput}
          onChangeText={setSkillsInput}
          placeholder="Docker, Kubernetes, Redis, GraphQL"
          placeholderTextColor={Colors.textMuted}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[toolStyles.generateBtn, loading && toolStyles.generateBtnDisabled]}
        onPress={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={toolStyles.generateBtnText}>📚 Generate Plan</Text>
        )}
      </TouchableOpacity>

      {output !== "" && (
        <View style={toolStyles.outputBox}>
          <Text style={toolStyles.outputLabel}>Learning Roadmap</Text>
          <Text style={toolStyles.outputText}>{output}</Text>
          {loading && <Text style={toolStyles.streamingIndicator}>▋ Generating...</Text>}
        </View>
      )}
    </View>
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
  tabScroll: { flexGrow: 0, marginBottom: Spacing.sm },
  tabContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  tabActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  tabEmoji: { fontSize: 18 },
  tabLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2, fontWeight: FontWeight.medium },
  tabLabelActive: { color: Colors.primaryLight },
  toolArea: { flex: 1 },
});

const toolStyles = StyleSheet.create({
  section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  toolTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  toolSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  fieldGroup: { marginBottom: Spacing.md },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: 6 },
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
  textarea: { minHeight: 70, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.xs },
  chipTextActive: { color: Colors.primaryLight, fontWeight: FontWeight.semibold },
  generateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  outputBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  outputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  outputText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  streamingIndicator: {
    color: Colors.primary,
    fontSize: FontSize.md,
    marginTop: 4,
  },
  // Match Score
  scoreRow: { flexDirection: "row", gap: Spacing.md, alignItems: "flex-start", marginBottom: Spacing.md },
  scoreBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  scoreValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  scoreGrade: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, textAlign: "center" },
  summary: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  resultSection: { marginTop: Spacing.sm },
  resultHeader: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 6 },
  resultItem: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20, marginBottom: 4 },
});
