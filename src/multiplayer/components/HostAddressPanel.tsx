import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getLanAddresses, type LanAddress } from "../network/LanAddress";
import { LAN_PORT } from "../network/LanConnection";

export default function HostAddressPanel() {
  const [addresses, setAddresses] = useState<LanAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(false);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;

    setLoading(true);
    setError(null);
    setAddresses([]);

    try {
      const result = await getLanAddresses();

      if (mountedRef.current && requestId === requestRef.current) {
        setAddresses(result);
      }
    } catch (cause) {
      if (mountedRef.current && requestId === requestRef.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Failed to read network addresses.",
        );
      }
    } finally {
      if (mountedRef.current && requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();

    return () => {
      mountedRef.current = false;
      requestRef.current++;
    };
  }, [refresh]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suggested Host Addresses</Text>

      <Text style={styles.hint}>
        Turn on the hotspot first. The guest must connect to the same network
        and only enter the IP in Join Room.
      </Text>

      {loading && <ActivityIndicator color="#73e6a2" style={styles.loader} />}

      {!loading &&
        addresses.map((item) => (
          <View
            key={`${item.interfaceName}/${item.address}`}
            style={styles.addressCard}
          >
            <Text selectable style={styles.address}>
              {item.address}
            </Text>

            <Text selectable style={styles.interfaceName}>
              Interface: {item.interfaceName}
            </Text>
          </View>
        ))}

      {!loading && error === null && addresses.length === 0 && (
        <Text style={styles.hint}>
          No displayable IPv4 address was found. Check your hotspot or Wi-Fi and
          tap refresh again.
        </Text>
      )}

      {error !== null && (
        <Text selectable style={styles.error}>
          {error}
        </Text>
      )}

      <Text style={styles.port}>TCP PORT: {LAN_PORT}</Text>

      <Text style={styles.hint}>
        This list may also include mobile data or VPN IPs. The correct address
        is the one on the interface shared with the guest device. On a hotspot
        it usually matches the Wi-Fi network gateway.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: loading }}
        disabled={loading}
        onPress={() => {
          void refresh();
        }}
        style={({ pressed }) => [
          styles.button,
          (loading || pressed) && styles.dimmed,
        ]}
      >
        <Text style={styles.buttonText}>
          {loading ? "Checking…" : "Refresh Addresses"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#354f70",
  },

  title: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "left",
  },

  hint: {
    color: "#9aabbe",
    fontSize: 11,
    lineHeight: 21,
    textAlign: "left",
    marginTop: 10,
  },

  loader: {
    marginVertical: 16,
  },

  addressCard: {
    backgroundColor: "#10151c",
    borderWidth: 1,
    borderColor: "#354f70",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },

  address: {
    color: "#73e6a2",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "left",
    writingDirection: "ltr",
  },

  interfaceName: {
    color: "#9aabbe",
    fontSize: 11,
    marginTop: 6,
    textAlign: "left",
    writingDirection: "ltr",
  },

  port: {
    color: "#d6e0ec",
    fontSize: 11,
    textAlign: "left",
    marginTop: 12,
  },

  error: {
    color: "#ff8080",
    fontSize: 12,
    lineHeight: 22,
    textAlign: "left",
    marginTop: 12,
  },

  button: {
    borderWidth: 1,
    borderColor: "#73e6a2",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },

  buttonText: {
    color: "#73e6a2",
    fontWeight: "700",
    fontSize: 12,
  },

  dimmed: {
    opacity: 0.5,
  },
});
