import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type HeaderProps = {
  profileImageUrl: string;
};

export const Header = ({ profileImageUrl }: HeaderProps) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const defaultImage = "https://api.dicebear.com/7.x/avataaars/png?seed=Calvin";

  return (
    <View style={styles.header}>
      <Text style={styles.title}>snippets</Text>
      <TouchableOpacity
        onPress={() =>
          router.push({ pathname: "/profile", params: { profileImageUrl } })
        }
        style={styles.profileContainer}
      >
        <Image
          source={{ uri: imageError ? defaultImage : profileImageUrl }}
          style={styles.profilePic}
          onError={(error) => {
            console.error("Profile image loading error:", error.nativeEvent);
            setImageError(true);
          }}
          onLoad={() => {
            console.log("Profile image loaded successfully");
            setImageError(false);
          }}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    height: 45,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.black,
    color: Colors.text.primary,
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  profilePic: {
    width: "100%",
    height: "100%",
  },
});
