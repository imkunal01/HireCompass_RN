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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
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
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                placeholder="you@example.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <View>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!showPassword}
                  containerStyle={{ marginBottom: Spacing.xl }}
                />
              )}
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

          <Button variant="primary" loading={loading} onPress={handleSubmit(onSubmit)}>
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
