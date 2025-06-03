import { ConversationFilters } from "@/components/conversations/ConversationFilters";
import { ConversationList } from "@/components/conversations/ConversationList";
import { Header } from "@/components/conversations/Header";
import { Colors } from "@/constants/theme";
import { dummyConversations } from "@/data/conversations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSpotifyAuth from "../spotify/useSpotifyAuth";

export default function Home() {
  const { user, refreshUser } = useSpotifyAuth();
  const [profileImageUrl, setProfileImageUrl] = useState(
    user?.profile_image ||
      "https://api.dicebear.com/7.x/avataaars/png?seed=Calvin"
  );
  const router = useRouter();

  // Update profile image whenever user data changes
  useEffect(() => {
    const updateProfileImage = async () => {
      try {
        // Get the latest user data from AsyncStorage
        const storedUser = await AsyncStorage.getItem("@spotify_user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.profile_image) {
            setProfileImageUrl(parsedUser.profile_image);
          }
        }
      } catch (error) {
        console.error("Error updating profile image:", error);
      }
    };

    // Initial update
    updateProfileImage();

    // Set up an interval to check for updates
    const intervalId = setInterval(updateProfileImage, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Also update when user data changes in the hook
  useEffect(() => {
    if (user?.profile_image) {
      setProfileImageUrl(user.profile_image);
    }
  }, [user?.profile_image]);

  // Refresh user data when the home page mounts
  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.safeArea}>
        <Header profileImageUrl={profileImageUrl} />

        <View style={styles.content}>
          <ConversationFilters activeFilter="All" />
          <ConversationList conversations={dummyConversations} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  profileButton: {
    padding: 8,
  },
});
