import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HeaderProps = {
  profileImageUrl: string;
};

export const Header = ({ profileImageUrl }: HeaderProps) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const defaultImage = "https://api.dicebear.com/7.x/avataaars/png?seed=Calvin";
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require("@/assets/images/Splash-screen.png")}
      style={[styles.header, { 
        paddingTop: insets.top + Spacing.xs,
        height: 80 + insets.top,
        marginTop: -insets.top
      }]}
      imageStyle={styles.backgroundImage}
    >
      {/* Gradient mask for opacity effect */}
      <LinearGradient
        colors={[
          'rgba(11, 23, 28, 0)',
          'rgb(11, 23, 28)'
        ]}
        locations={[0, 1]}
        style={styles.gradientMask}
      />
      
      <View style={styles.overlay}>
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  backgroundImage: {
    resizeMode: 'cover',
    top: '20%',
  },
  gradientMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: -15,
  },
  overlay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
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
