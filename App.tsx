import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  BackHandler,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { createGameHtml } from "./src/game/createGameHtml";
import SplashScreen from "./src/screens/SplashScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import CreateRoomScreen from "./src/multiplayer/screens/CreateRoomScreen";
import { useLanRoom } from "./src/multiplayer/hooks/useLanRoom";
import JoinRoomScreen from "./src/multiplayer/screens/JoinRoomScreen";
import MultiplayerGameScreen from "./src/multiplayer/screens/MultiplayerGameScreen";

type AppScreen = "splash" | "welcome" | "createRoom" | "joinRoom" | "game";
// Build once, not on every React render.
const GAME_SOURCE = { html: createGameHtml() };

export default function App() {
  const webViewRef = useRef<WebView>(null);

  const [screen, setScreen] = useState<AppScreen>("splash");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState(0);
  const {
    status: roomStatus,
    error: roomError,
    peerVerified,
    guestReady,
    matchPhase,
    canStartMatch,
    startHosting,
    joinRoom,
    toggleReady,
    startMatch,
    leaveRoom,
    matchSession,
    markGameLoaded,
    sendGameMessage,
    subscribeGameMessages,
  } = useLanRoom();

  const syncActivity = useCallback(() => {
    const event =
      AppState.currentState === "active" ? "nativeResume" : "nativePause";

    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new Event('${event}')); true;`,
    );
  }, []);

  useEffect(() => {
    if (screen !== "game") {
      return;
    }

    const subscription = AppState.addEventListener("change", syncActivity);

    return () => subscription.remove();
  }, [screen, syncActivity]);

  const finishSplash = useCallback(() => {
    setScreen("welcome");
  }, []);

  const startSinglePlayer = useCallback(() => {
    setError(null);
    setSession((value) => value + 1);
    setScreen("game");
  }, []);

  const openJoinRoom = useCallback(() => {
    setScreen("joinRoom");
  }, []);

  const openCreateRoom = useCallback(() => {
    setScreen("createRoom");
  }, []);

  const closeRoom = useCallback(() => {
    leaveRoom();
    setScreen("welcome");
  }, [leaveRoom]);

  const returnToWelcome = useCallback(() => {
    webViewRef.current?.injectJavaScript(
      "window.dispatchEvent(new Event('nativePause')); true;",
    );

    setError(null);
    setScreen("welcome");
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (screen === "splash") {
          return true;
        }

        if (screen === "game") {
          returnToWelcome();
          return true;
        }

        if (screen === "createRoom" || screen === "joinRoom") {
          closeRoom();
          return true;
        }

        return false;
      },
    );

    return () => subscription.remove();
  }, [screen, returnToWelcome, closeRoom]);

  function restart() {
    setError(null);
    setSession((value) => value + 1);
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {screen === "splash" && <SplashScreen onFinish={finishSplash} />}

      {screen === "welcome" && (
        <WelcomeScreen
          onSinglePlayer={startSinglePlayer}
          onJoinRoom={openJoinRoom}
          onCreateRoom={openCreateRoom}
        />
      )}
      {screen === "createRoom" && matchSession === null && (
        <CreateRoomScreen
          status={roomStatus}
          error={roomError}
          peerVerified={peerVerified}
          guestReady={guestReady}
          matchPhase={matchPhase}
          canStartMatch={canStartMatch}
          onStartMatch={startMatch}
          onStartHosting={startHosting}
          onLeave={closeRoom}
        />
      )}

      {screen === "joinRoom" && matchSession === null && (
        <JoinRoomScreen
          status={roomStatus}
          error={roomError}
          peerVerified={peerVerified}
          guestReady={guestReady}
          matchPhase={matchPhase}
          onJoin={joinRoom}
          onLeave={closeRoom}
          onToggleReady={toggleReady}
        />
      )}
      {(screen === "createRoom" || screen === "joinRoom") &&
        matchSession !== null && (
          <MultiplayerGameScreen
            key={matchSession.matchId}
            session={matchSession}
            phase={matchPhase}
            onLoaded={markGameLoaded}
            onLeave={leaveRoom}
            sendGameMessage={sendGameMessage}
            subscribeGameMessages={subscribeGameMessages}
          />
        )}

      {screen === "game" && (
        <View style={styles.container}>
          <WebView
            key={session}
            ref={webViewRef}
            source={GAME_SOURCE}
            style={styles.webview}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
            setSupportMultipleWindows={false}
            androidLayerType="hardware"
            onLoadEnd={syncActivity}
            onMessage={(event) => {
              try {
                const message: unknown = JSON.parse(event.nativeEvent.data);

                if (
                  typeof message === "object" &&
                  message !== null &&
                  "type" in message &&
                  message.type === "error" &&
                  "message" in message &&
                  typeof message.message === "string"
                ) {
                  setError(message.message);
                }
              } catch {
                // Ignore unrelated or malformed WebView messages.
              }
            }}
            onError={(event) => setError(event.nativeEvent.description)}
            onRenderProcessGone={() =>
              setError("The game renderer stopped. Restart the game.")
            }
            onContentProcessDidTerminate={() =>
              setError("The game renderer stopped. Restart the game.")
            }
          />

          {error !== null && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorTitle}>Game error</Text>

              <Text style={styles.errorText}>{error}</Text>

              <Pressable
                accessibilityRole="button"
                style={styles.retryButton}
                onPress={restart}
              >
                <Text style={styles.retryText}>Restart game</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={styles.backButton}
                onPress={returnToWelcome}
              >
                <Text style={styles.backText}>Back to menu</Text>
              </Pressable>
            </View>
          )}
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

  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(16,21,28,0.96)",
    padding: 24,
  },

  errorTitle: {
    color: "#ff6464",
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 12,
  },

  errorText: {
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: "#354f70",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },

  retryText: {
    color: "#ffffff",
    fontWeight: "700",
  },

  backButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  backText: {
    color: "#a9b8ca",
    fontWeight: "600",
  },
});
