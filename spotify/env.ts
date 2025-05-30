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
}

// Replace this with your Spotify Client ID from the Spotify Developer Dashboard
const CLIENT_ID = "80146fecc5c5415d83010f6bd87f0039";
const CLIENT_SECRET = "7155d29763014d8fa71679915231ad67";

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
};

const getEnv = (): EnvConfig => ENV;
export default getEnv;
