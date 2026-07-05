import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Text, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/services/api";
import { Colors, Shadows, Type } from "@/constants/theme";
import {
  Home,
  Layers,
  Send,
  Briefcase,
  MoreHorizontal,
} from "lucide-react-native";

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <BlurView intensity={80} tint="light" style={styles.pill}>
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

          // Map route names to Icons and labels
          let IconCmp = Home;
          let label = "Home";
          if (route.name === "opportunities") { IconCmp = Layers; label = "Pipeline"; }
          if (route.name === "outreach") { IconCmp = Send; label = "Outreach"; }
          if (route.name === "projects") { IconCmp = Briefcase; label = "Projects"; }
          if (route.name === "more") { IconCmp = MoreHorizontal; label = "More"; }

          // Only render the 5 main screens in the tab bar
          const mainRoutes = ["index", "opportunities", "outreach", "projects", "more"];
          if (!mainRoutes.includes(route.name)) return null;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tabItem}
            >
              <View style={styles.iconContainer}>
                <IconCmp
                  size={22}
                  color={isFocused ? Colors.primary : Colors.textMuted}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
                {/* Optional notification badge for specific routes if needed */}
                {route.name === "outreach" && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>3</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
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
      <Tabs.Screen name="index" />
      <Tabs.Screen name="opportunities" />
      <Tabs.Screen name="outreach" />
      <Tabs.Screen name="projects" />
      <Tabs.Screen name="more" />
      
      {/* Hidden Screens */}
      <Tabs.Screen name="interviews" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
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
    backgroundColor: "rgba(249, 249, 249, 0)", // 0% opacity as requested, relying entirely on BlurView
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "space-between",
    width: '92%',
    maxWidth: 500,
    overflow: "hidden",
    ...Shadows.card,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabLabel: {
    ...Type.micro,
    fontSize: 10,
    marginTop: 6,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
});
