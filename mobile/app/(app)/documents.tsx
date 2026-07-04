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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "@/constants/theme";

interface Document {
  id: string;
  name: string;
  type: string;
  targetRole?: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocCard({
  doc,
  onDelete,
}: {
  doc: Document;
  onDelete: () => void;
}) {
  const typeEmoji = doc.type === "RESUME" ? "📄" : doc.type === "COVER_LETTER" ? "✉️" : "📁";

  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconEmoji}>{typeEmoji}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
        <Text style={styles.docMeta}>
          {doc.type.replace("_", " ")} · {formatBytes(doc.sizeBytes)}
        </Text>
        {doc.targetRole && (
          <Text style={styles.docTarget}>For: {doc.targetRole}</Text>
        )}
        <Text style={styles.docDate}>
          Uploaded{" "}
          {new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() =>
          Alert.alert("Delete Document", `Remove "${doc.name}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onDelete },
          ])
        }
      >
        <Text style={styles.deleteBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.DOCUMENTS);
      setDocs(res.data);
    } catch (e) {
      console.error("Docs load error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword",
               "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];

      if (!file.uri) {
        Alert.alert("Error", "Could not read file.");
        return;
      }

      setUploading(true);

      // Read file as base64
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          await apiClient.post(API_ENDPOINTS.DOCUMENTS, {
            name: file.name,
            type: file.name.toLowerCase().includes("cover") ? "COVER_LETTER" : "RESUME",
            mimeType: file.mimeType || "application/pdf",
            data: base64,
            sizeBytes: file.size || 0,
          });
          load();
        } catch (err: any) {
          Alert.alert("Upload Failed", err?.response?.data?.error || "Could not upload document.");
        } finally {
          setUploading(false);
        }
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      setUploading(false);
      Alert.alert("Error", "Failed to pick document.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`${API_ENDPOINTS.DOCUMENTS}/${id}`);
      load();
    } catch {
      Alert.alert("Error", "Failed to delete document.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Documents</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.uploadBtnText}>↑ Upload</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          📎 Upload your CV, resume, and cover letters here. They can be attached to outreach campaigns.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <DocCard doc={item} onDelete={() => handleDelete(item.id)} />
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
              <Text style={styles.emptyEmoji}>📂</Text>
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptySubTitle}>
                Upload your CV or resume to get started
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={handleUpload}
              >
                <Text style={styles.emptyBtnText}>↑ Upload Document</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  pageTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  uploadBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    minWidth: 80,
    alignItems: "center",
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { color: "#fff", fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  infoBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.infoMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.info + "30",
  },
  infoText: { color: Colors.info, fontSize: FontSize.xs, lineHeight: 16 },
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
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIconEmoji: { fontSize: 24 },
  cardContent: { flex: 1 },
  docName: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  docMeta: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  docTarget: { color: Colors.primary, fontSize: FontSize.xs, marginTop: 2 },
  docDate: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 18 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 60, paddingHorizontal: Spacing.lg },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginBottom: 8 },
  emptySubTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: "center", marginBottom: Spacing.md },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  emptyBtnText: { color: "#fff", fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
});
