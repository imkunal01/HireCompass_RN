import React, { useState, useRef, useCallback } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient, { streamFetch } from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, EmptyState, Button, Input } from "@/components/ui";
import {
  Users,
  ArrowLeft,
  MessageSquare,
  X,
  CheckSquare,
  Square,
  FileText,
  Send,
  ChevronRight,
  RotateCcw,
  Megaphone,
  CheckCircle,
  Clock,
  Mail,
  UploadCloud,
} from "lucide-react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

type Tab = "CONTACTS" | "CAMPAIGNS";

const STATUS_COLORS: Record<string, string> = {
  PENDING: Colors.textMuted,
  DRAFT: "#9B7D00",
  APPROVED: "#1a7f37",
  SENDING: Colors.primaryLight,
  SENT: Colors.primary,
  FOLLOW_UP_SENT: "#7c3aed",
  REPLIED: "#16a34a",
  REJECTED: Colors.error,
};

export default function OutreachScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("CAMPAIGNS");
  const [selectedRecruiters, setSelectedRecruiters] = useState<Set<string>>(new Set());
  const [importedContacts, setImportedContacts] = useState<any[]>([]);
  const [selectedCv, setSelectedCv] = useState<any>(null);
  const [campaignName, setCampaignName] = useState("");
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);

  // Campaign detail / send panel
  const campaignSheetRef = useRef<BottomSheetModal>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [campaignRecords, setCampaignRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // AI draft panel (per-record)
  const draftSheetRef = useRef<BottomSheetModal>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [aiDraft, setAiDraft] = useState("");
  const [aiDraftLoading, setAiDraftLoading] = useState(false);

  // ── Data queries ────────────────────────────────────────────────────────────

  const { data: contacts = [], isLoading: contactsLoading, refetch: refetchContacts, isRefetching: isRefetchingContacts } = useQuery({
    queryKey: ["outreach_contacts"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.OUTREACH);
      return res.data;
    },
  });

  const { data: campaigns = [], isLoading: campaignsLoading, refetch: refetchCampaigns, isRefetching: isRefetchingCampaigns } = useQuery({
    queryKey: ["outreach_campaigns"],
    queryFn: async () => {
      const res = await apiClient.get(`${API_ENDPOINTS.OUTREACH}/campaigns`);
      return res.data;
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.DOCUMENTS);
      return res.data;
    },
  });

  // ── Mutations ───────────────────────────────────────────────────────────────

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      let selectedContactsData = [];
      if (importedContacts.length > 0) {
        selectedContactsData = importedContacts.map((c: any) => ({
          recruiterName: c.recruiterName,
          recruiterEmail: c.recruiterEmail || "",
          recruiterRole: c.recruiterRole,
          companyName: c.companyName,
          industry: c.industry,
          techStack: c.techStack,
        }));
      } else {
        selectedContactsData = contacts
          .filter((c: any) => selectedRecruiters.has(c.id))
          .map((c: any) => ({
            recruiterName: c.name,
            recruiterEmail: c.email || "",
            recruiterRole: c.role,
            companyName: c.company,
          }));
      }

      const res = await apiClient.post(`${API_ENDPOINTS.OUTREACH}/campaigns`, {
        name: campaignName,
        recruiters: selectedContactsData,
        attachedCvId: selectedCv?.id || null,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach_campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["outreach_contacts"] });
      setCampaignModalVisible(false);
      setCampaignName("");
      setSelectedRecruiters(new Set());
      setImportedContacts([]);
      setSelectedCv(null);
      setTab("CAMPAIGNS");
      Alert.alert("Campaign created!", "You can now generate and send emails from the Campaigns tab.");
    },
    onError: (err: any) => Alert.alert("Error", err?.response?.data?.error || "Failed to create campaign"),
  });

  const extractMutation = useMutation({
    mutationFn: async (fileContent: string) => {
      const res = await apiClient.post(`${API_ENDPOINTS.OUTREACH}/extract`, {
        content: fileContent,
        fileType: "csv",
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.records && data.records.length > 0) {
        setImportedContacts(data.records);
        setCampaignName("Imported Campaign");
        setCampaignModalVisible(true);
      } else {
        Alert.alert("Import Failed", "No valid contacts found in the file.");
      }
    },
    onError: (err: any) => Alert.alert("Extraction Error", err?.response?.data?.error || "Failed to parse file"),
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await apiClient.post(`${API_ENDPOINTS.OUTREACH}/send`, { campaignId });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["outreach_campaigns"] });
      Alert.alert("Emails Sent!", `Sent: ${data.sent}  Failed: ${data.failed}`);
      campaignSheetRef.current?.dismiss();
      loadCampaignRecords(selectedCampaign?.id);
    },
    onError: (err: any) => {
      Alert.alert("Send Failed", err?.response?.data?.error || "Could not send emails. Check that GMAIL credentials are configured on the server.");
    },
  });

  const approveRecordMutation = useMutation({
    mutationFn: async ({ recordId, status }: { recordId: string; status: string }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.OUTREACH}/records/${recordId}`, { status });
      return res.data;
    },
    onSuccess: () => {
      loadCampaignRecords(selectedCampaign?.id);
    },
  });

  const followUpMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const res = await apiClient.post(`${API_ENDPOINTS.OUTREACH}/followup`, { recordId });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.preview) {
        Alert.alert("Follow-up Preview", `Subject: ${data.subject}\n\n${data.body}`);
      } else {
        Alert.alert("Follow-up Sent!", "Your follow-up email was dispatched.");
        loadCampaignRecords(selectedCampaign?.id);
      }
    },
    onError: (err: any) => Alert.alert("Error", err?.response?.data?.error || "Follow-up failed"),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const loadCampaignRecords = async (campaignId: string) => {
    if (!campaignId) return;
    setRecordsLoading(true);
    try {
      // Fetch the contacts that belong to this campaign — we reuse the outreach_records route
      // by querying the full contact list and filtering by campaignId on client side
      // (Backend doesn't have a dedicated records-by-campaign endpoint, but contacts carry campaignId)
      // For now we show records stored in the outreach_records collection (all of the user's)
      const res = await apiClient.get(`${API_ENDPOINTS.OUTREACH}?campaignId=${campaignId}`);
      setCampaignRecords(res.data.filter((r: any) => r.campaignId === campaignId || !r.campaignId));
    } catch (e) {
      setCampaignRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const openCampaignDetail = (campaign: any) => {
    setSelectedCampaign(campaign);
    loadCampaignRecords(campaign.id);
    campaignSheetRef.current?.present();
  };

  const generateDraftForRecord = async (record: any) => {
    setSelectedRecord(record);
    setAiDraft("");
    setAiDraftLoading(true);
    draftSheetRef.current?.present();

    const profile = { fullName: "User", skills: [], bio: "" }; // will be fetched from profile endpoint ideally
    await streamFetch(
      `${API_ENDPOINTS.OUTREACH}/generate-emails`,
      { recordId: record.id, profile },
      (chunk) => setAiDraft((prev) => prev + chunk),
      () => setAiDraftLoading(false),
      (err) => { setAiDraftLoading(false); Alert.alert("AI Error", err); }
    );
  };

  const handleApproveRecord = (record: any) => {
    approveRecordMutation.mutate({ recordId: record.id, status: "APPROVED" });
  };

  const handleFollowUp = (record: any) => {
    Alert.alert("Send Follow-up", `Send a follow-up email to ${record.name} at ${record.company}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Send", onPress: () => followUpMutation.mutate(record.id) },
    ]);
  };

  const toggleRecruiter = (id: string) => {
    const next = new Set(selectedRecruiters);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRecruiters(next);
  };

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets[0];
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      extractMutation.mutate(base64);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ),
    []
  );

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderCampaign = ({ item }: { item: any }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => openCampaignDetail(item)}>
      <Card variant="elevated" style={styles.campaignCard}>
        <View style={styles.campaignHeader}>
          <Megaphone size={20} color={Colors.primaryLight} />
          <View style={styles.campaignInfo}>
            <Text style={styles.campaignName}>{item.name}</Text>
            <Text style={styles.campaignMeta}>
              {item.totalRecords} recipients • {item.sentCount} sent
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[item.status] + "22" }]}>
            <Text style={[styles.statusPillText, { color: STATUS_COLORS[item.status] || Colors.textMuted }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <View style={styles.campaignStats}>
          <View style={styles.statItem}>
            <Mail size={14} color={Colors.textMuted} />
            <Text style={styles.statLabel}>{item.sentCount || 0} sent</Text>
          </View>
          <View style={styles.statItem}>
            <CheckCircle size={14} color={Colors.textMuted} />
            <Text style={styles.statLabel}>{item.repliedCount || 0} replies</Text>
          </View>
          <View style={styles.statItem}>
            <ChevronRight size={14} color={Colors.primary} />
            <Text style={[styles.statLabel, { color: Colors.primary }]}>View</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderContact = ({ item }: { item: any }) => {
    const isSelected = selectedRecruiters.has(item.id);
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => toggleRecruiter(item.id)}>
        <Card variant="elevated" style={[styles.contactCard, isSelected && styles.cardSelected]}>
          <View style={styles.contactRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.name || "?").charAt(0)}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactRole}>{item.role} @ {item.company}</Text>
              <View style={[styles.statusPill, { alignSelf: "flex-start", marginTop: 4, backgroundColor: STATUS_COLORS[item.status] + "22" }]}>
                <Text style={[styles.statusPillText, { color: STATUS_COLORS[item.status] || Colors.textMuted }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            {isSelected ? (
              <CheckSquare size={24} color={Colors.primary} />
            ) : (
              <Square size={24} color={Colors.textFaint} />
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderRecord = (record: any) => (
    <Card key={record.id} variant="default" style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordName}>{record.name}</Text>
        <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[record.status] + "22" }]}>
          <Text style={[styles.statusPillText, { color: STATUS_COLORS[record.status] || Colors.textMuted }]}>
            {record.status}
          </Text>
        </View>
      </View>
      <Text style={styles.recordCompany}>{record.role} @ {record.company}</Text>
      <View style={styles.recordActions}>
        {record.status === "PENDING" && (
          <Button variant="secondary" size="sm" onPress={() => handleApproveRecord(record)} style={{ flex: 1 }}>
            <CheckCircle size={14} color={Colors.primaryLight} />
            Approve
          </Button>
        )}
        {(record.status === "SENT" || record.status === "FOLLOW_UP_SENT") && (
          <Button variant="secondary" size="sm" onPress={() => handleFollowUp(record)} style={{ flex: 1 }}>
            <RotateCcw size={14} color={Colors.text} />
            Follow Up
          </Button>
        )}
        {record.status === "PENDING" && (
          <Button variant="secondary" size="sm" onPress={() => generateDraftForRecord(record)} style={{ flex: 1 }}>
            <MessageSquare size={14} color={Colors.text} />
            Generate
          </Button>
        )}
      </View>
    </Card>
  );

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Outreach</Text>
        <View style={{ flex: 1 }} />
        {tab === "CONTACTS" && (
          <View style={{ flexDirection: "row", gap: Spacing.sm }}>
            <Button variant="secondary" size="sm" onPress={handleImportCSV} loading={extractMutation.isPending}>
              <UploadCloud size={16} color={Colors.text} />
              Import CSV
            </Button>
            {selectedRecruiters.size > 0 && (
              <Button variant="primary" size="sm" onPress={() => { setImportedContacts([]); setCampaignModalVisible(true); }}>
                Campaign ({selectedRecruiters.size})
              </Button>
            )}
          </View>
        )}
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "CAMPAIGNS" && styles.tabBtnActive]}
          onPress={() => setTab("CAMPAIGNS")}
        >
          <Megaphone size={14} color={tab === "CAMPAIGNS" ? Colors.text : Colors.textMuted} />
          <Text style={[styles.tabText, tab === "CAMPAIGNS" && styles.tabTextActive]}>Campaigns</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "CONTACTS" && styles.tabBtnActive]}
          onPress={() => setTab("CONTACTS")}
        >
          <Users size={14} color={tab === "CONTACTS" ? Colors.text : Colors.textMuted} />
          <Text style={[styles.tabText, tab === "CONTACTS" && styles.tabTextActive]}>Contacts</Text>
        </TouchableOpacity>
      </View>

      {/* Campaigns Tab */}
      {tab === "CAMPAIGNS" && (
        campaignsLoading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={campaigns}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={isRefetchingCampaigns} onRefresh={refetchCampaigns} tintColor={Colors.primary} />}
            ListEmptyComponent={
              <EmptyState
                icon={Megaphone}
                title="No campaigns yet"
                description="Select contacts and create a campaign to start sending outreach emails."
                actionLabel="Go to Contacts"
                onAction={() => setTab("CONTACTS")}
              />
            }
            renderItem={renderCampaign}
          />
        )
      )}

      {/* Contacts Tab */}
      {tab === "CONTACTS" && (
        contactsLoading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={isRefetchingContacts} onRefresh={refetchContacts} tintColor={Colors.primary} />}
            ListEmptyComponent={
              <EmptyState
                icon={Users}
                title="No contacts yet"
                description="Import a CSV/Excel file via the web app to populate recruiter contacts."
              />
            }
            renderItem={renderContact}
          />
        )
      )}

      {/* ── Campaign Creation Modal ── */}
      <Modal visible={campaignModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Campaign</Text>
              <TouchableOpacity onPress={() => setCampaignModalVisible(false)}>
                <X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Input
                label="Campaign Name"
                placeholder="e.g. Summer 2026 SWE Outreach"
                value={campaignName}
                onChangeText={setCampaignName}
              />
              <Text style={styles.label}>Attach CV (Optional)</Text>
              <View style={styles.docsList}>
                {documents.map((doc: any) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.docOption, selectedCv?.id === doc.id && styles.docOptionSelected]}
                    onPress={() => setSelectedCv(doc.id === selectedCv?.id ? null : doc)}
                  >
                    <FileText size={18} color={selectedCv?.id === doc.id ? Colors.primary : Colors.textMuted} />
                    <Text style={[styles.docOptionText, selectedCv?.id === doc.id && { color: Colors.primary }]}>
                      {doc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {documents.length === 0 && (
                  <Text style={styles.emptyDocText}>No CVs uploaded yet. Upload one in Documents.</Text>
                )}
              </View>
              <Text style={styles.label}>
                Selected Contacts: {importedContacts.length > 0 ? importedContacts.length : selectedRecruiters.size}
              </Text>
              <Button
                variant="primary"
                style={{ marginTop: Spacing.lg }}
                loading={createCampaignMutation.isPending}
                disabled={!campaignName || (importedContacts.length === 0 && selectedRecruiters.size === 0)}
                onPress={() => createCampaignMutation.mutate()}
              >
                Create Campaign
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Campaign Detail Bottom Sheet ── */}
      <BottomSheetModal
        ref={campaignSheetRef}
        snapPoints={["75%", "95%"]}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: Colors.surface }}
        handleIndicatorStyle={{ backgroundColor: Colors.border }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {selectedCampaign && (
            <>
              <View style={styles.sheetTitleRow}>
                <View>
                  <Text style={styles.sheetTitle}>{selectedCampaign.name}</Text>
                  <Text style={styles.sheetSubtitle}>{selectedCampaign.totalRecords} contacts</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[selectedCampaign.status] + "22" }]}>
                  <Text style={[styles.statusPillText, { color: STATUS_COLORS[selectedCampaign.status] || Colors.textMuted }]}>
                    {selectedCampaign.status}
                  </Text>
                </View>
              </View>

              <View style={styles.campaignStatsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>{selectedCampaign.sentCount || 0}</Text>
                  <Text style={styles.statBoxLabel}>Sent</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>{selectedCampaign.repliedCount || 0}</Text>
                  <Text style={styles.statBoxLabel}>Replied</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>{selectedCampaign.interviewCount || 0}</Text>
                  <Text style={styles.statBoxLabel}>Interviews</Text>
                </View>
              </View>

              <Button
                variant="primary"
                loading={sendCampaignMutation.isPending}
                onPress={() => {
                  Alert.alert(
                    "Send Emails",
                    "This will send emails to all APPROVED records in this campaign. Make sure you have reviewed and approved the drafts first.",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Send", onPress: () => sendCampaignMutation.mutate(selectedCampaign.id) },
                    ]
                  );
                }}
                style={{ marginBottom: Spacing.lg }}
              >
                <Send size={16} color="#FFF" />
                Send to Approved Records
              </Button>

              <Text style={styles.recordsLabel}>Records</Text>
              {recordsLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
              ) : campaignRecords.length === 0 ? (
                <Text style={styles.emptyDocText}>No records found for this campaign.</Text>
              ) : (
                campaignRecords.map(renderRecord)
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* ── AI Draft Bottom Sheet ── */}
      <BottomSheetModal
        ref={draftSheetRef}
        snapPoints={["85%"]}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: Colors.surface }}
        handleIndicatorStyle={{ backgroundColor: Colors.border }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {selectedRecord && (
            <>
              <Text style={styles.sheetTitle}>AI Draft</Text>
              <Text style={styles.sheetSubtitle}>
                To: {selectedRecord.name} @ {selectedRecord.company}
              </Text>
              <View style={styles.draftBox}>
                <Text style={styles.draftText}>{aiDraft}</Text>
                {aiDraftLoading && <Text style={styles.cursor}>▋</Text>}
              </View>
              {!aiDraftLoading && aiDraft && (
                <Button
                  variant="primary"
                  style={{ marginTop: Spacing.lg }}
                  onPress={() => {
                    // Approve the record so it can be sent
                    approveRecordMutation.mutate({ recordId: selectedRecord.id, status: "APPROVED" });
                    draftSheetRef.current?.dismiss();
                  }}
                >
                  <CheckCircle size={16} color="#FFF" />
                  Approve & Mark Ready to Send
                </Button>
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm },
  title: { ...Type.h2 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  tabBtnActive: { backgroundColor: Colors.surfaceHighlight },
  tabText: { ...Type.bodyMed, color: Colors.textMuted },
  tabTextActive: { color: Colors.text },
  listContent: { padding: Spacing.md, paddingBottom: 120 },

  campaignCard: { marginBottom: Spacing.md, padding: Spacing.md },
  campaignHeader: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm },
  campaignInfo: { flex: 1, marginLeft: Spacing.md },
  campaignName: { ...Type.h2, fontSize: 16, marginBottom: 2 },
  campaignMeta: { ...Type.caption },
  campaignStats: { flexDirection: "row", justifyContent: "flex-end", gap: Spacing.md },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statLabel: { ...Type.micro, color: Colors.textMuted },

  contactCard: { marginBottom: Spacing.md, padding: Spacing.md },
  cardSelected: { borderColor: Colors.primary, borderWidth: 1.5 },
  contactRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: { ...Type.h2, color: Colors.primaryLight },
  contactInfo: { flex: 1, marginRight: Spacing.sm },
  contactName: { ...Type.bodyMed, marginBottom: 2 },
  contactRole: { ...Type.caption },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusPillText: { ...Type.micro, fontWeight: "600" },

  modalBg: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.8)" },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { ...Type.h2 },
  modalScroll: { padding: Spacing.lg },
  label: { ...Type.caption, color: Colors.textMuted, marginBottom: 8 },
  docsList: { gap: 8, marginBottom: Spacing.lg },
  docOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  docOptionText: { ...Type.bodyMed, marginLeft: 10 },
  emptyDocText: { ...Type.caption, color: Colors.textMuted, textAlign: "center", paddingVertical: 12 },

  sheetContent: { padding: Spacing.lg, paddingBottom: 40 },
  sheetTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.lg },
  sheetTitle: { ...Type.h2 },
  sheetSubtitle: { ...Type.caption, color: Colors.textMuted, marginTop: 2 },
  campaignStatsRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.lg },
  statBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statBoxValue: { ...Type.h2, color: Colors.primary },
  statBoxLabel: { ...Type.micro, color: Colors.textMuted, textTransform: "uppercase" },
  recordsLabel: { ...Type.micro, color: Colors.textMuted, textTransform: "uppercase", marginBottom: Spacing.sm },
  recordCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  recordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  recordName: { ...Type.bodyMed, flex: 1, marginRight: 8 },
  recordCompany: { ...Type.caption, marginBottom: Spacing.sm },
  recordActions: { flexDirection: "row", gap: Spacing.sm },
  draftBox: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  draftText: { ...Type.body, color: Colors.text, lineHeight: 22 },
  cursor: { color: Colors.primary, fontSize: 18, marginTop: 4 },
});
