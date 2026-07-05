import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Colors, Spacing, Type } from "@/constants/theme";
import { Bell, ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MOCK_NOTIFICATIONS = [
  { id: "1", title: "New Interview Scheduled", message: "You have an interview with TechCorp tomorrow at 10 AM.", time: "2 hours ago", read: false },
  { id: "2", title: "Goal Reached!", message: "You solved 5 DSA problems today. Keep up the 12-day streak!", time: "5 hours ago", read: false },
  { id: "3", title: "Application Viewed", message: "Your application for Frontend Developer at StartupInc was viewed.", time: "1 day ago", read: true },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }: { item: typeof MOCK_NOTIFICATIONS[0] }) => (
    <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
      <View style={[styles.iconBox, !item.read && styles.unreadIconBox]}>
        <Bell size={20} color={!item.read ? Colors.primary : Colors.textMuted} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, !item.read && styles.unreadTitle]}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      
      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: 4,
  },
  headerTitle: {
    ...Type.h2,
  },
  listContent: {
    padding: Spacing.md,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: "#F8FAFC",
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  unreadIconBox: {
    backgroundColor: Colors.primaryMuted,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Type.bodyMed,
    marginBottom: 4,
  },
  unreadTitle: {
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  message: {
    ...Type.caption,
    marginBottom: 8,
  },
  time: {
    ...Type.micro,
    color: Colors.textFaint,
  },
});
