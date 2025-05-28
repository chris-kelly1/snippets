import SpotifyLogo from "@/assets/images/spotify.svg";
import { Button } from "@/components/ui/button";
import useSpotifyAuth from "@/spotify/useSpotifyAuth";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

export default function LaunchScreen() {
  const router = useRouter();
  const { login, error, isLoading } = useSpotifyAuth();

  const handleSpotifyLogin = async () => {
    await login();
    // The token will be handled by the useSpotifyAuth hook
    // We can navigate to home after successful login
    router.replace("/home");
  };

  return (
    <>
      <StatusBar style="light" />
      <ImageBackground
        source={require("@/assets/images/launch-screen.png")}
        style={styles.background}
        imageStyle={styles.image}
      >
        <View style={styles.container}>
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Button
                style={styles.spotifyButton}
                onPress={handleSpotifyLogin}
                disabled={isLoading}
              >
                <View style={styles.buttonContent}>
                  <SpotifyLogo
                    width={24}
                    height={24}
                    style={styles.spotifyLogo}
                  />
                  <Text style={styles.spotifyText}>
                    {isLoading ? "Loading..." : "Continue with Spotify"}
                  </Text>
                </View>
              </Button>
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          </View>
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "space-between",
  },
  image: {
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 100,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "white",
    letterSpacing: 0.5,
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: "auto", // Push to bottom
  },
  card: {
    width: 360,
    borderRadius: 24,
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    backdropFilter: "blur(10px)",
  },
  subtitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    color: "#222",
    textAlign: "center",
  },
  spotifyButton: {
    padding: 14,
    borderRadius: 50,
    backgroundColor: "#0D1117",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  spotifyLogo: {
    marginRight: 10,
  },
  spotifyText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
});
