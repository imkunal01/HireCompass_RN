import React, { useState, useEffect } from "react";
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
import apiClient, { streamFetch } from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card, EmptyState, Button } from "@/components/ui";
import { Users, ArrowLeft, MessageSquare, Linkedin, X } from "lucide-react-native";

export default function OutreachScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);

  const loadContacts = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.OUTREACH);
      setContacts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

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
        userProfile: { name: "User" }, // Mocked for now
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

  const renderItem = ({ item }: { item: any }) => (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.role}>{item.role} @ {item.company}</Text>
        </View>
        {item.platform === "linkedin" && (
          <Linkedin size={20} color="#0077b5" />
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
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Network</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadContacts(); }} tintColor={Colors.primary} />}
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

      {/* AI Draft Modal */}
      <Modal visible={aiModalVisible} animationType="slide" transparent>
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
                  // Usually here you'd copy to clipboard or redirect to mail app
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
});
