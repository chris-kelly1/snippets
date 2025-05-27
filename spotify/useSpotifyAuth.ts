import {
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

  const { CLIENT_ID, SCOPES, REDIRECT_URI, SPOTIFY_API } = getEnv();

  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.Token,
      clientId: CLIENT_ID,
      scopes: SCOPES,
      usePKCE: false,
      redirectUri: makeRedirectUri({
        scheme: "spotify",
        path: "auth",
      }),
    },
    SPOTIFY_API.DISCOVERY
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { access_token } = response.params;
      setToken(access_token);
    } else if (response?.type === "error") {
      setError(new Error(response.error?.message || "Authentication failed"));
    }
  }, [response]);

  const login = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await promptAsync();
    } catch (err) {
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
