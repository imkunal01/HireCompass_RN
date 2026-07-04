import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Card } from "@/components/ui";
import {
  User,
  Bell,
  FileText,
  Download,
  Zap,
  Target,
  Briefcase,
  AtSign,
  LogOut,
  ChevronRight,
  LucideIcon,
} from "lucide-react-native";

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon: IconCmp, label, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconBox, danger && styles.menuIconBoxDanger]}>
        <IconCmp size={18} color={danger ? Colors.error : Colors.text} strokeWidth={2} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
        {label}
      </Text>
      <ChevronRight size={18} color={Colors.textFaint} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(app)/profile")}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </Card>

        {/* Tools Section */}
        <Text style={styles.sectionTitle}>Tools</Text>
        <Card variant="default" style={styles.menuGroup}>
          <MenuItem icon={Bell} label="Reminders" onPress={() => router.push("/(app)/reminders")} />
          <MenuItem icon={FileText} label="Documents" onPress={() => router.push("/(app)/documents")} />
          <MenuItem icon={Download} label="Import Job" onPress={() => router.push("/(app)/import")} />
          <MenuItem icon={Zap} label="AI Tools" onPress={() => router.push("/(app)/ai-tools")} />
          <MenuItem icon={Target} label="DSA & Goals Tracker" onPress={() => router.push("/(app)/tracker")} />
        </Card>

        {/* Network Section */}
        <Text style={styles.sectionTitle}>Network</Text>
        <Card variant="default" style={styles.menuGroup}>
          <MenuItem icon={Target} label="Networking" onPress={() => router.push("/(app)/outreach")} />
          <MenuItem icon={Briefcase} label="Projects" onPress={() => router.push("/(app)/projects")} />
          <MenuItem icon={AtSign} label="Companies" onPress={() => {}} />
        </Card>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Account</Text>
        <Card variant="default" style={styles.menuGroup}>
          <MenuItem icon={User} label="Profile & Settings" onPress={() => router.push("/(app)/profile")} />
          <MenuItem icon={LogOut} label="Sign Out" onPress={handleLogout} danger />
        </Card>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Type.h1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120, // Tab bar padding
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
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
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Type.h2,
    marginBottom: 2,
  },
  profileEmail: {
    ...Type.caption,
  },
  editLink: {
    ...Type.bodyMed,
    color: Colors.primaryLight,
  },
  sectionTitle: {
    ...Type.micro,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuGroup: {
    padding: 0,
    marginBottom: Spacing.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  menuIconBoxDanger: {
    backgroundColor: "#EF444420", // Muted red
  },
  menuLabel: {
    flex: 1,
    ...Type.bodyMed,
  },
  menuLabelDanger: {
    color: Colors.error,
  },
});
