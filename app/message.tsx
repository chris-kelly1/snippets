import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { getConversationMessages } from "@/lib/messaging";
import { Message } from "@/types/message";
import { Conversation } from "@/types/conversation";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function MessageScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  // Load messages on mount and set up polling
  useEffect(() => {
    loadMessages();
    
    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      // Get the latest conversation from storage
      const storedConversations = await AsyncStorage.getItem("@conversations");
      let conversation = null;
      let conversationId = "00000000-0000-0000-0000-000000000001"; // fallback UUID
      
      if (storedConversations) {
        const conversations = JSON.parse(storedConversations);
        if (conversations.length > 0) {
          conversation = conversations[0]; // Use the most recent conversation
          conversationId = conversation.id;
          setCurrentConversation(conversation);
        }
      }

      const conversationMessages = await getConversationMessages(conversationId);
      setMessages(conversationMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  const renderMessage = (message: Message) => (
    <View key={message.id} style={styles.messageCard}>
      <View style={styles.messageHeader}>
        <Text style={styles.senderName}>{message.sender_name}</Text>
        <Text style={styles.messageTime}>
          {new Date(message.created_at).toLocaleTimeString()}
        </Text>
      </View>
      
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{message.song_title}</Text>
        <Text style={styles.artistName}>{message.artist}</Text>
      </View>
      
      <View style={styles.lyricsContainer}>
        {message.lyrics.map((line, index) => (
          <Text key={index} style={styles.lyricLine}>{line}</Text>
        ))}
      </View>
      
      {message.album_cover && (
        <Image source={{ uri: message.album_cover }} style={styles.albumArt} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons
              name="chevron-back"
              size={28}
              color={Colors.text.primary}
            />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {currentConversation?.name || "Loading..."}
            </Text>
          </View>

          <View style={styles.fakeBackButton} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {currentConversation && currentConversation.avatars && currentConversation.avatars.length > 0 && (
            <View style={styles.profileSection}>
              <Text style={styles.userName}>{currentConversation.name}</Text>
              <View style={styles.profileImageContainer}>
                <Image 
                  source={{ uri: currentConversation.avatars[0] }} 
                  style={styles.profileImageReal}
                />
              </View>
            </View>
          )}

          <ScrollView style={styles.messagesContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.text.primary} />
                <Text style={styles.loadingText}>Loading messages...</Text>
              </View>
            ) : messages.length > 0 ? (
              messages.map(renderMessage)
            ) : (
              <View style={styles.messageArea}>
                <Text style={styles.messageText}>No messages yet. Tap search to send a snippet!</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Bottom area */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={handleSearchPress}
          >
            <Ionicons
              name="search"
              size={18}
              color={Colors.text.secondary}
              style={styles.searchIcon}
            />
            <Text style={styles.searchPlaceholder}>Search for music</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
    width: 40,
  },
  fakeBackButton: {
    width: 40,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  profileSection: {
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  userName: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  profileImage: {
    fontSize: 40,
  },
  profileImageReal: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    padding: Spacing.lg,
  },
  loadingText: {
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  messageArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  messageText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.md,
    textAlign: "center",
  },
  messageCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  senderName: {
    color: Colors.text.primary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  messageTime: {
    color: Colors.text.secondary,
    fontSize: FontSizes.xs,
  },
  songInfo: {
    marginBottom: Spacing.sm,
  },
  songTitle: {
    color: Colors.text.primary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semiBold,
  },
  artistName: {
    color: Colors.text.secondary,
    fontSize: FontSizes.sm,
  },
  lyricsContainer: {
    marginBottom: Spacing.sm,
  },
  lyricLine: {
    color: "#7EB6FF",
    fontSize: FontSizes.sm,
    marginBottom: 2,
    fontStyle: "italic",
  },
  albumArt: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  bottomContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchPlaceholder: {
    color: Colors.text.secondary,
    fontSize: FontSizes.md,
  },
});
