import React from 'react';
import { Platform, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

const appUrl = 'https://sijj.onrender.com';

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <iframe title="Sijj MovieBox" src={appUrl} style={styles.webFrame} />
      </SafeAreaView>
    );
  }

  const { WebView } = require('react-native-webview');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        source={{ uri: appUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  webFrame: {
    borderWidth: 0,
    flex: 1,
    height: '100%',
    width: '100%',
  },
});
