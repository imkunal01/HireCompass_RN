import React, { useState, useEffect } from "react";
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
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Button, Input, Card, EmptyState } from "@/components/ui";
import { ArrowLeft, Target, BookOpen, Plus } from "lucide-react-native";

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"DAILY" | "DSA">("DAILY");

  // Daily Log state
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [problemsSolved, setProblemsSolved] = useState("0");
  const [platforms, setPlatforms] = useState("");

  // DSA Problem state
  const [problemTitle, setProblemTitle] = useState("");
  const [problemUrl, setProblemUrl] = useState("");
  const [problemDifficulty, setProblemDifficulty] = useState("Medium");

  const { data: dailyLogs = [], isLoading: dailyLoading, refetch: refetchDaily, isRefetching: isRefetchingDaily } = useQuery({
    queryKey: ["dailyLogs"],
    queryFn: async () => {
      const res = await apiClient.get("/api/tracker/daily-logs");
      return res.data;
    },
  });

  const { data: problems = [], isLoading: problemsLoading, refetch: refetchProblems, isRefetching: isRefetchingProblems } = useQuery({
    queryKey: ["problems"],
    queryFn: async () => {
      const res = await apiClient.get("/api/tracker/problems");
      return res.data;
    },
  });

  const logDailyMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post("/api/tracker/daily-logs", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyLogs"] });
      setProblemsSolved("0");
      setPlatforms("");
      Alert.alert("Success", "Daily log saved!");
    },
    onError: () => Alert.alert("Error", "Failed to save daily log"),
  });

  const addProblemMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post("/api/tracker/problems", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      setProblemTitle("");
      setProblemUrl("");
      Alert.alert("Success", "Problem added!");
    },
    onError: () => Alert.alert("Error", "Failed to add problem"),
  });

  const handleSaveDaily = () => {
    logDailyMutation.mutate({
      date: dailyDate,
      problemsSolved: parseInt(problemsSolved, 10) || 0,
      platforms: platforms.split(',').map(s => s.trim()),
      goalMet: parseInt(problemsSolved, 10) >= 2,
    });
  };

  const handleSaveProblem = () => {
    if (!problemTitle) return Alert.alert("Required", "Problem title is required");
    addProblemMutation.mutate({
      title: problemTitle,
      url: problemUrl,
      difficulty: problemDifficulty,
      topics: [],
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Goals & DSA Tracker</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "DAILY" && styles.tabBtnActive]}
          onPress={() => setTab("DAILY")}
        >
          <Target size={16} color={tab === "DAILY" ? Colors.text : Colors.textMuted} />
          <Text style={[styles.tabText, tab === "DAILY" && styles.tabTextActive]}>Daily Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "DSA" && styles.tabBtnActive]}
          onPress={() => setTab("DSA")}
        >
          <BookOpen size={16} color={tab === "DSA" ? Colors.text : Colors.textMuted} />
          <Text style={[styles.tabText, tab === "DSA" && styles.tabTextActive]}>DSA Problems</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={tab === "DAILY" ? isRefetchingDaily : isRefetchingProblems} 
            onRefresh={tab === "DAILY" ? refetchDaily : refetchProblems} 
            tintColor={Colors.primary}
          />
        }
      >
        {tab === "DAILY" ? (
          <>
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.sectionTitle}>Log Today's Progress</Text>
              <Input label="Date (YYYY-MM-DD)" value={dailyDate} onChangeText={setDailyDate} />
              <Input label="Problems Solved" value={problemsSolved} onChangeText={setProblemsSolved} keyboardType="numeric" />
              <Input label="Platforms (comma separated)" value={platforms} onChangeText={setPlatforms} placeholder="LeetCode, Codeforces" />
              <Button variant="primary" loading={logDailyMutation.isPending} onPress={handleSaveDaily} style={{ marginTop: 8 }}>
                Save Daily Log
              </Button>
            </Card>

            <Text style={styles.sectionTitle}>Recent Logs</Text>
            {dailyLoading ? <ActivityIndicator color={Colors.primary} /> : dailyLogs.map((log: any) => (
              <Card key={log.id} variant="elevated" style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.logDate}>{log.date}</Text>
                  {log.goalMet && <Text style={styles.goalBadge}>Goal Met</Text>}
                </View>
                <Text style={styles.logText}>Problems Solved: {log.problemsSolved}</Text>
                {log.platforms && log.platforms.length > 0 && (
                  <Text style={styles.logText}>Platforms: {log.platforms.join(', ')}</Text>
                )}
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.sectionTitle}>Add DSA Problem</Text>
              <Input label="Title" value={problemTitle} onChangeText={setProblemTitle} placeholder="Two Sum" />
              <Input label="URL" value={problemUrl} onChangeText={setProblemUrl} placeholder="https://leetcode.com/..." autoCapitalize="none" />
              
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.diffRow}>
                {["Easy", "Medium", "Hard"].map(diff => (
                  <TouchableOpacity
                    key={diff}
                    style={[styles.diffBtn, problemDifficulty === diff && styles.diffBtnActive]}
                    onPress={() => setProblemDifficulty(diff)}
                  >
                    <Text style={[styles.diffText, problemDifficulty === diff && styles.diffTextActive]}>{diff}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button variant="primary" loading={addProblemMutation.isPending} onPress={handleSaveProblem} style={{ marginTop: 8 }}>
                Add Problem
              </Button>
            </Card>

            <Text style={styles.sectionTitle}>Problem List</Text>
            {problemsLoading ? <ActivityIndicator color={Colors.primary} /> : problems.map((prob: any) => (
              <Card key={prob.id} variant="elevated" style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.logDate}>{prob.title}</Text>
                  <Text style={[styles.goalBadge, { backgroundColor: prob.difficulty === 'Hard' ? '#4a1111' : (prob.difficulty === 'Medium' ? '#4a3d11' : '#114a1f') }]}>
                    {prob.difficulty}
                  </Text>
                </View>
                <Text style={styles.logText}>{new Date(prob.createdAt).toLocaleDateString()}</Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm },
  title: { ...Type.h2 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  tabBtnActive: { backgroundColor: Colors.surfaceHighlight },
  tabText: { ...Type.bodyMed, color: Colors.textMuted },
  tabTextActive: { color: Colors.text },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  formCard: { marginBottom: Spacing.xl, padding: Spacing.lg },
  sectionTitle: { ...Type.h2, marginBottom: Spacing.md },
  logCard: { marginBottom: Spacing.md, padding: Spacing.md },
  logHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  logDate: { ...Type.bodyMed },
  goalBadge: { ...Type.micro, backgroundColor: Colors.primaryMuted, color: Colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  logText: { ...Type.caption, color: Colors.textMuted },
  label: { ...Type.caption, color: Colors.textMuted, marginBottom: 8 },
  diffRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  diffBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border },
  diffBtnActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  diffText: { ...Type.bodyMed, color: Colors.textMuted },
  diffTextActive: { color: Colors.primary },
});
