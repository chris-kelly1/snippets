import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  exchangeCodeAsync,
  makeRedirectUri,
  ResponseType,
  useAuthRequest,
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

  // Get the app's scheme from app.json
  const scheme = "snippets";

  // Generate the appropriate redirect URI based on the environment
  const redirectUri = makeRedirectUri({
    scheme,
    path: "auth",
    preferLocalhost: true,
    native: `${scheme}://auth`,
  });

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
    console.log("🚀 handleAuthenticationResponse called with:", authResponse?.type);
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

        console.log("Token response from Spotify exchangeCodeAsync:", tokenResponse);

        // Retrieve access token property – the key differs depending on expo-auth-session version
        const accessToken =
          (tokenResponse as any).accessToken ??
          (tokenResponse as any).access_token ??
          (tokenResponse as any).token ??
          null;

        console.log("Resolved accessToken:", accessToken);

        if (!accessToken) {
          throw new Error("Unable to resolve access token from Spotify response");
        }

        // Fetch user profile data first
        try {
          console.log("Fetching https://api.spotify.com/v1/me with token header...");
          console.log("Authorization header:", `Bearer ${accessToken.substring(0, 20)}...`);

          // First, try a simple endpoint to test token validity
          console.log("Testing token with simpler endpoint first...");
          const testResponse = await fetch("https://api.spotify.com/v1/markets", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          console.log("Markets endpoint response status:", testResponse.status);
          if (!testResponse.ok) {
            const errorText = await testResponse.text();
            console.log("Markets endpoint error body:", errorText);
          }

          const userResponse = await fetch("https://api.spotify.com/v1/me", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!userResponse.ok) {
            console.error("/me request failed", userResponse.status, userResponse.statusText);
            const errorBody = await userResponse.text();
            console.error("Error response body:", errorBody);
            throw new Error(
              `Failed to fetch user data: ${userResponse.status} ${userResponse.statusText}`
            );
          }

          const userData = await userResponse.json();
          const spotifyUser = {
            display_name: userData.display_name,
            email: userData.email,
            id: userData.id,
            profile_image:
              userData.images?.length > 0 ? userData.images[0].url : undefined,
          };

          // Insert or update user in Supabase
          const { error: supabaseError } = await supabase.from("users").upsert({
            id: spotifyUser.id,
            display_name: spotifyUser.display_name,
            email: spotifyUser.email,
            profile_image: spotifyUser.profile_image,
          });

          if (supabaseError) {
            console.error("Error saving user to Supabase:", supabaseError);
          }

          // Set both token and user data together
          setToken(accessToken);
          setUser(spotifyUser);

          // Store both token and user data in AsyncStorage
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.TOKEN, accessToken),
            AsyncStorage.setItem(
              STORAGE_KEYS.USER,
              JSON.stringify(spotifyUser)
            ),
          ]);
        } catch (err) {
          console.error("Error in user data fetch:", err);
          setError(
            err instanceof Error ? err : new Error("Failed to fetch user data")
          );
        }
      } catch (err) {
        console.error("Token exchange failed:", err);
        setError(
          err instanceof Error ? err : new Error("Token exchange failed")
        );
      }
    } else if (authResponse?.type === "error") {
      console.error("Auth Error:", {
        error: authResponse.error,
        errorCode: authResponse.error?.code,
        errorMessage: authResponse.error?.message,
      });
      setError(
        new Error(authResponse.error?.message || "Authentication failed")
      );
    } else if (authResponse?.type === "cancel") {
      console.log("Authentication was cancelled.");
      setToken(null);
      setUser(null);
      setError(new Error("Authentication was cancelled"));
    }
  };

  // Validate token by testing it against Spotify API
  const validateToken = async (tokenToValidate: string): Promise<boolean> => {
    console.log("🔍 validateToken called with token:", tokenToValidate?.substring(0, 20) + "...");
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${tokenToValidate}`,
        },
      });
      console.log("🔍 validateToken response status:", response.status);
      return response.ok;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  };

  // Load persisted auth state on mount
  useEffect(() => {
    const loadPersistedAuth = async () => {
      console.log("📱 loadPersistedAuth starting...");
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
        ]);

        console.log("Stored auth data:", {
          hasToken: !!storedToken,
          hasUser: !!storedUser,
          userData: storedUser ? JSON.parse(storedUser) : null,
        });

        if (storedToken && storedUser) {
          console.log("📱 Found stored credentials, validating token...");
          // Validate the stored token
          const isValidToken = await validateToken(storedToken);
          
          if (isValidToken) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            console.log("✅ Stored Spotify token is valid");
          } else {
            console.log("❌ Stored Spotify token is invalid/expired, clearing auth");
            // Clear invalid token
            await Promise.all([
              AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
              AsyncStorage.removeItem(STORAGE_KEYS.USER),
            ]);
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Error loading persisted auth:", err);
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
