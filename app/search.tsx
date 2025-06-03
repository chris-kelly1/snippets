import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { searchSongs } from "../spotify/apiOptions";
import useSpotifyAuth from "../spotify/useSpotifyAuth";

interface SongInfo {
  id: number;
  title: string;
  artist: string;
  url: string;
  release_date: string;
  albumArt?: string;
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

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [displayQuery, setDisplayQuery] = useState("");
  const [downloadingSnippets, setDownloadingSnippets] = useState<{
    [key: number]: boolean;
  }>({});
  const { token } = useSpotifyAuth();

  const handleBackPress = () => {
    router.back();
  };

  const handleClear = () => {
    setSearchQuery("");
    setDisplayQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setHasSearched(true);
    setIsLoading(true);
    setDisplayQuery(searchQuery);
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
        // Filter out results with no matches
        const filteredData = data.filter(
          (result) => result.matches && result.matches.length > 0
        );

        // If we have a Spotify token, fetch album art for each result
        if (token) {
          const resultsWithAlbumArt = await Promise.all(
            filteredData.map(async (result) => {
              try {
                const spotifyResults = await searchSongs(
                  `${result.song_info.title} ${result.song_info.artist}`,
                  token
                );
                const albumArt = spotifyResults[0]?.imageUrl;
                return {
                  ...result,
                  song_info: {
                    ...result.song_info,
                    albumArt,
                  },
                };
              } catch (error) {
                console.error("Error fetching album art:", error);
                return result;
              }
            })
          );
          setSearchResults(resultsWithAlbumArt);
        } else {
          setSearchResults(filteredData);
        }
        console.log("Set search results:", filteredData.length, "items");
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

      if (data.success) {
        // Update the search results with the snippet URL
        setSearchResults((prevResults) =>
          prevResults.map((r) =>
            r.song_info.id === result.song_info.id
              ? { ...r, snippetUrl: data.snippet.url }
              : r
          )
        );
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

  const renderSearchResults = () => {
    console.log("Rendering results, count:", searchResults.length);

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text.primary} />
        </View>
      );
    }

    if (searchResults.length === 0 && displayQuery) {
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDownloadSnippet(result)}
            disabled={downloadingSnippets[result.song_info.id]}
          >
            {downloadingSnippets[result.song_info.id] ? (
              <ActivityIndicator size="small" color={Colors.text.primary} />
            ) : result.snippetUrl ? (
              <Ionicons name="play" size={24} color={Colors.text.primary} />
            ) : (
              <Ionicons name="download" size={24} color={Colors.text.primary} />
            )}
          </TouchableOpacity>
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
            {result.matches && result.matches[0] && (
              <Text style={styles.lyricMatch}>
                {formatLyricMatch(result.matches[0].text, displayQuery)}
              </Text>
            )}
          </View>
        </View>
      );
    });
  };

  const formatLyricMatch = (text: string, query: string) => {
    const words = text.split(" ");
    const queryIndex = text.toLowerCase().indexOf(query.toLowerCase());

    if (queryIndex === -1) return text;

    // Find the word boundaries around the query
    let startIndex = Math.max(0, queryIndex - 20);
    let endIndex = Math.min(text.length, queryIndex + query.length + 20);

    // Adjust to word boundaries
    while (startIndex > 0 && text[startIndex] !== " ") startIndex--;
    while (endIndex < text.length && text[endIndex] !== " ") endIndex++;

    // Extract the context
    let context = text.slice(startIndex, endIndex).trim();

    // Add ellipsis if needed
    if (startIndex > 0) context = "..." + context;
    if (endIndex < text.length) context = context + "...";

    // Split the context into parts to highlight the query
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
});
