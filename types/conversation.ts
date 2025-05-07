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
}; 