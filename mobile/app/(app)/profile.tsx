import React, { useEffect, useState } from "react";
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/store/authStore";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Button, Input, Card } from "@/components/ui";
import { ArrowLeft, User, Shield, Bell } from "lucide-react-native";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  notifications: z.object({
    emailAlerts: z.boolean(),
    weeklyReport: z.boolean(),
    interviewRemind: z.boolean(),
    marketingEmails: z.boolean(),
  }),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      notifications: {
        emailAlerts: true,
        weeklyReport: true,
        interviewRemind: true,
        marketingEmails: false,
      },
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  useEffect(() => {
    apiClient.get(API_ENDPOINTS.PROFILE).then((res) => {
      if (res.data.name) profileForm.setValue("name", res.data.name);
      if (res.data.email) profileForm.setValue("email", res.data.email);
      if (res.data.notifications) profileForm.setValue("notifications", res.data.notifications);
    }).catch(() => {});
  }, []);

  const onSaveProfile = async (data: ProfileFormValues) => {
    setSavingProfile(true);
    try {
      const res = await apiClient.put(API_ENDPOINTS.PROFILE, data);
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

  const onChangePassword = async (data: PasswordFormValues) => {
    setSavingPassword(true);
    try {
      await apiClient.put(API_ENDPOINTS.PASSWORD, data);
      passwordForm.reset();
      Alert.alert("Success", "Password updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
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
          
          <Controller
            control={profileForm.control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={profileForm.formState.errors.name?.message}
              />
            )}
          />
          
          <Controller
            control={profileForm.control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                error={profileForm.formState.errors.email?.message}
              />
            )}
          />
          
          <Button variant="secondary" loading={savingProfile} onPress={profileForm.handleSubmit(onSaveProfile)} style={{ marginTop: 8 }}>
            Save Changes
          </Button>
        </Card>

        {/* Security Card */}
        <Card variant="elevated" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={Colors.primaryLight} />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          
          <Controller
            control={passwordForm.control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Current Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={passwordForm.formState.errors.currentPassword?.message}
              />
            )}
          />
          
          <Controller
            control={passwordForm.control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={passwordForm.formState.errors.newPassword?.message}
              />
            )}
          />
          
          <Button variant="secondary" loading={savingPassword} onPress={passwordForm.handleSubmit(onChangePassword)} style={{ marginTop: 8 }}>
            Update Password
          </Button>
        </Card>

        {/* Notifications Card */}
        <Card variant="elevated" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={Colors.primaryLight} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          
          <Controller
            control={profileForm.control}
            name="notifications.emailAlerts"
            render={({ field: { onChange, value } }) => (
              <View style={styles.switchRow}>
                <View style={styles.switchTextCol}>
                  <Text style={styles.switchLabel}>Email Alerts</Text>
                  <Text style={styles.switchDesc}>Status changes and deadlines</Text>
                </View>
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            )}
          />

          <Controller
            control={profileForm.control}
            name="notifications.weeklyReport"
            render={({ field: { onChange, value } }) => (
              <View style={styles.switchRow}>
                <View style={styles.switchTextCol}>
                  <Text style={styles.switchLabel}>Weekly Report</Text>
                  <Text style={styles.switchDesc}>Summary of your activity</Text>
                </View>
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            )}
          />

          <Controller
            control={profileForm.control}
            name="notifications.interviewRemind"
            render={({ field: { onChange, value } }) => (
              <View style={[styles.switchRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={styles.switchTextCol}>
                  <Text style={styles.switchLabel}>Interview Reminders</Text>
                  <Text style={styles.switchDesc}>24 hours before interview</Text>
                </View>
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            )}
          />
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
