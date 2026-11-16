import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { MatchPhase, MatchRole } from "../protocol/matchProtocol";

type Props = {
  role: MatchRole;
  phase: MatchPhase;
  canStart: boolean;
  onStart?: () => void;
};

export default function MatchStartPanel({
  role,
  phase,
  canStart,
  onStart,
}: Props) {
  if (phase === "loading") {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#73e6a2" />

        <Text style={styles.title}>در حال آماده‌سازی مسابقه</Text>

        <Text style={styles.description}>
          منتظر آماده‌شدن موتور بازی در هر دو گوشی…
        </Text>
      </View>
    );
  }

  if (phase === "running") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>فرمان شروع مسابقه تأیید شد</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {role === "host" ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canStart }}
            disabled={!canStart}
            onPress={onStart}
            style={({ pressed }) => [
              styles.button,
              !canStart && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.buttonText}>شروع مسابقه</Text>
          </Pressable>

          <Text style={styles.description}>
            {canStart
              ? "مهمان آماده است؛ می‌توانی مسابقه را شروع کنی."
              : "برای شروع، مهمان باید متصل، تأییدشده و آماده باشد."}
          </Text>
        </>
      ) : (
        <Text style={styles.description}>
          پس از اعلام آمادگی، منتظر شروع مسابقه توسط میزبان بمان.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#354f70",
    alignItems: "center",
  },

  title: {
    color: "#73e6a2",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
  },

  description: {
    color: "#a9b8ca",
    fontSize: 12,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
  },

  button: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: "#73e6a2",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },

  disabled: {
    opacity: 0.4,
  },

  pressed: {
    opacity: 0.8,
  },

  buttonText: {
    color: "#10151c",
    fontSize: 15,
    fontWeight: "800",
  },
});
