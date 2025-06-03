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

// Replace this with your Spotify Client ID from the Spotify Developer Dashboard
const CLIENT_ID = "80146fecc5c5415d83010f6bd87f0039";
const CLIENT_SECRET = "7155d29763014d8fa71679915231ad67";

// Replace this with your Supabase anonymous key
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueG11dW1vZGx0aXV6cmJram9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ3MjEyMCwiZXhwIjoyMDY0MDQ4MTIwfQ.zf__8_PalpiStC74oHq8qIYWt1nbFX2vxYMcwxXCCzE";

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
