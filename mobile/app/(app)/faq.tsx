import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Colors, Spacing, Type } from "@/constants/theme";
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FAQ_DATA = [
  {
    id: "1",
    question: "How does the AI Form Kit work?",
    answer: "The AI Form Kit uses your profile data, project details, and experience to generate tailored responses for job applications. It automatically formats the information into snippets you can copy-paste directly into application forms.",
  },
  {
    id: "2",
    question: "How do I track my DSA progress?",
    answer: "Currently, the DSA Tracker is in development ('Soon'). Once released, you'll be able to log problems solved on platforms like LeetCode and see a visual heatmap of your consistency.",
  },
  {
    id: "3",
    question: "Can I import jobs from LinkedIn?",
    answer: "Yes! Use the 'Import Job' feature under the Tools menu. You can paste a LinkedIn job URL or description, and our system will extract the key requirements for you to track.",
  },
  {
    id: "4",
    question: "Is my data secure?",
    answer: "Absolutely. We use industry-standard encryption and JWT-based authentication to ensure your personal data and job search history remain private and secure.",
  },
  {
    id: "5",
    question: "How do I upgrade to the Pro Plan?",
    answer: "You can upgrade to the Pro Plan from the Profile & Settings page. The Pro Plan gives you unlimited AI snippet generations, advanced analytics, and priority support.",
  },
];

export default function FAQScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>("1");

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <HelpCircle size={64} color={Colors.primary} strokeWidth={1.5} />
        </View>
        
        <Text style={styles.title}>Frequently Asked Questions</Text>
        <Text style={styles.subtitle}>Find answers to common questions about HireCompass</Text>

        <View style={styles.faqList}>
          {FAQ_DATA.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View key={item.id} style={styles.faqCard}>
                <TouchableOpacity 
                  style={styles.faqHeader} 
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.question, isExpanded && styles.questionExpanded]}>{item.question}</Text>
                  {isExpanded ? (
                    <ChevronUp size={20} color={Colors.primary} />
                  ) : (
                    <ChevronDown size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answer}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
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
  },
  faqList: {
    gap: Spacing.md,
  },
  faqCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  question: {
    ...Type.bodyMed,
    flex: 1,
    marginRight: Spacing.md,
  },
  questionExpanded: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  answerContainer: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  answer: {
    ...Type.body,
    color: Colors.textMuted,
    lineHeight: 22,
  },
});
