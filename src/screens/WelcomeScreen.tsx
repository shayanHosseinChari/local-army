import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { gameTheme } from "../theme/gameTheme";

type WelcomeScreenProps = {
  onSinglePlayer: () => void;
  onJoinRoom: () => void;
  onCreateRoom: () => void;
};

type MenuButtonProps = {
  number: string;
  title: string;
  description: string;
  primary?: boolean;
  onPress: () => void;
};

const { colors } = gameTheme;

function MenuButton({
  number,
  title,
  description,
  primary = false,
  onPress,
}: MenuButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuButton,
        primary && styles.primaryButton,
        pressed && styles.pressedButton,
      ]}
    >
      <View style={styles.buttonContent}>
        <View style={styles.buttonLabels}>
          <Text style={[styles.buttonTitle, primary && styles.primaryTitle]}>
            {title}
          </Text>
        </View>

        <Text
          accessible={false}
          style={[styles.buttonArrow, primary && styles.primaryTitle]}
        >
          ›
        </Text>
      </View>
    </Pressable>
  );
}

export default function WelcomeScreen({
  onSinglePlayer,
  onJoinRoom,
  onCreateRoom,
}: WelcomeScreenProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View
          pointerEvents="none"
          accessible={false}
          style={styles.backgroundPanel}
        />

        <View style={styles.layout}>
          {/* Brand Section */}
          <ScrollView
            style={styles.brandColumn}
            contentContainerStyle={styles.brandContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>WELCOME TO THE BATTLEFIELD</Text>
            </View>

            <Text
              accessibilityRole="header"
              accessibilityLabel="Local Army"
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.6}
              style={styles.logo}
            >
              LOCAL
              <Text style={styles.logoAccent}>ARMY</Text>
            </Text>

            <View style={styles.separator} />

            <Text style={styles.slogan}>YOUR ARENA. YOUR RULES.</Text>

            <Text style={styles.introduction}>
              Enter the battlefield alone or play with another player on the
              local network.
            </Text>

            <Text style={styles.footer}>SINGLE PLAYER / LOCAL MULTIPLAYER</Text>
          </ScrollView>

          {/* Game Mode Selection */}
          <ScrollView
            style={styles.menuColumn}
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.menuEyebrow}>SELECT YOUR MODE</Text>

            <MenuButton
              number="01"
              title="Single Player"
              description="Start a solo game"
              primary
              onPress={onSinglePlayer}
            />

            <MenuButton
              number="02"
              title="Join Room"
              description="Join the host's room"
              onPress={onJoinRoom}
            />

            <MenuButton
              number="03"
              title="Create Room"
              description="Create a room on your phone"
              onPress={onCreateRoom}
            />

            <Text style={styles.networkHint}>
              Local play: both phones must be on the same network.
            </Text>
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: "hidden",
  },

  backgroundPanel: {
    position: "absolute",
    top: "-35%",
    bottom: "-35%",
    right: "-12%",
    width: "55%",
    backgroundColor: colors.panelDark,
    transform: [{ rotate: "18deg" }],
  },

  layout: {
    flex: 1,
    flexDirection: "row",
    direction: "ltr",
  },

  brandColumn: {
    flex: 1,
    minWidth: 0,
  },

  brandContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: 8,
  },

  badgeText: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "left",
  },

  logo: {
    color: colors.text,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "left",
  },

  logoAccent: {
    color: colors.accent,
  },

  separator: {
    width: 54,
    height: 3,
    backgroundColor: colors.accent,
    marginVertical: 15,
  },

  slogan: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "left",
  },

  introduction: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 24,
    textAlign: "left",
    marginTop: 14,
    maxWidth: 360,
  },

  footer: {
    color: colors.textMuted,
    fontSize: 8,
    letterSpacing: 1,
    textAlign: "left",
    marginTop: 24,
  },

  menuColumn: {
    flex: 1,
    minWidth: 0,
  },

  menuContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  menuEyebrow: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "left",
    marginBottom: 12,
  },

  menuButton: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    minHeight: 68,
  },

  primaryButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  pressedButton: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  buttonNumber: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    marginRight: 12,
  },

  primaryNumber: {
    color: colors.background,
  },

  buttonLabels: {
    flex: 1,
    minWidth: 0,
  },

  buttonTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "left",
  },

  primaryTitle: {
    color: colors.background,
  },

  buttonDescription: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },

  primaryDescription: {
    color: colors.panelDark,
  },

  buttonArrow: {
    color: colors.accent,
    fontSize: 28,
    marginLeft: 10,
  },

  networkHint: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 18,
    textAlign: "right",
    marginTop: 2,
  },
});
