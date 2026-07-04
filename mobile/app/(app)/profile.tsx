import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/store/authStore";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "@/constants/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyReport: true,
    interviewRemind: true,
    marketingEmails: false,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    apiClient.get(API_ENDPOINTS.PROFILE).then((res) => {
      setName(res.data.name ?? "");
      setEmail(res.data.email ?? "");
      if (res.data.notifications) {
        setNotifications(res.data.notifications);
      }
    }).catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    if (name.trim().length < 2) {
      Alert.alert("Validation", "Name must be at least 2 characters.");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await apiClient.put(API_ENDPOINTS.PROFILE, {
        name: name.trim(),
        email: email.trim(),
        notifications,
      });
      // Update token if returned
      if (res.data.token) {
        const { saveToken } = await import("@/services/api");
        await saveToken(res.data.token);
      }
      Alert.alert("✅ Saved", "Profile updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Required", "Both current and new password are required.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Too short", "New password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.put(API_ENDPOINTS.PASSWORD, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("✅ Changed", "Password updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Profile & Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name[0]?.toUpperCase() ?? "U"}</Text>
            </View>
            <Text style={styles.avatarName}>{name}</Text>
            <Text style={styles.avatarEmail}>{email}</Text>
          </View>

          {/* Profile */}
          <SectionHeader title="PROFILE INFORMATION" />
          <View style={styles.card}>
            <Field label="Full Name">
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </Field>
            <Field label="Email Address">
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </Field>
            <TouchableOpacity
              style={[styles.saveBtn, savingProfile && styles.saveBtnDisabled]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Password */}
          <SectionHeader title="CHANGE PASSWORD" />
          <View style={styles.card}>
            <Field label="Current Password">
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </Field>
            <Field label="New Password">
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min 8 characters"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </Field>
            <TouchableOpacity
              style={[styles.saveBtn, styles.saveBtnSecondary, savingPassword && styles.saveBtnDisabled]}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <Text style={styles.saveBtnSecondaryText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Notifications */}
          <SectionHeader title="NOTIFICATIONS" />
          <View style={styles.card}>
            {(
              [
                { key: "emailAlerts", label: "Email Alerts", sub: "Get notified about deadlines" },
                { key: "weeklyReport", label: "Weekly Report", sub: "Summary of your job search" },
                { key: "interviewRemind", label: "Interview Reminders", sub: "Reminders before interviews" },
                { key: "marketingEmails", label: "Marketing Emails", sub: "Tips and product updates" },
              ] as const
            ).map((n) => (
              <View key={n.key} style={styles.notifRow}>
                <View style={styles.notifText}>
                  <Text style={styles.notifLabel}>{n.label}</Text>
                  <Text style={styles.notifSub}>{n.sub}</Text>
                </View>
                <Switch
                  value={notifications[n.key]}
                  onValueChange={(val) =>
                    setNotifications((prev) => ({ ...prev, [n.key]: val }))
                  }
                  trackColor={{ false: Colors.border, true: Colors.primary + "60" }}
                  thumbColor={notifications[n.key] ? Colors.primary : Colors.textMuted}
                />
              </View>
            ))}
            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: Spacing.sm }]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <SectionHeader title="ACCOUNT" />
          <View style={styles.card}>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
              <Text style={styles.dangerBtnText}>🚪 Sign Out</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
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
  pageTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },

  // Avatar
  avatarSection: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 3,
    borderColor: Colors.primary + "50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  avatarText: { color: Colors.primary, fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  avatarName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  avatarEmail: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },

  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 1,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: 8,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: {
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

  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  saveBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  saveBtnSecondaryText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  // Notifications
  notifRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  notifText: { flex: 1, marginRight: Spacing.md },
  notifLabel: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  notifSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  dangerBtn: {
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error + "50",
    alignItems: "center",
  },
  dangerBtnText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
});
