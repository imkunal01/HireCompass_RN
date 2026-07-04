import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "@/constants/theme";

interface MenuItemProps {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ emoji, title, subtitle, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Text style={styles.menuEmoji}>{emoji}</Text>
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
          {title}
        </Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>More</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? "User"}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ""}</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push("/(app)/profile")}
          >
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Job Tracking */}
        <SectionHeader title="JOB TRACKING" />
        <View style={styles.menuGroup}>
          <MenuItem
            emoji="🔔"
            title="Reminders"
            subtitle="Deadlines, follow-ups & alerts"
            onPress={() => router.push("/(app)/reminders")}
          />
          <MenuItem
            emoji="📁"
            title="Documents"
            subtitle="CV, resume & cover letters"
            onPress={() => router.push("/(app)/documents")}
          />
          <MenuItem
            emoji="📥"
            title="Import Job"
            subtitle="Paste URL or text to add a job"
            onPress={() => router.push("/(app)/import")}
          />
        </View>

        {/* AI Tools */}
        <SectionHeader title="AI TOOLS" />
        <View style={styles.menuGroup}>
          <MenuItem
            emoji="🤖"
            title="AI Email Generator"
            subtitle="Generate cold emails & cover letters"
            onPress={() => router.push("/(app)/ai-tools")}
          />
          <MenuItem
            emoji="🎯"
            title="Match Score"
            subtitle="Check how well you fit a role"
            onPress={() => router.push("/(app)/ai-tools")}
          />
        </View>

        {/* Career */}
        <SectionHeader title="CAREER" />
        <View style={styles.menuGroup}>
          <MenuItem
            emoji="🛠️"
            title="Projects"
            subtitle="Manage portfolio projects & AI snippets"
            onPress={() => router.push("/(app)/projects")}
          />
          <MenuItem
            emoji="📣"
            title="Outreach"
            subtitle="Recruiter campaigns & cold emails"
            onPress={() => router.push("/(app)/outreach")}
          />
        </View>

        {/* Account */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.menuGroup}>
          <MenuItem
            emoji="👤"
            title="Profile & Settings"
            subtitle="Edit name, email, password"
            onPress={() => router.push("/(app)/profile")}
          />
          <MenuItem
            emoji="🚪"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            danger
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>HireCompass v1.0.0</Text>
          <Text style={styles.footerSub}>Built for serious job seekers 🚀</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pageHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },

  // Profile Card
  profileCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 2,
    borderColor: Colors.primary + "50",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  profileInfo: { flex: 1 },
  profileName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  profileEmail: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  editProfileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  editProfileText: { color: Colors.textSecondary, fontSize: FontSize.xs },

  // Section header
  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 1,
    paddingHorizontal: Spacing.lg,
    marginBottom: 8,
    marginTop: 4,
  },

  // Menu
  menuGroup: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIconDanger: { backgroundColor: Colors.errorMuted },
  menuEmoji: { fontSize: 18 },
  menuText: { flex: 1 },
  menuTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  menuTitleDanger: { color: Colors.error },
  menuSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  menuArrow: { color: Colors.textMuted, fontSize: 20 },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: 4,
  },
  footerText: { color: Colors.textMuted, fontSize: FontSize.xs },
  footerSub: { color: Colors.textMuted, fontSize: FontSize.xs },
});
