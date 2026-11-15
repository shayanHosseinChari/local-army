import React from "react";
import { StyleSheet, View, StatusBar } from "react-native";
import { WebView } from "react-native-webview";
const gameHtml = require("./");
export default function GameWebView() {
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <WebView
        source={{ uri: "file:///android_asset/game/game.html" }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        scrollEnabled={false}
        overScrollMode="never"
        androidLayerType="hardware"
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#10151c" },
  webview: { flex: 1, backgroundColor: "#10151c" },
});
