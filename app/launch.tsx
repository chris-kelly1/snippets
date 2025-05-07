import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

export default function LaunchScreen() {
  return (
    <ImageBackground
      source={require("../assets/images/launch-screen.png")}
      style={styles.background}
      imageStyle={styles.image}
    >
      <View style={styles.container}>
        <Text style={styles.title}>snippets</Text>
        <View style={styles.card}>
          <Text style={styles.subtitle}>Welcome Back!</Text>
          {/* Add your buttons here */}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { resizeMode: "cover" },
  container: { alignItems: "center" },
  title: { fontSize: 32, fontWeight: "900", color: "white" },
  card: {
    marginTop: 32,
    padding: 24,
    borderRadius: 16,
    backgroundColor: "white",
  },
  subtitle: { fontSize: 24, fontWeight: "600", marginBottom: 16 },
});
