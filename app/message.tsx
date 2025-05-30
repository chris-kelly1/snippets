import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { dummyConversations } from "@/data/conversations";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
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

// Card type for the animated cards
type CardData = {
  title: string;
  artist: string;
  lyrics: string[];
  albumCover: string;
};

type CardItem = {
  id: string;
  content: CardData;
};

type CardStackProps = {
  cards: CardData[];
};

type AnimatedCardProps = {
  i: number;
  card: CardData;
  length: number;
  rotateArray: (n: number) => void;
  current: number;
};

// Card animation constants
const CARD_HEIGHT = 280;
const CARD_WIDTH = Dimensions.get('window').width * 0.6;
const VISIBLE_CARDS = 3;

// Create sample data for multiple cards
const createCardData = (conversation: ExtendedConversation): CardData[] => {
  const baseCard = {
    title: conversation.currentSong.title,
    artist: conversation.currentSong.artist,
    lyrics: conversation.currentSong.lyrics,
    albumCover: conversation.currentSong.albumCover,
  };

  // Create variations of the card with different lyrics
  return [
    baseCard,
    {
      ...baseCard,
      lyrics: ["Different verse here", "Another line of music", "Keep the rhythm going"],
      title: "Different Song"
    },
    {
      ...baseCard,
      lyrics: ["Third card lyrics", "Music keeps playing", "Dance to the beat"],
      title: "Another Track"
    },
    {
      ...baseCard,
      lyrics: ["Fourth set of lyrics", "Never ending music", "Feel the vibe"],
      title: "Next Song"
    },
    {
      ...baseCard,
      lyrics: ["Fifth card content", "Music flows through", "Keep it moving"],
      title: "Last Track"
    }
  ];
};

// Mapping function to create duplicates with UIDs for continuous rotation
const mapData = (data: CardData[], prefix: string): CardItem[] =>
  data.map((item, i) => ({
    id: `${prefix}${i}`,
    content: item
  }));

const CardStack = ({ cards }: CardStackProps) => {
  // Create multiple copies for seamless rotation (matching original logic)
  const dataClone = [
    ...mapData(cards, "1"), // Exit animations
    ...mapData(cards, "2"), // Currently displayed
    ...mapData(cards, "3"), // Initial animation
    ...mapData(cards, "4")  // Avoid final->initial animation
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
            />
          )
      )}
    </View>
  );
};

const AnimatedCard = ({ i, card, length, rotateArray, current }: AnimatedCardProps) => {
  // Helpers to determine card position (directly from original)
  const isLeft = i < length;
  const isFirst = i === length;
  const isCenter = i > length && i <= length * 2 - 1;
  const isRight = i > length * 2 - 1 && i < length * 3;

  const iFromFirst = i - length;

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
        scale: 1 - (iFromFirst * 0.05),
        opacity: 1 - (iFromFirst * 0.2),
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
    
    return { translateX: leftOffset, translateY: 0, scale: 1, opacity: 1, zIndex: 1 };
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
          type: 'spring',
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
              <Image source={{ uri: card.albumCover }} style={styles.albumCover} />
              <View style={styles.lyricsContainer}>
                <Text style={styles.songLyric}>{card.lyrics[0]}</Text>
                <Text style={styles.songLyric}>{card.lyrics[1]}</Text>
                <Text style={styles.songLyric}>{card.lyrics[2]}</Text>
                <Text style={styles.songMeta}>{card.title} - {card.artist}</Text>
              </View>
              <View style={styles.pulseIconContainer}>
                <Ionicons name="pulse" size={24} color={Colors.text.primary} style={styles.pulseIcon} />
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

  // Create card data
  const cards = useMemo(() => createCardData(conversation), [conversation]);

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

          {/* Animated Card Stack */}
          <CardStack cards={cards} />
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
  cardStackContainer: {
    height: 320,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
    overflow: 'visible',
  },
  animatedCard: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardTouchable: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    height: '100%',
    justifyContent: 'space-between',
  },
  albumCover: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 16,
  },
  lyricsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  songLyric: {
    color: '#7EB6FF',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
  songMeta: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  pulseIconContainer: {
    alignItems: 'center',
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
