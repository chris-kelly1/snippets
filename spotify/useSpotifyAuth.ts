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

interface UseSpotifyAuthReturn {
  token: string | null;
  isLoading: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => void;
}

const useSpotifyAuth = (): UseSpotifyAuthReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  // Debug information
  console.log("Auth Configuration:", {
    clientId: CLIENT_ID,
    redirectUri,
    scopes: SCOPES,
    scheme,
    isDevelopment: __DEV__,
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

  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      exchangeCodeAsync(
        {
          code,
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          redirectUri,
        },
        SPOTIFY_API.DISCOVERY
      )
        .then((tokenResponse) => {
          setToken(tokenResponse.accessToken);
        })
        .catch((err) => {
          setError(
            err instanceof Error ? err : new Error("Token exchange failed")
          );
        });
    } else if (response?.type === "error") {
      console.error("Auth Error:", response.error);
      setError(new Error(response.error?.message || "Authentication failed"));
    } else if (response?.type === "cancel") {
      console.log("Auth Cancelled");
      setError(new Error("Authentication was cancelled"));
    }
  }, [response]);

  const login = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Starting login process...");
      await promptAsync();
    } catch (err) {
      console.error("Login Error:", err);
      setError(err instanceof Error ? err : new Error("Authentication failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setToken(null);
    setError(null);
  };

  return {
    token,
    isLoading,
    error,
    login,
    logout,
  };
};

export default useSpotifyAuth;
