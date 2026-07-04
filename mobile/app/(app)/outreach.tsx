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
import { API_ENDPOINTS } from "@/constants/api";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "@/constants/theme";

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalRecords: number;
  sentCount: number;
  repliedCount: number;
  interviewCount: number;
  createdAt: string;
}

function CampaignCard({ campaign, onPress }: { campaign: Campaign; onPress: () => void }) {
  const statusColor: Record<string, string> = {
    DRAFT: Colors.textSecondary,
    READY: Colors.primary,
    SENDING: Colors.warning,
    SENT: Colors.success,
  };
  const color = statusColor[campaign.status] ?? Colors.textSecondary;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{campaign.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: color + "20" }]}>
          <Text style={[styles.statusText, { color }]}>{campaign.status}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <StatPill emoji="👥" label="Total" value={campaign.totalRecords} />
        <StatPill emoji="📤" label="Sent" value={campaign.sentCount} />
        <StatPill emoji="💬" label="Replied" value={campaign.repliedCount} />
        <StatPill emoji="🗓️" label="Interviews" value={campaign.interviewCount} />
      </View>
      <Text style={styles.cardDate}>
        Created {new Date(campaign.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })}
      </Text>
    </TouchableOpacity>
  );
}

function StatPill({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CreateCampaignModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, recruiters: any[]) => void;
}) {
  const [name, setName] = useState("");
  const [recruiterRows, setRecruiterRows] = useState([
    { recruiterName: "", recruiterEmail: "", companyName: "", recruiterRole: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const addRow = () => {
    setRecruiterRows((r) => [
      ...r,
      { recruiterName: "", recruiterEmail: "", companyName: "", recruiterRole: "" },
    ]);
  };

  const updateRow = (idx: number, field: string, val: string) => {
    setRecruiterRows((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r))
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Required", "Campaign name is required."); return; }
    const valid = recruiterRows.filter((r) => r.companyName.trim());
    if (valid.length === 0) { Alert.alert("Required", "Add at least one recruiter/company."); return; }
    setSaving(true);
    try {
      await onSave(name.trim(), valid);
      setName("");
      setRecruiterRows([{ recruiterName: "", recruiterEmail: "", companyName: "", recruiterRole: "" }]);
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bgModal }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose}><Text style={modalStyles.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={modalStyles.title}>New Campaign</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.primary} size="small" /> : <Text style={modalStyles.save}>Create</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }} keyboardShouldPersistTaps="handled">
          <View style={{ marginBottom: Spacing.md }}>
            <Text style={modalStyles.label}>Campaign Name</Text>
            <TextInput style={modalStyles.input} value={name} onChangeText={setName}
              placeholder="e.g. Summer Internship 2025" placeholderTextColor={Colors.textMuted} />
          </View>
          <Text style={modalStyles.sectionHeader}>Recruiters / Companies</Text>
          {recruiterRows.map((row, idx) => (
            <View key={idx} style={modalStyles.recruiterCard}>
              <Text style={modalStyles.recruiterNum}>#{idx + 1}</Text>
              {[
                { key: "companyName", label: "Company *", placeholder: "Stripe" },
                { key: "recruiterName", label: "Recruiter Name", placeholder: "John Doe" },
                { key: "recruiterEmail", label: "Email", placeholder: "john@stripe.com" },
                { key: "recruiterRole", label: "Role", placeholder: "Engineering Manager" },
              ].map((f) => (
                <View key={f.key} style={{ marginBottom: 8 }}>
                  <Text style={modalStyles.subLabel}>{f.label}</Text>
                  <TextInput style={modalStyles.smallInput}
                    value={(row as any)[f.key]}
                    onChangeText={(v) => updateRow(idx, f.key, v)}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize={f.key === "recruiterEmail" ? "none" : "sentences"}
                    keyboardType={f.key === "recruiterEmail" ? "email-address" : "default"}
                  />
                </View>
              ))}
            </View>
          ))}
          <TouchableOpacity style={modalStyles.addRowBtn} onPress={addRow}>
            <Text style={modalStyles.addRowText}>+ Add Another</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function OutreachScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const [campaignsRes, statsRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.OUTREACH_CAMPAIGNS),
        apiClient.get(API_ENDPOINTS.OUTREACH_STATS),
      ]);
      setCampaigns(campaignsRes.data);
      setStats(statsRes.data);
    } catch (e) { console.error("Outreach load error", e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (name: string, recruiters: any[]) => {
    try {
      await apiClient.post(API_ENDPOINTS.OUTREACH_CAMPAIGNS, { name, recruiters });
      load();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to create campaign.");
      throw err;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Outreach</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Global Stats */}
      {stats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.globalStats} contentContainerStyle={styles.globalStatsContent}>
          {[
            { emoji: "📣", label: "Campaigns", value: stats.totalCampaigns },
            { emoji: "📤", label: "Sent", value: stats.totalEmailsSent },
            { emoji: "💬", label: "Replied", value: stats.totalReplied },
            { emoji: "🗓️", label: "Interviews", value: stats.totalInterviews },
            { emoji: "📈", label: "Response %", value: `${stats.responseRate}%` },
          ].map((s) => (
            <View key={s.label} style={styles.globalStatCard}>
              <Text style={styles.globalStatEmoji}>{s.emoji}</Text>
              <Text style={styles.globalStatValue}>{s.value}</Text>
              <Text style={styles.globalStatLabel}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <CampaignCard
              campaign={item}
              onPress={() =>
                Alert.alert(
                  item.name,
                  `Status: ${item.status}\nTotal: ${item.totalRecords}\nSent: ${item.sentCount}\nReplied: ${item.repliedCount}`,
                  [{ text: "OK" }]
                )
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📣</Text>
              <Text style={styles.emptyTitle}>No campaigns yet</Text>
              <Text style={styles.emptySubTitle}>Create a campaign to start reaching out to recruiters</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
                <Text style={styles.emptyBtnText}>+ Create Campaign</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <CreateCampaignModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreate}
      />
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
  globalStats: { flexGrow: 0, marginBottom: Spacing.sm },
  globalStatsContent: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  globalStatCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md,
    alignItems: "center", borderWidth: 1, borderColor: Colors.border, minWidth: 80,
  },
  globalStatEmoji: { fontSize: 18, marginBottom: 4 },
  globalStatValue: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  globalStatLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  cardTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  statPill: {
    flex: 1, backgroundColor: Colors.bgElevated, borderRadius: BorderRadius.sm,
    padding: 8, alignItems: "center",
  },
  statEmoji: { fontSize: 12 },
  statValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statLabel: { color: Colors.textMuted, fontSize: 9 },
  cardDate: { color: Colors.textMuted, fontSize: FontSize.xs },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 60, paddingHorizontal: Spacing.lg },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginBottom: 8 },
  emptySubTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: "center", marginBottom: Spacing.md },
  emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: 12, borderRadius: BorderRadius.md },
  emptyBtnText: { color: "#fff", fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
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
  sectionHeader: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  input: {
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 13,
    color: Colors.text, fontSize: FontSize.sm,
  },
  recruiterCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  recruiterNum: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: 8 },
  subLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: 4 },
  smallInput: {
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.sm, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 10,
    color: Colors.text, fontSize: FontSize.xs,
  },
  addRowBtn: {
    borderWidth: 1, borderColor: Colors.primary, borderStyle: "dashed",
    borderRadius: BorderRadius.md, paddingVertical: 12, alignItems: "center", marginBottom: Spacing.sm,
  },
  addRowText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
});
