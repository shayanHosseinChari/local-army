import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import {
  LanConnection,
  LAN_PORT,
  type LanStatus,
} from "../network/LanConnection";

const STATUS_LABELS: Record<LanStatus, string> = {
  idle: "قطع / آماده",
  hosting: "میزبان: منتظر اتصال مهمان",
  connecting: "در حال اتصال به میزبان",
  connected: "متصل",
  disconnected: "ارتباط قطع شد",
};

function NetworkTest() {
  const connectionRef = useRef<LanConnection | null>(null);

  const [status, setStatus] = useState<LanStatus>("idle");
  const [hostIp, setHostIp] = useState("");
  const [message, setMessage] = useState("سلام از گوشی من!");
  const [logs, setLogs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  function addLog(text: string) {
    const time = new Date().toLocaleTimeString();

    setLogs((previous) => [`${time} — ${text}`, ...previous].slice(0, 60));
  }

  useEffect(() => {
    let active = true;

    const connection = new LanConnection({
      onStatus(nextStatus) {
        if (!active) {
          return;
        }

        setStatus(nextStatus);
        addLog(`وضعیت: ${STATUS_LABELS[nextStatus]}`);
      },

      onMessage(received) {
        if (!active) {
          return;
        }

        if (
          received.type === "test:chat" &&
          typeof received.payload === "string"
        ) {
          // نمایش متن را هم محدود می‌کنیم.
          addLog(`دریافت: ${received.payload.slice(0, 500)}`);
        } else {
          addLog(`پیام با نوع: ${received.type.slice(0, 80)}`);
        }
      },

      onError(error) {
        if (active) {
          addLog(`خطا: ${error}`);
        }
      },
    });

    connectionRef.current = connection;
    setReady(true);

    return () => {
      // هنگام خروج، callbackها نباید state صفحه را تغییر دهند.
      active = false;
      connectionRef.current = null;
      connection.stop();
    };
  }, []);

  function startHosting() {
    addLog(`درخواست میزبانی روی پورت ${LAN_PORT}`);
    connectionRef.current?.host();
  }

  function joinHost() {
    addLog(`درخواست اتصال به ${hostIp.trim()}:${LAN_PORT}`);
    connectionRef.current?.join(hostIp);
  }

  function sendMessage() {
    const text = message.trim();

    if (!text || status !== "connected") {
      return;
    }

    const queued = connectionRef.current?.send({
      type: "test:chat",
      payload: text,
    });

    if (queued) {
      // این فقط ثبت ارسال محلی است، نه تأیید دریافت طرف مقابل.
      addLog(`ارسال محلی: ${text}`);
    }
  }

  const busy =
    status === "hosting" || status === "connecting" || status === "connected";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>تست شبکهٔ محلی StrikeZone</Text>

        <Text style={styles.description}>
          یک گوشی میزبان شود و گوشی دیگر با IP میزبان به آن وصل شود. برنامه روی
          هر دو گوشی باز بماند.
        </Text>

        <View style={styles.card}>
          <Text style={styles.status}>{STATUS_LABELS[status]}</Text>
          <Text style={styles.description}>پورت ارتباط: {LAN_PORT}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>گوشی اول — میزبان</Text>

          <Text style={styles.description}>
            ابتدا هات‌اسپات را از تنظیمات گوشی روشن کن، سپس دکمهٔ زیر را بزن.
          </Text>

          <Button
            title="شروع میزبانی"
            disabled={!ready || busy}
            onPress={startHosting}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>گوشی دوم — مهمان</Text>

          <Text style={styles.description}>
            به هات‌اسپات میزبان وصل شو و IP میزبان را وارد کن.
          </Text>

          <TextInput
            style={styles.input}
            value={hostIp}
            onChangeText={setHostIp}
            placeholder="IP میزبان"
            placeholderTextColor="#8190a5"
            keyboardType="decimal-pad"
            autoCorrect={false}
            autoCapitalize="none"
            editable={!busy}
            maxLength={15}
          />

          <Button
            title="اتصال به میزبان"
            disabled={!ready || busy || !hostIp.trim()}
            onPress={joinHost}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>ارسال پیام آزمایشی</Text>

          <TextInput
            style={[styles.input, styles.messageInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="پیام"
            placeholderTextColor="#8190a5"
            maxLength={500}
          />

          <Button
            title="ارسال پیام"
            disabled={status !== "connected" || !message.trim()}
            onPress={sendMessage}
          />

          <View style={styles.spacing} />

          <Button
            title="قطع اتصال / توقف میزبانی"
            color="#c24141"
            disabled={!ready}
            onPress={() => connectionRef.current?.stop()}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>گزارش ارتباط</Text>

          <Button title="پاک‌کردن گزارش" onPress={() => setLogs([])} />

          {logs.length === 0 ? (
            <Text style={styles.log}>هنوز رویدادی ثبت نشده است.</Text>
          ) : (
            logs.map((line, index) => (
              <Text key={index} selectable style={styles.log}>
                {line}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function LanTestScreen() {
  return (
    <SafeAreaProvider>
      <NetworkTest />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#10151c",
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 12,
  },
  description: {
    color: "#b8c5d6",
    fontSize: 14,
    lineHeight: 24,
    textAlign: "right",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#1a2431",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  heading: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 12,
  },
  status: {
    color: "#7dd3fc",
    fontSize: 17,
    textAlign: "right",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#10151c",
    borderColor: "#3c4c61",
    borderWidth: 1,
    borderRadius: 8,
    color: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    textAlign: "left",
  },
  messageInput: {
    textAlign: "right",
  },
  spacing: {
    height: 12,
  },
  log: {
    color: "#d1d9e6",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "right",
    marginTop: 12,
  },
});
