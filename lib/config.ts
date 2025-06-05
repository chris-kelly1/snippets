// Non-sensitive configuration that's safe to commit
export const spotifyConfig = {
  SCOPES: [
    "user-read-email",
    "user-read-private", 
    "user-read-playback-state",
    "user-modify-playback-state",
    "streaming",
  ],
  API: {
    DISCOVERY: {
      authorizationEndpoint: "https://accounts.spotify.com/authorize",
      tokenEndpoint: "https://accounts.spotify.com/api/token",
    },
  },
};

export const supabaseConfig = {
  URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://anxmuumodltiuzrbkjog.supabase.co",
  ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};