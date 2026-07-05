import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Colors, Spacing, Type } from "@/constants/theme";
import { ArrowLeft, Shield } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <Shield size={64} color={Colors.primary} strokeWidth={1.5} />
        </View>
        
        <Text style={styles.title}>Your Privacy Matters</Text>
        <Text style={styles.lastUpdated}>Last Updated: July 2026</Text>

        <Text style={styles.sectionTitle}>1. Data Collection</Text>
        <Text style={styles.paragraph}>
          At HireCompass, we collect only the necessary data to help you track your job applications, 
          manage your projects, and generate AI snippets. This includes your profile details, application history, 
          and uploaded documents.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
        <Text style={styles.paragraph}>
          Your data is used exclusively to provide and improve the HireCompass service. We do not sell your personal 
          information to third parties. AI features process your data securely to generate relevant outputs.
        </Text>

        <Text style={styles.sectionTitle}>3. Security</Text>
        <Text style={styles.paragraph}>
          We implement a variety of security measures to maintain the safety of your personal information. 
          Your session is secured using JWT tokens, and all data transmission is encrypted using industry-standard 
          SSL/TLS protocols.
        </Text>

        <Text style={styles.sectionTitle}>4. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to access, modify, or delete your personal information at any time. 
          You can manage your data directly from your account settings or contact support for assistance.
        </Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: 4,
  },
  headerTitle: {
    ...Type.h2,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 60,
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  title: {
    ...Type.h1,
    textAlign: "center",
    marginBottom: 8,
  },
  lastUpdated: {
    ...Type.caption,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Type.h2,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    ...Type.body,
    color: Colors.textMuted,
    lineHeight: 24,
  },
});
