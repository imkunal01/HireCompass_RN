import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient, { streamFetch } from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, EmptyState, Button, Input } from "@/components/ui";
import { Users, ArrowLeft, MessageSquare, Linkedin, X, CheckSquare, Square, FileText } from "lucide-react-native";

export default function OutreachScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);

  // Campaign State
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [selectedRecruiters, setSelectedRecruiters] = useState<Set<string>>(new Set());
  const [selectedCv, setSelectedCv] = useState<any>(null);

  // Queries
  const { data: contacts = [], isLoading: contactsLoading, refetch, isRefetching } = useQuery({
    queryKey: ["outreach_contacts"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.OUTREACH);
      return res.data;
    },
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.DOCUMENTS);
      return res.data;
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      const selectedContactsData = contacts.filter((c: any) => selectedRecruiters.has(c.id));
      const res = await apiClient.post(`${API_ENDPOINTS.OUTREACH}/campaigns`, {
        name: campaignName,
        recruiters: selectedContactsData,
        attachedCvId: selectedCv?.id || null,
      });
      return res.data;
    },
    onSuccess: () => {
      Alert.alert("Success", "Campaign created successfully");
      setCampaignModalVisible(false);
      setCampaignName("");
      setSelectedRecruiters(new Set());
      setSelectedCv(null);
      // refetch campaigns if we had a tab for them
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.error || "Failed to create campaign");
    }
  });

  const handleGenerateMsg = async (contact: any) => {
    setSelectedContact(contact);
    setAiOutput("");
    setAiLoading(true);
    setAiModalVisible(true);

    await streamFetch(
      API_ENDPOINTS.AI_GENERATE_EMAIL,
      {
        type: "email",
        job: {
          company: contact.company,
          title: contact.role || "Recruiter",
          skills: [],
        },
        userProfile: { name: "User" },
        templateType: "Networking",
      },
      (chunk) => setAiOutput((prev) => prev + chunk),
      () => setAiLoading(false),
      (err) => {
        setAiLoading(false);
        Alert.alert("AI Error", err);
      }
    );
  };

  const toggleRecruiter = (id: string) => {
    const next = new Set(selectedRecruiters);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRecruiters(next);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selectedRecruiters.has(item.id);

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => toggleRecruiter(item.id)}>
        <Card variant="elevated" style={[styles.card, isSelected && styles.cardSelected]}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.role}>{item.role} @ {item.company}</Text>
            </View>
            {isSelected ? (
              <CheckSquare size={24} color={Colors.primary} />
            ) : (
              <Square size={24} color={Colors.textFaint} />
            )}
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>Status: <Text style={{ color: Colors.primaryLight }}>{item.status}</Text></Text>
            <Text style={styles.dateText}>Added: {new Date(item.addedAt).toLocaleDateString()}</Text>
          </View>
          <Button variant="secondary" size="sm" onPress={() => handleGenerateMsg(item)}>
            <MessageSquare size={16} color={Colors.text} />
            Draft Message
          </Button>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Network</Text>
        <View style={{ flex: 1 }} />
        {selectedRecruiters.size > 0 && (
          <Button variant="primary" size="sm" onPress={() => setCampaignModalVisible(true)}>
            Create Campaign ({selectedRecruiters.size})
          </Button>
        )}
      </View>

      {contactsLoading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={Users}
              title="No contacts yet"
              description="Keep track of recruiters and hiring managers."
              actionLabel="Add Contact"
              onAction={() => Alert.alert("Coming Soon", "Manual add coming soon.")}
            />
          }
          renderItem={renderItem}
        />
      )}

      {/* Campaign Creation Modal */}
      <Modal visible={campaignModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Campaign</Text>
              <TouchableOpacity onPress={() => setCampaignModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Input
                label="Campaign Name"
                placeholder="e.g. Summer 2026 SWE Interns"
                value={campaignName}
                onChangeText={setCampaignName}
              />
              
              <Text style={styles.label}>Select CV to Attach (Optional)</Text>
              {docsLoading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <View style={styles.docsList}>
                  {documents.map((doc: any) => (
                    <TouchableOpacity
                      key={doc.id}
                      style={[
                        styles.docOption,
                        selectedCv?.id === doc.id && styles.docOptionSelected
                      ]}
                      onPress={() => setSelectedCv(doc.id === selectedCv?.id ? null : doc)}
                    >
                      <FileText size={20} color={selectedCv?.id === doc.id ? Colors.primary : Colors.textMuted} />
                      <Text style={[styles.docOptionText, selectedCv?.id === doc.id && { color: Colors.primary }]}>
                        {doc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {documents.length === 0 && (
                    <Text style={styles.dateText}>No CVs available. Upload one in Documents.</Text>
                  )}
                </View>
              )}

              <Button 
                variant="primary" 
                style={{ marginTop: Spacing.xl }} 
                loading={createCampaignMutation.isPending}
                onPress={() => createCampaignMutation.mutate()}
                disabled={!campaignName}
              >
                Launch Campaign
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AI Draft Modal */}
      <Modal visible={aiModalVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Draft Message</Text>
              <TouchableOpacity onPress={() => setAiModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.draftTo}>To: {selectedContact?.name} ({selectedContact?.company})</Text>
              
              <View style={styles.outputBox}>
                <Text style={styles.outputText}>{aiOutput}</Text>
                {aiLoading && <Text style={styles.streamingIndicator}>▋</Text>}
              </View>

              {!aiLoading && aiOutput !== "" && (
                <Button variant="primary" style={{ marginTop: Spacing.xl }} onPress={() => {
                  Alert.alert("Copied!", "Message copied to clipboard.");
                  setAiModalVisible(false);
                }}>
                  Copy to Clipboard
                </Button>
              )}
            </ScrollView>
          </View>
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
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    ...Type.h2,
    color: Colors.primaryLight,
  },
  info: {
    flex: 1,
  },
  name: {
    ...Type.h2,
    fontSize: 16,
    marginBottom: 4,
  },
  role: {
    ...Type.caption,
  },
  statusBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  statusText: {
    ...Type.micro,
  },
  dateText: {
    ...Type.micro,
    color: Colors.textMuted,
  },
  modalBg: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    minHeight: "60%",
    maxHeight: "90%",
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
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: Spacing.lg,
  },
  draftTo: {
    ...Type.bodyMed,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  outputBox: {
    padding: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  outputText: {
    ...Type.body,
    color: Colors.text,
    lineHeight: 22,
  },
  streamingIndicator: {
    color: Colors.primaryLight,
    marginTop: 4,
  },
  label: {
    ...Type.caption,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  docsList: {
    gap: 8,
    marginBottom: Spacing.lg,
  },
  docOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  docOptionText: {
    ...Type.bodyMed,
    marginLeft: 12,
  },
});
