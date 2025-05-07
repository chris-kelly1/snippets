import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

type GroupAvatarProps = {
  avatars: string[];
}

export const GroupAvatar = ({ avatars }: GroupAvatarProps) => {
  if (avatars.length === 1) {
    return (
      <View style={styles.singleAvatar}>
        <Image source={{ uri: avatars[0] }} style={styles.avatar} />
      </View>
    );
  }

  return (
    <View style={styles.groupAvatarContainer}>
      {avatars.slice(0, 4).map((avatar, index) => (
        <Image 
          key={index} 
          source={{ uri: avatar }} 
          style={[styles.smallAvatar, {
            top: index < 2 ? 0 : 18,
            left: index % 2 === 0 ? 0 : 18,
          }]} 
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  singleAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  groupAvatarContainer: {
    width: 60,
    height: 60,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    position: 'absolute',
  },
}); 