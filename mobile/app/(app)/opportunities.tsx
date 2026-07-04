import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface Opportunity {
  id: string;
  title: string;
  company: string;
  location?: string;
  isRemote: boolean;
  employmentType: string;
  salary?: string;
  url?: string;
  sourcePlatform?: string;
  status: string;
  priority: string;
  deadline?: string;
  skills: string[];
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  "ALL",
  "SAVED",
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];
const PRIORITY_OPTIONS = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"];
const EMPLOYMENT_TYPES = [
  "ALL",
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "FREELANCE",
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg =
    Colors.status[status as keyof typeof Colors.status] ?? Colors.status.SAVED;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.badgeText, { color: cfg.text }]}>{status}</Text>
    </View>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const cfg =
    Colors.priority[priority as keyof typeof Colors.priority] ??
    Colors.priority.MEDIUM;
  return (
    <View style={[styles.priorityBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.priorityText, { color: cfg.text }]}>
        {priority}
      </Text>
    </View>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({
  item,
  onPress,
}: {
  item: Opportunity;
  onPress: () => void;
}) {
  const deadlineSoon =
    item.deadline &&
    new Date(item.deadline).getTime() - Date.now() < 3 * 86400000;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardCompany} numberOfLines={1}>
            {item.company}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.cardMeta}>
        {item.location && (
          <Text style={styles.metaChip}>
            📍 {item.isRemote ? "Remote" : item.location}
          </Text>
        )}
        {item.employmentType && (
          <Text style={styles.metaChip}>
            {item.employmentType.replace("_", " ")}
          </Text>
        )}
        <PriorityBadge priority={item.priority} />
      </View>
      {deadlineSoon && item.deadline && (
        <Text style={styles.deadlineWarning}>
          ⚠️ Deadline:{" "}
          {new Date(item.deadline).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </Text>
      )}
      {item.skills.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.skillsRow}
        >
          {item.skills.slice(0, 5).map((s) => (
            <View key={s} style={styles.skillChip}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </TouchableOpacity>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
function AddEditModal({
  visible,
  onClose,
  onSave,
  initial,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<Opportunity>) => void;
  initial?: Partial<Opportunity>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [isRemote, setIsRemote] = useState(initial?.isRemote ?? false);
  const [status, setStatus] = useState(initial?.status ?? "SAVED");
  const [priority, setPriority] = useState(initial?.priority ?? "MEDIUM");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [skillsRaw, setSkillsRaw] = useState(
    (initial?.skills ?? []).join(", ")
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(initial?.title ?? "");
      setCompany(initial?.company ?? "");
      setLocation(initial?.location ?? "");
      setIsRemote(initial?.isRemote ?? false);
      setStatus(initial?.status ?? "SAVED");
      setPriority(initial?.priority ?? "MEDIUM");
      setUrl(initial?.url ?? "");
      setNotes(initial?.notes ?? "");
      setSkillsRaw((initial?.skills ?? []).join(", "));
    }
  }, [visible, initial]);

  const handleSave = async () => {
    if (!title.trim() || !company.trim()) {
      Alert.alert("Required", "Job title and company are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || undefined,
        isRemote,
        status,
        priority,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        skills: skillsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
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
        {/* Header */}
        <View style={addStyles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={addStyles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={addStyles.modalTitle}>
            {initial?.id ? "Edit Job" : "Add Job"}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Text style={addStyles.saveBtn}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={addStyles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormField label="Job Title *">
            <TextInput
              style={addStyles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Software Engineer Intern"
              placeholderTextColor={Colors.textMuted}
            />
          </FormField>
          <FormField label="Company *">
            <TextInput
              style={addStyles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="e.g. Google"
              placeholderTextColor={Colors.textMuted}
            />
          </FormField>
          <FormField label="Location">
            <TextInput
              style={addStyles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Bangalore, India"
              placeholderTextColor={Colors.textMuted}
            />
          </FormField>

          {/* Remote Toggle */}
          <View style={addStyles.toggleRow}>
            <Text style={addStyles.label}>Remote</Text>
            <TouchableOpacity
              style={[addStyles.toggle, isRemote && addStyles.toggleOn]}
              onPress={() => setIsRemote(!isRemote)}
            >
              <View
                style={[
                  addStyles.toggleThumb,
                  isRemote && addStyles.toggleThumbOn,
                ]}
              />
            </TouchableOpacity>
          </View>

          <FormField label="Status">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={addStyles.chipRow}>
                {STATUS_OPTIONS.filter((s) => s !== "ALL").map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      addStyles.chip,
                      status === s && addStyles.chipActive,
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <Text
                      style={[
                        addStyles.chipText,
                        status === s && addStyles.chipTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </FormField>

          <FormField label="Priority">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={addStyles.chipRow}>
                {PRIORITY_OPTIONS.filter((p) => p !== "ALL").map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      addStyles.chip,
                      priority === p && addStyles.chipActive,
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        addStyles.chipText,
                        priority === p && addStyles.chipTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </FormField>

          <FormField label="Job URL">
            <TextInput
              style={addStyles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://..."
              placeholderTextColor={Colors.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />
          </FormField>

          <FormField label="Skills (comma-separated)">
            <TextInput
              style={addStyles.input}
              value={skillsRaw}
              onChangeText={setSkillsRaw}
              placeholder="React, Node.js, TypeScript"
              placeholderTextColor={Colors.textMuted}
            />
          </FormField>

          <FormField label="Notes">
            <TextInput
              style={[addStyles.input, addStyles.textarea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any notes about this role..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </FormField>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={addStyles.fieldGroup}>
      <Text style={addStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OpportunitiesScreen() {
  const insets = useSafeAreaInsets();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Opportunity | undefined>(undefined);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  const loadOpps = useCallback(
    async (q?: string, status?: string) => {
      try {
        const params: Record<string, string> = {};
        if (q) params.search = q;
        if (status && status !== "ALL") params.status = status;
        const res = await apiClient.get(API_ENDPOINTS.OPPORTUNITIES, {
          params,
        });
        setOpps(res.data);
      } catch (e) {
        console.error("Opps load error", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadOpps(search, statusFilter);
  }, [statusFilter]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearch(text);
      loadOpps(text, statusFilter);
    },
    [statusFilter]
  );

  const handleSave = async (data: Partial<Opportunity>) => {
    try {
      if (editItem?.id) {
        await apiClient.patch(
          `${API_ENDPOINTS.OPPORTUNITIES}/${editItem.id}`,
          data
        );
      } else {
        await apiClient.post(API_ENDPOINTS.OPPORTUNITIES, data);
      }
      setEditItem(undefined);
      loadOpps(search, statusFilter);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.error || "Failed to save opportunity"
      );
      throw err;
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Job", "Are you sure you want to delete this job?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`${API_ENDPOINTS.OPPORTUNITIES}/${id}`);
            setSelectedOpp(null);
            loadOpps(search, statusFilter);
          } catch {
            Alert.alert("Error", "Failed to delete job.");
          }
        },
      },
    ]);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`${API_ENDPOINTS.OPPORTUNITIES}/${id}`, {
        status: newStatus,
      });
      loadOpps(search, statusFilter);
      setSelectedOpp((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
    } catch {
      Alert.alert("Error", "Failed to update status.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Job Tracker</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditItem(undefined);
            setShowModal(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs, companies..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => handleSearch("")}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {STATUS_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.filterChip,
              statusFilter === s && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(s)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === s && styles.filterChipTextActive,
              ]}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={opps}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JobCard
              item={item}
              onPress={() => setSelectedOpp(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadOpps(search, statusFilter);
              }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🗂️</Text>
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.emptySubTitle}>
                {search ? "Try a different search" : "Add your first job opportunity"}
              </Text>
              {!search && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => setShowModal(true)}
                >
                  <Text style={styles.emptyBtnText}>+ Add Job</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <AddEditModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditItem(undefined);
        }}
        onSave={handleSave}
        initial={editItem}
      />

      {/* Detail Modal */}
      {selectedOpp && (
        <DetailModal
          opp={selectedOpp}
          onClose={() => setSelectedOpp(null)}
          onEdit={() => {
            setEditItem(selectedOpp);
            setSelectedOpp(null);
            setShowModal(true);
          }}
          onDelete={() => handleDelete(selectedOpp.id)}
          onStatusChange={(newStatus) =>
            handleStatusChange(selectedOpp.id, newStatus)
          }
        />
      )}
    </View>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({
  opp,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  opp: Opportunity;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: string) => void;
}) {
  const STATUS_PIPELINE = [
    "SAVED",
    "APPLIED",
    "ASSESSMENT",
    "INTERVIEW",
    "OFFER",
  ];
  const currentIdx = STATUS_PIPELINE.indexOf(opp.status);

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: Colors.bgModal }}>
        <View style={detailStyles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={detailStyles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <View style={detailStyles.headerActions}>
            <TouchableOpacity style={detailStyles.actionBtn} onPress={onEdit}>
              <Text style={detailStyles.actionBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[detailStyles.actionBtn, detailStyles.deleteBtn]}
              onPress={onDelete}
            >
              <Text style={detailStyles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={detailStyles.content}
        >
          <Text style={detailStyles.title}>{opp.title}</Text>
          <Text style={detailStyles.company}>{opp.company}</Text>

          <View style={detailStyles.badgesRow}>
            <StatusBadge status={opp.status} />
            <PriorityBadge priority={opp.priority} />
            {opp.isRemote && (
              <View style={detailStyles.remoteBadge}>
                <Text style={detailStyles.remoteBadgeText}>🌐 Remote</Text>
              </View>
            )}
          </View>

          {/* Pipeline */}
          <Text style={detailStyles.sectionTitle}>Status Pipeline</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={detailStyles.pipelineScroll}
          >
            {STATUS_PIPELINE.map((s, i) => (
              <TouchableOpacity
                key={s}
                style={detailStyles.pipelineStep}
                onPress={() => onStatusChange(s)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    detailStyles.pipelineDot,
                    i <= currentIdx && detailStyles.pipelineDotActive,
                    i === currentIdx && detailStyles.pipelineDotCurrent,
                  ]}
                >
                  {i <= currentIdx && (
                    <Text style={detailStyles.pipelineDotIcon}>
                      {i === currentIdx ? "●" : "✓"}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    detailStyles.pipelineLabel,
                    i === currentIdx && detailStyles.pipelineLabelActive,
                  ]}
                >
                  {s}
                </Text>
                {i < STATUS_PIPELINE.length - 1 && (
                  <View
                    style={[
                      detailStyles.pipelineLine,
                      i < currentIdx && detailStyles.pipelineLineActive,
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Meta info */}
          <View style={detailStyles.infoGrid}>
            {opp.location && (
              <InfoRow icon="📍" label="Location" value={opp.location} />
            )}
            {opp.employmentType && (
              <InfoRow
                icon="💼"
                label="Type"
                value={opp.employmentType.replace("_", " ")}
              />
            )}
            {opp.salary && (
              <InfoRow icon="💰" label="Salary" value={opp.salary} />
            )}
            {opp.sourcePlatform && (
              <InfoRow icon="🔗" label="Source" value={opp.sourcePlatform} />
            )}
            {opp.deadline && (
              <InfoRow
                icon="⏰"
                label="Deadline"
                value={new Date(opp.deadline).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            )}
          </View>

          {/* Skills */}
          {opp.skills.length > 0 && (
            <>
              <Text style={detailStyles.sectionTitle}>Required Skills</Text>
              <View style={detailStyles.skillsWrap}>
                {opp.skills.map((s) => (
                  <View key={s} style={detailStyles.skillTag}>
                    <Text style={detailStyles.skillTagText}>{s}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Notes */}
          {opp.notes && (
            <>
              <Text style={detailStyles.sectionTitle}>Notes</Text>
              <View style={detailStyles.notesBox}>
                <Text style={detailStyles.notesText}>{opp.notes}</Text>
              </View>
            </>
          )}

          {/* Rejected status option */}
          {opp.status !== "REJECTED" && opp.status !== "SAVED" && (
            <TouchableOpacity
              style={detailStyles.rejectBtn}
              onPress={() => onStatusChange("REJECTED")}
            >
              <Text style={detailStyles.rejectBtnText}>Mark as Rejected</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={detailStyles.infoRow}>
      <Text style={detailStyles.infoIcon}>{icon}</Text>
      <View>
        <Text style={detailStyles.infoLabel}>{label}</Text>
        <Text style={detailStyles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  addBtnText: {
    color: "#fff",
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  searchRow: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    position: "relative",
  },
  searchInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  clearBtn: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  clearBtnText: { color: Colors.textMuted, fontSize: 16 },
  filterScroll: { marginBottom: Spacing.sm },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  filterChipTextActive: { color: Colors.primaryLight },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardLeft: { flex: 1, marginRight: Spacing.sm },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  cardCompany: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  metaChip: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  deadlineWarning: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    marginBottom: 6,
    fontWeight: FontWeight.medium,
  },
  skillsRow: { marginTop: 4 },
  skillChip: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginRight: 6,
  },
  skillText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  priorityText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: 6,
  },
  emptySubTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
});

const addStyles = StyleSheet.create({
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelBtn: { color: Colors.textSecondary, fontSize: FontSize.md },
  modalTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
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
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    padding: 2,
  },
  toggleOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.textMuted,
  },
  toggleThumbOn: {
    backgroundColor: "#fff",
    alignSelf: "flex-end",
  },
  chipRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.xs },
  chipTextActive: { color: Colors.primaryLight, fontWeight: FontWeight.semibold },
});

const detailStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: { color: Colors.textSecondary, fontSize: 20 },
  headerActions: { flexDirection: "row", gap: Spacing.sm },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: { color: Colors.text, fontSize: FontSize.sm },
  deleteBtn: { borderColor: Colors.error + "50" },
  deleteBtnText: { color: Colors.error, fontSize: FontSize.sm },
  content: { padding: Spacing.lg },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  company: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  badgesRow: { flexDirection: "row", gap: 8, marginBottom: Spacing.lg, flexWrap: "wrap" },
  remoteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.infoMuted,
  },
  remoteBadgeText: { color: Colors.info, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pipelineScroll: { marginBottom: Spacing.md },
  pipelineStep: { alignItems: "center", width: 80 },
  pipelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  pipelineDotActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  pipelineDotCurrent: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pipelineDotIcon: { color: "#fff", fontSize: 10, fontWeight: FontWeight.bold },
  pipelineLabel: { color: Colors.textMuted, fontSize: 10, textAlign: "center" },
  pipelineLabelActive: { color: Colors.primaryLight, fontWeight: FontWeight.semibold },
  pipelineLine: {
    position: "absolute",
    top: 14,
    left: 64,
    width: 16,
    height: 2,
    backgroundColor: Colors.border,
  },
  pipelineLineActive: { backgroundColor: Colors.primary },
  infoGrid: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    marginTop: Spacing.sm,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoIcon: { fontSize: 16, marginTop: 2 },
  infoLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  infoValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  skillTag: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  skillTagText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  notesBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  rejectBtn: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error + "50",
    alignItems: "center",
  },
  rejectBtnText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
});
