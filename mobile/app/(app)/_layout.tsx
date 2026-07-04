import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/services/api";
import { Colors, Shadows } from "@/constants/theme";
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  TrendingUp,
  Grid,
} from "lucide-react-native";

// ── Custom Floating Pill Tab Bar ─────────────────────────────────────────────
function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.pill}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Map route names to Icons
          let IconCmp = LayoutDashboard;
          if (route.name === "opportunities") IconCmp = Briefcase;
          if (route.name === "interviews") IconCmp = CalendarDays;
          if (route.name === "analytics") IconCmp = TrendingUp;
          if (route.name === "more") IconCmp = Grid;

          // Don't render hidden screens if any exist
          if (["profile", "documents", "import", "outreach", "projects", "ai-tools", "reminders", "tracker"].includes(route.name)) return null;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              activeOpacity={0.8}
              style={[
                styles.tabItem,
                isFocused && styles.tabItemActive,
              ]}
            >
              <IconCmp
                size={22}
                color={isFocused ? Colors.text : Colors.textFaint}
                strokeWidth={isFocused ? 2.5 : 2}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AppLayout() {
  const router = useRouter();
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    getToken().then(async (token) => {
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }
      const ok = await fetchMe();
      if (!ok) {
        router.replace("/(auth)/login");
      }
    });
  }, []);

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="opportunities" options={{ title: "Jobs" }} />
      <Tabs.Screen name="interviews" options={{ title: "Interviews" }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
      <Tabs.Screen name="more" options={{ title: "Menu" }} />
      
      {/* Exclude other screens from tabs if they accidentally get mapped here */}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  pill: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 8,
    ...Shadows.pill,
  },
  tabItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
  },
});
