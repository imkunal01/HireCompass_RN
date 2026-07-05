import React, { useState } from "react";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { streamFetch } from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, Button, Input } from "@/components/ui";
import { Zap, ArrowLeft, Target, BookOpen } from "lucide-react-native";

type Tab = "COVER_LETTER" | "MATCH_SCORE" | "LEARNING_PLAN";

export default function AIToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("COVER_LETTER");

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>AI Toolkit</Text>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === "COVER_LETTER" && styles.tabBtnActive]} onPress={() => setActiveTab("COVER_LETTER")}>
            <Zap size={16} color={activeTab === "COVER_LETTER" ? Colors.text : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === "COVER_LETTER" && styles.tabTextActive]}>Cover Letter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === "MATCH_SCORE" && styles.tabBtnActive]} onPress={() => setActiveTab("MATCH_SCORE")}>
            <Target size={16} color={activeTab === "MATCH_SCORE" ? Colors.text : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === "MATCH_SCORE" && styles.tabTextActive]}>Match Score</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === "LEARNING_PLAN" && styles.tabBtnActive]} onPress={() => setActiveTab("LEARNING_PLAN")}>
            <BookOpen size={16} color={activeTab === "LEARNING_PLAN" ? Colors.text : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === "LEARNING_PLAN" && styles.tabTextActive]}>Learning Plan</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {activeTab === "COVER_LETTER" && <CoverLetterTool />}
        {activeTab === "MATCH_SCORE" && <MatchScoreTool />}
        {activeTab === "LEARNING_PLAN" && <LearningPlanTool />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Cover Letter Tool ────────────────────────────────────────────────────────
function CoverLetterTool() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!company.trim() || !role.trim()) {
      Alert.alert("Required", "Company and Role are required.");
      return;
    }
    setOutput("");
    setLoading(true);

    await streamFetch(
      API_ENDPOINTS.AI_GENERATE_EMAIL,
      {
        type: "cover",
        job: {
          company,
          title: role,
          skills: skills.split(",").map((s) => s.trim()),
        },
        userProfile: { name: "User", skills: [] }, // Mocked for now, in a real app fetch from user store
        templateType: "Professional",
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
    <Card variant="elevated" style={styles.toolCard}>
      <Text style={styles.toolTitle}>Cover Letter Generator</Text>
      <Text style={styles.toolDesc}>Generate a tailored cover letter based on the job requirements.</Text>
      <Input placeholder="Company Name" value={company} onChangeText={setCompany} />
      <Input placeholder="Job Title" value={role} onChangeText={setRole} />
      <Input placeholder="Key Skills (comma separated)" value={skills} onChangeText={setSkills} containerStyle={{ marginBottom: Spacing.xl }} />
      <Button variant="primary" loading={loading} onPress={handleGenerate} disabled={loading}>
        Generate Draft
      </Button>
      {output !== "" && (
        <View style={styles.outputBox}>
          <Text style={styles.outputText}>{output}</Text>
          {loading && <Text style={styles.streamingIndicator}>▋</Text>}
        </View>
      )}
      {!loading && output !== "" && (
        <Button variant="secondary" style={{ marginTop: 12 }} onPress={() => {
          Clipboard.setString(output);
          Alert.alert("Copied!", "Cover letter copied to clipboard.");
        }}>
          Copy to Clipboard
        </Button>
      )}
    </Card>
  );
}

// ─── Match Score Tool ─────────────────────────────────────────────────────────
function MatchScoreTool() {
  const [desc, setDesc] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleScore = async () => {
    if (!desc.trim()) return;
    setLoading(true);
    setResult(null);

    let buffer = "";
    await streamFetch(
      API_ENDPOINTS.AI_MATCH_SCORE,
      {
        job: { description: desc },
        userProfile: { skills: ["React Native", "TypeScript", "Node.js"] }, // Mock profile
      },
      (chunk) => { buffer += chunk; },
      () => {
        setLoading(false);
        try {
          // Streaming may return JSON inside a block, similar to import parser
          const clean = buffer.replace(/```json|```/g, "").trim();
          setResult(JSON.parse(clean));
        } catch (e) {
          Alert.alert("Error", "Failed to parse AI score result.");
        }
      },
      (err) => {
        setLoading(false);
        Alert.alert("AI Error", err);
      }
    );
  };

  return (
    <Card variant="elevated" style={styles.toolCard}>
      <Text style={styles.toolTitle}>Resume Match Score</Text>
      <Text style={styles.toolDesc}>Paste a job description to see how well your profile matches.</Text>
      <Input
        placeholder="Paste job description..."
        value={desc}
        onChangeText={setDesc}
        multiline
        style={{ minHeight: 120, textAlignVertical: "top" }}
        containerStyle={{ marginBottom: Spacing.xl }}
      />
      <Button variant="primary" loading={loading} onPress={handleScore} disabled={loading}>
        Calculate Score
      </Button>

      {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />}
      {result && (
        <View style={styles.resultBox}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreValue}>{result.score ?? "?"}</Text>
            </View>
            <Text style={styles.summaryText}>{result.summary}</Text>
          </View>
          {result.missing?.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.missingTitle}>Missing Skills:</Text>
              {result.missing.map((m: any, i: number) => (
                <Text key={i} style={styles.missingItem}>• {m.skill} (~{m.learnTime})</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

// ─── Learning Plan Tool ───────────────────────────────────────────────────────
function LearningPlanTool() {
  const [skills, setSkills] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!skills.trim()) return;
    setOutput("");
    setLoading(true);

    const missingSkills = skills.split(",").map((s) => ({
      skill: s.trim(),
      importance: "must-have",
      learnTime: "2-4 weeks",
    })).filter(s => s.skill);

    await streamFetch(
      API_ENDPOINTS.AI_LEARNING_PLAN,
      { missingSkills },
      (chunk) => setOutput((prev) => prev + chunk),
      () => setLoading(false),
      (err) => {
        setLoading(false);
        Alert.alert("AI Error", err);
      }
    );
  };

  return (
    <Card variant="elevated" style={styles.toolCard}>
      <Text style={styles.toolTitle}>Learning Plan</Text>
      <Text style={styles.toolDesc}>Generate a customized learning roadmap for skills you're missing.</Text>
      <Input
        placeholder="e.g. Docker, GraphQL, Redis"
        value={skills}
        onChangeText={setSkills}
        containerStyle={{ marginBottom: Spacing.xl }}
      />
      <Button variant="primary" loading={loading} onPress={handleGenerate} disabled={loading}>
        Build Roadmap
      </Button>

      {output !== "" && (
        <View style={styles.outputBox}>
          <Text style={styles.outputText}>{output}</Text>
          {loading && <Text style={styles.streamingIndicator}>▋</Text>}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
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
  tabContainer: {
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtnActive: {
    backgroundColor: Colors.surfaceHighlight,
  },
  tabText: {
    ...Type.bodyMed,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.text,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  toolCard: {
    padding: Spacing.lg,
  },
  toolTitle: {
    ...Type.h2,
    marginBottom: 4,
  },
  toolDesc: {
    ...Type.body,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  outputBox: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  outputText: {
    ...Type.bodyMed,
    color: Colors.text,
    lineHeight: 22,
  },
  streamingIndicator: {
    color: Colors.primary,
    marginTop: 4,
  },
  resultBox: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  scoreBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: {
    ...Type.h2,
    color: Colors.primaryLight,
  },
  summaryText: {
    flex: 1,
    ...Type.body,
    color: Colors.textMuted,
  },
  missingTitle: {
    ...Type.micro,
    color: Colors.error,
    marginBottom: 8,
  },
  missingItem: {
    ...Type.caption,
    color: Colors.text,
    marginBottom: 4,
  },
});
