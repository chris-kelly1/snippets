import axios from "axios";
import getEnv from "./env";

interface Artist {
  name: string;
}

interface Track {
  name: string;
  artists: Artist[];
  album?: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  external_urls?: {
    spotify?: string;
  };
  preview_url?: string;
}

interface FormattedTrack {
  songTitle: string;
  songArtists: Artist[];
  albumName?: string;
  imageUrl?: string;
  duration: number;
  externalUrl?: string;
  previewUrl?: string;
}

interface SpotifySearchResponse {
  tracks: {
    items: Track[];
  };
}

const { SPOTIFY_API } = getEnv();

const ERROR_ALERT = new Error(
  "Oh no! Something went wrong; probably a malformed request or a network error.\nCheck console for more details."
);

/* Helper function to format API response data into a structured object. */
const formatter = (data: Track[]): FormattedTrack[] =>
  data.map((val) => {
    const artists = val.artists?.map((artist) => ({ name: artist.name }));
    return {
      songTitle: val.name,
      songArtists: artists,
      albumName: val.album?.name,
      imageUrl: val.album?.images[0]?.url ?? undefined,
      duration: val.duration_ms,
      externalUrl: val.external_urls?.spotify ?? undefined,
      previewUrl: val.preview_url ?? undefined,
    };
  });

/* Helper function to fetch data from a given URL with the access token. */
const fetcher = async <T>(url: string, token: string) => {
  try {
    const response = await axios<T>({
      url,
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const searchSongs = async (
  query: string,
  token: string
): Promise<FormattedTrack[]> => {
  try {
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      query
    )}&type=track&limit=20`;
    const res = await fetcher<SpotifySearchResponse>(searchUrl, token);
    return formatter(res.data.tracks.items);
  } catch (e) {
    console.error(e);
    alert(ERROR_ALERT);
    return [];
  }
};
