import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import WebView from 'react-native-webview';
import {createGameHtml} from './src/game/createGameHtml';

// Build once, not on every React render.
const GAME_SOURCE = {html: createGameHtml()};

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState(0);

  const syncActivity = useCallback(() => {
    const event = AppState.currentState === 'active' ? 'nativeResume' : 'nativePause';
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new Event('${event}')); true;`,
    );
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', syncActivity);
    return () => subscription.remove();
  }, [syncActivity]);

  function restart() {
    setError(null);
    setSession(value => value + 1);
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <WebView
        key={session}
        ref={webViewRef}
        source={GAME_SOURCE}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        onLoadEnd={syncActivity}
        onMessage={event => {
          try {
            const message: unknown = JSON.parse(event.nativeEvent.data);
            if (
              typeof message === 'object' && message !== null &&
              'type' in message && message.type === 'error' &&
              'message' in message && typeof message.message === 'string'
            ) {
              setError(message.message);
            }
          } catch {
            // Ignore unrelated or malformed messages from the WebView.
          }
        }}
        onError={event => setError(event.nativeEvent.description)}
        onRenderProcessGone={() => setError('The game renderer stopped. Restart the game.')}
        onContentProcessDidTerminate={() => setError('The game renderer stopped. Restart the game.')}
      />
      {error !== null && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>Game error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={restart}>
            <Text style={styles.retryText}>Restart game</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#10151c'},
  webview: {flex: 1, backgroundColor: '#10151c'},
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(16,21,28,0.96)', padding: 24,
  },
  errorTitle: {color: '#ff6464', fontSize: 21, fontWeight: '700', marginBottom: 12},
  errorText: {color: '#ffffff', textAlign: 'center', marginBottom: 20},
  retryButton: {backgroundColor: '#354f70', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 14},
  retryText: {color: '#ffffff', fontWeight: '700'},
});
