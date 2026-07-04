import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { getToken } from "@/services/api";

export default function AuthLayout() {
  const router = useRouter();

  useEffect(() => {
    // If already have a token, go to app
    getToken().then((token) => {
      if (token) {
        router.replace("/(app)");
      }
    });
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
