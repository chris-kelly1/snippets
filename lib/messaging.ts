import { Conversation } from "@/types/conversation";
import { CreateMessageRequest, Message } from "@/types/message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

export const createConversation = async (
  name: string,
  participants: string[],
  createdBy: string
): Promise<Conversation> => {
  try {
    console.log("Creating conversation via Supabase:", {
      name,
      participants,
      createdBy,
    });

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        name,
        participants,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }

    console.log("Conversation created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

export const sendMessage = async (
  messageRequest: CreateMessageRequest
): Promise<Message> => {
  try {
    console.log("Sending message via Supabase:", messageRequest);

    const user = await AsyncStorage.getItem("@spotify_user");
    if (!user) {
      throw new Error("User not authenticated - please log in again");
    }

    const userData = JSON.parse(user);
    console.log("Current user data:", userData);

    // Validate required fields
    if (!messageRequest.conversation_id) {
      throw new Error("Conversation ID is required");
    }

    if (!messageRequest.lyrics || messageRequest.lyrics.length === 0) {
      throw new Error("Lyrics are required");
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: messageRequest.conversation_id,
        sender_id: userData.id,
        sender_email: userData.email,
        sender_name: userData.display_name || userData.email.split("@")[0],
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
      console.error("Error sending message:", error);
      throw error;
    }

    console.log("Message sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const getConversationMessages = async (
  conversationId: string
): Promise<Message[]> => {
  try {
    //console.log('Fetching messages for conversation via Supabase:', conversationId);

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }

    //console.log("Fetched messages via Supabase:", messages.length);
    return messages || [];
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const getUserConversations = async (): Promise<Conversation[]> => {
  try {
    const user = await AsyncStorage.getItem("@spotify_user");
    if (!user) return [];

    const userData = JSON.parse(user);
    console.log(
      "Fetching conversations for user via Supabase:",
      userData.email
    );

    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .contains("participants", [userData.email])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }

    console.log("Fetched conversations via Supabase:", conversations.length);
    return conversations || [];
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
};

// Real-time subscriptions with Supabase
export const subscribeToConversationMessages = (
  conversationId: string,
  callback: (message: Message) => void
) => {
  console.log(
    "Setting up real-time subscription for conversation:",
    conversationId
  );

  const subscription = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log("New message received:", payload.new);
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      console.log("Unsubscribing from conversation messages");
      supabase.removeChannel(subscription);
    },
  };
};

export const likeMessage = async (messageId: string): Promise<Message> => {
  try {
    const user = await AsyncStorage.getItem("@spotify_user");
    if (!user) {
      throw new Error("User not authenticated - please log in again");
    }

    const userData = JSON.parse(user);
    console.log("Liking message:", messageId, "by user:", userData.id);

    // First, get the current message to check existing likes
    const { data: currentMessage, error: fetchError } = await supabase
      .from("messages")
      .select("likes, like_count")
      .eq("id", messageId)
      .single();

    if (fetchError) {
      console.error("Error fetching current message:", fetchError);
      throw fetchError;
    }

    const currentLikes = currentMessage.likes || [];
    const currentLikeCount = currentMessage.like_count || 0;

    // Check if user already liked the message
    if (currentLikes.includes(userData.id)) {
      console.log("User already liked this message");
      return currentMessage as Message;
    }

    // Add user to likes array
    const updatedLikes = [...currentLikes, userData.id];
    const updatedLikeCount = currentLikeCount + 1;

    const { data, error } = await supabase
      .from("messages")
      .update({
        likes: updatedLikes,
        like_count: updatedLikeCount,
      })
      .eq("id", messageId)
      .select()
      .single();

    if (error) {
      console.error("Error liking message:", error);
      throw error;
    }

    console.log("Message liked successfully:", data);
    return data;
  } catch (error) {
    console.error("Error liking message:", error);
    throw error;
  }
};

export const unlikeMessage = async (messageId: string): Promise<Message> => {
  try {
    const user = await AsyncStorage.getItem("@spotify_user");
    if (!user) {
      throw new Error("User not authenticated - please log in again");
    }

    const userData = JSON.parse(user);
    console.log("Unliking message:", messageId, "by user:", userData.id);

    // First, get the current message to check existing likes
    const { data: currentMessage, error: fetchError } = await supabase
      .from("messages")
      .select("likes, like_count")
      .eq("id", messageId)
      .single();

    if (fetchError) {
      console.error("Error fetching current message:", fetchError);
      throw fetchError;
    }

    const currentLikes = currentMessage.likes || [];
    const currentLikeCount = currentMessage.like_count || 0;

    // Check if user hasn't liked the message
    if (!currentLikes.includes(userData.id)) {
      console.log("User hasn't liked this message");
      return currentMessage as Message;
    }

    // Remove user from likes array
    const updatedLikes = currentLikes.filter(
      (userId: string) => userId !== userData.id
    );
    const updatedLikeCount = Math.max(0, currentLikeCount - 1);

    const { data, error } = await supabase
      .from("messages")
      .update({
        likes: updatedLikes,
        like_count: updatedLikeCount,
      })
      .eq("id", messageId)
      .select()
      .single();

    if (error) {
      console.error("Error unliking message:", error);
      throw error;
    }

    console.log("Message unliked successfully:", data);
    return data;
  } catch (error) {
    console.error("Error unliking message:", error);
    throw error;
  }
};
