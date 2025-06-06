import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { Message } from "@/types/message";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  console.log('🎬 Preview screen loaded with params:', params);

  // Parse the message data from route params
  const messageData = params.message ? JSON.parse(params.message as string) : null;
  
  console.log('📝 Parsed message data:', messageData);

  if (!messageData) {
    console.log('❌ No message data found in preview screen');
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No message data found</Text>
      </View>
    );
  }

  console.log('✅ Preview screen rendering with message:', messageData.song_title);

  const handleContinue = () => {
    // Navigate back to the messages page, replacing the entire stack from search onwards
    router.dismissAll();
    router.push({
      pathname: "/message",
      params: { id: messageData.conversation_id }
    });
  };

  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Snippet Sent!</Text>
          <Text style={styles.headerSubtitle}>Preview of your message</Text>
        </View>

        {/* Message Preview Card */}
        <View style={styles.previewContainer}>
          <View style={styles.messageCard}>
            {/* Header with timestamp */}
            <View style={styles.cardHeader}>
              <View style={styles.senderInfo}>
                <Text style={styles.senderName}>You</Text>
              </View>
              <Text style={styles.timestamp}>
                {formatTimestamp(messageData.created_at)}
              </Text>
            </View>

            {/* Album Cover */}
            <Image
              source={{ 
                uri: messageData.album_cover || 
                `https://api.dicebear.com/7.x/shapes/png?seed=${messageData.song_title}` 
              }}
              style={styles.albumCover}
            />

            {/* Lyrics */}
            <View style={styles.lyricsContainer}>
              {messageData.lyrics.slice(0, 3).map((lyric: string, index: number) => (
                <Text key={index} style={styles.songLyric}>
                  {lyric}
                </Text>
              ))}
              <Text style={styles.songMeta}>
                {messageData.song_title} - {messageData.artist}
              </Text>
            </View>
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Successfully Sent!</Text>
          <Text style={styles.successMessage}>
            Your snippet has been added to the conversation and will appear at the top of the stack.
          </Text>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue to Messages</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
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
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  previewContainer: {
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  messageCard: {
    width: 280,
    backgroundColor: "#222",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  senderName: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  timestamp: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  albumCover: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: "center",
  },
  lyricsContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  songLyric: {
    color: "#7EB6FF",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
    textAlign: "center",
    lineHeight: 20,
  },
  songMeta: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  successIcon: {
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: "#4CAF50",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  successMessage: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    marginTop: "auto",
  },
  continueButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
  },
  buttonIcon: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    color: Colors.text.primary,
    fontSize: FontSizes.md,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});