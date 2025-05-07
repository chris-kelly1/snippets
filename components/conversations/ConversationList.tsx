import { Conversation } from '@/types/conversation';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ConversationItem } from './ConversationItem';

type ConversationListProps = {
  conversations: Conversation[];
}

export const ConversationList = ({ conversations }: ConversationListProps) => {
  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ConversationItem conversation={item} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
}); 