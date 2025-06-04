import { ConversationFilters } from "@/components/conversations/ConversationFilters";
import { ConversationList } from "@/components/conversations/ConversationList";
import { Header } from "@/components/conversations/Header";
import { NewChatModal } from "@/components/conversations/NewChatModal";
import { Colors } from "@/constants/theme";
import { dummyConversations } from "@/data/conversations";
import { Conversation } from "@/types/conversation";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSpotifyAuth from "../spotify/useSpotifyAuth";

export default function Home() {
  const { user, refreshUser } = useSpotifyAuth();
  const [profileImageUrl, setProfileImageUrl] = useState(
    user?.profile_image ||
      "https://api.dicebear.com/7.x/avataaars/png?seed=Calvin"
  );
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();

  // Load conversations from AsyncStorage
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const storedConversations = await AsyncStorage.getItem(
          "@conversations"
        );
        if (storedConversations) {
          setConversations(JSON.parse(storedConversations));
        } else {
          // If no conversations in storage, load dummy data initially
          setConversations(dummyConversations);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        // Fallback to dummy data on error
        setConversations(dummyConversations);
      }
    };

    loadConversations();
  }, []);

  // Save conversations to AsyncStorage whenever they change, excluding dummy data check
  useEffect(() => {
    const saveConversations = async () => {
      try {
        await AsyncStorage.setItem(
          "@conversations",
          JSON.stringify(conversations)
        );
      } catch (error) {
        console.error("Error saving conversations:", error);
      }
    };

    // Only save if conversations state has been populated (either from storage or dummy)
    if (
      conversations.length > 0 ||
      (conversations.length === 0 && hasLoadedInitial.current)
    ) {
      // Added hasLoadedInitial ref check
      saveConversations();
    }

    if (conversations.length > 0 && !hasLoadedInitial.current) {
      // Set the ref once conversations are loaded
      hasLoadedInitial.current = true;
    }
  }, [conversations]);

  // Ref to track if initial conversations have been loaded
  const hasLoadedInitial = React.useRef(false);

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

  const handleNewChat = (emails: string[], groupName: string) => {
    // Create a new conversation
    const newConversation: Conversation = {
      id: Date.now().toString(), // Generate a unique ID
      name: groupName || emails.join(", "), // Use group name or emails as name
      lastMessage: "Chat created", // Initial message
      time: "Just now",
      avatars: emails.map(
        (email) => `https://api.dicebear.com/7.x/avataaars/png?seed=${email}`
      ), // Generate avatars for each email
      hasUnread: true,
      participants: emails, // Store the emails for reference
    };

    // Add the new conversation to the list
    setConversations([newConversation, ...conversations]);
    setIsNewChatModalVisible(false);
  };

  const handleClearConversations = async () => {
    try {
      await AsyncStorage.removeItem("@conversations");
      setConversations([]); // Clear the state as well
      console.log("Conversations cleared from AsyncStorage");
    } catch (error) {
      console.error("Error clearing conversations:", error);
    }
  };

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
          <ConversationList conversations={conversations} />
        </View>
      </SafeAreaView>

      {/* Temporary button to clear conversations */}
      <TouchableOpacity
        style={styles.clearButton}
        onPress={handleClearConversations}
      >
        <Text style={styles.clearButtonText}>Clear Chats</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsNewChatModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#fff" weight="bold" />
      </TouchableOpacity>

      <NewChatModal
        visible={isNewChatModalVisible}
        onClose={() => setIsNewChatModalVisible(false)}
        onSubmit={handleNewChat}
      />
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
  fab: {
    position: "absolute",
    right: 25,
    bottom: 25,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#95B3FF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clearButton: {
    position: "absolute",
    left: 20,
    bottom: 20,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    zIndex: 100,
  },
  clearButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
