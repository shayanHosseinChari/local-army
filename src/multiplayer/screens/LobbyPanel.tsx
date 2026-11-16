import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  role: "host" | "guest";
  peerVerified: boolean;
  guestReady: boolean;
  onToggleReady?: () => void;
};

export default function LobbyPanel({
  role,
  peerVerified,
  guestReady,
  onToggleReady,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ROOM LOBBY</Text>

      <Text accessibilityLiveRegion="polite" style={styles.description}>
        {peerVerified
          ? "ارتباط لابی تأیید شد"
          : "در حال بررسی نسخهٔ برنامهٔ بازیکن مقابل…"}
      </Text>

      {peerVerified && (
        <>
          <Text style={styles.player}>میزبان: حاضر</Text>

          <Text
            accessibilityLiveRegion="polite"
            style={[styles.player, guestReady && styles.ready]}
          >
            مهمان: {guestReady ? "آماده" : "هنوز آماده نیست"}
          </Text>

          {role === "guest" && (
            <Pressable
              accessibilityRole="button"
              onPress={onToggleReady}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>
                {guestReady ? "لغو آمادگی" : "آماده‌ام"}
              </Text>
            </Pressable>
          )}

          <Text style={styles.hint}>
            {role === "host"
              ? guestReady
                ? "مهمان آماده است. شروع مسابقه پس از اتصال موتور بازی اضافه می‌شود."
                : "منتظر اعلام آمادگی مهمان هستیم."
              : "شروع مسابقه در اختیار میزبان خواهد بود؛ در این مرحله فقط آمادگی ثبت می‌شود."}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#354f70",
    paddingTop: 16,
  },

  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "left",
  },

  description: {
    color: "#9aabbe",
    fontSize: 12,
    lineHeight: 22,
    textAlign: "right",
    marginTop: 10,
  },

  player: {
    color: "#d6e0ec",
    fontSize: 14,
    textAlign: "right",
    marginTop: 12,
  },

  ready: {
    color: "#73e6a2",
  },

  button: {
    backgroundColor: "#73e6a2",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 16,
  },

  pressed: {
    opacity: 0.8,
  },

  buttonText: {
    color: "#10151c",
    fontWeight: "800",
  },

  hint: {
    color: "#9aabbe",
    fontSize: 11,
    lineHeight: 21,
    textAlign: "right",
    marginTop: 14,
  },
});
