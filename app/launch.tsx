import { Button } from "@/components/ui/button"; // Make sure you have this component
import { Link } from "expo-router";
import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

export default function LaunchScreen() {
  return (
    <ImageBackground
      source={require("@/assets/images/launch-screen.png")} // Update path if needed
      style={styles.background}
      imageStyle={styles.image}
    >
      <View style={styles.container}>
        <Text style={styles.title}>snippets</Text>
        <View style={styles.card}>
          <Text style={styles.subtitle}>Welcome Back!</Text>

          <Button style={styles.googleButton}>
            <Text style={styles.googleText}>Continue with Google</Text>
          </Button>

          <Button style={styles.appleButton}>
            <Text style={styles.appleText}>Continue with Apple</Text>
          </Button>

          <Button style={styles.emailButton}>
            <Text style={styles.emailText}>Continue with Email</Text>
          </Button>
          
          <Link href="/home" asChild>
            <Button style={styles.homeButton}>
              <Text style={styles.homeText}>Go to Messages</Text>
            </Button>
          </Link>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 175,
    paddingBottom: 66,
  },
  image: {
    resizeMode: "cover",
  },
  container: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "white",
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
  },
  card: {
    width: 360,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "white",
  },
  googleButton: {
    marginBottom: 10,
    padding: 12,
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 21,
  },
  googleText: {
    color: "#0000008a",
    fontSize: 18,
    textAlign: "center",
  },
  appleButton: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: "black",
    borderRadius: 21,
  },
  appleText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
  emailButton: {
    padding: 12,
    borderRadius: 21,
    backgroundColor: "#0b171c",
    marginBottom: 10,
  },
  emailText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
  homeButton: {
    padding: 12,
    borderRadius: 21,
    backgroundColor: "#0a7ea4",
  },
  homeText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
});
