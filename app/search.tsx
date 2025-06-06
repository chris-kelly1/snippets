import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { sendMessage } from "@/lib/messaging";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserExists } from "@/lib/users";
import { CreateMessageRequest } from "@/types/message";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { searchSongs } from "../spotify/apiOptions";
import getEnv from "../spotify/env";
import useSpotifyAuth from "../spotify/useSpotifyAuth";

interface SongInfo {
  id: number;
  title: string;
  artist: string;
  url: string;
  release_date: string;
  albumArt?: string;
  previewUrl?: string;
  spotifyId?: string;
}

interface LyricMatch {
  timestamp: number;
  text: string;
  time_formatted: string;
  artificial: boolean;
}

interface SearchResult {
  song_info: SongInfo;
  matches: LyricMatch[];
  snippetUrl?: string;
}

function SnippetPlayer({
  result,
  isPlaying,
  onPlay,
  onPause,
}: {
  result: SearchResult;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}) {
  const env = getEnv();
  const urlWithKey = result.snippetUrl
    ? `${result.snippetUrl}?apikey=${env.SUPABASE_ANON_KEY}`
    : undefined;
  const player = useAudioPlayer(urlWithKey ? { uri: urlWithKey } : undefined);
  const status = useAudioPlayerStatus(player);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Handle player initialization and cleanup
  useEffect(() => {
    if (player) {
      setIsPlayerReady(true);
      return () => {
        try {
          if (status?.isLoaded) {
            player.pause();
          }
          player.remove();
        } catch (error) {
          console.log("Error cleaning up player:", error);
        }
        setIsPlayerReady(false);
      };
    }
  }, [player, status]);

  // Play/pause logic
  useEffect(() => {
    if (!player || !isPlayerReady) return;

    try {
      if (!status?.isLoaded) return;
      if (isPlaying) {
        player.play();
      } else {
        player.pause();
      }
    } catch (error) {
      console.log("Error controlling playback:", error);
      onPause(); // Reset state if there's an error
    }
  }, [isPlaying, player, isPlayerReady]);

  // When playback finishes, notify parent
  useEffect(() => {
    if (status?.didJustFinish && player && isPlayerReady) {
      try {
        if (status?.isLoaded) player.pause();
        player.remove();
      } catch (error) {
        console.log("Error cleaning up finished player:", error);
      }
      onPause();
      setIsPlayerReady(false);
    }
  }, [status?.didJustFinish, player, isPlayerReady]);

  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={() => {
        if (isPlaying) {
          onPause();
        } else {
          onPlay();
        }
      }}
      disabled={!result.snippetUrl || !isPlayerReady}
    >
      <Ionicons
        name={isPlaying ? "pause" : "play"}
        size={24}
        color={Colors.text.primary}
      />
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [displayQuery, setDisplayQuery] = useState("");
  const [downloadingSnippets, setDownloadingSnippets] = useState<{
    [key: number]: boolean;
  }>({});
  const [playingSnippet, setPlayingSnippet] = useState<number | null>(null);

  // Store player instances by song id
  const playersRef = useRef<{
    [id: number]: ReturnType<typeof useAudioPlayer>;
  }>({});

  // Clean up all players on unmount
  useEffect(() => {
    return () => {
      Object.values(playersRef.current).forEach((player) => player.remove());
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState(""); // Store the query used for current results
  const [useAIVoice, setUseAIVoice] = useState<{[key: number]: boolean}>({}); // Track AI voice state per song
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { token } = useSpotifyAuth();

  // Initialize current user
  useEffect(() => {
    const initUser = async () => {
      const user = await ensureCurrentUserExists();
      setCurrentUser(user);
    };
    initUser();
  }, []);

  const handleBackPress = () => {
    router.back();
  };

  const toggleVoiceOption = (songId: number) => {
    setUseAIVoice(prev => ({
      ...prev,
      [songId]: !prev[songId]
    }));
  };

  const handleSendSnippet = async (result: SearchResult) => {
    if (!result.matches || result.matches.length === 0) {
      Alert.alert("Error", "No lyrics to send");
      return;
    }

    try {
      const match = result.matches[0];
      const lyricsArray = match.text.split(' ').reduce((acc: string[], word: string, index: number) => {
        const lineIndex = Math.floor(index / 3); // 3 words per line
        if (!acc[lineIndex]) acc[lineIndex] = '';
        acc[lineIndex] += (acc[lineIndex] ? ' ' : '') + word;
        return acc;
      }, []);

      // Get conversation ID from route params (passed from message screen)
      const conversationId = params.conversationId as string;
      
      if (!conversationId) {
        Alert.alert("Error", "No conversation selected. Please go back and try again.");
        return;
      }

      let finalAudioUrl = result.snippetUrl || result.song_info.previewUrl || undefined;

      // Generate AI voice if enabled and user has voice model
      const shouldUseAIVoice = useAIVoice[result.song_info.id] && 
                               currentUser?.ai_voice_enabled && 
                               currentUser?.voice_model_id;

      if (shouldUseAIVoice) {
        try {
          console.log('🤖 Generating AI voice via backend API for lyrics:', match.text);
          
          // Call backend API to generate AI voice
          const response = await fetch("http://localhost:8000/generate-ai-voice", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              text: match.text,
              voice_model_id: currentUser.voice_model_id,
              voice_settings: {
                stability: 0.2,        // Lower = more expressive/musical
                similarity_boost: 0.8, // Keep voice recognition 
                style: 0.8,            // Higher = more stylized/musical
                use_speaker_boost: true
              }
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend AI voice generation failed: ${response.status} - ${errorText}`);
          }

          const result = await response.json();
          console.log('✅ Backend AI voice response:', result);

          if (!result.success) {
            throw new Error(result.error || 'Backend AI voice generation failed');
          }

          finalAudioUrl = result.audio_url;
          console.log('🔗 AI voice generated and available at:', finalAudioUrl);
          
        } catch (error) {
          console.error('💥 Error generating AI voice:', error);
          Alert.alert("Warning", "Failed to generate AI voice. Using original audio instead.");
        }
      }

      const messageRequest: CreateMessageRequest = {
        conversation_id: conversationId,
        lyrics: lyricsArray.slice(0, 3), // Take first 3 lines
        song_title: result.song_info.title,
        artist: result.song_info.artist,
        album_cover: result.song_info.albumArt || undefined,
        audio_url: finalAudioUrl,
        spotify_id: result.song_info.spotifyId || result.song_info.id?.toString() || undefined,
      };

      console.log('Sending message:', messageRequest);
      const newMessage = await sendMessage(messageRequest);
      console.log('Message sent with ID:', newMessage.id);
      
      // Poll the database until we can confirm the message exists
      let messageExists = false;
      let attempts = 0;
      const maxAttempts = 20;
      
      console.log('Waiting for message to be readable from database...');
      
      while (!messageExists && attempts < maxAttempts) {
        attempts++;
        console.log(`Attempt ${attempts}/${maxAttempts} - checking if message exists...`);
        
        try {
          const { data: checkMessage, error: checkError } = await supabase
            .from("messages")
            .select("id, song_title")
            .eq("id", newMessage.id)
            .single();
            
          if (checkMessage && !checkError) {
            messageExists = true;
            console.log('✅ Message confirmed in database:', checkMessage.song_title);
            break;
          } else {
            console.log('❌ Message not found, error:', checkError?.message);
          }
        } catch (error) {
          console.log('❌ Database check failed:', error);
        }
        
        // Wait 200ms before next attempt
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      if (!messageExists) {
        console.log('⚠️ Timeout waiting for message confirmation, proceeding anyway');
      }
      
      console.log('🚀 Navigating to preview...');
      console.log('📤 Message data being passed to preview:', newMessage);
      
      // Navigate to preview screen with message data
      try {
        router.push({
          pathname: "/preview",
          params: {
            message: JSON.stringify(newMessage)
          }
        });
        console.log('✅ Navigation to preview initiated');
      } catch (error) {
        console.error('❌ Navigation error:', error);
      }
    } catch (error) {
      console.error('Error sending snippet:', error);
      Alert.alert("Error", "Failed to send snippet. Please try again.");
    }
  };

  const checkExistingSnippets = async (results: SearchResult[]) => {
    try {
      // Check if snippets already exist for these songs
      const response = await fetch("http://localhost:8000/check-snippet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          songs: results.map((r) => ({
            id: r.song_info.id,
            title: r.song_info.title,
            artist: r.song_info.artist,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Existing snippets check:", JSON.stringify(data, null, 2));

        // Update results with existing snippet URLs
        return results.map((result) => {
          const existingSnippet = data.snippets?.find(
            (s: any) => s.song_id === result.song_info.id
          );
          return existingSnippet
            ? { ...result, snippetUrl: existingSnippet.url }
            : result;
        });
      } else {
        console.error(
          "Failed to check snippets:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error checking existing snippets:", error);
    }

    // Return original results if check fails
    return results;
  };

  const handleDownloadSnippet = async (result: SearchResult) => {
    if (!result.matches || result.matches.length === 0) return;

    const match = result.matches[0];
    setDownloadingSnippets((prev) => ({
      ...prev,
      [result.song_info.id]: true,
    }));

    try {
      const response = await fetch("http://localhost:8000/download-snippets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          song_id: result.song_info.id,
          song_title: result.song_info.title,
          artist: result.song_info.artist,
          lyric_text: match.text,
          timestamp: match.timestamp,
        }),
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Download response:", JSON.stringify(data, null, 2));

      if (data.success) {
        console.log("Setting snippet URL:", data.snippet.url);
        // Update the search results with the snippet URL
        setSearchResults((prevResults) => {
          const newResults = prevResults.map((r) =>
            r.song_info.id === result.song_info.id
              ? { ...r, snippetUrl: data.snippet.url }
              : r
          );
          console.log(
            "Updated search results:",
            JSON.stringify(newResults, null, 2)
          );
          return newResults;
        });
      }
    } catch (error) {
      console.error("Error downloading snippet:", error);
    } finally {
      setDownloadingSnippets((prev) => ({
        ...prev,
        [result.song_info.id]: false,
      }));
    }
  };

  const formatLyricMatch = (text: string, query: string) => {
    const queryIndex = text.toLowerCase().indexOf(query.toLowerCase());

    if (queryIndex === -1) return text;

    // Convert to words array to work with word boundaries
    const words = text.split(/\s+/);
    const queryWords = query.toLowerCase().split(/\s+/);

    // Find the starting word index of the query
    let matchStartWordIndex = -1;
    for (let i = 0; i <= words.length - queryWords.length; i++) {
      const wordSlice = words
        .slice(i, i + queryWords.length)
        .join(" ")
        .toLowerCase();
      if (wordSlice === query.toLowerCase()) {
        matchStartWordIndex = i;
        break;
      }
    }

    if (matchStartWordIndex === -1) {
      // Fallback to character-based search if word-based fails
      const contextRadius = 40;
      let startIndex = Math.max(0, queryIndex - contextRadius);
      let endIndex = Math.min(
        text.length,
        queryIndex + query.length + contextRadius
      );

      // Adjust to word boundaries
      while (startIndex > 0 && text[startIndex] !== " ") startIndex--;
      while (endIndex < text.length && text[endIndex] !== " ") endIndex++;

      let context = text.slice(startIndex, endIndex).trim();

      // Add ellipsis if needed
      if (startIndex > 0) context = "..." + context;
      if (endIndex < text.length) context = context + "...";

      // Split and highlight
      const parts = context.split(new RegExp(`(${query})`, "i"));
      return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={index} style={styles.highlightedText}>
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      );
    }

    // Word-based context (show 4-6 words before and after)
    const contextWordsCount = 5;
    const matchEndWordIndex = matchStartWordIndex + queryWords.length - 1;

    const startWordIndex = Math.max(0, matchStartWordIndex - contextWordsCount);
    const endWordIndex = Math.min(
      words.length - 1,
      matchEndWordIndex + contextWordsCount
    );

    // Get the context words
    const beforeWords = words.slice(startWordIndex, matchStartWordIndex);
    const matchWords = words.slice(matchStartWordIndex, matchEndWordIndex + 1);
    const afterWords = words.slice(matchEndWordIndex + 1, endWordIndex + 1);

    // Build the display text
    let displayText = "";

    // Add ellipsis and before words
    if (startWordIndex > 0) displayText += "...";
    if (beforeWords.length > 0) displayText += beforeWords.join(" ");

    // Add the match
    if (beforeWords.length > 0) displayText += " ";
    const matchText = matchWords.join(" ");

    // Add after words
    const afterText = afterWords.length > 0 ? " " + afterWords.join(" ") : "";

    // Add ellipsis if there are more words after
    const ellipsisAfter = endWordIndex < words.length - 1 ? "..." : "";

    return (
      <>
        {startWordIndex > 0 && <Text>...</Text>}
        {beforeWords.length > 0 && <Text>{beforeWords.join(" ")} </Text>}
        <Text style={styles.highlightedText}>{matchText}</Text>
        {afterWords.length > 0 && <Text> {afterWords.join(" ")}</Text>}
        {endWordIndex < words.length - 1 && <Text>...</Text>}
      </>
    );
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setLastSearchQuery(""); // Clear the stored search query
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setHasSearched(true);
    setIsLoading(true);
    setLastSearchQuery(searchQuery); // Store the query used for these results
    try {
      console.log("Making request to:", "http://127.0.0.1:8000/search-lyrics");
      console.log("With query:", searchQuery);

      const response = await fetch("http://127.0.0.1:8000/search-lyrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Search failed with status:", response.status);
        console.error("Error response:", errorText);
        throw new Error(`Search failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Search response:", JSON.stringify(data, null, 2));

      if (data && Array.isArray(data)) {
        // If we have a Spotify token, fetch album art for each result
        let finalResults = data;

        if (token) {
          console.log("Spotify token available, fetching album art...");
          const resultsWithAlbumArt = await Promise.all(
            data.map(async (result) => {
              try {
                const spotifyResults = await searchSongs(
                  `${result.song_info.title} ${result.song_info.artist}`,
                  token
                );
                const albumArt = spotifyResults[0]?.imageUrl;
                const spotifyId = spotifyResults[0]?.externalUrl;
                const previewUrl = spotifyResults[0]?.previewUrl;
                
                return {
                  ...result,
                  song_info: {
                    ...result.song_info,
                    albumArt: albumArt || `https://api.dicebear.com/7.x/shapes/png?seed=${result.song_info.title}`,
                    spotifyId,
                    previewUrl,
                  },
                };
              } catch (error: any) {
                console.error(
                  "Error fetching album art for:",
                  result.song_info.title,
                  error
                );
                // If it's a 401/403 error, the token is expired/invalid
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                  console.error(
                    "🔴 Spotify token expired/invalid - user needs to re-authenticate"
                  );
                  console.error("Token exists:", !!token);
                  console.error("Token length:", token?.length);
                  console.error("💡 Solution: Go to profile and re-login to Spotify");
                }
                // Return the result with fallback album art
                return {
                  ...result,
                  song_info: {
                    ...result.song_info,
                    albumArt: `https://api.dicebear.com/7.x/shapes/png?seed=${result.song_info.title}`,
                  },
                };
              }
            })
          );
          finalResults = resultsWithAlbumArt;
        } else {
          console.log("No Spotify token available, using fallback album art");
          // Add fallback album art when no Spotify token
          finalResults = data.map(result => ({
            ...result,
            song_info: {
              ...result.song_info,
              albumArt: `https://api.dicebear.com/7.x/shapes/png?seed=${result.song_info.title}`,
            },
          }));
        }

        // Check for existing snippets
        console.log("Checking for existing snippets...");
        finalResults = await checkExistingSnippets(finalResults);

        setSearchResults(finalResults);
        console.log("Set search results:", finalResults.length, "items");
      } else {
        console.error("Unexpected response format:", data);
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error("Search error details:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSearchResults = () => {
    console.log("Rendering results, count:", searchResults.length);

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text.primary} />
        </View>
      );
    }

    if (searchResults.length === 0 && searchQuery) {
      return (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No results found</Text>
        </View>
      );
    }

    return searchResults.map((result) => {
      console.log("Rendering result:", result.song_info.title);
      return (
        <View key={result.song_info.id} style={styles.resultCard}>
          <Image
            source={
              result.song_info.albumArt
                ? { uri: result.song_info.albumArt }
                : { uri: result.song_info.url }
            }
            style={styles.albumCover}
          />
          <View style={styles.songInfo}>
            <Text style={styles.songTitle}>{result.song_info.title}</Text>
            <Text style={styles.artistName}>{result.song_info.artist}</Text>
            {result.matches && result.matches[0] && lastSearchQuery && (
              <Text style={styles.lyricMatch}>
                {formatLyricMatch(result.matches[0].text, lastSearchQuery)}
              </Text>
            )}
          </View>
          <View style={styles.actionButtons}>
            {result.snippetUrl ? (
              <SnippetPlayer
                result={result}
                isPlaying={playingSnippet === result.song_info.id}
                onPlay={() => setPlayingSnippet(result.song_info.id)}
                onPause={() => setPlayingSnippet(null)}
              />
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDownloadSnippet(result)}
                disabled={downloadingSnippets[result.song_info.id]}
              >
                {downloadingSnippets[result.song_info.id] ? (
                  <ActivityIndicator size="small" color={Colors.text.primary} />
                ) : (
                  <Ionicons
                    name="download"
                    size={24}
                    color={Colors.text.primary}
                  />
                )}
              </TouchableOpacity>
            )}
            
            {/* Voice option toggle - only show if user has AI voice enabled */}
            {currentUser?.ai_voice_enabled && currentUser?.voice_model_id && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.voiceToggle,
                  useAIVoice[result.song_info.id] && styles.voiceToggleActive
                ]}
                onPress={() => toggleVoiceOption(result.song_info.id)}
              >
                <Ionicons
                  name={useAIVoice[result.song_info.id] ? "mic" : "musical-notes"}
                  size={20}
                  color={useAIVoice[result.song_info.id] ? "#fff" : Colors.text.secondary}
                />
              </TouchableOpacity>
            )}
            
            {/* Send button - always show for testing */}
            <TouchableOpacity
              style={[styles.actionButton, styles.sendButton]}
              onPress={() => handleSendSnippet(result)}
            >
              <Ionicons
                name="send"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>
      );
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
          <View style={styles.searchInputContainer}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={Colors.text.primary}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search lyrics..."
              placeholderTextColor={Colors.text.secondary}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (hasSearched) {
                  setHasSearched(false);
                }
              }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={Colors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Button */}
        {!hasSearched && (
          <View style={styles.searchButtonContainer}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Results */}
        <View style={styles.resultsContainer}>{renderSearchResults()}</View>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    height: 40,
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: FontSizes.md,
  },
  searchButtonContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  searchButtonText: {
    color: Colors.text.primary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semiBold,
  },
  resultsContainer: {
    padding: Spacing.md,
  },
  resultCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  albumCover: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: Colors.text.primary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semiBold,
    marginBottom: 4,
  },
  artistName: {
    color: Colors.text.secondary,
    fontSize: FontSizes.sm,
    marginBottom: 8,
  },
  lyricMatch: {
    color: Colors.text.secondary,
    fontSize: FontSizes.sm,
  },
  highlightedText: {
    color: Colors.text.primary,
    fontWeight: FontWeights.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  noResultsText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.md,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  voiceToggle: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.text.secondary,
  },
  voiceToggleActive: {
    backgroundColor: "#95B3FF",
    borderColor: "#95B3FF",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
});
