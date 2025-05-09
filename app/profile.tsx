import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { profileImageUrl } = useLocalSearchParams<{
    profileImageUrl: string;
  }>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.profileCard}>
        <Image source={{ uri: profileImageUrl }} style={styles.profileIcon} />
        <Text style={styles.profileName}>John Doe</Text>
        <Text style={styles.profileEmail}>john.doe@example.com</Text>
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => router.push("/launch")}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b171c",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#0b171c",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  placeholder: {
    width: 28,
  },
  profileCard: {
    margin: 16,
    padding: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    color: "#cccccc",
  },
  signOutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: "#ff3b30",
    borderRadius: 12,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
});
