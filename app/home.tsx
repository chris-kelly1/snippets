import { Button } from "@/components/ui/button";
import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define type for conversation data
type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatars: string[];
  songTitle?: string;
  artist?: string;
  albumCover?: string;
  hasUnread?: boolean;
};

// Dummy data for the conversations
const dummyConversations: Conversation[] = [
  {
    id: '1',
    name: 'The Fellas',
    lastMessage: 'Where have you been all my l-i-i-i-i-fe',
    time: '11:47 AM',
    avatars: [
      'https://api.dicebear.com/7.x/avataaars/png?seed=Felix',
      'https://api.dicebear.com/7.x/avataaars/png?seed=John',
      'https://api.dicebear.com/7.x/avataaars/png?seed=Mike',
      'https://api.dicebear.com/7.x/avataaars/png?seed=Tyson',
    ],
    songTitle: 'Where Have You Been',
    artist: 'Rihanna',
    albumCover: 'https://api.dicebear.com/7.x/identicon/png?seed=1',
    hasUnread: true,
  },
  {
    id: '2',
    name: 'Chris Kelly',
    lastMessage: 'Thank you everyone for stepping out',
    time: '10:27 AM',
    avatars: ['https://api.dicebear.com/7.x/avataaars/png?seed=Chris'],
    songTitle: 'Daddy On The Floor',
    artist: 'Jamie xx, Honey Dijon',
    albumCover: 'https://api.dicebear.com/7.x/identicon/png?seed=2',
    hasUnread: true,
  },
  {
    id: '3',
    name: 'Calvin Laughlin',
    lastMessage: 'Jammin\' right straight from yard, you call it front page',
    time: '10:27 AM',
    avatars: ['https://api.dicebear.com/7.x/avataaars/png?seed=Calvin'],
    songTitle: 'Jamming',
    artist: 'FISHER Rework - Bob Marley and The Wailers',
    albumCover: 'https://api.dicebear.com/7.x/identicon/png?seed=3',
    hasUnread: false,
  },
  {
    id: '4',
    name: 'Jack Ryan',
    lastMessage: 'Call my mom and let her know that I\'m alright',
    time: 'Yesterday',
    avatars: ['https://api.dicebear.com/7.x/avataaars/png?seed=Jack'],
    songTitle: 'Georgia',
    artist: 'Kevin Abstract',
    albumCover: 'https://api.dicebear.com/7.x/identicon/png?seed=4',
    hasUnread: false,
  },
  {
    id: '5',
    name: 'Cool Groupchat',
    lastMessage: 'I\'m ridin\' \'round and my car\'s low',
    time: 'Yesterday',
    avatars: [
      'https://api.dicebear.com/7.x/avataaars/png?seed=Sarah',
      'https://api.dicebear.com/7.x/avataaars/png?seed=Alex',
      'https://api.dicebear.com/7.x/avataaars/png?seed=Emma',
      'https://api.dicebear.com/7.x/avataaars/png?seed=David',
    ],
    songTitle: 'Still Riding',
    artist: 'Barry Can\'t Swim',
    albumCover: 'https://api.dicebear.com/7.x/identicon/png?seed=5',
    hasUnread: false,
  },
];

// Filter button component
const FilterButton = ({ 
  label, 
  isActive = false 
}: { 
  label: string;
  isActive?: boolean;
}) => {
  return (
    <Button
      style={{
        backgroundColor: isActive ? '#0a7ea4' : 'rgba(120, 130, 140, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 0,
        borderRadius: 21,
        height: 34,
        justifyContent: 'center',
      }}
    >
      <Text style={{
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
        color: isActive ? 'white' : '#9BA1A6'
      }}>
        {label}
      </Text>
    </Button>
  );
};

// Group avatar component
const GroupAvatar = ({ avatars }: { avatars: string[] }) => {
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

// Message component
const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
  return (
    <Pressable style={styles.conversationItem}>
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

export default function Home() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Stack.Screen 
        options={{ 
          headerShown: false 
        }} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>snippets</Text>
          <View style={styles.profileContainer}>
            <Image 
              source={{ uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Calvin' }} 
              style={styles.profilePic} 
            />
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.filtersWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.filterContainer}
            >
              <FilterButton label="All" isActive={true} />
              <FilterButton label="Recipient Online" />
              <FilterButton label="Unread" />
              <FilterButton label="Groups" />
            </ScrollView>
          </View>
          
          <FlatList
            data={dummyConversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ConversationItem conversation={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b171c',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 5,
    height: 45,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  filtersWrapper: {
    height: 38,
    marginBottom: 0,
  },
  filterContainer: {
    paddingHorizontal: 15,
    gap: 8,
    height: 38,
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    marginBottom: 25,
    marginTop: 5,
  },
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
  conversationContent: {
    flex: 1,
    marginLeft: 15,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  conversationTime: {
    fontSize: 12,
    color: '#9BA1A6',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  songMessageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumCover: {
    width: 22,
    height: 22,
    borderRadius: 4,
    marginRight: 8,
  },
  songTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationMessage: {
    fontSize: 15,
    flex: 1,
    color: 'white',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0a7ea4',
  },
  songInfo: {
    fontSize: 13,
    marginTop: 4,
    color: '#9BA1A6',
  },
}); 