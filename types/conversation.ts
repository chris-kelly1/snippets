export type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatars: string[];
  songTitle?: string;
  artist?: string;
  albumCover?: string;
  hasUnread?: boolean;
  participants?: string[]; // Array of participant emails
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  last_message_id?: string;
};
