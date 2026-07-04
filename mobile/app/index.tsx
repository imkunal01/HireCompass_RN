import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getToken } from "@/services/api";
import { Colors } from "@/constants/theme";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    getToken().then((token) => {
      if (token) {
        router.replace("/(app)");
      } else {
        router.replace("/(auth)/login");
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}
