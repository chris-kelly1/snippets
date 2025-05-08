import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { dummyConversations } from "@/data/conversations";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Extended type for the message screen
type ExtendedConversation = {
  id: string;
  name: string;
  avatars: string[];
  currentSong: {
    title: string;
    artist: string;
    lyrics: string[];
    albumCover: string;
  };
  members: { id: string; avatar: string }[];
};

export default function MessageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId: string }>();

  // Find the conversation from the dummy data
  const baseConversation = useMemo(() => {
    return (
      dummyConversations.find((c) => c.id === params.conversationId) ||
      dummyConversations[0]
    );
  }, [params.conversationId]);

  // Parse lyrics from the last message
  const parseLyrics = (message: string): string[] => {
    // For Where Have You Been, split the lyrics appropriately
    if (message.includes("Where have you been")) {
      return [
        "All my life, life, life, life",
        "Where have you been all my li-i-i-i-i-fe?",
        "Where have you been all my li-i-i-i-i-fe?",
      ];
    }

    // For other songs, create basic 3-line lyrics
    const lines = message.split(" ");
    if (lines.length <= 6) {
      return [message, message, message];
    }

    const midpoint = Math.floor(lines.length / 3);
    return [
      lines.slice(0, midpoint).join(" "),
      lines.slice(midpoint, midpoint * 2).join(" "),
      lines.slice(midpoint * 2).join(" "),
    ];
  };

  // Extend the conversation with additional data for the message screen
  const conversation: ExtendedConversation = useMemo(() => {
    return {
      id: baseConversation.id,
      name: baseConversation.name,
      avatars: baseConversation.avatars,
      currentSong: {
        title: baseConversation.songTitle || "",
        artist: baseConversation.artist || "",
        lyrics: parseLyrics(baseConversation.lastMessage),
        albumCover: baseConversation.albumCover || "",
      },
      members: [
        {
          id: "CK",
          avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=CK",
        },
        {
          id: "CL",
          avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=CL",
        },
        {
          id: "JR",
          avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=JR",
        },
      ],
    };
  }, [baseConversation]);

  const handleBackPress = () => {
    router.back();
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
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons
              name="chevron-back"
              size={28}
              color={Colors.text.primary}
            />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{conversation.name}</Text>
          </View>

          <View style={styles.fakeBackButton} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          {/* User Profile */}
          <View style={styles.profileSection}>
            <Text style={styles.userName}>Reid McCaw</Text>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: conversation.avatars[0] }}
                style={styles.profileImage}
              />
            </View>
          </View>

          {/* Current Song */}
          <View style={styles.songContainer}>
            <Image
              source={{ uri: conversation.currentSong.albumCover }}
              style={styles.albumCover}
            />
            <View style={styles.lyricsContainer}>
              {conversation.currentSong.lyrics.map((line, index) => (
                <Text
                  key={index}
                  style={[
                    styles.lyricText,
                    index === 0
                      ? styles.firstLyricLine
                      : index === 1
                      ? styles.highlightedLyricLine
                      : styles.lastLyricLine,
                  ]}
                >
                  {line}
                </Text>
              ))}
              <View style={styles.songInfoContainer}>
                <Text style={styles.songTitle}>
                  {conversation.currentSong.title}
                </Text>
                <Text style={styles.artistName}>
                  {conversation.currentSong.artist}
                </Text>
              </View>
            </View>

            {/* Audio wave icon */}
            <View style={styles.audioWaveContainer}>
              <Ionicons name="pulse" size={24} color={Colors.text.primary} />
            </View>
          </View>
        </ScrollView>

        {/* Bottom user list */}
        <View style={styles.bottomContainer}>
          <View style={styles.userAvatarRow}>
            {conversation.members.map((member) => (
              <View key={member.id} style={styles.memberContainer}>
                <View style={styles.memberAvatarContainer}>
                  <Image
                    source={{ uri: member.avatar }}
                    style={styles.memberAvatar}
                  />
                </View>
                <Text style={styles.memberName}>{member.id}</Text>
              </View>
            ))}
          </View>

          {/* Search bar */}
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={() => router.push("/search")}
          >
            <Ionicons
              name="search"
              size={18}
              color={Colors.text.secondary}
              style={styles.searchIcon}
            />
            <Text style={styles.searchPlaceholder}>Search</Text>
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
    width: 40, // Same width as the back button for symmetry
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
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#4A7AFF",
    marginBottom: Spacing.xl,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  songContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  albumCover: {
    width: 65,
    height: 65,
    borderRadius: 8,
    marginRight: Spacing.md,
  },
  lyricsContainer: {
    flex: 1,
  },
  lyricText: {
    color: Colors.text.primary,
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs / 2,
  },
  firstLyricLine: {
    opacity: 0.6,
  },
  highlightedLyricLine: {
    color: "#4A7AFF",
    fontWeight: FontWeights.semiBold,
  },
  lastLyricLine: {
    opacity: 0.6,
  },
  songInfoContainer: {
    marginTop: Spacing.sm,
  },
  songTitle: {
    color: Colors.text.secondary,
    fontSize: FontSizes.sm,
  },
  artistName: {
    color: Colors.text.secondary,
    fontSize: FontSizes.sm,
  },
  audioWaveContainer: {
    padding: Spacing.sm,
  },
  bottomContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  userAvatarRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
  },
  memberContainer: {
    alignItems: "center",
  },
  memberAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#2A2A2A",
    marginBottom: Spacing.xs,
  },
  memberAvatar: {
    width: "100%",
    height: "100%",
  },
  memberName: {
    color: Colors.text.primary,
    fontSize: FontSizes.sm,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchPlaceholder: {
    color: Colors.text.secondary,
    fontSize: FontSizes.md,
  },
});
