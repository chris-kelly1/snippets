import { ConversationFilters } from '@/components/conversations/ConversationFilters';
import { ConversationList } from '@/components/conversations/ConversationList';
import { Header } from '@/components/conversations/Header';
import { Colors } from '@/constants/theme';
import { dummyConversations } from '@/data/conversations';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  const profileImageUrl = 'https://api.dicebear.com/7.x/avataaars/png?seed=Calvin';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Stack.Screen 
        options={{ 
          headerShown: false 
        }} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        <Header profileImageUrl={profileImageUrl} />
        
        <View style={styles.content}>
          <ConversationFilters activeFilter="All" />
          <ConversationList conversations={dummyConversations} />
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
  content: {
    flex: 1,
    marginTop: 0,
  },
}); 