import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useSpotifyAuth from "../spotify/useSpotifyAuth";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, user, isLoading, error } = useSpotifyAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        {user ? (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user.display_name?.[0]?.toUpperCase() || "?"}
                </Text>
              </View>
              <Text style={styles.userName}>{user.display_name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Playlists</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.notLoggedInContainer}>
            <Text style={styles.notLoggedInText}>User Not Logged In</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  profileSection: {
    padding: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: "#b3b3b3",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#282828",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#b3b3b3",
  },
  logoutButton: {
    backgroundColor: "#1DB954",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  notLoggedInContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 18,
    color: "#b3b3b3",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
