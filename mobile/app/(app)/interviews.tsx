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
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "@/constants/theme";

interface Interview {
  id: string;
  company: string;
  role: string;
  date: string;
  time: string;
  type: string;
  location: string;
  link: string;
  notes: string;
  status: string;
}

const INTERVIEW_TYPES = [
  "Technical",
  "Behavioral",
  "HR",
  "System Design",
  "Case Study",
  "Take-Home",
  "Culture Fit",
];

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) >= new Date(new Date().setHours(0, 0, 0, 0));
}

function InterviewCard({
  item,
  onPress,
}: {
  item: Interview;
  onPress: () => void;
}) {
  const upcoming = isUpcoming(item.date);
  const typeColors: Record<string, string> = {
    Technical: Colors.primary,
    Behavioral: Colors.success,
    HR: Colors.info,
    "System Design": Colors.warning,
    default: Colors.textSecondary,
  };
  const typeColor = typeColors[item.type] ?? typeColors.default;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardDateCol}>
        <Text style={styles.dateDay}>
          {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric" })}
        </Text>
        <Text style={styles.dateMonth}>
          {new Date(item.date).toLocaleDateString("en-IN", { month: "short" })}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Text style={styles.cardRole} numberOfLines={1}>
            {item.role}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {item.type}
            </Text>
          </View>
        </View>
        <Text style={styles.cardCompany}>{item.company}</Text>
        <View style={styles.metaRow}>
          {item.time && (
            <Text style={styles.metaChip}>🕐 {item.time}</Text>
          )}
          {item.location && (
            <Text style={styles.metaChip}>📍 {item.location}</Text>
          )}
          {item.link && (
            <Text style={styles.metaChip}>🔗 Online</Text>
          )}
        </View>
      </View>
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: upcoming ? Colors.success : Colors.textMuted,
          },
        ]}
      />
    </TouchableOpacity>
  );
}

function AddEditModal({
  visible,
  onClose,
  onSave,
  initial,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<Interview>) => void;
  initial?: Partial<Interview>;
}) {
  const [company, setCompany] = useState(initial?.company ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [date, setDate] = useState(
    initial?.date ?? new Date().toISOString().split("T")[0]
  );
  const [time, setTime] = useState(initial?.time ?? "");
  const [type, setType] = useState(initial?.type ?? "Technical");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setCompany(initial?.company ?? "");
      setRole(initial?.role ?? "");
      setDate(initial?.date ?? new Date().toISOString().split("T")[0]);
      setTime(initial?.time ?? "");
      setType(initial?.type ?? "Technical");
      setLocation(initial?.location ?? "");
      setLink(initial?.link ?? "");
      setNotes(initial?.notes ?? "");
    }
  }, [visible, initial]);

  const handleSave = async () => {
    if (!company.trim() || !role.trim() || !date) {
      Alert.alert("Required", "Company, role, and date are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        company: company.trim(),
        role: role.trim(),
        date,
        time,
        type,
        location,
        link,
        notes,
      });
      onClose();
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
          <Text style={modalStyles.title}>
            {initial?.id ? "Edit Interview" : "Schedule Interview"}
          </Text>
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
          showsVerticalScrollIndicator={false}
        >
          <Field label="Company *">
            <TextInput
              style={modalStyles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="e.g. Google"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>
          <Field label="Role *">
            <TextInput
              style={modalStyles.input}
              value={role}
              onChangeText={setRole}
              placeholder="e.g. Software Engineer"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>
          <Field label="Date (YYYY-MM-DD) *">
            <TextInput
              style={modalStyles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2024-12-25"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
          </Field>
          <Field label="Time">
            <TextInput
              style={modalStyles.input}
              value={time}
              onChangeText={setTime}
              placeholder="e.g. 10:00 AM IST"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>
          <Field label="Type">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={modalStyles.chipRow}>
                {INTERVIEW_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[modalStyles.chip, type === t && modalStyles.chipActive]}
                    onPress={() => setType(t)}
                  >
                    <Text
                      style={[
                        modalStyles.chipText,
                        type === t && modalStyles.chipTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Field>
          <Field label="Location">
            <TextInput
              style={modalStyles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Mumbai Office / Zoom"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>
          <Field label="Meeting Link">
            <TextInput
              style={modalStyles.input}
              value={link}
              onChangeText={setLink}
              placeholder="https://meet.google.com/..."
              placeholderTextColor={Colors.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />
          </Field>
          <Field label="Notes">
            <TextInput
              style={[modalStyles.input, modalStyles.textarea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Topics to prepare, interviewer name..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </Field>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={modalStyles.fieldGroup}>
      <Text style={modalStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function InterviewsScreen() {
  const insets = useSafeAreaInsets();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Interview | undefined>(undefined);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.INTERVIEWS);
      setInterviews(res.data);
    } catch (e) {
      console.error("Interviews load error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Partial<Interview>) => {
    try {
      if (editItem?.id) {
        await apiClient.patch(`${API_ENDPOINTS.INTERVIEWS}/${editItem.id}`, data);
      } else {
        await apiClient.post(API_ENDPOINTS.INTERVIEWS, data);
      }
      setEditItem(undefined);
      load();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to save interview");
      throw err;
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Interview", "Remove this interview from your schedule?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`${API_ENDPOINTS.INTERVIEWS}/${id}`);
            load();
          } catch {
            Alert.alert("Error", "Failed to delete interview.");
          }
        },
      },
    ]);
  };

  const filtered = interviews.filter((i) =>
    tab === "upcoming" ? isUpcoming(i.date) : !isUpcoming(i.date)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Interviews</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { setEditItem(undefined); setShowModal(true); }}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(["upcoming", "past"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "upcoming" ? "📅 Upcoming" : "🕐 Past"}
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
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <InterviewCard
              item={item}
              onPress={() => {
                Alert.alert(
                  `${item.role} at ${item.company}`,
                  `Date: ${formatDate(item.date)}\nTime: ${item.time || "TBD"}\nType: ${item.type}\n${item.notes ? `\nNotes:\n${item.notes}` : ""}`,
                  [
                    { text: "Edit", onPress: () => { setEditItem(item); setShowModal(true); } },
                    { text: "Delete", style: "destructive", onPress: () => handleDelete(item.id) },
                    { text: "Close", style: "cancel" },
                  ]
                );
              }}
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
              <Text style={styles.emptyEmoji}>🗓️</Text>
              <Text style={styles.emptyTitle}>
                {tab === "upcoming" ? "No upcoming interviews" : "No past interviews"}
              </Text>
              {tab === "upcoming" && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => setShowModal(true)}
                >
                  <Text style={styles.emptyBtnText}>+ Schedule Interview</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <AddEditModal
        visible={showModal}
        onClose={() => { setShowModal(false); setEditItem(undefined); }}
        onSave={handleSave}
        initial={editItem}
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
  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  addBtnText: { color: "#fff", fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
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
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
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
    alignItems: "center",
    gap: Spacing.md,
  },
  cardDateCol: {
    width: 44,
    alignItems: "center",
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.md,
    padding: 8,
  },
  dateDay: {
    color: Colors.primaryLight,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    lineHeight: 24,
  },
  dateMonth: { color: Colors.primaryLight, fontSize: FontSize.xs },
  cardContent: { flex: 1 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cardRole: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  typeText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  cardCompany: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: 6 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaChip: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
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
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: 6,
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
  textarea: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
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
});
