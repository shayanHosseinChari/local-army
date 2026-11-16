import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";

import { LAN_PORT } from "../network/LanConnection";
import type { RoomStatus } from "../hooks/useLanRoom";
import LobbyPanel from "./LobbyPanel";
import HostAddressPanel from "../components/HostAddressPanel";
import MatchStartPanel from "../components/MatchStartPanel";
import type { MatchPhase } from "../protocol/matchProtocol";

type Props = {
  status: RoomStatus;
  error: string | null;
  onStartHosting: () => void;
  onLeave: () => void;
  peerVerified: boolean;
  guestReady: boolean;
  matchPhase: MatchPhase;
  canStartMatch: boolean;
  onStartMatch: () => void;
};

const STATUS_LABELS: Record<RoomStatus, string> = {
  idle: "Room not created yet",
  starting: "Creating room…",
  hosting: "Room ready — waiting for guest",
  connecting: "Connecting…",
  connected: "Guest connected",
  disconnected: "Connection lost",
};

const STATUS_TONES: Record<RoomStatus, { dot: string; text: string }> = {
  idle: { dot: "#f5c76b", text: "#f5c76b" },
  starting: { dot: "#f5c76b", text: "#f5c76b" },
  hosting: { dot: "#73e6a2", text: "#73e6a2" },
  connecting: { dot: "#f5c76b", text: "#f5c76b" },
  connected: { dot: "#73e6a2", text: "#73e6a2" },
  disconnected: { dot: "#ff8080", text: "#ff8080" },
};

export default function CreateRoomScreen({
  status,
  error,
  peerVerified,
  guestReady,
  onStartHosting,
  onLeave,
  matchPhase,
  canStartMatch,
  onStartMatch,
}: Props) {
  const [requested, setRequested] = useState(false);

  const waitingForServer = requested && status === "idle" && error === null;

  const canStart =
    !waitingForServer && (status === "idle" || status === "disconnected");

  const connected = status === "connected";

  const tone = STATUS_TONES[status];

  function createRoom() {
    setRequested(true);
    onStartHosting();
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Header — داخل اسکرول تا با محتوا جابه‌جا شود */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>LOCAL MULTIPLAYER</Text>
            <Text style={styles.title}>Create Room</Text>
            <Text style={styles.subtitle}>
              Host a match on your local network
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onLeave}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Text style={styles.backText}>BACK</Text>
          </Pressable>
        </View>

        <View style={styles.columns}>
          {/* Left: How it works */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: "#2a3b52" }]}>
                <Text style={styles.iconBadgeText}>1</Text>
              </View>
              <Text style={styles.cardTitle}>How It Works</Text>
            </View>

            <View style={styles.stepList}>
              <View style={styles.stepRow}>
                <View style={styles.stepBullet} />
                <Text style={styles.stepText}>
                  Turn on the host phone's hotspot.
                </Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepBullet} />
                <Text style={styles.stepText}>
                  Connect the guest phone to the same hotspot.
                </Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepBullet} />
                <Text style={styles.stepText}>
                  Tap "Create Room" and keep this app open.
                </Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepBullet} />
                <Text style={styles.stepText}>
                  On the guest device, enter this phone's local IP in Join Room.
                </Text>
              </View>
            </View>

            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Finding the host IP</Text>
              <Text style={styles.hintBody}>
                The host IP is not auto-detected. On most phones it appears as
                the Gateway address in the guest's Wi-Fi details — there is no
                universal fixed IP across devices.
              </Text>
            </View>
          </View>

          {/* Right: Room status */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: "#2a3b52" }]}>
                <Text style={styles.iconBadgeText}>2</Text>
              </View>
              <Text style={styles.cardTitle}>Room Status</Text>
            </View>

            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.statusText, { color: tone.text }]}
              >
                {waitingForServer ? "Creating room…" : STATUS_LABELS[status]}
              </Text>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>PORT</Text>
                <Text style={styles.metaValue}>{LAN_PORT}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>CAPACITY</Text>
                <Text style={styles.metaValue}>1 + 1</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>GUESTS</Text>
                <Text
                  style={[
                    styles.metaValue,
                    connected && styles.metaValueConnected,
                  ]}
                >
                  {connected ? "1 / 1" : "0 / 1"}
                </Text>
              </View>
            </View>

            <HostAddressPanel />

            {error !== null && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Error</Text>
                <Text
                  accessibilityLiveRegion="polite"
                  selectable
                  style={styles.errorBody}
                >
                  {error}
                </Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canStart }}
              disabled={!canStart}
              onPress={createRoom}
              style={({ pressed }) => [
                styles.createButton,
                !canStart && styles.disabledButton,
                pressed && styles.pressedButton,
              ]}
            >
              <Text style={styles.createText}>
                {canStart ? "CREATE ROOM" : "ROOM RUNNING"}
              </Text>
            </Pressable>

            {connected && (
              <View style={styles.matchSection}>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>MATCH</Text>

                {matchPhase === "lobby" && (
                  <LobbyPanel
                    role="host"
                    peerVerified={peerVerified}
                    guestReady={guestReady}
                  />
                )}

                <MatchStartPanel
                  role="host"
                  phase={matchPhase}
                  canStart={canStartMatch}
                  onStart={onStartMatch}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const CARD_BG = "#1a2431";
const CARD_BORDER = "#2c3f57";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c1117",
  },

  /* ScrollView padding به‌جای container تا هدر هم داخل اسکرول باشد */
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },

  /* ---------- Header (اکنون داخل ScrollView) ---------- */
  header: {
    flexDirection: "row",
    direction: "ltr",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    flexShrink: 1,
  },
  eyebrow: {
    color: "#73e6a2",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 6,
  },
  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#9aabbe",
    fontSize: 13,
    marginTop: 6,
  },
  backButton: {
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginLeft: 16,
  },
  backButtonPressed: {
    backgroundColor: "#1a2431",
  },
  backText: {
    color: "#d6e0ec",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  /* ---------- Layout ---------- */
  columns: {
    flexDirection: "row",
    direction: "ltr",
    gap: 18,
    flexWrap: "wrap",
  },

  /* ---------- Card ---------- */
  card: {
    flexGrow: 1,
    flexBasis: 320,
    minWidth: 0,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 18,
    padding: 22,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  /* ---------- Steps ---------- */
  stepList: { gap: 14 },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#73e6a2",
    marginTop: 7,
  },
  stepText: {
    flex: 1,
    color: "#d6e0ec",
    fontSize: 14,
    lineHeight: 22,
  },

  /* ---------- Hint ---------- */
  hintBox: {
    marginTop: 22,
    backgroundColor: "#141c26",
    borderLeftWidth: 3,
    borderLeftColor: "#f5c76b",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  hintTitle: {
    color: "#f5c76b",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  hintBody: {
    color: "#9aabbe",
    fontSize: 12,
    lineHeight: 20,
  },

  /* ---------- Status ---------- */
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#141c26",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "800",
    flexShrink: 1,
  },

  /* ---------- Meta grid ---------- */
  metaGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  metaCell: {
    flex: 1,
    backgroundColor: "#141c26",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  metaLabel: {
    color: "#7d8fa6",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  metaValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  metaValueConnected: {
    color: "#73e6a2",
  },

  /* ---------- Error ---------- */
  errorBox: {
    marginTop: 16,
    backgroundColor: "#2a1414",
    borderLeftWidth: 3,
    borderLeftColor: "#ff8080",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  errorTitle: {
    color: "#ff8080",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  errorBody: {
    color: "#ffb3b3",
    fontSize: 12,
    lineHeight: 20,
  },

  /* ---------- Create button ---------- */
  createButton: {
    backgroundColor: "#73e6a2",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#73e6a2",
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  disabledButton: { opacity: 0.35 },
  pressedButton: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  createText: {
    color: "#0c1117",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1.5,
  },

  /* ---------- Match section ---------- */
  matchSection: { marginTop: 24 },
  divider: {
    height: 1,
    backgroundColor: CARD_BORDER,
    marginBottom: 18,
  },
  sectionLabel: {
    color: "#7d8fa6",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 12,
  },
});
