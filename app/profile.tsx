import useSpotifyAuth from "@/spotify/useSpotifyAuth";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { profileImageUrl: initialProfileImageUrl } = useLocalSearchParams<{
    profileImageUrl?: string;
  }>();
  const { logout } = useSpotifyAuth();

  // Placeholder state for profile info (replace with actual user data later)
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState("John Doe"); // Replace with actual user name
  const [profileImage, setProfileImage] = useState(
    initialProfileImageUrl || "https://via.placeholder.com/150"
  ); // Replace with actual user image or placeholder

  const pickImage = async () => {
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSaveProfile = () => {
    // Implement save logic here (e.g., send updated data to backend/API)
    console.log("Saving profile:", { userName, profileImage });
    setIsEditing(false);
    // In a real app, you would handle API calls and error handling here
  };

  const handleCancelEdit = () => {
    // Revert changes if needed (e.g., fetch original data again)
    setIsEditing(false);
  };

  const handleSignOut = () => {
    logout(); // Call the logout function from the hook
    router.replace("/launch"); // Navigate back to the launch screen
  };

  return (
    <ImageBackground
      source={require("@/assets/images/launch-screen.png")}
      style={styles.background}
      imageStyle={styles.image}
    >
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
          <Image source={{ uri: profileImage }} style={styles.profileIcon} />

          {isEditing ? (
            <>
              <TextInput
                style={styles.input}
                value={userName}
                onChangeText={setUserName}
                placeholder="Username"
                placeholderTextColor="#aaaaaa"
              />
              <TouchableOpacity onPress={pickImage}>
                <Text style={styles.editPhotoText}>Edit Photo</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.profileName}>{userName}</Text>
            </>
          )}

          {isEditing ? (
            <View style={styles.editButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover", // Ensure the image covers the background
  },
  image: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)", // Add a dark overlay for readability
    paddingTop: 60,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: "100%",
    // Removed background color from header to let ImageBackground show through
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
    margin: 20,
    padding: 24,
    backgroundColor: "rgba(30,30,30,0.9)", // Darker card with some transparency
    borderRadius: 12,
    alignItems: "center",
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    backgroundColor: "#ccc", // Placeholder background
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#333333",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  editButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  editButton: {
    backgroundColor: "#1DB954", // Spotify Green
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: "#1DB954", // Spotify Green
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#555555", // Dark Gray
    marginRight: 10,
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: "auto", // Push to bottom
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#1a1a1a", // Darker than edit buttons
    borderRadius: 12,
    alignItems: "center",
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#333333",
  },
  signOutText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#cccccc", // Lighter text for sign out
  },
  editPhotoText: {
    color: "#1DB954", // Spotify green
    fontSize: 16,
    marginTop: 8,
    textDecorationLine: "underline",
  },
});
