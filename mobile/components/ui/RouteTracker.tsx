import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Colors, Type, BorderRadius } from "@/constants/theme";

const STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"];

export function RouteTracker({
  stage = "APPLIED",
  compact = false,
}: {
  stage?: string;
  compact?: boolean;
}) {
  const safeStage = stage || "APPLIED";
  const currentIndex = Math.max(0, STAGES.indexOf(safeStage));
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentIndex / (STAGES.length - 1)) * 100)
  );

  const rProgressStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${progressPercent}%`, {
        damping: 20,
        stiffness: 90,
      }),
    };
  }, [progressPercent]);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactTrackBg}>
          <Animated.View style={[styles.compactTrackFill, rProgressStyle]} />
        </View>
        <Text style={styles.compactLabel}>
          {safeStage.replace("_", " ")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <View style={styles.fullTrackBg}>
        <Animated.View style={[styles.fullTrackFill, rProgressStyle]} />
      </View>

      <View style={styles.nodesContainer}>
        {STAGES.map((s, idx) => {
          const isPast = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;

          return (
            <View key={s} style={styles.nodeWrapper}>
              <View
                style={[
                  styles.nodeCircle,
                  isPast && styles.nodePast,
                  isCurrent && styles.nodeCurrent,
                  isFuture && styles.nodeFuture,
                ]}
              >
                {isPast ? (
                  <Check size={12} color={Colors.text} strokeWidth={3} />
                ) : isCurrent ? (
                  <View style={styles.nodeDot} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.nodeLabel,
                  isPast && styles.labelPast,
                  isCurrent && styles.labelCurrent,
                  isFuture && styles.labelFuture,
                ]}
              >
                {s}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact Mode
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  compactTrackBg: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  compactTrackFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  compactLabel: {
    ...Type.micro,
    color: Colors.primaryLight,
  },

  // Full Mode
  fullContainer: {
    paddingVertical: 12,
  },
  fullTrackBg: {
    position: "absolute",
    top: 24, // 12 padding + 12 (half of 24px circle)
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  fullTrackFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  nodesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nodeWrapper: {
    alignItems: "center",
    width: 60,
  },
  nodeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
  },
  nodePast: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  nodeCurrent: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
  },
  nodeFuture: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  nodeLabel: {
    ...Type.micro,
    fontSize: 9,
    textAlign: "center",
  },
  labelPast: { color: Colors.text },
  labelCurrent: { color: Colors.primaryLight },
  labelFuture: { color: Colors.textFaint },
});
