import SpotifyLogo from "@/assets/images/spotify.svg";
import { Button } from "@/components/ui/button";
import useSpotifyAuth from "@/spotify/useSpotifyAuth";
import {
  DMSans_400Regular,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function LaunchScreen() {
  const router = useRouter();
  const { login, error, isLoading, token } = useSpotifyAuth();
  const [tempError, setTempError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_700Bold,
  });

  const handleSpotifyLogin = async () => {
    try {
      await login();

      // Wait for token to be set in storage
      let attempts = 0;
      const checkToken = setInterval(async () => {
        const storedToken = await AsyncStorage.getItem("@spotify_token");
        if (storedToken) {
          clearInterval(checkToken);
          router.replace("/home");
        } else if (attempts >= 10) {
          // Try for 1 second (10 * 100ms)
          clearInterval(checkToken);
        }
        attempts++;
      }, 100);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  // Add effect to monitor token changes
  useEffect(() => {
    if (error?.message === "Authentication was cancelled") {
      setTempError(error.message);
      const timer = setTimeout(() => {
        setTempError(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!fontsLoaded) {
    return null; // or a loading spinner
  }

  return (
    <>
      <StatusBar style="light" />
      <ImageBackground
        source={require("@/assets/images/Splash-screen.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.container}>
          {/* Animated Shiny Title */}
          <View style={styles.titleContainer}>
            <MaskedView
              style={styles.maskedView}
              maskElement={<Text style={styles.titleText}>snippets</Text>}
            >
              <MotiView
                style={styles.gradientContainer}
                animate={{
                  translateX: [-width, width],
                }}
                transition={{
                  type: "timing",
                  duration: 3000,
                  loop: true,
                  repeatReverse: true,
                }}
              >
                <LinearGradient
                  colors={[
                    "#ffffff40",
                    "#ffffff20",
                    "#ffffff",
                    "#ffffff",
                    "#ffffff20",
                    "#ffffff40",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradient}
                />
              </MotiView>
            </MaskedView>
          </View>

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
              {tempError && <Text style={styles.errorText}>{tempError}</Text>}
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
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 120,
    paddingBottom: 40,
    backgroundColor: "rgba(0,0,0,0.3)", // Add a slight dark overlay
  },
  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 80,
    width: "100%",
  },
  maskedView: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 30,
    fontWeight: "700",
    fontFamily: "DMSans_700Bold",
    color: "#95B3FF",
    textAlign: "center",
  },
  gradientContainer: {
    width: width * 4, // Make it wider than screen for smooth animation
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    width: "100%",
    height: "100%",
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: "auto", // Push to bottom
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spotifyButton: {
    padding: 14,
    borderRadius: 50,
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#95B3FF",
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
