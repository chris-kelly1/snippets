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
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";

const { width } = Dimensions.get("window");

// Mock users for development
const mockUsers = [
  {
    id: "calvin",
    display_name: "Calvin Laughlin",
    email: "laughlincalvin22@gmail.com",
    profile_image: "https://i.scdn.co/image/ab6775700000ee85c588066682c09323acbe12fd"
  },
  {
    id: "reid",
    display_name: "Reid McCaw", 
    email: "rmccaw@stanford.edu",
    profile_image: "https://api.dicebear.com/7.x/avataaars/png?seed=reid"
  },
  {
    id: "testuser",
    display_name: "Test User",
    email: "test@example.com", 
    profile_image: "https://api.dicebear.com/7.x/avataaars/png?seed=test"
  }
];

export default function LaunchScreen() {
  const router = useRouter();
  const { login, error, isLoading, token } = useSpotifyAuth();
  const [tempError, setTempError] = useState<string | null>(null);
  const [showUserSelect, setShowUserSelect] = useState(false);

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_700Bold,
  });

  const clearAuthData = async () => {
    await AsyncStorage.multiRemove(['@spotify_token', '@spotify_user', '@conversations']);
    console.log('✅ Auth data cleared');
  };

  const handleBypassAuth = async (user: typeof mockUsers[0]) => {
    try {
      // Clear any existing auth data
      await clearAuthData();
      
      // Set mock user data
      await Promise.all([
        AsyncStorage.setItem("@spotify_token", "mock-token-" + Date.now()),
        AsyncStorage.setItem("@spotify_user", JSON.stringify(user)),
      ]);

      console.log('✅ Bypassed auth with user:', user.display_name);
      router.replace("/home");
    } catch (err) {
      console.error("Bypass auth error:", err);
    }
  };

  const handleSpotifyLogin = async () => {
    try {
      // Uncomment this line to clear auth data before login
      // await clearAuthData();
      
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
              
              {/* Bypass Auth Button */}
              <TouchableOpacity
                style={styles.bypassButton}
                onPress={() => setShowUserSelect(true)}
              >
                <Text style={styles.bypassText}>Development: Skip Auth</Text>
              </TouchableOpacity>
              
              {tempError && <Text style={styles.errorText}>{tempError}</Text>}
            </View>
          </View>

          {/* User Selection Modal */}
          <Modal
            visible={showUserSelect}
            transparent
            animationType="slide"
            onRequestClose={() => setShowUserSelect(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Choose User to Impersonate</Text>
                
                <FlatList
                  data={mockUsers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.userItem}
                      onPress={() => {
                        setShowUserSelect(false);
                        handleBypassAuth(item);
                      }}
                    >
                      <Text style={styles.userName}>{item.display_name}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </TouchableOpacity>
                  )}
                />
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowUserSelect(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  bypassButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginTop: 16,
  },
  bypassText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxHeight: "70%",
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  userItem: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  cancelText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});
