export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_email: string;
  sender_name: string;
  lyrics: string[];
  song_title: string;
  artist: string;
  album_cover?: string;
  audio_url?: string;
  spotify_id?: string;
  created_at: string;
  updated_at: string;
  likes?: string[]; // Array of user IDs who liked the message
  like_count?: number; // Total number of likes
};

export type CreateMessageRequest = {
  conversation_id: string;
  lyrics: string[];
  song_title: string;
  artist: string;
  album_cover?: string;
  audio_url?: string;
  spotify_id?: string;
};
