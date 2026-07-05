import React, { useState, useRef, useCallback, useMemo } from "react";
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
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Zap, ClipboardList, Mailbox, TrendingUp, Building2, Rocket, Globe, Shield, Clock4 } from "lucide-react-native";
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
  Trash2,
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

  // New flow picker
  const [newPickerVisible, setNewPickerVisible] = useState(false);

  // Quick Send state
  const [quickSendVisible, setQuickSendVisible] = useState(false);
  const [qsName, setQsName] = useState("");
  const [qsEmail, setQsEmail] = useState("");
  const [qsCompany, setQsCompany] = useState("");
  const [qsRole, setQsRole] = useState("");
  const [qsCv, setQsCv] = useState<any>(null);

  // Campaign detail / send panel
  const campaignSheetRef = useRef<BottomSheetModal>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [campaignRecords, setCampaignRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // AI draft panel (per-record)
  const draftSheetRef = useRef<BottomSheetModal>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [aiDraft, setAiDraft] = useState("");
  const [aiDraftSubject, setAiDraftSubject] = useState("");
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [draftEditMode, setDraftEditMode] = useState(false);
  const [editedDraft, setEditedDraft] = useState("");
  const [editedSubject, setEditedSubject] = useState("");

  // Delete confirmation
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'CAMPAIGN' | 'RECORD', name: string } | null>(null);

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

  // Saves the (possibly edited) draft + subject to the record AND marks it APPROVED
  const saveAndApproveMutation = useMutation({
    mutationFn: async ({ recordId, emailBody, subject }: { recordId: string; emailBody: string; subject: string }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.OUTREACH}/records/${recordId}`, {
        status: "APPROVED",
        finalEmail: emailBody,
        finalSubject: subject,
        generatedEmail: emailBody,
        emailSubject: subject,
      });
      return res.data;
    },
    onSuccess: () => {
      loadCampaignRecords(selectedCampaign?.id);
      draftSheetRef.current?.dismiss();
      Alert.alert("✅ Approved!", "Email saved and marked ready to send.");
    },
    onError: (err: any) => Alert.alert("Error", err?.response?.data?.error || "Failed to save draft"),
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

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await apiClient.delete(`${API_ENDPOINTS.OUTREACH}/campaigns/${campaignId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach_campaigns"] });
      campaignSheetRef.current?.dismiss();
      Alert.alert("Deleted", "Campaign has been deleted.");
    },
    onError: (err: any) => Alert.alert("Error", err?.response?.data?.error || "Failed to delete campaign"),
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const res = await apiClient.delete(`${API_ENDPOINTS.OUTREACH}/records/${recordId}`);
      return res.data;
    },
    onSuccess: () => {
      loadCampaignRecords(selectedCampaign?.id);
    },
    onError: (err: any) => Alert.alert("Error", err?.response?.data?.error || "Failed to delete record"),
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
      setCampaignRecords(res.data.filter((r: any) => r.campaignId === campaignId));
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
    setAiDraftSubject("");
    setEditedDraft("");
    setEditedSubject("");
    setDraftEditMode(false);
    setAiDraftLoading(true);
    draftSheetRef.current?.present();

    const profile = { fullName: "User", skills: [], bio: "" };
    let fullText = "";
    await streamFetch(
      `${API_ENDPOINTS.OUTREACH}/generate-emails`,
      { recordId: record.id, profile },
      (chunk) => {
        fullText += chunk;
        setAiDraft(fullText);
      },
      () => {
        setAiDraftLoading(false);
        // Try to parse subject from streamed text (format: Subject: ... \n\n body)
        const subjectMatch = fullText.match(/^Subject:\s*(.+)$/m);
        if (subjectMatch) {
          setAiDraftSubject(subjectMatch[1].trim());
          const bodyStart = fullText.indexOf("\n\n");
          const cleanBody = bodyStart !== -1 ? fullText.slice(bodyStart + 2) : fullText;
          setAiDraft(cleanBody);
          setEditedDraft(cleanBody);
          setEditedSubject(subjectMatch[1].trim());
        } else {
          setEditedDraft(fullText);
          setEditedSubject(`Internship Inquiry – ${record.company}`);
          setAiDraftSubject(`Internship Inquiry – ${record.company}`);
        }
      },
      (err) => { setAiDraftLoading(false); Alert.alert("AI Error", err); }
    );
  };

  const handleApproveRecord = (record: any) => {
    approveRecordMutation.mutate({ recordId: record.id, status: "APPROVED" });
  };

  const handleFollowUp = (record: any) => {
    if (Platform.OS === "web") {
      if (window.confirm(`Send a follow-up email to ${record.name} at ${record.company}?`)) {
        followUpMutation.mutate(record.id);
      }
    } else {
      Alert.alert("Send Follow-up", `Send a follow-up email to ${record.name} at ${record.company}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Send", onPress: () => followUpMutation.mutate(record.id) },
      ]);
    }
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

  const renderRecord = (record: any) => {
    const statusColor = STATUS_COLORS[record.status] || Colors.textMuted;
    const statusBg = statusColor + "22";
    const hasDraft = !!(record.generatedEmail || record.finalEmail);
    const isApproved = record.status === "APPROVED";
    const isSent = record.status === "SENT" || record.status === "FOLLOW_UP_SENT";
    const isPending = record.status === "PENDING";

    return (
      <Card key={record.id} variant="default" style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <View style={styles.recordAvatarCircle}>
            <Text style={styles.recordAvatarText}>{(record.name || "?").charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.recordName}>{record.name}</Text>
            <Text style={styles.recordCompany}>{record.role} @ {record.company}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{record.status}</Text>
          </View>
        </View>

        {record.email ? (
          <Text style={styles.recordEmailText}>✉️ {record.email}</Text>
        ) : null}

        {hasDraft && !isSent && (
          <View style={styles.draftPreviewBox}>
            <Text style={styles.draftPreviewLabel}>📝 Draft ready</Text>
            <Text style={styles.draftPreviewText} numberOfLines={2}>
              {record.finalEmail || record.generatedEmail}
            </Text>
          </View>
        )}

        <View style={styles.recordActions}>
          {isPending && !hasDraft && (
            <Button variant="secondary" size="sm" onPress={() => generateDraftForRecord(record)} style={{ flex: 1 }}>
              <MessageSquare size={14} color={Colors.text} />
              Generate
            </Button>
          )}
          {(isPending || isApproved) && hasDraft && (
            <Button variant="secondary" size="sm" onPress={() => {
              setSelectedRecord(record);
              const body = record.finalEmail || record.generatedEmail || "";
              const subj = record.finalSubject || record.emailSubject || `Internship Inquiry – ${record.company}`;
              setAiDraft(body);
              setEditedDraft(body);
              setAiDraftSubject(subj);
              setEditedSubject(subj);
              setDraftEditMode(false);
              setAiDraftLoading(false);
              draftSheetRef.current?.present();
            }} style={{ flex: 1 }}>
              <FileText size={14} color={Colors.text} />
              {isApproved ? "View / Edit" : "Review Draft"}
            </Button>
          )}
          {isPending && !hasDraft && (
            <Button variant="secondary" size="sm" onPress={() => handleApproveRecord(record)} style={{ flex: 1 }}>
              <CheckCircle size={14} color={Colors.primaryLight} />
              Quick Approve
            </Button>
          )}
          {isSent && (
            <Button variant="secondary" size="sm" onPress={() => handleFollowUp(record)} style={{ flex: 1 }}>
              <RotateCcw size={14} color={Colors.text} />
              Follow Up
            </Button>
          )}
          <TouchableOpacity
            style={{ padding: 8, justifyContent: "center", alignItems: "center", backgroundColor: "#FEF2F2", borderRadius: BorderRadius.sm, marginLeft: 4 }}
            onPress={() => {
              setItemToDelete({ id: record.id, type: 'RECORD', name: record.name });
              setDeleteConfirmVisible(true);
            }}
          >
            <Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────────

  const [campaignFilter, setCampaignFilter] = useState("All");
  
  const filteredCampaigns = useMemo(() => {
    if (campaignFilter === "All") return campaigns;
    return campaigns.filter((c: any) => (c.status || "DRAFT").toUpperCase() === campaignFilter.toUpperCase());
  }, [campaigns, campaignFilter]);

  const getCampaignVisuals = (name: string) => {
    if (name.includes("Tech")) return { icon: Building2, subtitle: "FAANG + Tier-1", bg: "#E0E7FF", color: "#4F46E5" };
    if (name.includes("Startup")) return { icon: Rocket, subtitle: "Series A-C Startups", bg: "#DCFCE7", color: "#10B981" };
    if (name.includes("Remote")) return { icon: Globe, subtitle: "Remote-first companies", bg: "#FEF3C7", color: "#3B82F6" };
    if (name.includes("Fintech")) return { icon: Shield, subtitle: "Finance & Crypto", bg: "#F3E8FF", color: "#9333EA" };
    return { icon: Megaphone, subtitle: "Outreach Campaign", bg: Colors.primaryMuted, color: Colors.primary };
  };

  const getStatusVisuals = (status: string) => {
    switch (status?.toUpperCase()) {
      case "REPLIED": return { bg: "#DCFCE7", text: "#16A34A", icon: CheckCircle, label: "Replied" };
      case "SENT": return { bg: "#E0E7FF", text: "#3B82F6", icon: Mail, label: "Sent" };
      case "SENDING": return { bg: "#FEF3C7", text: "#D97706", icon: Clock4, label: "Sending..." };
      case "DRAFT": return { bg: "#F1F5F9", text: "#64748B", icon: Clock4, label: "Draft" };
      default: return { bg: "#F1F5F9", text: "#64748B", icon: Clock4, label: status || "Draft" };
    }
  };

  const renderCampaignItem = ({ item }: { item: any }) => {
    const visuals = getCampaignVisuals(item.name || "");
    const status = getStatusVisuals(item.status || "DRAFT");
    const IconComponent = visuals.icon;
    const StatusIcon = status.icon;

    const isSending = (item.status || "").toUpperCase() === "SENDING";

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => openCampaignDetail(item)}>
        <Card variant="elevated" style={styles.newCampaignCard}>
          <View style={styles.newCampaignHeader}>
            <View style={[styles.newCampaignIconBox, { backgroundColor: visuals.bg }]}>
              <IconComponent size={20} color={visuals.color} />
            </View>
            <View style={styles.newCampaignInfo}>
              <Text style={styles.newCampaignName}>{item.name}</Text>
              <Text style={styles.newCampaignSubtitle}>{visuals.subtitle}</Text>
            </View>
            <View style={[styles.newStatusPill, { backgroundColor: status.bg }]}>
              <StatusIcon size={12} color={status.text} style={{ marginRight: 4 }} />
              <Text style={[styles.newStatusPillText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>
          
          <View style={styles.newCampaignStats}>
            <View style={styles.newStatItem}>
              <Users size={14} color={Colors.textMuted} />
              <Text style={styles.newStatLabel}>{item.totalRecords || 0} recruiters</Text>
            </View>
            <View style={styles.newStatItem}>
              <Mail size={14} color={Colors.textMuted} />
              <Text style={styles.newStatLabel}>{item.sentCount || 0} sent</Text>
            </View>
            {((item.status || "").toUpperCase() === "REPLIED" || item.repliedCount > 0) && (
              <View style={styles.newStatItem}>
                <CheckCircle size={14} color="#16A34A" />
                <Text style={[styles.newStatLabel, { color: "#16A34A" }]}>{item.repliedCount || 0} replied</Text>
              </View>
            )}
          </View>

          {isSending && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressTextLabel}>Sending...</Text>
                <Text style={styles.progressTextValue}>{item.sentCount || 0}/{item.totalRecords || 0}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, ((item.sentCount || 0) / (item.totalRecords || 1)) * 100)}%` }]} />
              </View>
            </View>
          )}

          {((item.status || "").toUpperCase() === "REPLIED" || item.repliedCount > 0) && !isSending && (
            <View style={styles.newCampaignFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TrendingUp size={14} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={styles.replyRateText}>
                  {Math.round(((item.repliedCount || 0) / (item.sentCount || 1)) * 100)}% reply rate
                </Text>
              </View>
              <Text style={styles.dateText}>• Jun 30</Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      <LinearGradient colors={['#0F9B8E', '#0372A5']} style={[styles.gradientHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Outreach</Text>
          <TouchableOpacity style={styles.newButton} onPress={() => setNewPickerVisible(true)}>
            <Zap size={14} color="#FDB813" style={{ marginRight: 4 }} />
            <Text style={styles.newButtonText}>New</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>AI-powered recruiter campaigns</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCardGlass}>
            <View style={styles.statIconWrapper}>
              <ClipboardList size={16} color="#4F46E5" />
            </View>
            <Text style={styles.statNumberGlass}>4</Text>
            <Text style={styles.statLabelGlass}>Campaigns</Text>
          </View>
          <View style={styles.statCardGlass}>
            <View style={styles.statIconWrapper}>
              <Mailbox size={16} color="#E11D48" />
            </View>
            <Text style={styles.statNumberGlass}>54</Text>
            <Text style={styles.statLabelGlass}>Reached</Text>
          </View>
          <View style={styles.statCardGlass}>
            <View style={styles.statIconWrapper}>
              <CheckSquare size={16} color="#16A34A" />
            </View>
            <Text style={styles.statNumberGlass}>4</Text>
            <Text style={styles.statLabelGlass}>Replied</Text>
          </View>
          <View style={styles.statCardGlass}>
            <View style={styles.statIconWrapper}>
              <TrendingUp size={16} color="#9333EA" />
            </View>
            <Text style={styles.statNumberGlass}>31%</Text>
            <Text style={styles.statLabelGlass}>Open Rate</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.filterRow}>
        {["All", "Draft", "Sent", "Replied"].map(f => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterPill, campaignFilter === f && styles.filterPillActive]}
            onPress={() => setCampaignFilter(f)}
          >
            <Text style={[styles.filterPillText, campaignFilter === f && styles.filterPillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.aiBannerContainer}>
        <View style={styles.aiBanner}>
          <View style={styles.aiBannerIconBox}>
            <Zap size={18} color="#FFF" />
          </View>
          <View style={styles.aiBannerContent}>
            <Text style={styles.aiBannerTitle}>AI suggests 8 new targets</Text>
            <Text style={styles.aiBannerSubtitle}>Based on your recent interview success at Google</Text>
          </View>
          <ChevronRight size={20} color="#8B5CF6" />
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredCampaigns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader()}
        refreshControl={<RefreshControl refreshing={isRefetchingCampaigns} onRefresh={refetchCampaigns} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Create a new campaign to start sending outreach emails."
            actionLabel="New Campaign"
            onAction={() => setNewPickerVisible(true)}
          />
        }
        renderItem={renderCampaignItem}
      />
{/* ── New Flow Picker Modal ── */}
      <Modal visible={newPickerVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.pickerContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start Outreach</Text>
              <TouchableOpacity onPress={() => setNewPickerVisible(false)}>
                <X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.pickerSubtitle}>How do you want to reach out?</Text>

            {/* Quick Send option */}
            <TouchableOpacity
              style={styles.pickerOption}
              activeOpacity={0.8}
              onPress={() => {
                setNewPickerVisible(false);
                setQsName(""); setQsEmail(""); setQsCompany(""); setQsRole(""); setQsCv(null);
                setQuickSendVisible(true);
              }}
            >
              <View style={[styles.pickerIconBox, { backgroundColor: "#FEF3C7" }]}>
                <Send size={22} color="#D97706" />
              </View>
              <View style={styles.pickerTextBlock}>
                <Text style={styles.pickerOptionTitle}>⚡ Quick Send</Text>
                <Text style={styles.pickerOptionDesc}>Add one contact and send an AI-written email instantly — no campaign needed.</Text>
              </View>
              <ChevronRight size={20} color={Colors.textFaint} />
            </TouchableOpacity>

            {/* Campaign option */}
            <TouchableOpacity
              style={styles.pickerOption}
              activeOpacity={0.8}
              onPress={() => {
                setNewPickerVisible(false);
                setImportedContacts([]);
                setCampaignModalVisible(true);
              }}
            >
              <View style={[styles.pickerIconBox, { backgroundColor: Colors.primaryMuted }]}>
                <Megaphone size={22} color={Colors.primary} />
              </View>
              <View style={styles.pickerTextBlock}>
                <Text style={styles.pickerOptionTitle}>📋 Campaign</Text>
                <Text style={styles.pickerOptionDesc}>Create a bulk outreach campaign with multiple contacts or imported CSV.</Text>
              </View>
              <ChevronRight size={20} color={Colors.textFaint} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

{/* ── Quick Send Modal ── */}
      <Modal visible={quickSendVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚡ Quick Send</Text>
              <TouchableOpacity onPress={() => setQuickSendVisible(false)}>
                <X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.pickerSubtitle}>Fill in the contact details and we'll write and send a personalised email.</Text>
              <Input label="Recruiter Name *" placeholder="e.g. Sarah Johnson" value={qsName} onChangeText={setQsName} />
              <Input label="Email Address *" placeholder="sarah@company.com" value={qsEmail} onChangeText={setQsEmail} keyboardType="email-address" autoCapitalize="none" />
              <Input label="Company" placeholder="e.g. Google" value={qsCompany} onChangeText={setQsCompany} />
              <Input label="Their Role" placeholder="e.g. Engineering Recruiter" value={qsRole} onChangeText={setQsRole} />

              <Text style={styles.label}>Attach CV (Optional)</Text>
              <View style={styles.docsList}>
                {documents.map((doc: any) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.docOption, qsCv?.id === doc.id && styles.docOptionSelected]}
                    onPress={() => setQsCv(doc.id === qsCv?.id ? null : doc)}
                  >
                    <FileText size={18} color={qsCv?.id === doc.id ? Colors.primary : Colors.textMuted} />
                    <Text style={[styles.docOptionText, qsCv?.id === doc.id && { color: Colors.primary }]}>{doc.name}</Text>
                  </TouchableOpacity>
                ))}
                {documents.length === 0 && <Text style={styles.emptyDocText}>No CVs uploaded yet.</Text>}
              </View>

              <Button
                variant="primary"
                style={{ marginTop: Spacing.lg }}
                loading={createCampaignMutation.isPending}
                disabled={!qsName || !qsEmail}
                onPress={() => {
                  setImportedContacts([{
                    recruiterName: qsName,
                    recruiterEmail: qsEmail,
                    companyName: qsCompany,
                    recruiterRole: qsRole,
                  }]);
                  setCampaignName(`Quick Send to ${qsName}`);
                  setSelectedCv(qsCv);
                  setQuickSendVisible(false);
                  // Small delay so state settles, then fire campaign creation
                  setTimeout(() => createCampaignMutation.mutate(), 100);
                }}
              >
                <Send size={16} color="#FFF" />
                Create & Generate Email
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal visible={deleteConfirmVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg), padding: Spacing.lg }]}>
            <Text style={{ ...Type.h2, marginBottom: Spacing.md }}>Confirm Deletion</Text>
            <Text style={{ ...Type.body, color: Colors.textMuted, marginBottom: Spacing.xl }}>
              Are you sure you want to delete {itemToDelete?.type === 'CAMPAIGN' ? 'the campaign' : 'the contact'} "{itemToDelete?.name}"? 
              {itemToDelete?.type === 'CAMPAIGN' && " This will also remove all its contacts."}
              {"\n\n"}This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Button 
                variant="secondary" 
                style={{ flex: 1 }} 
                onPress={() => setDeleteConfirmVisible(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                style={{ flex: 1, backgroundColor: Colors.error }} 
                onPress={() => {
                  if (itemToDelete?.type === 'CAMPAIGN') {
                    deleteCampaignMutation.mutate(itemToDelete.id);
                  } else if (itemToDelete?.type === 'RECORD') {
                    deleteRecordMutation.mutate(itemToDelete.id);
                  }
                  setDeleteConfirmVisible(false);
                }}
              >
                Delete
              </Button>
            </View>
          </View>
        </View>
      </Modal>

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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[selectedCampaign.status] + "22" }]}>
                    <Text style={[styles.statusPillText, { color: STATUS_COLORS[selectedCampaign.status] || Colors.textMuted }]}>
                      {selectedCampaign.status}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setItemToDelete({ id: selectedCampaign.id, type: 'CAMPAIGN', name: selectedCampaign.name });
                      setDeleteConfirmVisible(true);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={20} color={Colors.error} />
                  </TouchableOpacity>
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
                  if (Platform.OS === "web") {
                    if (window.confirm("This will send emails to all APPROVED records in this campaign. Make sure you have reviewed and approved the drafts first. Send now?")) {
                      sendCampaignMutation.mutate(selectedCampaign.id);
                    }
                  } else {
                    Alert.alert(
                      "Send Emails",
                      "This will send emails to all APPROVED records in this campaign. Make sure you have reviewed and approved the drafts first.",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Send", onPress: () => sendCampaignMutation.mutate(selectedCampaign.id) },
                      ]
                    );
                  }
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
        snapPoints={["90%"]}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: Colors.surface }}
        handleIndicatorStyle={{ backgroundColor: Colors.border }}
        onDismiss={() => setDraftEditMode(false)}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          {selectedRecord && (
            <>
              {/* Header */}
              <View style={styles.draftSheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>📧 Email Draft</Text>
                  <Text style={styles.sheetSubtitle}>To: {selectedRecord.name} · {selectedRecord.company}</Text>
                </View>
                {!aiDraftLoading && (aiDraft || editedDraft) && (
                  <TouchableOpacity
                    style={[styles.editToggleBtn, draftEditMode && styles.editToggleBtnActive]}
                    onPress={() => {
                      if (!draftEditMode) {
                        setEditedDraft(aiDraft || editedDraft);
                        setEditedSubject(aiDraftSubject || editedSubject);
                      }
                      setDraftEditMode(!draftEditMode);
                    }}
                  >
                    <Text style={[styles.editToggleText, draftEditMode && { color: Colors.primary }]}>
                      {draftEditMode ? "👁 Preview" : "✏️ Edit"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Streaming / loading */}
              {aiDraftLoading && (
                <View style={styles.streamingBox}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <Text style={styles.streamingLabel}>Writing your email...</Text>
                  <Text style={styles.draftText}>{aiDraft}</Text>
                  <Text style={styles.cursor}>▋</Text>
                </View>
              )}

              {/* Subject field */}
              {!aiDraftLoading && (aiDraft || editedDraft) && (
                <>
                  <Text style={styles.draftFieldLabel}>Subject</Text>
                  {draftEditMode ? (
                    <Input
                      value={editedSubject}
                      onChangeText={setEditedSubject}
                      placeholder="Email subject..."
                      style={{ marginBottom: Spacing.md }}
                    />
                  ) : (
                    <View style={styles.subjectPreviewBox}>
                      <Text style={styles.subjectPreviewText}>{editedSubject || aiDraftSubject}</Text>
                    </View>
                  )}

                  {/* Body */}
                  <Text style={styles.draftFieldLabel}>Body</Text>
                  {draftEditMode ? (
                    <Input
                      value={editedDraft}
                      onChangeText={setEditedDraft}
                      multiline
                      numberOfLines={14}
                      placeholder="Email body..."
                      style={{ minHeight: 260, textAlignVertical: "top", marginBottom: Spacing.md }}
                    />
                  ) : (
                    <View style={styles.draftBox}>
                      <Text style={styles.draftText}>{editedDraft || aiDraft}</Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={styles.draftActionRow}>
                    <Button
                      variant="secondary"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() => generateDraftForRecord(selectedRecord)}
                    >
                      <RotateCcw size={14} color={Colors.text} />
                      Regenerate
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      style={{ flex: 2 }}
                      loading={saveAndApproveMutation.isPending}
                      onPress={() => {
                        const body = draftEditMode ? editedDraft : (editedDraft || aiDraft);
                        const subj = draftEditMode ? editedSubject : (editedSubject || aiDraftSubject);
                        saveAndApproveMutation.mutate({
                          recordId: selectedRecord.id,
                          emailBody: body,
                          subject: subj,
                        });
                      }}
                    >
                      <CheckCircle size={14} color="#FFF" />
                      {selectedRecord.status === "APPROVED" ? "Save Changes" : "Approve & Save"}
                    </Button>
                  </View>
                </>
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  gradientHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "#FFF",
    letterSpacing: -0.5,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  newButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFF",
  },
  headerSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statCardGlass: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
  },
  statIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumberGlass: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FFF",
    marginBottom: 2,
  },
  statLabelGlass: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  filterPillActive: {
    backgroundColor: "#00897B",
  },
  filterPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#64748B",
  },
  filterPillTextActive: {
    color: "#FFF",
  },
  aiBannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  aiBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  aiBannerContent: {
    flex: 1,
  },
  aiBannerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#6D28D9",
    marginBottom: 2,
  },
  aiBannerSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#8B5CF6",
  },
  listContent: {
    paddingBottom: 40,
  },
  newCampaignCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  newCampaignHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  newCampaignIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  newCampaignInfo: {
    flex: 1,
  },
  newCampaignName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 2,
  },
  newCampaignSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#94A3B8",
  },
  newStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newStatusPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  newCampaignStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  newStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  newStatLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#64748B",
  },
  progressBarContainer: {
    marginTop: 16,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressTextLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#94A3B8",
  },
  progressTextValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#D97706",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#F59E0B",
    borderRadius: 2,
  },
  newCampaignFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  replyRateText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#16A34A",
  },
  dateText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#94A3B8",
    marginLeft: 8,
  },

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

  // New flow picker styles
  pickerContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: "auto",
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  pickerSubtitle: {
    ...Type.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    marginTop: -4,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  pickerTextBlock: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  pickerOptionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 3,
  },
  pickerOptionDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  
  // Updated Draft and Record styles
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  recordAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  recordAvatarText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
  recordEmailText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  draftPreviewBox: {
    backgroundColor: "#F1F5F9",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  draftPreviewLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.primary,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  draftPreviewText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
  },
  draftSheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  editToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceHighlight,
  },
  editToggleBtnActive: {
    backgroundColor: Colors.primaryMuted,
  },
  editToggleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  streamingBox: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  streamingLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  draftFieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    marginBottom: 6,
  },
  subjectPreviewBox: {
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  subjectPreviewText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  draftActionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  }
});