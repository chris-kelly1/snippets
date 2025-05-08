import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  const router = useRouter();

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
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color={Colors.text.secondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search lyrics..."
              placeholderTextColor={Colors.text.secondary}
              defaultValue="New York"
            />
            <TouchableOpacity onPress={handleBackPress}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Results */}
        <View style={styles.resultsContainer}>
          <View style={styles.resultCard}>
            <Image
              source={require("@/assets/images/empireStateofMind.jpeg")}
              style={styles.albumCover}
            />
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>Empire State of Mind</Text>
              <Text style={styles.artistName}>Jay-Z & Alicia Keys</Text>
              <Text style={styles.lyricMatch}>
                ...<Text style={styles.highlightedText}>New York</Text> concrete
                jungle where dreams are made of...
              </Text>
            </View>
          </View>
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
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: FontSizes.md,
  },
  cancelButton: {
    color: Colors.text.primary,
    fontSize: FontSizes.md,
    marginLeft: Spacing.sm,
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
});
