import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import {
  getConversationMessages,
  likeMessage,
  unlikeMessage,
} from "@/lib/messaging";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/users";
import { Conversation } from "@/types/conversation";
import { Message } from "@/types/message";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import React, { useEffect, useMemo, useState } from "react";
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
  currentUser: {
    id: string;
    avatar: string;
    name: string;
    initials: string;
  };
  otherParticipants: {
    id: string;
    avatar: string;
    name: string;
    initials: string;
  }[];
};

// Card type for the animated cards
type CardData = {
  id: string; // Message ID for like/unlike functionality
  title: string;
  artist: string;
  lyrics: string[];
  albumCover: string;
  audioUrl?: string;
  timestamp: string;
  senderName: string;
  senderAvatar: string;
  senderId: string;
  likes: string[]; // Array of user IDs who liked the message
  likeCount: number; // Total number of likes
  isLikedByCurrentUser: boolean; // Whether current user has liked this message
};

type CardItem = {
  id: string;
  content: CardData;
};

type CardStackProps = {
  cards: CardData[];
  playingCard: string | null;
  setPlayingCard: (cardId: string | null) => void;
  onLikeToggle: (messageId: string, isCurrentlyLiked: boolean) => void;
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
  onLikeToggle: (messageId: string, isCurrentlyLiked: boolean) => void;
};

// Card animation constants
const CARD_HEIGHT = 280;
const CARD_WIDTH = Dimensions.get("window").width * 0.6;
const VISIBLE_CARDS = 3;

// Define interface for participant data displayed in UI
interface ParticipantUIData {
  id: string; // User ID or email
  avatar: string; // Profile image URL or fallback
  name: string; // Display name or fallback
  initials: string; // Initials or fallback
}

// Create card data from messages (most recent first)
const createCardDataFromMessages = (
  messages: Message[],
  allUsers: User[],
  currentUserId?: string
): CardData[] => {
  if (!messages || messages.length === 0) return [];

  return messages
    .slice(-5)
    .reverse()
    .map((message) => {
      // Find the sender user data
      const senderUser = allUsers.find(
        (user) =>
          user.id === message.sender_id || user.email === message.sender_email
      );

      // Format timestamp
      const timestamp = new Date(message.created_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // Handle likes data
      const likes = message.likes || [];
      const likeCount = message.like_count || 0;
      const isLikedByCurrentUser = currentUserId
        ? likes.includes(currentUserId)
        : false;

      return {
        id: message.id,
        title: message.song_title || "Unknown Song",
        artist: message.artist || "Unknown Artist",
        lyrics: message.lyrics || ["No lyrics available"],
        albumCover:
          message.album_cover ||
          `https://api.dicebear.com/7.x/shapes/png?seed=${message.song_title}`,
        audioUrl: message.audio_url,
        timestamp,
        senderName:
          senderUser?.display_name ||
          message.sender_name ||
          message.sender_email.split("@")[0],
        senderAvatar:
          senderUser?.profile_image ||
          `https://api.dicebear.com/7.x/avataaars/png?seed=${message.sender_email}`,
        senderId: message.sender_id,
        likes,
        likeCount,
        isLikedByCurrentUser,
      };
    });
};

// Mapping function to create duplicates with UIDs for continuous rotation
const mapData = (data: CardData[], prefix: string): CardItem[] =>
  data.map((item, i) => ({
    id: `${prefix}${i}`,
    content: item,
  }));

const CardStack = ({
  cards,
  playingCard,
  setPlayingCard,
  onLikeToggle,
}: CardStackProps) => {
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
              onLikeToggle={onLikeToggle}
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
  onLikeToggle,
}: AnimatedCardProps) => {
  // Helpers to determine card position (directly from original)
  const isLeft = i < length;
  const isFirst = i === length;
  const isCenter = i > length && i <= length * 2 - 1;
  const isRight = i > length * 2 - 1 && i < length * 3;

  const iFromFirst = i - length;

  // Audio setup
  const env = getEnv();
  const audioUrl = card.audioUrl
    ? `${card.audioUrl}?apikey=${env.SUPABASE_ANON_KEY}`
    : undefined;
  const player = useAudioPlayer(audioUrl ? { uri: audioUrl } : undefined);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status?.playing || false;
  const isPlayerReady = status?.isLoaded || false;

  useEffect(() => {
    // Manual play only - no auto-play
    if (playingCard === cardId && isPlayerReady && !isPlaying) {
      player?.play();
    } else if (playingCard !== cardId && isPlaying) {
      player?.pause();
    }
    // Pause when the card is no longer the first one
    if (!isFirst && isPlaying) {
      player?.pause();
      setPlayingCard(null);
    }
  }, [
    isFirst,
    audioUrl,
    player,
    isPlayerReady,
    cardId,
    setPlayingCard,
    isPlaying,
    playingCard,
  ]);

  // Play/pause logic for manual button press
  const handlePlayButtonPress = () => {
    if (isFirst && isPlayerReady) {
      if (isPlaying) {
        player?.pause();
        setPlayingCard(null);
      } else {
        player?.play();
        setPlayingCard(cardId);
      }
    }
  };

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
    }
    // Card taps no longer control audio - only the play button does
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
            {/* Play Button - Bottom Left Corner */}
            {isFirst && card.audioUrl && (
              <TouchableOpacity
                style={styles.playButtonCorner}
                onPress={handlePlayButtonPress}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={18}
                  color={Colors.text.primary}
                />
              </TouchableOpacity>
            )}

            {/* Like Button - Bottom Right Corner */}
            <TouchableOpacity
              style={styles.likeButtonCorner}
              onPress={() => onLikeToggle(card.id, card.isLikedByCurrentUser)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={card.isLikedByCurrentUser ? "heart" : "heart-outline"}
                size={18}
                color={
                  card.isLikedByCurrentUser ? "#FF4757" : Colors.text.secondary
                }
              />
              {card.likeCount > 0 && (
                <Text style={styles.likeCountCorner}>{card.likeCount}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.cardInner}>
              {/* Header with profile photo and timestamp */}
              <View style={styles.cardHeader}>
                <View style={styles.senderInfo}>
                  <Image
                    source={{ uri: card.senderAvatar }}
                    style={styles.senderAvatar}
                  />
                  <Text style={styles.senderName}>{card.senderName}</Text>
                </View>
                <Text style={styles.timestamp}>{card.timestamp}</Text>
              </View>

              <Image
                source={{ uri: card.albumCover }}
                style={styles.albumCover}
              />
              <View style={styles.lyricsContainer}>
                {card.lyrics.slice(0, 3).map((lyric, index) => (
                  <Text key={index} style={styles.songLyric}>
                    {lyric}
                  </Text>
                ))}
                {card.lyrics.length < 3 &&
                  Array.from({ length: 3 - card.lyrics.length }).map(
                    (_, index) => (
                      <Text
                        key={`empty-${index}`}
                        style={styles.songLyric}
                      ></Text>
                    )
                  )}
                <Text style={styles.songMeta}>
                  {card.title} - {card.artist}
                </Text>
              </View>

              {/* Pulse Icon - Placeholder */}
              {isFirst && isPlaying && (
                <MotiView
                  from={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{
                    type: "timing",
                    duration: 1000,
                    loop: true,
                  }}
                  style={styles.pulseIconContainer}
                >
                  <Ionicons
                    name="volume-high-outline"
                    size={24}
                    color={Colors.text.primary}
                    style={styles.pulseIcon}
                  />
                </MotiView>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    </PanGestureHandler>
  );
};

export default function MessageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [playingCard, setPlayingCard] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Load conversation data and messages based on conversation ID from params
  useEffect(() => {
    const conversationId = params.id;
    // console.log("useEffect [params.id] triggered. params.id:", conversationId);

    // Only proceed if a valid conversationId string is present
    if (typeof conversationId !== "string") {
      // console.log("Conversation ID is not a string, skipping data load.");
      setLoading(false); // Ensure loading is false if ID is not valid string
      setCurrentConversation(null); // Clear conversation data
      return; // Exit the effect
    }

    // console.log("Valid conversation ID found, loading data:", conversationId);
    setLoading(true); // Set loading true when we have a valid ID and start fetching

    const loadConversationData = async () => {
      try {
        // Fetch the specific conversation
        const { data: convData, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .single();

        if (convError) throw convError;
        setCurrentConversation(convData);

        // Fetch messages for the conversation
        const conversationMessages = await getConversationMessages(
          conversationId
        );
        setMessages(conversationMessages);
      } catch (error) {
        console.error("Error loading conversation data:", error);
        setCurrentConversation(null); // Indicate error state
      } finally {
        setLoading(false); // Set loading to false when fetch is complete;
      }
    };

    loadConversationData();

    // Set up polling interval only if a valid conversationId is available
    const interval = setInterval(() => loadConversationData(), 500);

    // Cleanup function to clear the interval
    return () => clearInterval(interval);
  }, [params.id]); // Depend specifically on params.id

  // Load all users and current user when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getAllUsers } = await import("@/lib/users");
        const users = await getAllUsers();
        setAllUsers(users);

        const storedUser = await AsyncStorage.getItem("@spotify_user");
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setAllUsers([]);
        setCurrentUser(null);
      }
    };
    fetchData();
  }, []);

  // Define ExtendedConversation based on the loaded data
  const extendedConversation = useMemo(() => {
    if (!currentConversation || !currentUser || allUsers.length === 0)
      return null;

    // Get the latest message for current song info
    const latestMessage =
      messages.length > 0 ? messages[messages.length - 1] : null;
    const currentSong = latestMessage
      ? {
          title: latestMessage.song_title,
          artist: latestMessage.artist,
          lyrics: latestMessage.lyrics,
          albumCover: latestMessage.album_cover || "",
        }
      : undefined;

    // Map participant emails to ParticipantUIData objects
    const participantsUIData: ParticipantUIData[] =
      currentConversation.participants?.map((email) => {
        const participantUser = allUsers.find((user) => user.email === email);
        // Always return an object conforming to ParticipantUIData interface
        return {
          id: participantUser?.id || email, // Use user ID if available, fallback to email
          avatar:
            participantUser?.profile_image ||
            `https://api.dicebear.com/7.x/avataaars/png?seed=${email}`, // Use profile_image if available
          name: participantUser?.display_name || email.split("@")[0], // Use display_name if available
          initials:
            participantUser?.display_name?.[0]?.toUpperCase() ||
            email.split("@")[0]?.[0]?.toUpperCase() ||
            "?",
        };
      }) || [];

    // Separate current user and other participants based on the UIData structure
    const currentUserData =
      participantsUIData.find(
        (user) =>
          user.id === currentUser.id || user.name === currentUser.display_name
      ) || null; // Find current user by ID or display name
    const otherParticipantsData = participantsUIData.filter(
      (user) =>
        user.id !== currentUserData?.id && user.name !== currentUserData?.name
    );

    return {
      id: currentConversation.id,
      name: currentConversation.name,
      avatars: currentConversation.avatars || [],
      currentSong: currentSong,
      currentUser: currentUserData, // Use the found current user data
      otherParticipants: otherParticipantsData, // Use the filtered other participants data
    };
  }, [currentConversation, messages, currentUser, allUsers]);

  const handleBackPress = () => {
    router.back();
  };

  // Handle like/unlike functionality
  const handleLikeToggle = async (
    messageId: string,
    isCurrentlyLiked: boolean
  ) => {
    try {
      if (isCurrentlyLiked) {
        await unlikeMessage(messageId);
      } else {
        await likeMessage(messageId);
      }

      // Refresh messages to get updated like counts
      const conversationId = params.id;
      if (typeof conversationId === "string") {
        const updatedMessages = await getConversationMessages(conversationId);
        setMessages(updatedMessages);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Create card data from messages (cards are now independent of user data)
  const cards = useMemo(() => {
    return createCardDataFromMessages(messages, allUsers, currentUser?.id);
  }, [messages, allUsers, currentUser?.id]);

  // Conditional rendering based on loading/error state
  if (loading) {
    // Only check loading state here
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#95B3FF" />
        <Text style={{ color: Colors.text.primary, marginTop: 10 }}>
          Loading Conversation...
        </Text>
      </View>
    );
  }

  // Add a separate check for when extendedConversation data is not available after loading
  if (!extendedConversation) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={{ color: Colors.text.primary }}>
          Conversation not found or failed to load.
        </Text>
      </View>
    );
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
            <Text style={styles.headerTitle}>{extendedConversation.name}</Text>
          </View>

          <View style={styles.fakeBackButton} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Current User Profile - Show current user at the top */}
          {extendedConversation.currentUser && (
            <View style={styles.profileSection}>
              <Text style={styles.userName}>
                {extendedConversation.currentUser.name}
              </Text>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: extendedConversation.currentUser.avatar }}
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
              onLikeToggle={handleLikeToggle}
            />
          ) : (
            <View style={styles.noMessagesContainer}>
              <Text style={styles.noMessagesText}>
                No messages yet. Tap search to send a snippet!
              </Text>
            </View>
          )}
        </View>

        {/* Other Participants List - Show above the search bar */}
        {extendedConversation.otherParticipants.length > 0 && (
          <View style={styles.userAvatarRow}>
            {extendedConversation.otherParticipants.map((member) =>
              // Ensure member has a valid structure with id, name, and avatar
              member &&
              member.id &&
              member.name !== undefined &&
              member.avatar !== undefined ? (
                <View key={member.id} style={styles.memberContainer}>
                  <View style={styles.memberAvatarContainer}>
                    <Image
                      source={{ uri: member.avatar }}
                      style={styles.memberAvatar}
                    />
                  </View>
                  {/* Show display name under each avatar */}
                  <Text style={styles.memberName}>{member.name}</Text>
                </View>
              ) : null
            )}
          </View>
        )}

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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  senderName: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  timestamp: {
    color: Colors.text.secondary,
    fontSize: 10,
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
    justifyContent: "center",
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
    flex: 1, // Allow placeholder to take available space
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
  likeContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  likeCount: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "600",
  },
  playButtonCorner: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 10,
  },
  likeButtonCorner: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 10,
  },
  likeCountCorner: {
    color: Colors.text.primary,
    fontSize: 11,
    marginLeft: 4,
    fontWeight: "600",
  },
});
