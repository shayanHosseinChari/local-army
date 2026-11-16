import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import WebView from "react-native-webview";
import { isGameMessage, type GameMessage } from "../protocol/gameProtocol";

import { createMultiplayerHtml } from "../game/createMultiplayerHtml";
import type { MatchPhase, MatchSession } from "../protocol/matchProtocol";

type Props = {
  session: MatchSession;
  phase: MatchPhase;
  onLoaded: (matchId: string) => void;
  onLeave: () => void;
  sendGameMessage: (message: GameMessage) => boolean;
  subscribeGameMessages: (
    listener: (message: GameMessage) => void,
  ) => () => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type PlayerScore = {
  id: string;
  name: string;
  score: number;
  kills: number;
  health: number;
  isLocal: boolean;
  rank: number;
};

export default function MultiplayerGameScreen({
  session,
  phase,
  onLoaded,
  onLeave,
  sendGameMessage,
  subscribeGameMessages,
}: Props) {
  const [result, setResult] = useState<string | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [rematchPending, setRematchPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<PlayerScore[]>([]);

  const observeSnapshot = useCallback(
    (message: GameMessage) => {
      if (
        message.type !== "game/snapshot" ||
        message.payload.matchId !== session.matchId
      )
        return;
      const players = message.payload.players;

      // DEBUG: برای بررسی اینکه kills/score میان یا نه
      // console.log("[snapshot players]", JSON.stringify(players));

      const parsed: PlayerScore[] = players.map((player) => ({
        id: player.id,
        name: player.id === session.role ? "YOU" : "ENEMY",
        score: player.score ?? 0,
        kills: player.kills ?? 0,
        health: player.health ?? 0,
        isLocal: player.id === session.role,
        rank: 0,
      }));

      const sorted = [...parsed].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.kills !== a.kills) return b.kills - a.kills;
        return b.health - a.health;
      });
      sorted.forEach((p, i) => {
        const target = parsed.find((x) => x.id === p.id)!;
        target.rank = i + 1;
      });

      setScores(parsed);

      if (!players.some((player) => player.health <= 0)) return;
      const local = players.find((player) => player.id === session.role)!;
      const allDead = players.every((player) => player.health <= 0);
      setResult(allDead ? "DRAW" : local.health > 0 ? "VICTORY" : "DEFEAT");
      setIsWin(!allDead && local.health > 0);
    },
    [session.matchId, session.role],
  );

  const [localLoaded, setLocalLoaded] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    setResult(null);
    setIsWin(false);
    setRematchPending(false);
    setError(null);
    setLocalLoaded(false);
    setScores([]);
  }, [session.matchId]);

  const injectBridgeCall = useCallback(
    (method: "start" | "receive", argument: unknown) => {
      const serialized = JSON.stringify(argument)
        .replace(/</g, "\\u003c")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");

      webViewRef.current?.injectJavaScript(`
      (function () {
        if (window.lanBridge) {
          window.lanBridge.${method}(${serialized});
        }
      })();
      true;
    `);
    },
    [],
  );

  useEffect(() => {
    return subscribeGameMessages((message) => {
      if (message.payload.matchId !== session.matchId) {
        return;
      }
      observeSnapshot(message);
      injectBridgeCall("receive", message);
    });
  }, [
    session.matchId,
    subscribeGameMessages,
    injectBridgeCall,
    observeSnapshot,
  ]);

  useEffect(() => {
    if (localLoaded && phase === "running" && !error) {
      injectBridgeCall("start", session.matchId);
    }
  }, [localLoaded, phase, error, session.matchId, injectBridgeCall]);

  const document = useMemo(() => {
    try {
      return {
        source: { html: createMultiplayerHtml(session) },
        error: null,
      };
    } catch (cause) {
      return {
        source: null,
        error: cause instanceof Error ? cause.message : String(cause),
      };
    }
  }, [session]);

  const handleMessage = useCallback(
    (data: string) => {
      let message: unknown;

      try {
        message = JSON.parse(data);
      } catch {
        return;
      }

      if (!isRecord(message)) {
        return;
      }

      if (message.type === "error" && typeof message.message === "string") {
        setError(message.message);
        return;
      }

      if (message.matchId !== session.matchId) {
        return;
      }
      if (message.type === "multiplayer/network") {
        if (
          isGameMessage(message.message) &&
          message.message.payload.matchId === session.matchId
        ) {
          sendGameMessage(message.message);
          observeSnapshot(message.message);
        }
        return;
      }

      if (message.type === "multiplayer/loaded") {
        setLocalLoaded(true);
        onLoaded(session.matchId);
        return;
      }

      if (
        message.type === "multiplayer/error" &&
        typeof message.message === "string"
      ) {
        setError(message.message);
      }
    },
    [session.matchId, onLoaded, sendGameMessage, observeSnapshot],
  );

  const displayedError = error ?? document.error;
  const showPreview = localLoaded && phase === "running" && !displayedError;

  const localScore = scores.find((s) => s.isLocal);
  const topScore = Math.max(1, ...scores.map((s) => s.score));
  const mvp = scores.find((s) => s.rank === 1);

  const resultColor = isWin
    ? "#73e6a2"
    : result === "DRAW"
      ? "#ffb84d"
      : "#ff6464";
  const resultGlow = isWin
    ? "rgba(115,230,162,0.55)"
    : result === "DRAW"
      ? "rgba(255,184,77,0.55)"
      : "rgba(255,100,100,0.55)";

  return (
    <View style={styles.container}>
      {document.source && (
        <WebView
          key={session.matchId}
          ref={webViewRef}
          source={document.source}
          style={styles.webview}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          setSupportMultipleWindows={false}
          androidLayerType="hardware"
          onMessage={(event) => {
            handleMessage(event.nativeEvent.data);
          }}
          onError={(event) => {
            setError(event.nativeEvent.description);
          }}
          onRenderProcessGone={() => {
            setError("Game graphics process stopped.");
          }}
          onContentProcessDidTerminate={() => {
            setError("Game graphics process stopped.");
          }}
        />
      )}

      {(!showPreview || result !== null) && (
        <View style={styles.overlay}>
          <ScrollView
            fadingEdgeLength={30}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {displayedError ? (
              <View style={styles.panel}>
                <Text style={styles.errorTitle}>GAME INIT ERROR</Text>
                <Text style={styles.description}>{displayedError}</Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.leaveButton}
                  onPress={onLeave}
                >
                  <Text style={styles.leaveText}>LEAVE MATCH</Text>
                </Pressable>
              </View>
            ) : result ? (
              <View style={styles.resultPanel}>
                {/* ===== هدر نتیجه ===== */}
                <View style={styles.resultHeader}>
                  <Text
                    style={[
                      styles.resultTitle,
                      { color: resultColor, textShadowColor: resultGlow },
                    ]}
                  >
                    {result}
                  </Text>
                  <Text style={styles.resultSubtitle}>
                    {isWin
                      ? "You dominated the arena"
                      : result === "DRAW"
                        ? "Evenly matched warriors"
                        : "Better luck next time"}
                  </Text>
                </View>

                {/* ===== کارت آمار محلی ===== */}
                {localScore && (
                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>KILLS</Text>
                      <Text style={styles.statValue}>{localScore.kills}</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>SCORE</Text>
                      <Text style={[styles.statValue, { color: "#8ec8ff" }]}>
                        {localScore.score}
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>RANK</Text>
                      <Text style={[styles.statValue, { color: resultColor }]}>
                        #{localScore.rank}
                      </Text>
                    </View>
                  </View>
                )}

                {/* ===== جدول امتیازات ===== */}
                <View style={styles.scoreboard}>
                  <View style={styles.scoreHeader}>
                    <Text style={[styles.scoreHeaderText, { flex: 0.6 }]}>
                      RANK
                    </Text>
                    <Text style={[styles.scoreHeaderText, { flex: 1.4 }]}>
                      PLAYER
                    </Text>
                    <Text style={styles.scoreHeaderText}>KILLS</Text>
                    <Text style={styles.scoreHeaderText}>SCORE</Text>
                  </View>

                  {[...scores]
                    .sort((a, b) => a.rank - b.rank)
                    .map((s) => {
                      const progress = (s.score / topScore) * 100;
                      return (
                        <View
                          key={s.id}
                          style={[
                            styles.scoreRow,
                            s.isLocal && styles.localRow,
                          ]}
                        >
                          <View style={{ flex: 0.6, alignItems: "center" }}>
                            <Text
                              style={[
                                styles.medal,
                                s.rank === 1 && { color: "#ffb84d" },
                              ]}
                            >
                              #{s.rank}
                            </Text>
                          </View>
                          <View style={{ flex: 1.4 }}>
                            <Text
                              style={[
                                styles.scoreName,
                                s.isLocal && styles.localText,
                              ]}
                            >
                              {s.name}
                              {s.isLocal ? " (you)" : ""}
                            </Text>
                            <View style={styles.progressTrack}>
                              <View
                                style={[
                                  styles.progressFill,
                                  {
                                    width: `${progress}%`,
                                    backgroundColor: s.isLocal
                                      ? "#73e6a2"
                                      : "#53a8ff",
                                  },
                                ]}
                              />
                            </View>
                            <View style={styles.healthTrack}>
                              <View
                                style={[
                                  styles.healthFill,
                                  {
                                    width: `${Math.max(0, Math.min(100, s.health))}%`,
                                    backgroundColor:
                                      s.health > 50
                                        ? "#73e6a2"
                                        : s.health > 20
                                          ? "#ffb84d"
                                          : "#ff6464",
                                  },
                                ]}
                              />
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.scoreValue,
                              s.isLocal && styles.localText,
                            ]}
                          >
                            {s.kills}
                          </Text>
                          <Text
                            style={[
                              styles.scoreValue,
                              s.isLocal && styles.localText,
                            ]}
                          >
                            {s.score}
                          </Text>
                        </View>
                      );
                    })}
                </View>

                {/* ===== MVP ===== */}
                {mvp && (
                  <View style={styles.mvpCard}>
                    <Text style={styles.mvpLabel}>MVP</Text>
                    <Text style={styles.mvpName}>{mvp.name}</Text>
                    <Text style={styles.mvpDetail}>
                      {mvp.kills} kills · {mvp.score} pts
                    </Text>
                  </View>
                )}

                {/* ===== دکمه‌ها ===== */}
                <View style={styles.actionsRow}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={rematchPending}
                    style={({ pressed }) => [
                      styles.rematchButton,
                      rematchPending && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      if (
                        sendGameMessage({
                          type: "game/rematch",
                          payload: {
                            matchId: session.matchId,
                            sequence: 0,
                          },
                        })
                      )
                        setRematchPending(true);
                    }}
                  >
                    <Text style={styles.rematchText}>
                      {rematchPending ? "WAITING…" : "REMATCH"}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.leaveButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={onLeave}
                  >
                    <Text style={styles.leaveText}>LEAVE</Text>
                  </Pressable>
                </View>

                <Text style={styles.description}>
                  {rematchPending
                    ? "Waiting for opponent to accept…"
                    : "Both players must accept to start a new round."}
                </Text>
              </View>
            ) : (
              <View style={styles.panel}>
                <ActivityIndicator color="#73e6a2" size="large" />
                <Text style={styles.title}>
                  {localLoaded
                    ? "Waiting for opponent…"
                    : "Building game world…"}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.leaveButton}
                  onPress={onLeave}
                >
                  <Text style={styles.leaveText}>LEAVE MATCH</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10151c",
  },
  webview: {
    flex: 1,
    backgroundColor: "#10151c",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,15,22,0.9)",
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#182330",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3a50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  resultPanel: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#182330",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3a50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    color: "#73e6a2",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 14,
  },
  errorTitle: {
    color: "#ff6464",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  description: {
    color: "#9aabbe",
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 12,
  },

  /* ===== هدر نتیجه ===== */
  resultHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  resultSubtitle: {
    color: "#9aabbe",
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 1,
    textAlign: "center",
  },

  /* ===== کارت آمار ===== */
  statsRow: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#0f1825",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3a50",
  },
  statLabel: {
    color: "#7d8fa6",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 4,
  },
  statValue: {
    color: "#e8eef7",
    fontSize: 22,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },

  /* ===== جدول امتیازات ===== */
  scoreboard: {
    width: "100%",
    backgroundColor: "#0f1825",
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2a3a50",
  },
  scoreHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2a3a50",
    marginBottom: 6,
  },
  scoreHeaderText: {
    flex: 1,
    color: "#7d8fa6",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginBottom: 4,
  },
  localRow: {
    backgroundColor: "rgba(115,230,162,0.08)",
    borderWidth: 1,
    borderColor: "rgba(115,230,162,0.25)",
  },
  medal: {
    fontSize: 14,
    fontWeight: "900",
    color: "#7d8fa6",
  },
  scoreName: {
    color: "#d6e0ec",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  scoreValue: {
    flex: 1,
    color: "#d6e0ec",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  localText: {
    color: "#73e6a2",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#1a2836",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 3,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  healthTrack: {
    height: 3,
    backgroundColor: "#1a2836",
    borderRadius: 2,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: 2,
  },

  /* ===== MVP ===== */
  mvpCard: {
    width: "100%",
    backgroundColor: "rgba(255,184,77,0.1)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,184,77,0.3)",
    alignItems: "center",
  },
  mvpLabel: {
    color: "#ffb84d",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 2,
  },
  mvpName: {
    color: "#ffb84d",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  mvpDetail: {
    color: "#c8a468",
    fontSize: 10,
    marginTop: 2,
  },

  /* ===== دکمه‌ها ===== */
  actionsRow: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  rematchButton: {
    flex: 1,
    backgroundColor: "#73e6a2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#73e6a2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  rematchText: {
    color: "#10151c",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 2,
  },
  leaveButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#354f70",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 0,
  },
  leaveText: {
    color: "#9aabbe",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  disabled: { opacity: 0.5 },
});
