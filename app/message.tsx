import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { getConversationMessages } from "@/lib/messaging";
import { Message } from "@/types/message";
import { Conversation } from "@/types/conversation";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import getEnv from "../spotify/env";

// Extended type for the message screen
type ExtendedConversation = {
  id: string;
  name: string;
  avatars: string[];
  currentSong:
    | {
        title: string;
        artist: string;
        lyrics: string[];
        albumCover: string;
      }
    | undefined;
  members: { id: string; avatar: string; name: string; initials: string }[];
};

// Card type for the animated cards
type CardData = {
  title: string;
  artist: string;
  lyrics: string[];
  albumCover: string;
  audioUrl?: string;
};

type CardItem = {
  id: string;
  content: CardData;
};

type CardStackProps = {
  cards: CardData[];
  playingCard: string | null;
  setPlayingCard: (cardId: string | null) => void;
};

type AnimatedCardProps = {
  i: number;
  card: CardData;
  length: number;
  rotateArray: (n: number) => void;
  current: number;
  cardId: string;
  playingCard: string | null;
  setPlayingCard: (cardId: string | null) => void;
};

// Card animation constants
const CARD_HEIGHT = 280;
const CARD_WIDTH = Dimensions.get("window").width * 0.6;
const VISIBLE_CARDS = 3;

// Create card data from messages (most recent first)
const createCardDataFromMessages = (messages: Message[]): CardData[] => {
  if (!messages || messages.length === 0) return [];

  return messages.slice(-5).reverse().map(message => ({
    title: message.song_title || "Unknown Song",
    artist: message.artist || "Unknown Artist",
    lyrics: message.lyrics || ["No lyrics available"],
    albumCover: message.album_cover || `https://api.dicebear.com/7.x/shapes/png?seed=${message.song_title}`,
    audioUrl: message.audio_url,
  }));
};

// Mapping function to create duplicates with UIDs for continuous rotation
const mapData = (data: CardData[], prefix: string): CardItem[] =>
  data.map((item, i) => ({
    id: `${prefix}${i}`,
    content: item,
  }));

const CardStack = ({ cards, playingCard, setPlayingCard }: CardStackProps) => {
  // Create multiple copies for seamless rotation (matching original logic)
  const dataClone = [
    ...mapData(cards, "1"), // Exit animations
    ...mapData(cards, "2"), // Currently displayed
    ...mapData(cards, "3"), // Initial animation
    ...mapData(cards, "4"), // Avoid final->initial animation
  ];

  const [state, setState] = useState({ current: 0, arr: dataClone });
  const length = cards.length;

  // Function to rotate the array (directly from original)
  const rotateArray = (n = 1) => {
    const newArr = [...state.arr];
    if (n > 0) {
      for (let i = 0; i < n; i++) {
        const first = newArr.shift();
        if (first) newArr.push(first);
      }
      setState({ current: n, arr: newArr });
    } else {
      for (let i = 0; i < -n; i++) {
        const last = newArr.pop();
        if (last) newArr.unshift(last);
      }
      setState({ current: n, arr: newArr });
    }
  };

  return (
    <View style={styles.cardStackContainer}>
      {state.arr.map(
        (item, i) =>
          // Render only first 3 copies (matching original logic)
          i < length * 3 && (
            <AnimatedCard
              key={item.id}
              i={i}
              current={state.current}
              card={item.content}
              rotateArray={rotateArray}
              length={length}
              cardId={item.id}
              playingCard={playingCard}
              setPlayingCard={setPlayingCard}
            />
          )
      )}
    </View>
  );
};

const AnimatedCard = ({
  i,
  card,
  length,
  rotateArray,
  current,
  cardId,
  playingCard,
  setPlayingCard,
}: AnimatedCardProps) => {
  // Helpers to determine card position (directly from original)
  const isLeft = i < length;
  const isFirst = i === length;
  const isCenter = i > length && i <= length * 2 - 1;
  const isRight = i > length * 2 - 1 && i < length * 3;

  const iFromFirst = i - length;
  
  // Audio setup
  const env = getEnv();
  const audioUrl = card.audioUrl ? `${card.audioUrl}?apikey=${env.SUPABASE_ANON_KEY}` : undefined;
  const player = useAudioPlayer(audioUrl ? { uri: audioUrl } : undefined);
  const status = useAudioPlayerStatus(player);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const isPlaying = playingCard === cardId;

  // Handle player initialization and cleanup
  useEffect(() => {
    if (player && audioUrl) {
      setIsPlayerReady(true);
      return () => {
        try {
          player.pause();
          player.remove();
        } catch (error) {
          console.log("Error cleaning up player:", error);
        }
        setIsPlayerReady(false);
      };
    }
  }, [player, audioUrl]);

  // Auto-play when card becomes visible (first position) and stop when not first
  useEffect(() => {
    if (isFirst && audioUrl && player && isPlayerReady) {
      setPlayingCard(cardId);
    } else if (!isFirst && isPlaying) {
      setPlayingCard(null);
    }
  }, [isFirst, audioUrl, player, isPlayerReady, cardId, setPlayingCard, isPlaying]);

  // Play/pause logic
  useEffect(() => {
    if (!player || !isPlayerReady || !audioUrl) return;

    try {
      if (isPlaying) {
        player.play();
      } else {
        player.pause();
      }
    } catch (error) {
      console.log("Error controlling playback:", error);
      setPlayingCard(null);
    }
  }, [isPlaying, player, isPlayerReady, audioUrl]);

  // When playback finishes, reset state
  useEffect(() => {
    if (status?.didJustFinish && player && isPlayerReady) {
      try {
        player.pause();
        player.remove();
      } catch (error) {
        console.log("Error cleaning up finished player:", error);
      }
      setPlayingCard(null);
      setIsPlayerReady(false);
    }
  }, [status?.didJustFinish, player, isPlayerReady, setPlayingCard]);

  // Calculate positions (adapted from original but simplified for React Native)
  const getCardStyle = () => {
    const leftOffset = -30; // Slight offset to move cards left

    if (isLeft) {
      return {
        translateX: -CARD_WIDTH * 1.5 + leftOffset,
        translateY: 0,
        scale: 0.8,
        opacity: 0,
        zIndex: 0,
      };
    } else if (isFirst) {
      return {
        translateX: 0 + leftOffset,
        translateY: 0,
        scale: 1,
        opacity: 1,
        zIndex: length,
      };
    } else if (isCenter) {
      const offset = iFromFirst * 20;
      return {
        translateX: offset + leftOffset,
        translateY: offset * 0.5,
        scale: 1 - iFromFirst * 0.05,
        opacity: 1 - iFromFirst * 0.2,
        zIndex: length - iFromFirst,
      };
    } else if (isRight) {
      return {
        translateX: CARD_WIDTH * 1.5 + leftOffset,
        translateY: 0,
        scale: 0.8,
        opacity: 0,
        zIndex: 0,
      };
    }

    return {
      translateX: leftOffset,
      translateY: 0,
      scale: 1,
      opacity: 1,
      zIndex: 1,
    };
  };

  const cardStyle = getCardStyle();

  const handlePanEnd = (event: any) => {
    if (!isFirst) return;

    const { translationX, velocityX } = event.nativeEvent;
    const minVelocity = Math.abs(velocityX) > 500;
    const minDistance = Math.abs(translationX) > CARD_WIDTH * 0.3;
    const direction = translationX > 0 ? -1 : 1;

    if (minDistance && minVelocity) {
      rotateArray(direction);
    }
  };

  const handleTap = () => {
    if (!isFirst) {
      rotateArray(i - length);
    } else if (audioUrl) {
      // Toggle play/pause for the current card when it's at the top
      if (isPlaying) {
        setPlayingCard(null);
      } else {
        setPlayingCard(cardId);
      }
    }
  };

  return (
    <PanGestureHandler
      onHandlerStateChange={(event) => {
        if (event.nativeEvent.state === State.END) {
          handlePanEnd(event);
        }
      }}
      enabled={isFirst}
    >
      <MotiView
        style={[styles.animatedCard, { zIndex: cardStyle.zIndex }]}
        animate={{
          translateX: cardStyle.translateX,
          translateY: cardStyle.translateY,
          scale: cardStyle.scale,
          opacity: cardStyle.opacity,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
          delay: (iFromFirst + current) * 25,
        }}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={handleTap}
          activeOpacity={0.9}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardInner}>
              <Image
                source={{ uri: card.albumCover }}
                style={styles.albumCover}
              />
              <View style={styles.lyricsContainer}>
                {card.lyrics.slice(0, 3).map((lyric, index) => (
                  <Text key={index} style={styles.songLyric}>{lyric}</Text>
                ))}
                {card.lyrics.length < 3 && Array.from({ length: 3 - card.lyrics.length }).map((_, index) => (
                  <Text key={`empty-${index}`} style={styles.songLyric}></Text>
                ))}
                <Text style={styles.songMeta}>
                  {card.title} - {card.artist}
                </Text>
              </View>
              <View style={styles.pulseIconContainer}>
                {audioUrl ? (
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={24}
                    color={Colors.text.primary}
                    style={styles.pulseIcon}
                  />
                ) : (
                  <Ionicons
                    name="pulse"
                    size={24}
                    color={Colors.text.primary}
                    style={styles.pulseIcon}
                  />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    </PanGestureHandler>
  );
};

export default function MessageScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [playingCard, setPlayingCard] = useState<string | null>(null);

  // Load messages on mount and set up polling
  useEffect(() => {
    loadMessages();
    
    // Poll for new messages every 500ms for more responsiveness
    const interval = setInterval(loadMessages, 500);
    
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

  // Define ExtendedConversation based on the loaded data
  const extendedConversation = useMemo(() => {
    if (!currentConversation) return null;

    // Get the latest message for current song info
    const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const currentSong = latestMessage ? {
      title: latestMessage.song_title,
      artist: latestMessage.artist,
      lyrics: latestMessage.lyrics,
      albumCover: latestMessage.album_cover || "",
    } : undefined;

    return {
      id: currentConversation.id,
      name: currentConversation.name,
      avatars: currentConversation.avatars || [],
      currentSong: currentSong,
      members:
        currentConversation.participants?.map((email, index) => {
          const username = email.split("@")[0];
          const nameParts = username.split(".");
          let initials = "";
          if (nameParts.length > 1) {
            initials = `${nameParts[0].charAt(0)}${nameParts[
              nameParts.length - 1
            ].charAt(0)}`;
          } else if (username.length > 0) {
            initials = username.charAt(0);
          }
          return {
            id: email,
            avatar:
              currentConversation.avatars?.[index] ||
              `https://api.dicebear.com/7.x/avataaars/png?seed=${email}`,
            name: username,
            initials: initials.toUpperCase(),
          };
        }) || [],
    };
  }, [currentConversation, messages]);

  const handleBackPress = () => {
    router.back();
  };

  // Create card data from messages
  const cards = useMemo(() => {
    return createCardDataFromMessages(messages);
  }, [messages]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#95B3FF" />
        <Text style={{ color: Colors.text.primary, marginTop: 10 }}>
          Loading Conversation...
        </Text>
      </View>
    );
  }

  if (!extendedConversation) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={{ color: Colors.text.primary }}>
          No conversation found
        </Text>
      </View>
    );
  }

  const firstParticipant = extendedConversation.members[0];

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
            <Text style={styles.headerTitle}>{extendedConversation.name}</Text>
          </View>

          <View style={styles.fakeBackButton} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* User Profile - Show first participant */}
          {firstParticipant && (
            <View style={styles.profileSection}>
              <Text style={styles.userName}>{firstParticipant.name}</Text>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: firstParticipant.avatar }}
                  style={styles.profileImage}
                />
              </View>
            </View>
          )}

          {/* Animated Card Stack - Show only if cards exist */}
          {cards.length > 0 ? (
            <CardStack 
              cards={cards} 
              playingCard={playingCard}
              setPlayingCard={setPlayingCard}
            />
          ) : (
            <View style={styles.noMessagesContainer}>
              <Text style={styles.noMessagesText}>
                No messages yet. Tap search to send a snippet!
              </Text>
            </View>
          )}
        </View>

        {/* Bottom search bar */}
        <View style={styles.bottomContainer}>
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
  cardStackContainer: {
    height: 320,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    position: "relative",
    overflow: "visible",
  },
  animatedCard: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardTouchable: {
    width: "100%",
    height: "100%",
  },
  cardContent: {
    width: "100%",
    height: "100%",
    backgroundColor: "#222",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "column",
    alignItems: "center",
    padding: 20,
    height: "100%",
    justifyContent: "space-between",
  },
  albumCover: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 16,
  },
  lyricsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
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
  pulseIconContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  pulseIcon: {
    marginLeft: 0,
  },
  bottomContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  userAvatarRow: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  memberContainer: {
    alignItems: "center",
    marginHorizontal: Spacing.sm,
  },
  memberAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#2A2A2A",
    marginBottom: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.background,
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  noMessagesText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.md,
    textAlign: "center",
    fontStyle: "italic",
  },
});