import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MatchStartPanel from "../components/MatchStartPanel";
import type { MatchPhase } from "../protocol/matchProtocol";

import { LAN_PORT } from "../network/LanConnection";
import type { RoomStatus } from "../hooks/useLanRoom";
import LobbyPanel from "./LobbyPanel";

type Props = {
  status: RoomStatus;
  error: string | null;
  onJoin: (hostIp: string) => void;
  onLeave: () => void;
  peerVerified: boolean;
  guestReady: boolean;
  matchPhase: MatchPhase;

  onToggleReady: () => void;
};

export default function JoinRoomScreen({
  status,
  error,
  peerVerified,
  guestReady,
  onJoin,
  onLeave,
  onToggleReady,
  matchPhase,
}: Props) {
  const [hostIp, setHostIp] = useState("");

  const connecting = status === "connecting";
  const connected = status === "connected";
  const canJoin =
    (status === "idle" || status === "disconnected") &&
    hostIp.trim().length > 0;

  function connect() {
    if (!canJoin) {
      return;
    }

    Keyboard.dismiss();
    onJoin(hostIp.trim());
  }

  const statusText = connected
    ? "Connected to host"
    : connecting
      ? "Connecting to host…"
      : status === "disconnected"
        ? "Connection to host lost"
        : "Enter host IP address";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>LOCAL MULTIPLAYER</Text>
          <Text style={styles.title}>Join Room</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onLeave}
          style={styles.backButton}
        >
          <Text style={styles.backText}>BACK / DISCONNECT</Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.columns}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connect to Host</Text>

            <Text style={styles.instructions}>
              1. Connect to the host phone's hotspot.
              {"\n\n"}
              2. The host must tap "Create Room" and start hosting.
              {"\n\n"}
              3. Enter the host's local IP address and tap "Connect".
            </Text>

            <Text style={styles.hint}>
              On most phones, the Gateway address in the guest Wi-Fi network
              details is the hotspot host's address. Do not enter the guest
              phone's IP.
            </Text>

            <Text style={styles.hint}>
              No internet needed; both phones must be on the same local network
              and the host app must stay open.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Room Address</Text>

            <Text style={styles.inputLabel}>Host IPv4</Text>

            <TextInput
              accessibilityLabel="Host IPv4 address"
              value={hostIp}
              onChangeText={setHostIp}
              placeholder="e.g. 192.168.43.1"
              placeholderTextColor="#78899d"
              editable={!connecting && !connected}
              keyboardType="decimal-pad"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={15}
              returnKeyType="go"
              onSubmitEditing={connect}
              style={styles.input}
            />

            <Text style={styles.port}>TCP PORT: {LAN_PORT}</Text>

            <View style={styles.statusRow}>
              {connecting && <ActivityIndicator size="small" color="#f5c76b" />}

              <Text
                accessibilityLiveRegion="polite"
                style={[styles.status, connected && styles.connectedStatus]}
              >
                {statusText}
              </Text>
            </View>

            {error !== null && (
              <Text
                accessibilityLiveRegion="polite"
                selectable
                style={styles.error}
              >
                {error}
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canJoin }}
              disabled={!canJoin}
              onPress={connect}
              style={({ pressed }) => [
                styles.joinButton,
                !canJoin && styles.disabledButton,
                pressed && styles.pressedButton,
              ]}
            >
              <Text style={styles.joinText}>
                {connected
                  ? "CONNECTED"
                  : connecting
                    ? "CONNECTING…"
                    : "CONNECT"}
              </Text>
            </Pressable>

            {connected && (
              <>
                {matchPhase === "lobby" && (
                  <LobbyPanel
                    role="guest"
                    peerVerified={peerVerified}
                    guestReady={guestReady}
                    onToggleReady={onToggleReady}
                  />
                )}

                <MatchStartPanel
                  role="guest"
                  phase={matchPhase}
                  canStart={false}
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10151c",
    paddingHorizontal: 24,
    paddingTop: 16,
  },

  header: {
    flexDirection: "row",
    direction: "ltr",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  eyebrow: {
    color: "#9aabbe",
    fontSize: 10,
    letterSpacing: 2,
  },

  title: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },

  backButton: {
    borderWidth: 1,
    borderColor: "#354f70",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  backText: {
    color: "#ffffff",
    fontSize: 12,
  },

  content: {
    paddingBottom: 24,
  },

  columns: {
    flexDirection: "row",
    direction: "ltr",
    gap: 16,
  },

  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#1a2431",
    borderWidth: 1,
    borderColor: "#354f70",
    borderRadius: 14,
    padding: 18,
  },

  cardTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "left",
    marginBottom: 14,
  },

  instructions: {
    color: "#d6e0ec",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "left",
  },

  hint: {
    color: "#9aabbe",
    fontSize: 11,
    lineHeight: 21,
    textAlign: "left",
    marginTop: 16,
  },

  inputLabel: {
    color: "#d6e0ec",
    fontSize: 12,
    textAlign: "left",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#10151c",
    borderWidth: 1,
    borderColor: "#354f70",
    borderRadius: 10,
    color: "#ffffff",
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: "left",
    writingDirection: "ltr",
  },

  port: {
    color: "#9aabbe",
    fontSize: 10,
    textAlign: "left",
    marginTop: 8,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },

  status: {
    flex: 1,
    color: "#f5c76b",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "left",
  },

  connectedStatus: {
    color: "#73e6a2",
  },

  error: {
    color: "#ff8080",
    fontSize: 12,
    lineHeight: 22,
    textAlign: "left",
    marginTop: 12,
  },

  joinButton: {
    backgroundColor: "#73e6a2",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 18,
  },

  disabledButton: {
    opacity: 0.45,
  },

  pressedButton: {
    opacity: 0.8,
  },

  joinText: {
    color: "#10151c",
    fontWeight: "800",
    fontSize: 14,
  },
});
