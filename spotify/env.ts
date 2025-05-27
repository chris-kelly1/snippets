interface SpotifyApiConfig {
  DISCOVERY: {
    authorizationEndpoint: string;
    tokenEndpoint: string;
  };
}

interface EnvConfig {
  CLIENT_ID: string;
  SCOPES: string[];
  REDIRECT_URI: string;
  SPOTIFY_API: SpotifyApiConfig;
}

// Replace this with your Spotify Client ID from the Spotify Developer Dashboard
const CLIENT_ID = "80146fecc5c5415d83010f6bd87f0039";

// The redirect URI will be handled by expo-auth-session
const REDIRECT_URI = "spotify://auth";

const ENV: EnvConfig = {
  CLIENT_ID: CLIENT_ID,
  SCOPES: ["user-read-email", "user-read-private"],
  REDIRECT_URI: REDIRECT_URI,
  SPOTIFY_API: {
    DISCOVERY: {
      authorizationEndpoint: "https://accounts.spotify.com/authorize",
      tokenEndpoint: "https://accounts.spotify.com/api/token",
    },
  },
};

const getEnv = (): EnvConfig => ENV;
export default getEnv;
