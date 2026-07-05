import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Colors, Spacing, Type } from "@/constants/theme";
import { ArrowLeft, Mail, Bug, MessageCircle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleEmailSupport = (isBug: boolean = false) => {
    const email = "support@hirecompass.com";
    const subject = isBug ? "Bug Report - HireCompass App" : "Support Request - HireCompass App";
    const body = "Hi Kunal,\n\nI need some help with...\n\n(Please describe your issue or feature request below)\n\n";
    
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(
          "Email Not Available",
          "We couldn't open your email client. Please send an email directly to support@hirecompass.com"
        );
      }
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <MessageCircle size={64} color={Colors.primary} strokeWidth={1.5} />
        </View>
        
        <Text style={styles.title}>How can we help?</Text>
        <Text style={styles.subtitle}>
          If you've noticed a bug, faced a challenge during operation, or just want to request a feature, let us know!
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => handleEmailSupport(false)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: "#EFF6FF" }]}>
              <Mail size={24} color="#3B82F6" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Contact Support</Text>
              <Text style={styles.optionSubtitle}>General questions and assistance</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => handleEmailSupport(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: "#FEF2F2" }]}>
              <Bug size={24} color="#EF4444" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Report a Bug</Text>
              <Text style={styles.optionSubtitle}>Let us know if something is broken</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Response Time</Text>
          <Text style={styles.infoText}>
            I typically respond to emails within 24-48 hours. Thank you for your patience and for helping improve HireCompass!
          </Text>
        </View>

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
  subtitle: {
    ...Type.bodyMed,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  optionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    ...Type.h2,
    marginBottom: 4,
  },
  optionSubtitle: {
    ...Type.body,
    color: Colors.textMuted,
  },
  infoBox: {
    backgroundColor: "#F8FAFC",
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    ...Type.bodyMed,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    color: Colors.text,
  },
  infoText: {
    ...Type.body,
    color: Colors.textMuted,
    lineHeight: 22,
  },
});
