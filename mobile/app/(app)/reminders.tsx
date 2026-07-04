import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, BorderRadius, Type } from "@/constants/theme";
import { Card, EmptyState, Button, Input } from "@/components/ui";
import { Clock, Mail, CalendarDays, Bell, Check, ArrowLeft, Plus } from "lucide-react-native";

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

const TYPE_ICON: Record<string, any> = {
  DEADLINE: Clock,
  FOLLOWUP: Mail,
  INTERVIEW: CalendarDays,
  CUSTOM: Bell,
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

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formType, setFormType] = useState("FOLLOWUP");
  const [formDue, setFormDue] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const loadReminders = useCallback(async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.REMINDERS);
      setReminders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const toggleDone = async (id: string, current: boolean) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, done: !current } : r)));
    try {
      await apiClient.put(`${API_ENDPOINTS.REMINDERS}/${id}`, { done: !current });
    } catch (err) {
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, done: current } : r)));
    }
  };

  const deleteReminder = async (id: string) => {
    Alert.alert("Delete", "Remove this reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setReminders((prev) => prev.filter((r) => r.id !== id));
          try {
            await apiClient.delete(`${API_ENDPOINTS.REMINDERS}/${id}`);
          } catch (err) {
            loadReminders();
          }
        },
      },
    ]);
  };

  const handleAdd = async () => {
    if (!formDue || !formMsg) {
      Alert.alert("Error", "Due date and message required.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(API_ENDPOINTS.REMINDERS, {
        type: formType,
        dueAt: new Date(formDue).toISOString(),
        message: formMsg,
      });
      setShowModal(false);
      setFormType("FOLLOWUP");
      setFormMsg("");
      loadReminders();
    } catch (err) {
      Alert.alert("Error", "Failed to add reminder");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Reminder }) => {
    const isOverdue = !item.done && new Date(item.dueAt) < new Date();
    const IconCmp = TYPE_ICON[item.type] ?? Bell;

    return (
      <Card variant="elevated" style={[styles.card, item.done && styles.cardDone]}>
        <View style={styles.cardRow}>
          <TouchableOpacity
            style={[styles.checkbox, item.done && styles.checkboxDone]}
            onPress={() => toggleDone(item.id, item.done)}
          >
            {item.done && <Check size={14} color={Colors.surface} strokeWidth={3} />}
          </TouchableOpacity>
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.typePill}>
                <IconCmp size={12} color={Colors.primaryLight} strokeWidth={2} />
                <Text style={styles.typeText}>{item.type}</Text>
              </View>
              <Text style={[styles.dueText, isOverdue && !item.done && styles.overdue]}>
                {timeFromNow(item.dueAt)}
              </Text>
            </View>
            <Text style={[styles.message, item.done && styles.textDone]}>{item.message}</Text>
            {item.jobTitle && (
              <Text style={styles.contextText}>For: {item.jobTitle} at {item.company}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteReminder(item.id)}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Reminders</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Plus size={24} color={Colors.primaryLight} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReminders(); }} tintColor={Colors.primary} />}
          ListEmptyComponent={<EmptyState icon={Bell} title="All caught up" description="You have no active reminders." />}
          renderItem={renderItem}
        />
      )}

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Reminder</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.cancelBtn}>Cancel</Text></TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeChips}>
                {["FOLLOWUP", "DEADLINE", "INTERVIEW", "CUSTOM"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, formType === t && styles.chipActive]}
                    onPress={() => setFormType(t)}
                  >
                    <Text style={[styles.chipText, formType === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label="Due Date (YYYY-MM-DD)" value={formDue} onChangeText={setFormDue} placeholder="e.g. 2024-12-25" />
              <Input label="Message" value={formMsg} onChangeText={setFormMsg} placeholder="Send thank you email" multiline style={{ minHeight: 80 }} />
              
              <Button variant="primary" loading={saving} onPress={handleAdd} style={{ marginTop: 16 }}>
                Save Reminder
              </Button>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    padding: Spacing.sm,
  },
  title: {
    ...Type.h2,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardDone: {
    opacity: 0.6,
  },
  cardRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    ...Type.micro,
    color: Colors.primaryLight,
  },
  dueText: {
    ...Type.micro,
    color: Colors.textMuted,
  },
  overdue: {
    color: Colors.error,
  },
  message: {
    ...Type.bodyMed,
    marginBottom: 4,
  },
  textDone: {
    textDecorationLine: "line-through",
    color: Colors.textMuted,
  },
  contextText: {
    ...Type.caption,
    color: Colors.textFaint,
  },
  deleteBtn: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  deleteBtnText: {
    ...Type.caption,
    color: Colors.error,
  },
  modalBg: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Type.h2,
  },
  cancelBtn: {
    ...Type.body,
    color: Colors.textMuted,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  label: {
    ...Type.caption,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  typeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Type.caption,
  },
  chipTextActive: {
    color: Colors.primaryLight,
  },
});
