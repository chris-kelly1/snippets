import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    exchangeCodeAsync,
    ResponseType,
    useAuthRequest
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import getEnv from "./env";

// needed so that the browser closes the modal after auth token
WebBrowser.maybeCompleteAuthSession();

interface AuthResponse {
  type: string;
  params: {
    access_token: string;
    expires_in: string;
    refresh_token: string;
  };
}

interface SpotifyUser {
  display_name: string;
  email: string;
  id?: string;
  profile_image?: string;
  voice_model_id?: string | null;
  voice_sample_url?: string | null;
  ai_voice_enabled?: boolean | null;
}

interface UseSpotifyAuthReturn {
  token: string | null;
  user: SpotifyUser | null;
  isLoading: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const STORAGE_KEYS = {
  TOKEN: "@spotify_token",
  USER: "@spotify_user",
};

const useSpotifyAuth = (): UseSpotifyAuthReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const { CLIENT_ID, CLIENT_SECRET, SCOPES, SPOTIFY_API } = getEnv();

  // Use a simple, consistent redirect URI
  const redirectUri = "snippets://auth";

  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.Code,
      clientId: CLIENT_ID,
      scopes: SCOPES,
      usePKCE: true,
      redirectUri,
      extraParams: {
        show_dialog: "true",
      },
    },
    SPOTIFY_API.DISCOVERY
  );

  const handleAuthenticationResponse = async (authResponse: any) => {
    if (authResponse?.type === "success") {
      const { code } = authResponse.params;

      try {
        const tokenResponse = await exchangeCodeAsync(
          {
            code,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            redirectUri,
            extraParams: {
              code_verifier: request?.codeVerifier || "",
            },
          },
          SPOTIFY_API.DISCOVERY
        );

        const accessToken = (tokenResponse as any).accessToken || (tokenResponse as any).access_token;
        
        if (!accessToken) {
          throw new Error("No access token received");
        }

        const userResponse = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        const spotifyUser = {
          display_name: userData.display_name,
          email: userData.email,
          id: userData.id,
          profile_image: userData.images?.[0]?.url,
          voice_model_id: userData.voice_model_id,
          voice_sample_url: userData.voice_sample_url,
          ai_voice_enabled: userData.ai_voice_enabled,
        };

        await supabase.from("users").upsert({
          id: spotifyUser.id,
          display_name: spotifyUser.display_name,
          email: spotifyUser.email,
          profile_image: spotifyUser.profile_image,
          voice_model_id: spotifyUser.voice_model_id,
          voice_sample_url: spotifyUser.voice_sample_url,
          ai_voice_enabled: spotifyUser.ai_voice_enabled,
        });

        setToken(accessToken);
        setUser(spotifyUser);

        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.TOKEN, accessToken),
          AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(spotifyUser)),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Authentication failed"));
      }
    } else if (authResponse?.type === "error") {
      setError(new Error(authResponse.error?.message || "Authentication failed"));
    } else if (authResponse?.type === "cancel") {
      setError(new Error("Authentication cancelled"));
    }
  };

  const validateToken = async (tokenToValidate: string): Promise<boolean> => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${tokenToValidate}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const loadPersistedAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
        ]);

        if (storedToken && storedUser) {
          const isValidToken = await validateToken(storedToken);
          
          if (isValidToken) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            await Promise.all([
              AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
              AsyncStorage.removeItem(STORAGE_KEYS.USER),
            ]);
          }
        }
      } catch (err) {
        console.error("Error loading auth:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersistedAuth();
  }, []);

  // Helper function to fetch user from Supabase
  const fetchUserFromSupabase = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user from Supabase:", error);
      return null;
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return; // Only refresh if user ID is available
    setIsLoading(true);
    try {
      const updatedUser = await fetchUserFromSupabase(user.id);
      if (updatedUser) {
        console.log("Fetched updated user data:", updatedUser);
        setUser(updatedUser);
        // Optionally update AsyncStorage as well
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(updatedUser)
        );
      }
    } catch (err) {
      console.error("Error refreshing user data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await promptAsync();
      await handleAuthenticationResponse(result);
    } catch (err) {
      console.error("Login Error:", err);
      setError(err instanceof Error ? err : new Error("Authentication failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear local storage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);

      // Clear state
      setToken(null);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  return {
    token,
    user,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
  };
};

export default useSpotifyAuth;
