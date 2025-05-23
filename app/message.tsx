import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { dummyConversations } from "@/data/conversations";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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

const CARD_HEIGHT = 180;
const CARD_WIDTH = '90%';
const CARD_STACK_OFFSET = 18;
const CARD_SCALE_STEP = 0.07;
const VISIBLE_CARDS = 3;
const CARD_OVERLAP = 20; // px

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

  const cards = [
    conversation.currentSong,
    {
      title: "Blinding Lights",
      artist: "The Weeknd",
      lyrics: [
        "I said, ooh, I'm blinded by the lights",
        "No, I can't sleep until I feel your touch",
        "I said, ooh, I'm drowning in the night"
      ],
      albumCover: "https://upload.wikimedia.org/wikipedia/en/0/09/The_Weeknd_-_Blinding_Lights.png"
    },
    {
      title: "Body On The Floor",
      artist: "Junior Jack, Maddy O'Neal",
      lyrics: [
        "Thank you everyone for stepping out tonight",
        "Move your body, move your body",
        "Move your body, move your body"
      ],
      albumCover: "https://upload.wikimedia.org/wikipedia/en/6/6a/Junior_Jack_-_Trust_It.png"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const transition = useSharedValue(0);

  // Gesture handler
  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      transition.value = event.translationY;
    },
    onEnd: (event) => {
      if (event.translationY < -50 && currentIndex < cards.length - 1) {
        runOnJS(setCurrentIndex)(currentIndex + 1);
      } else if (event.translationY > 50 && currentIndex > 0) {
        runOnJS(setCurrentIndex)(currentIndex - 1);
      }
      transition.value = withSpring(0);
    },
  });

  // Debug: fallback button to advance card
  const handleNext = () => {
    if (currentIndex < cards.length - 1) setCurrentIndex(currentIndex + 1);
  };
  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  // Always call VISIBLE_CARDS hooks and render VISIBLE_CARDS slots
  const animatedStyles = Array(VISIBLE_CARDS).fill(0).map((_, i) =>
    useAnimatedStyle(() => {
      const scale = 1 - i * CARD_SCALE_STEP;
      // Offset so the focused card is always centered, and others are stacked upward
      const translateY = -i * CARD_OVERLAP;
      let y = 0;
      if (i === 0) {
        y = transition.value;
      }
      return {
        position: 'absolute',
        alignSelf: 'center',
        transform: [
          { translateY: y + translateY },
          { scale },
        ],
        zIndex: VISIBLE_CARDS - i,
        opacity: 1 - i * 0.12,
      };
    })
  );

  // Always render VISIBLE_CARDS slots
  const visibleCards = [];
  for (let i = 0; i < VISIBLE_CARDS; i++) {
    const card = cards[currentIndex + i];
    visibleCards.push(card || null);
  }

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
        <View style={styles.content}>
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

          {/* Card Stack */}
          <View style={{ height: 260, alignItems: 'center', justifyContent: 'center', marginBottom: 32, position: 'relative' }}>
            {visibleCards.map((card, i) => {
              if (!card) return null;
              if (i === 0) {
                // Only top card is interactive
                return (
                  <PanGestureHandler
                    key={currentIndex + i}
                    onGestureEvent={gestureHandler}
                  >
                    <Animated.View style={[styles.mockupCard, animatedStyles[i]]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={{ uri: card.albumCover }} style={styles.mockupAlbumCover} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.mockupSongTitle}>{card.lyrics[0]}</Text>
                          <Text style={styles.mockupSongSubtitle}>{card.lyrics[1]}</Text>
                          <Text style={styles.mockupSongSubtitle}>{card.lyrics[2]}</Text>
                          <Text style={styles.mockupSongMeta}>{card.title} - {card.artist}</Text>
                        </View>
                        <Ionicons name="pulse" size={24} color={Colors.text.primary} style={{ marginLeft: 8 }} />
                      </View>
                    </Animated.View>
                  </PanGestureHandler>
                );
              } else {
                // Non-top cards are not interactive
                return (
                  <Animated.View key={currentIndex + i} style={[styles.mockupCard, animatedStyles[i]]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image source={{ uri: card.albumCover }} style={styles.mockupAlbumCover} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.mockupSongTitle}>{card.lyrics[0]}</Text>
                        <Text style={styles.mockupSongSubtitle}>{card.lyrics[1]}</Text>
                        <Text style={styles.mockupSongSubtitle}>{card.lyrics[2]}</Text>
                        <Text style={styles.mockupSongMeta}>{card.title} - {card.artist}</Text>
                      </View>
                      <Ionicons name="pulse" size={24} color={Colors.text.primary} style={{ marginLeft: 8 }} />
                    </View>
                  </Animated.View>
                );
              }
            })}
          </View>

          {/* Debug buttons for advancing cards if swipe fails */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
            <Button title="Prev" onPress={handlePrev} disabled={currentIndex === 0} />
            <View style={{ width: 16 }} />
            <Button title="Next" onPress={handleNext} disabled={currentIndex === cards.length - 1} />
          </View>
        </View>

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
  mockupCard: {
    width: '90%',
    height: CARD_HEIGHT,
    backgroundColor: '#222',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    padding: 20,
    marginBottom: 0,
    justifyContent: 'center',
  },
  mockupAlbumCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 8,
  },
  mockupSongTitle: {
    color: '#7EB6FF',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
  },
  mockupSongSubtitle: {
    color: '#bbb',
    fontSize: 15,
    marginBottom: 1,
  },
  mockupSongMeta: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
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
