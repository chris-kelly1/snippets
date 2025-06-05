import { ConversationFilters } from "@/components/conversations/ConversationFilters";
import { ConversationList } from "@/components/conversations/ConversationList";
import { Header } from "@/components/conversations/Header";
import { NewChatModal } from "@/components/conversations/NewChatModal";
import { Colors } from "@/constants/theme";
import {
  createConversation,
  getConversationMessages,
  getUserConversations,
} from "@/lib/messaging";
import { User, ensureCurrentUserExists } from "@/lib/users";
import { Conversation } from "@/types/conversation";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSpotifyAuth from "../spotify/useSpotifyAuth";

export default function Home() {
  const { user, token, refreshUser } = useSpotifyAuth();
  const [profileImageUrl, setProfileImageUrl] = useState(
    user?.profile_image ||
      "https://api.dicebear.com/7.x/avataaars/png?seed=Calvin"
  );
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  // Check for valid token and redirect if none exists
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = await AsyncStorage.getItem("@spotify_token");
      if (!storedToken) {
        router.replace("/launch");
      }
    };
    checkAuth();
  }, []);

  // Ensure current user exists in database
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const userRecord = await ensureCurrentUserExists();
        setCurrentUser(userRecord);
        console.log("Current user initialized:", userRecord);
      } catch (error) {
        console.error("Error initializing user:", error);
        Alert.alert(
          "Database Error",
          "Could not connect to the database. Please check your internet connection and try again.",
          [{ text: "OK" }]
        );
      }
    };

    if (user) {
      initializeUser();
    }
  }, [user]);

  // Load conversations from Supabase and add avatars
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const realConversations = await getUserConversations();

        // Add avatars and latest messages to conversations based on participants
        const conversationsWithData = await Promise.all(
          realConversations.map(async (conv) => {
            if (conv.participants && conv.participants.length > 0) {
              // Try to get real user avatars from the database
              const { getAllUsers } = await import("@/lib/users");
              const allUsers = await getAllUsers();

              const avatars = conv.participants.map((email) => {
                // Find user in database first
                const user = allUsers.find((u) => u.email === email);
                if (user && user.profile_image) {
                  return user.profile_image;
                }
                // Fallback to generated avatar
                return `https://api.dicebear.com/7.x/avataaars/png?seed=${email}`;
              });

              // Get latest message for this conversation
              let lastMessage = "";
              let songTitle = "";
              let artist = "";
              let albumCover = "";

              try {
                const messages = await getConversationMessages(conv.id);
                if (messages.length > 0) {
                  const latestMessage = messages[messages.length - 1];
                  lastMessage = latestMessage.lyrics.join(" ");
                  songTitle = latestMessage.song_title;
                  artist = latestMessage.artist;
                  albumCover = latestMessage.album_cover || "";
                }
              } catch (error) {
                console.error(
                  `Error fetching messages for conversation ${conv.id}:`,
                  error
                );
              }

              return {
                ...conv,
                avatars,
                lastMessage: lastMessage || "",
                songTitle,
                artist,
                albumCover,
                time: conv.updated_at
                  ? new Date(conv.updated_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "now",
              };
            }
            return conv;
          })
        );

        setConversations(conversationsWithData);

        // Also save to AsyncStorage as cache
        await AsyncStorage.setItem(
          "@conversations",
          JSON.stringify(conversationsWithData)
        );
      } catch (error) {
        console.error("Error loading conversations:", error);

        // Fallback to cached conversations
        try {
          const storedConversations = await AsyncStorage.getItem(
            "@conversations"
          );
          if (storedConversations) {
            setConversations(JSON.parse(storedConversations));
          }
        } catch (cacheError) {
          console.error("Error loading cached conversations:", cacheError);
          setConversations([]);
        }
      }
    };

    loadConversations();
  }, []);

  // Ref to track if initial conversations have been loaded
  const hasLoadedInitial = React.useRef(false);

  // Save conversations to AsyncStorage whenever they change
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

    if (conversations.length > 0 || hasLoadedInitial.current) {
      saveConversations();
    }

    if (conversations.length >= 0 && !hasLoadedInitial.current) {
      hasLoadedInitial.current = true;
    }
  }, [conversations]);

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

  // Renamed and modified to handle both 1-on-1 and group chats
  const handleCreateConversation = async (
    selectedUsers: User[],
    groupName: string
  ) => {
    try {
      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to start a chat");
        return;
      }

      // Always include the current user in the participants list
      const participantEmails = [
        currentUser.email,
        ...selectedUsers.map((user) => user.email),
      ];

      let conversationName = groupName.trim();

      // Handle 1-on-1 chat case: Use the other user's name if no group name provided
      if (selectedUsers.length === 1 && conversationName === "") {
        conversationName =
          selectedUsers[0].display_name || selectedUsers[0].email.split("@")[0];
      }

      // Ensure group name is not empty for group chats (>2 participants)
      if (participantEmails.length > 2 && conversationName === "") {
        Alert.alert("Error", "Group name is required for group chats.");
        return;
      }

      // Optional: Check for existing 1-on-1 conversation
      if (selectedUsers.length === 1) {
        const otherUserEmail = selectedUsers[0].email;
        const existingConversation = conversations.find((conv) => {
          if (conv.participants && conv.participants.length === 2) {
            return (
              conv.participants.includes(currentUser.email) &&
              conv.participants.includes(otherUserEmail)
            );
          }
          return false;
        });

        if (existingConversation) {
          console.log(
            "Found existing 1-on-1 conversation:",
            existingConversation.id
          );
          setIsNewChatModalVisible(false);
          router.push({
            pathname: "/message",
            params: { id: existingConversation.id },
          });
          return;
        }
      }

      console.log("Creating conversation:", {
        name: conversationName,
        participants: participantEmails,
        createdBy: currentUser.email,
      });

      // Create conversation in Supabase
      const newConversation = await createConversation(
        conversationName,
        participantEmails,
        currentUser.email
      );

      console.log("Conversation created successfully:", newConversation);

      // Close modal and navigate to the new conversation
      setIsNewChatModalVisible(false);
      router.push({ pathname: "/message", params: { id: newConversation.id } });

      // Refresh conversations list on home screen
      refreshConversations();
    } catch (error) {
      console.error("Error creating conversation:", error);
      Alert.alert("Error", "Failed to create conversation. Please try again.");
    }
  };

  const refreshConversations = async () => {
    try {
      const realConversations = await getUserConversations();
      setConversations(realConversations);

      // Update cache
      await AsyncStorage.setItem(
        "@conversations",
        JSON.stringify(realConversations)
      );
    } catch (error) {
      console.error("Error refreshing conversations:", error);
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsNewChatModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#fff" weight="bold" />
      </TouchableOpacity>

      <NewChatModal
        visible={isNewChatModalVisible}
        onClose={() => setIsNewChatModalVisible(false)}
        // Pass selected users and group name to the handler
        onSubmit={handleCreateConversation}
        currentUser={currentUser} // Pass the current user as well
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
});
