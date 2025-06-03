import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { updateUserProfile, uploadProfileImage } from "../lib/supabase";
import useSpotifyAuth from "../spotify/useSpotifyAuth";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, user, isLoading, error, refreshUser } = useSpotifyAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(
    user?.display_name || ""
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleImagePick = async () => {
    try {
      // Request permission first
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      console.log("Media Library Permission Status:", status);

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos to change your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUpdating(true);
        try {
          // Upload image to Supabase Storage
          const imageUrl = await uploadProfileImage(
            user?.id || "",
            result.assets[0].uri
          );

          // Update user profile with new image URL and current display name
          await updateUserProfile(user?.id || "", {
            profile_image: imageUrl,
            display_name: user?.display_name || "",
          });

          // Refresh user data in the hook's state
          await refreshUser();

          // Force a refresh of the user data in AsyncStorage
          await AsyncStorage.setItem(
            "@spotify_user",
            JSON.stringify({
              ...user,
              profile_image: imageUrl,
            })
          );

          // Update local state
          if (user) {
            user.profile_image = imageUrl;
          }
        } catch (error) {
          Alert.alert("Error", "Failed to update profile picture");
          console.error("Error updating profile picture:", error);
        } finally {
          setIsUpdating(false);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error("Error picking image:", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, {
        display_name: newDisplayName,
      });

      // Refresh user data in the hook's state
      await refreshUser();

      // Update local state
      if (user) {
        user.display_name = newDisplayName;
      }
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/images/launch-screen.png")}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={handleImagePick}
                disabled={isUpdating}
              >
                {user?.profile_image ? (
                  <Image
                    source={{ uri: user.profile_image }}
                    style={styles.avatar}
                    onError={(error) => {
                      console.error("Image loading error:", error.nativeEvent);
                    }}
                    onLoad={() => {
                      console.log(
                        "Image loaded successfully:",
                        user.profile_image
                      );
                    }}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {user?.display_name?.[0]?.toUpperCase() || "?"}
                  </Text>
                )}
                {isUpdating && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              {isEditing ? (
                <View style={styles.editNameContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={newDisplayName}
                    onChangeText={setNewDisplayName}
                    placeholder="Enter Username"
                    placeholderTextColor="#666"
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      style={[styles.editButton, styles.cancelButton]}
                      onPress={() => {
                        setIsEditing(false);
                        setNewDisplayName(user?.display_name || "");
                      }}
                    >
                      <Text style={styles.editButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editButton, styles.saveButton]}
                      onPress={handleUpdateProfile}
                      disabled={isUpdating}
                    >
                      <Text style={styles.editButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={styles.nameContainer}
                >
                  <Text style={styles.userName}>{user?.display_name}</Text>
                  <Ionicons name="pencil" size={16} color="#b3b3b3" />
                </TouchableOpacity>
              )}

              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.3,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  profileSection: {
    padding: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 8,
  },
  userEmail: {
    fontSize: 16,
    color: "#b3b3b3",
  },
  editNameContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: "#282828",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginBottom: 12,
    fontSize: 18,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  saveButton: {
    backgroundColor: "#95B3FF",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#95B3FF",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
