import { Message, CreateMessageRequest } from '@/types/message';
import { Conversation } from '@/types/conversation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const createConversation = async (
  name: string,
  participants: string[],
  createdBy: string
): Promise<Conversation> => {
  try {
    console.log('Creating conversation via Supabase:', { name, participants, createdBy });

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        name,
        participants,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }

    console.log('Conversation created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const sendMessage = async (messageRequest: CreateMessageRequest): Promise<Message> => {
  try {
    console.log('Sending message via Supabase:', messageRequest);
    
    const user = await AsyncStorage.getItem('@spotify_user');
    if (!user) {
      throw new Error('User not authenticated - please log in again');
    }
    
    const userData = JSON.parse(user);
    console.log('Current user data:', userData);
    
    // Validate required fields
    if (!messageRequest.conversation_id) {
      throw new Error('Conversation ID is required');
    }
    
    if (!messageRequest.lyrics || messageRequest.lyrics.length === 0) {
      throw new Error('Lyrics are required');
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: messageRequest.conversation_id,
        sender_id: userData.id,
        sender_email: userData.email,
        sender_name: userData.display_name || userData.email.split('@')[0],
        lyrics: messageRequest.lyrics,
        song_title: messageRequest.song_title,
        artist: messageRequest.artist,
        album_cover: messageRequest.album_cover || null,
        audio_url: messageRequest.audio_url,
        spotify_id: messageRequest.spotify_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    console.log('Message sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    console.log('Fetching messages for conversation via Supabase:', conversationId);

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    console.log('Fetched messages via Supabase:', messages.length);
    return messages || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const getUserConversations = async (): Promise<Conversation[]> => {
  try {
    const user = await AsyncStorage.getItem('@spotify_user');
    if (!user) return [];
    
    const userData = JSON.parse(user);
    console.log('Fetching conversations for user via Supabase:', userData.email);

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [userData.email])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    console.log('Fetched conversations via Supabase:', conversations.length);
    return conversations || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

// Real-time subscriptions with Supabase
export const subscribeToConversationMessages = (
  conversationId: string,
  callback: (message: Message) => void
) => {
  console.log('Setting up real-time subscription for conversation:', conversationId);
  
  const subscription = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log('New message received:', payload.new);
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      console.log('Unsubscribing from conversation messages');
      supabase.removeChannel(subscription);
    }
  };
};