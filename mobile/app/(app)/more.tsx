import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import {
  Moon,
  FileText,
  Cpu,
  BarChart2,
  BookOpen,
  Trophy,
  Dumbbell,
  Bell,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
  Flame,
  LucideIcon
} from "lucide-react-native";

interface MenuItemProps {
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  isSoon?: boolean;
  soonColor?: string;
  soonBgColor?: string;
}

function MenuItem({ 
  icon: IconCmp, 
  iconBgColor, 
  iconColor, 
  title, 
  subtitle, 
  onPress, 
  rightElement, 
  isSoon,
  soonColor,
  soonBgColor
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isSoon}
    >
      <View style={[styles.menuIconBox, iconBgColor ? { backgroundColor: iconBgColor } : null]}>
        <IconCmp size={20} color={iconColor || Colors.text} strokeWidth={2} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      {isSoon ? (
        <View style={[styles.soonPill, soonBgColor ? { backgroundColor: soonBgColor } : null]}>
          <Text style={[styles.soonText, soonColor ? { color: soonColor } : null]}>Soon</Text>
        </View>
      ) : (
        rightElement || <ChevronRight size={18} color={Colors.textFaint} />
      )}
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return name.charAt(0);
  };

  return (
    <View style={styles.container}>
      {/* Dark Header Section */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
        {/* Decorative elements for the header */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        
        <View style={styles.profileTopRow}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || "Alex Johnson"}</Text>
            <Text style={styles.profileEmail}>{user?.email || "alex.johnson@gmail.com"}</Text>
            
            <View style={styles.badgesRow}>
              <View style={styles.proBadge}>
                <Star size={12} color="#FBBF24" fill="#FBBF24" style={{ marginRight: 4 }} />
                <Text style={styles.proBadgeText}>Pro Plan</Text>
              </View>
              <View style={styles.streakBadge}>
                <Flame size={12} color="#F97316" fill="#F97316" style={{ marginRight: 4 }} />
                <Text style={styles.streakBadgeText}>12-day streak</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Applied</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Dark Mode Toggle */}
        <View style={[styles.card, styles.darkModeCard]}>
          <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
            <Moon size={20} color={Colors.textMuted} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Dark Mode</Text>
            <Text style={styles.menuSubtitle}>{isDarkMode ? "Enabled" : "Disabled"}</Text>
          </View>
          <Switch 
            value={isDarkMode} 
            onValueChange={setIsDarkMode} 
            trackColor={{ false: '#E2E8F0', true: Colors.primary }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        {/* Tools Section */}
        <Text style={styles.sectionTitle}>TOOLS</Text>
        <View style={styles.card}>
          <MenuItem 
            icon={FileText} 
            iconBgColor="#EFF6FF" 
            iconColor="#3B82F6" 
            title="Documents" 
            subtitle="4 files stored" 
            onPress={() => router.push("/(app)/documents")} 
          />
          <View style={styles.separator} />
          <MenuItem 
            icon={Cpu} 
            iconBgColor="#F5F3FF" 
            iconColor="#8B5CF6" 
            title="Form Kit" 
            subtitle="Fast application filler" 
            onPress={() => router.push("/(app)/form-kit")} 
          />
          <View style={styles.separator} />
          <MenuItem 
            icon={BarChart2} 
            iconBgColor="#F0FDF4" 
            iconColor="#10B981" 
            title="Analytics" 
            subtitle="Job search insights" 
            onPress={() => router.push("/(app)/analytics")} 
          />
        </View>

        {/* Prep Tracker Section */}
        <Text style={styles.sectionTitle}>PREP TRACKER</Text>
        <View style={styles.card}>
          <MenuItem 
            icon={BookOpen} 
            iconBgColor="#FFFBEB" 
            iconColor="#F59E0B" 
            title="DSA Tracker" 
            subtitle="Daily problem solving" 
            onPress={() => {}} 
            isSoon
            soonBgColor="#FFFBEB"
            soonColor="#F59E0B"
          />
          <View style={styles.separator} />
          <MenuItem 
            icon={Trophy} 
            iconBgColor="#ECFCCB" 
            iconColor="#84CC16" 
            title="Streaks & Goals" 
            subtitle="Consistency heatmap" 
            onPress={() => {}} 
            isSoon
            soonBgColor="#ECFCCB"
            soonColor="#84CC16"
          />
          <View style={styles.separator} />
          <MenuItem 
            icon={Dumbbell} 
            iconBgColor="#FDF2F8" 
            iconColor="#EC4899" 
            title="Physique Tracker" 
            subtitle="Health alongside prep" 
            onPress={() => {}} 
            isSoon
            soonBgColor="#FDF2F8"
            soonColor="#EC4899"
          />
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.card}>
          <MenuItem 
            icon={Bell} 
            iconBgColor="#FFF7ED" 
            iconColor="#EA580C" 
            title="Notifications" 
            subtitle="3 active alerts" 
            onPress={() => router.push("/(app)/notifications")} 
          />
          <View style={styles.separator} />
          <MenuItem 
            icon={Shield} 
            iconBgColor="#F1F5F9" 
            iconColor="#475569" 
            title="Privacy & Security" 
            subtitle="JWT session active" 
            onPress={() => router.push("/(app)/privacy")} 
          />
          <View style={styles.separator} />
          <MenuItem 
            icon={Settings} 
            iconBgColor="#F1F5F9" 
            iconColor="#475569" 
            title="Settings" 
            subtitle="Customize your app" 
            onPress={() => router.push("/(app)/profile")} 
          />
          <View style={styles.separator} />
          <MenuItem 
            icon={HelpCircle} 
            iconBgColor="#ECFCCB" 
            iconColor="#65A30D" 
            title="FAQ" 
            subtitle="Frequently asked questions" 
            onPress={() => router.push("/(app)/faq")} 
          />
          <View style={styles.separator} />
          <MenuItem 
            icon={HelpCircle} 
            iconBgColor="#EFF6FF" 
            iconColor="#3B82F6" 
            title="Help & Support" 
            subtitle="Docs, feedback, contact" 
            onPress={() => router.push("/(app)/support")} 
          />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut size={20} color={Colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>HireCompass v1.0.0 - Made with ❤️</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    backgroundColor: "#171B36",
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
  },
  headerCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#2E1C65",
    top: -100,
    right: -100,
    opacity: 0.5,
  },
  headerCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#27274A",
    bottom: -50,
    left: -50,
    opacity: 0.5,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    zIndex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F59E0B", // Orange background
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "#FFFFFF",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981", // Green
    borderWidth: 2,
    borderColor: "#171B36",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  profileEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6D28D9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 1,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#94A3B8",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120, // Bottom tab padding
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  darkModeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  menuTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#94A3B8",
  },
  soonPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  soonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 12,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  signOutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.error,
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});
