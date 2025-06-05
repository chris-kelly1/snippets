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
const CLIENT_ID = "061a72ed13c042fb988132620e39ad6d";
const CLIENT_SECRET = "d28bc8ebb85d44fc8fa7df498051d555";

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