import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  exchangeCodeAsync,
  makeRedirectUri,
  ResponseType,
  useAuthRequest,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
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
}

interface UseSpotifyAuthReturn {
  token: string | null;
  user: SpotifyUser | null;
  isLoading: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => void;
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

        // Fetch user profile data first
        try {
          const userResponse = await fetch("https://api.spotify.com/v1/me", {
            headers: {
              Authorization: `Bearer ${tokenResponse.accessToken}`,
            },
          });

          if (!userResponse.ok) {
            throw new Error(
              `Failed to fetch user data: ${userResponse.status} ${userResponse.statusText}`
            );
          }

          const userData = await userResponse.json();
          const spotifyUser = {
            display_name: userData.display_name,
            email: userData.email,
            id: userData.id,
          };

          // Set both token and user data together
          setToken(tokenResponse.accessToken);
          setUser(spotifyUser);

          // Store both token and user data in AsyncStorage
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.TOKEN, tokenResponse.accessToken),
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
      setError(new Error("Authentication was cancelled"));
    }
  };

  // Load persisted auth state on mount
  useEffect(() => {
    const loadPersistedAuth = async () => {
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
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Error loading persisted auth:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersistedAuth();
  }, []);

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
  };
};

export default useSpotifyAuth;
