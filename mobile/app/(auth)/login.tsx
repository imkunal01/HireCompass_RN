import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing, Type, BorderRadius } from "@/constants/theme";
import { Button, Input } from "@/components/ui";
import { Compass, Eye, EyeOff } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(app)/");
    } catch (err: any) {
      Alert.alert("Login Failed", err?.response?.data?.error || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        {/* Logo/Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBox}>
            <Compass size={32} color={Colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.brandName}>HireCompass</Text>
          <Text style={styles.brandTagline}>Track jobs, land offers.</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View>
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              containerStyle={{ marginBottom: Spacing.xl }}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={Colors.textFaint} strokeWidth={2} />
              ) : (
                <Eye size={20} color={Colors.textFaint} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>

          <Button variant="primary" loading={loading} onPress={handleLogin}>
            Sign In
          </Button>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 24, // Squircle
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  brandName: {
    ...Type.h1,
    fontSize: 28,
    marginBottom: 4,
  },
  brandTagline: {
    ...Type.body,
    color: Colors.textMuted,
  },
  formContainer: {
    width: "100%",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 42,
    padding: 4,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
    gap: 6,
  },
  footerText: {
    ...Type.bodyMed,
    color: Colors.textMuted,
  },
  footerLink: {
    ...Type.bodyMed,
    color: Colors.primaryLight,
  },
});
