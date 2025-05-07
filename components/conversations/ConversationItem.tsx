import { Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { Conversation } from '@/types/conversation';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GroupAvatar } from './GroupAvatar';

type ConversationItemProps = {
  conversation: Conversation;
}

export const ConversationItem = ({ conversation }: ConversationItemProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/message',
      params: { conversationId: conversation.id }
    });
  };

  return (
    <Pressable style={styles.conversationItem} onPress={handlePress}>
      <GroupAvatar avatars={conversation.avatars} />
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{conversation.name}</Text>
          <Text style={styles.conversationTime}>{conversation.time}</Text>
        </View>
        
        <View style={styles.messageContainer}>
          {conversation.songTitle ? (
            <View style={styles.songMessageContainer}>
              {conversation.albumCover && (
                <Image 
                  source={{ uri: conversation.albumCover }} 
                  style={styles.albumCover} 
                />
              )}
              <View style={styles.songTextContainer}>
                <Text style={styles.conversationMessage} numberOfLines={1}>
                  {conversation.lastMessage}
                </Text>
                <Text style={styles.songInfo} numberOfLines={1}>
                  {conversation.songTitle} — {conversation.artist}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.conversationMessage} numberOfLines={1}>
              {conversation.lastMessage}
            </Text>
          )}
          
          {conversation.hasUnread && (
            <View style={styles.unreadIndicator} />
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  conversationItem: {
    flexDirection: 'row',
    marginBottom: 25,
    marginTop: 5,
  },
  conversationContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  conversationName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
    color: Colors.text.primary,
  },
  conversationTime: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  songMessageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumCover: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  songTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationMessage: {
    fontSize: FontSizes.md,
    flex: 1,
    color: Colors.text.primary,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  songInfo: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
  },
}); 