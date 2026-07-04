/**
 * CompassMark.tsx — Minimal compass SVG mark.
 * Single 45°-rotated needle inside a thin circle, in brass on inkRaised.
 * Replaces the 🧭 emoji on auth screens.
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Line, G } from "react-native-svg";
import { Colors, BorderRadius } from "@/constants/theme";

interface CompassMarkProps {
  size?: number;
}

export function CompassMark({ size = 72 }: CompassMarkProps) {
  const r = size / 2;
  const innerR = r * 0.72;
  const needleHalf = innerR * 0.72;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
        },
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer thin circle */}
        <Circle
          cx={r}
          cy={r}
          r={innerR}
          stroke={Colors.brass}
          strokeWidth={1.25}
          fill="none"
        />
        {/* 45° rotated needle — N/S axis */}
        <G rotation="45" origin={`${r}, ${r}`}>
          {/* North half — brass (pointing up/right) */}
          <Line
            x1={r}
            y1={r - needleHalf}
            x2={r}
            y2={r}
            stroke={Colors.brass}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {/* South half — dimmed */}
          <Line
            x1={r}
            y1={r}
            x2={r}
            y2={r + needleHalf}
            stroke={Colors.brassDim}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </G>
        {/* Center pivot dot */}
        <Circle cx={r} cy={r} r={2} fill={Colors.brass} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.inkRaised,
    borderWidth: 1,
    borderColor: Colors.hairline,
    justifyContent: "center",
    alignItems: "center",
  },
});
