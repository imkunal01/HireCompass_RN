import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
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

interface Reminder {
  id: string;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  type: string;
  dueAt: string;
  message: string;
  done: boolean;
}

const TYPE_EMOJI: Record<string, string> = {
  DEADLINE: "⏰",
  FOLLOWUP: "📬",
  INTERVIEW: "🗓️",
  CUSTOM: "🔔",
};

function timeFromNow(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / 86400000);
  const hrs = Math.floor(absDiff / 3600000);
  const mins = Math.floor(absDiff / 60000);
  const past = diff < 0;
  if (days > 0) return `${past ? "" : "in "}${days}d${past ? " ago" : ""}`;
  if (hrs > 0) return `${past ? "" : "in "}${hrs}h${past ? " ago" : ""}`;
  return `${past ? "" : "in "}${mins}m${past ? " ago" : ""}`;
}

function ReminderCard({
  item,
  onToggle,
  onSnooze,
  onDelete,
}: {
  item: Reminder;
  onToggle: () => void;
  onSnooze: (option: string) => void;
  onDelete: () => void;
}) {
  const isOverdue = !item.done && new Date(item.dueAt) < new Date();

  return (
    <View
      style={[
        styles.card,
        item.done && styles.cardDone,
        isOverdue && styles.cardOverdue,
      ]}
    >
      <TouchableOpacity style={styles.checkBtn} onPress={onToggle} activeOpacity={0.7}>
        <View
          style={[styles.checkbox, item.done && styles.checkboxDone]}
        >
          {item.done && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.typeEmoji}>{TYPE_EMOJI[item.type] ?? "🔔"}</Text>
          <Text style={[styles.typeName, item.done && styles.textDone]}>
            {item.type.replace("_", " ")}
          </Text>
          <Text
            style={[
              styles.dueTime,
              isOverdue && styles.overdue,
              item.done && styles.textDone,
            ]}
          >
            {timeFromNow(item.dueAt)}
          </Text>
        </View>
        {item.message && (
          <Text
            style={[styles.message, item.done && styles.textDone]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
        )}
        {(item.company || item.jobTitle) && (
          <Text style={styles.jobRef}>
            {item.company} {item.jobTitle ? `· ${item.jobTitle}` : ""}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.moreBtn}
        onPress={() => {
          Alert.alert(
            "Reminder Options",
            "",
            [
              {
                text: "Snooze 1 day",
                onPress: () => onSnooze("1day"),
              },
              {
                text: "Snooze 3 days",
                onPress: () => onSnooze("3days"),
              },
              {
                text: "Snooze 1 week",
                onPress: () => onSnooze("1week"),
              },
              {
                text: "Delete",
                style: "destructive",
                onPress: onDelete,
              },
              { text: "Cancel", style: "cancel" },
            ]
          );
        }}
      >
        <Text style={styles.moreBtnText}>•••</Text>
      </TouchableOpacity>
    </View>
  );
}

function AddReminderModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<Reminder>) => void;
}) {
  const [type, setType] = useState("CUSTOM");
  const [message, setMessage] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!dueDate) {
      Alert.alert("Required", "Due date is required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        type,
        message,
        dueAt: new Date(dueDate).toISOString(),
      });
      onClose();
      setMessage("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.bgModal }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={modalStyles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>Add Reminder</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Text style={modalStyles.saveBtn}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView
          style={modalStyles.form}
          keyboardShouldPersistTaps="handled"
        >
          <View style={modalStyles.fieldGroup}>
            <Text style={modalStyles.label}>Type</Text>
            <View style={modalStyles.chipRow}>
              {["CUSTOM", "FOLLOWUP", "DEADLINE", "INTERVIEW"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    modalStyles.chip,
                    type === t && modalStyles.chipActive,
                  ]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[
                      modalStyles.chipText,
                      type === t && modalStyles.chipTextActive,
                    ]}
                  >
                    {TYPE_EMOJI[t]} {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={modalStyles.fieldGroup}>
            <Text style={modalStyles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={modalStyles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="2024-12-25"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={modalStyles.fieldGroup}>
            <Text style={modalStyles.label}>Message</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textarea]}
              value={message}
              onChangeText={setMessage}
              placeholder="What do you need to do?"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"pending" | "done">("pending");

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.REMINDERS, {
        params: { status: tab },
      });
      setReminders(res.data);
    } catch (e) {
      console.error("Reminders load error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [tab]);

  const handleToggle = async (id: string, currentDone: boolean) => {
    try {
      await apiClient.patch(`${API_ENDPOINTS.REMINDERS}/${id}`, {
        done: !currentDone,
      });
      load();
    } catch {
      Alert.alert("Error", "Failed to update reminder.");
    }
  };

  const handleSnooze = async (id: string, option: string) => {
    try {
      await apiClient.patch(`${API_ENDPOINTS.REMINDERS}/${id}`, {
        snooze: option,
      });
      load();
    } catch {
      Alert.alert("Error", "Failed to snooze reminder.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`${API_ENDPOINTS.REMINDERS}/${id}`);
      load();
    } catch {
      Alert.alert("Error", "Failed to delete reminder.");
    }
  };

  const handleSave = async (data: Partial<Reminder>) => {
    try {
      await apiClient.post(API_ENDPOINTS.REMINDERS, data);
      load();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to save reminder");
      throw err;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Reminders</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(["pending", "done"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "pending" ? "🔔 Pending" : "✅ Done"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <ReminderCard
              item={item}
              onToggle={() => handleToggle(item.id, item.done)}
              onSnooze={(opt) => handleSnooze(item.id, opt)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyTitle}>
                {tab === "pending" ? "No pending reminders" : "No completed reminders"}
              </Text>
              {tab === "pending" && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => setShowModal(true)}
                >
                  <Text style={styles.emptyBtnText}>+ Add Reminder</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <AddReminderModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: { padding: 4 },
  backBtnText: { color: Colors.primary, fontSize: FontSize.md },
  pageTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  addBtnText: { color: "#fff", fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  tabsRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabTextActive: { color: "#fff", fontWeight: FontWeight.semibold },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  cardDone: { opacity: 0.6 },
  cardOverdue: { borderColor: Colors.error + "40", borderLeftWidth: 3, borderLeftColor: Colors.error },
  checkBtn: { paddingTop: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: FontWeight.bold },
  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  typeEmoji: { fontSize: 14 },
  typeName: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.medium, flex: 1 },
  dueTime: { color: Colors.textSecondary, fontSize: FontSize.xs },
  overdue: { color: Colors.error },
  textDone: { color: Colors.textMuted, textDecorationLine: "line-through" },
  message: { color: Colors.textSecondary, fontSize: FontSize.xs, marginBottom: 4 },
  jobRef: { color: Colors.textMuted, fontSize: FontSize.xs },
  moreBtn: { padding: 4 },
  moreBtnText: { color: Colors.textMuted, fontSize: FontSize.sm, letterSpacing: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  emptyBtnText: { color: "#fff", fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
});

const modalStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelBtn: { color: Colors.textSecondary, fontSize: FontSize.md },
  title: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  saveBtn: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  form: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
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
  textarea: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.xs },
  chipTextActive: { color: Colors.primaryLight, fontWeight: FontWeight.semibold },
});
