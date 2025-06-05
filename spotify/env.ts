interface SpotifyApiConfig {
  DISCOVERY: {
    authorizationEndpoint: string;
    tokenEndpoint: string;
  };
}

interface EnvConfig {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  SCOPES: string[];
  SPOTIFY_API: SpotifyApiConfig;
  SUPABASE_ANON_KEY: string;
}

// Get credentials from environment variables
const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || "";
const CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || "";

// Get Supabase anon key from environment
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

const ENV: EnvConfig = {
  CLIENT_ID: CLIENT_ID,
  CLIENT_SECRET: CLIENT_SECRET,
  SCOPES: [
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "streaming",
  ],
  SPOTIFY_API: {
    DISCOVERY: {
      authorizationEndpoint: "https://accounts.spotify.com/authorize",
      tokenEndpoint: "https://accounts.spotify.com/api/token",
    },
  },
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
};

const getEnv = (): EnvConfig => ENV;
export default getEnv;