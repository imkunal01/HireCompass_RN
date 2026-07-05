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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type } from "@/constants/theme";
import { Card, EmptyState } from "@/components/ui";
import { FileText, ArrowLeft, UploadCloud, Trash2 } from "lucide-react-native";

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: documents = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.DOCUMENTS);
      return res.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (payload: { name: string; type: string; mimeType: string; data: string; sizeBytes: number }) => {
      const res = await apiClient.post(API_ENDPOINTS.DOCUMENTS, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      Alert.alert("Success", "Document uploaded successfully");
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.error || "Failed to upload document");
    },
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`${API_ENDPOINTS.DOCUMENTS}/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.error || "Failed to delete document");
    },
  });

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      
      const file = result.assets[0];
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert("File too large", "Maximum file size is 5MB");
        return;
      }
      
      setUploading(true);
      const base64Data = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      uploadMutation.mutate({
        name: file.name,
        type: "RESUME",
        mimeType: file.mimeType || "application/pdf",
        data: `data:${file.mimeType || "application/pdf"};base64,${base64Data}`,
        sizeBytes: file.size || 0,
      });
    } catch (err) {
      setUploading(false);
      Alert.alert("Error", "Failed to select document");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Remove this document?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.cardIconBox}>
        <FileText size={24} color={Colors.primaryLight} strokeWidth={1.5} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.docMeta}>
          {new Date(item.uploadedAt).toLocaleDateString()} • {item.type}
        </Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Trash2 size={20} color={Colors.textFaint} />
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Documents</Text>
        {uploading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <TouchableOpacity onPress={handleUpload}>
            <UploadCloud size={24} color={Colors.primaryLight} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload your resumes and cover letters to use them in applications."
              actionLabel="Upload Document"
              onAction={handleUpload}
            />
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cardInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  docName: {
    ...Type.h2,
    fontSize: 16,
    marginBottom: 4,
  },
  docMeta: {
    ...Type.caption,
  },
  deleteBtn: {
    padding: Spacing.xs,
  },
});
