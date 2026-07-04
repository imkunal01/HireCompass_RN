import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/store/authStore";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Button, Input, Card } from "@/components/ui";
import { ArrowLeft, User, Shield, Bell } from "lucide-react-native";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();

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
      if (res.data.token) {
        const { saveToken } = await import("@/services/api");
        await saveToken(res.data.token);
      }
      Alert.alert("Saved", "Profile updated successfully.");
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
      Alert.alert("Success", "Password updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <Card variant="elevated" style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={Colors.primaryLight} />
            <Text style={styles.sectionTitle}>Profile Details</Text>
          </View>
          <Input label="Full Name" value={name} onChangeText={setName} />
          <Input label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Button variant="secondary" loading={savingProfile} onPress={handleSaveProfile} style={{ marginTop: 8 }}>
            Save Changes
          </Button>
        </Card>

        {/* Security Card */}
        <Card variant="elevated" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={Colors.primaryLight} />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          <Input label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          <Input label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <Button variant="secondary" loading={savingPassword} onPress={handleChangePassword} style={{ marginTop: 8 }}>
            Update Password
          </Button>
        </Card>

        {/* Notifications Card */}
        <Card variant="elevated" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={Colors.primaryLight} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          
          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchLabel}>Email Alerts</Text>
              <Text style={styles.switchDesc}>Status changes and deadlines</Text>
            </View>
            <Switch
              value={notifications.emailAlerts}
              onValueChange={() => toggleNotif("emailAlerts")}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchLabel}>Weekly Report</Text>
              <Text style={styles.switchDesc}>Summary of your activity</Text>
            </View>
            <Switch
              value={notifications.weeklyReport}
              onValueChange={() => toggleNotif("weeklyReport")}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.switchRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchLabel}>Interview Reminders</Text>
              <Text style={styles.switchDesc}>24 hours before interview</Text>
            </View>
            <Switch
              value={notifications.interviewRemind}
              onValueChange={() => toggleNotif("interviewRemind")}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </Card>

      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Type.h2,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  switchLabel: {
    ...Type.bodyMed,
    marginBottom: 2,
  },
  switchDesc: {
    ...Type.caption,
  },
});
