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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors, Spacing, Type } from "@/constants/theme";
import { Card, EmptyState } from "@/components/ui";
import { FileText, ArrowLeft, UploadCloud, Trash2 } from "lucide-react-native";

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDocuments = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.DOCUMENTS);
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      
      const file = result.assets[0];
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert("File too large", "Maximum file size is 5MB");
        return;
      }
      
      Alert.alert("Upload simulated", `Would upload: ${file.name}`);
      // Upload simulation...
    } catch (err) {
      Alert.alert("Error", "Failed to select document");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Remove this document?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        setDocuments(prev => prev.filter(d => d.id !== id));
        apiClient.delete(`${API_ENDPOINTS.DOCUMENTS}/${id}`).catch(() => loadDocuments());
      }},
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
        <TouchableOpacity onPress={handleUpload}>
          <UploadCloud size={24} color={Colors.primaryLight} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDocuments(); }} tintColor={Colors.primary} />}
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
