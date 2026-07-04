import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import apiClient, { streamFetch } from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Button, Input, Card } from "@/components/ui";
import { ArrowLeft, Link as LinkIcon, AlignLeft } from "lucide-react-native";

export default function ImportJobScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [tab, setTab] = useState<"URL" | "TEXT">("URL");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [rawOutput, setRawOutput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleImport = async () => {
    if (tab === "URL" && !url.trim()) {
      Alert.alert("Required", "Please paste a job posting URL.");
      return;
    }
    if (tab === "TEXT" && !text.trim()) {
      Alert.alert("Required", "Please paste the job description text.");
      return;
    }

    setLoading(true);
    setParsed(null);
    setRawOutput("");

    let buffer = "";
    
    // Determine the correct endpoint and payload based on mode
    const endpoint = tab === "URL" ? `${API_ENDPOINTS.JOBS_IMPORT}/url` : `${API_ENDPOINTS.JOBS_IMPORT}/text`;
    const payload = tab === "URL" ? { url: url.trim() } : { text: text.trim() };

    await streamFetch(
      endpoint,
      payload,
      (chunk) => {
        buffer += chunk;
        setRawOutput(buffer);
      },
      () => {
        setLoading(false);
        try {
          // The stream sends raw JSON payload followed by "\n__AI_START__\n" and then the AI response
          const parts = buffer.split("__AI_START__");
          const aiResponse = parts.length > 1 ? parts[1].trim() : parts[0].trim();
          
          // Groq sometimes wraps json in ```json ... ```
          let cleanJson = aiResponse;
          if (cleanJson.includes("```json")) {
            cleanJson = cleanJson.split("```json")[1].split("```")[0];
          } else if (cleanJson.includes("```")) {
            cleanJson = cleanJson.split("```")[1].split("```")[0];
          }
          
          const result = JSON.parse(cleanJson);
          setParsed(result);
        } catch (err) {
          Alert.alert("Parsing Error", "Failed to parse AI output. The format might be invalid.");
          console.log(buffer);
        }
      },
      (errorMsg) => {
        setLoading(false);
        Alert.alert("Import Failed", errorMsg);
      }
    );
  };

  const handleSaveJob = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const payload = {
        title: parsed.role || "Unknown Role",
        company: parsed.company || "Unknown Company",
        location: parsed.location || "",
        employmentType: parsed.type || "Full-time",
        description: parsed.description || "",
        sourceUrl: tab === "URL" ? url : parsed.link || "",
        skills: parsed.skills || [],
        salary: parsed.salary || "",
        status: "SAVED",
      };
      await apiClient.post(API_ENDPOINTS.JOBS, payload);
      router.replace("/(app)/");
    } catch (err: any) {
      Alert.alert("Save Error", err?.response?.data?.error || "Could not save the job.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Job</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "URL" && styles.tabBtnActive]}
            onPress={() => { setTab("URL"); setParsed(null); }}
          >
            <LinkIcon size={16} color={tab === "URL" ? Colors.text : Colors.textMuted} />
            <Text style={[styles.tabText, tab === "URL" && styles.tabTextActive]}>From URL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "TEXT" && styles.tabBtnActive]}
            onPress={() => { setTab("TEXT"); setParsed(null); }}
          >
            <AlignLeft size={16} color={tab === "TEXT" ? Colors.text : Colors.textMuted} />
            <Text style={[styles.tabText, tab === "TEXT" && styles.tabTextActive]}>Paste Text</Text>
          </TouchableOpacity>
        </View>

        {/* Form Area */}
        <Card variant="elevated" style={styles.formCard}>
          <Text style={styles.formInstructions}>
            {tab === "URL" 
              ? "Paste the link to the job posting. Our AI will automatically extract the role, company, and requirements."
              : "Paste the full text of the job description. We'll analyze it and extract structured data."}
          </Text>

          {tab === "URL" ? (
            <Input
              placeholder="https://linkedin.com/jobs/view/..."
              value={url}
              onChangeText={setUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={{ marginBottom: Spacing.xl }}
            />
          ) : (
            <Input
              placeholder="Paste job description here...\n\nAt least 50 characters needed."
              value={text}
              onChangeText={setText}
              multiline
              style={{ minHeight: 160, textAlignVertical: "top" }}
              containerStyle={{ marginBottom: Spacing.xl }}
            />
          )}

          <Button variant="primary" loading={loading} onPress={handleImport} disabled={loading || saving}>
            {tab === "URL" ? "Extract from URL" : "Analyze Text"}
          </Button>
        </Card>

        {loading && !parsed && (
          <View style={styles.streamingBox}>
            <Text style={styles.streamingLabel}>AI is analyzing...</Text>
          </View>
        )}

        {/* Review Parsed Result */}
        {parsed && !loading && (
          <Card variant="elevated" style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Extracted Job Info</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{parsed.confidence ?? "?"}% Match</Text>
              </View>
            </View>

            {[
              { label: "Role", value: parsed.role },
              { label: "Company", value: parsed.company },
              { label: "Location", value: parsed.location },
              { label: "Type", value: parsed.type },
              { label: "Salary", value: parsed.salary },
              { label: "Deadline", value: parsed.deadline },
            ].filter(f => f.value).map((f) => (
              <View key={f.label} style={styles.resultRow}>
                <Text style={styles.resultLabel}>{f.label}</Text>
                <Text style={styles.resultValue}>{f.value}</Text>
              </View>
            ))}

            {parsed.skills && parsed.skills.length > 0 && (
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

            <Button variant="secondary" loading={saving} onPress={handleSaveJob} style={{ marginTop: 12 }}>
              Save to Tracker
            </Button>
          </Card>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
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
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  formInstructions: {
    ...Type.body,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  streamingBox: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  streamingLabel: {
    ...Type.bodyMed,
    color: Colors.primaryLight,
  },
  resultCard: {
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  resultTitle: {
    ...Type.h2,
  },
  confidenceBadge: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  confidenceText: {
    ...Type.micro,
    color: Colors.primaryLight,
  },
  resultRow: {
    marginBottom: Spacing.sm,
  },
  resultLabel: {
    ...Type.micro,
    color: Colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  resultValue: {
    ...Type.bodyMed,
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  skillChip: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillText: {
    ...Type.caption,
  },
  descBox: {
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  descText: {
    ...Type.body,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});
