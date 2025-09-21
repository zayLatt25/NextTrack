const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

// Spotify API response types
interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: { 
    id: string; 
    name: string; 
    images: Array<{ url: string; width: number; height: number }> 
  };
  popularity: number;
  external_urls: { spotify: string };
  preview_url: string | null;
  duration_ms: number;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
  external_urls: { spotify: string };
  images: Array<{ url: string; width: number; height: number }>;
}

interface SpotifyAudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms: number;
  time_signature: number;
}

export async function getSpotifyAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function fetchSpotifyTracks(
  accessToken: string,
  query: string
): Promise<SpotifyTrack[]> {
  const queryParams = new URLSearchParams({
    q: query,
    type: "track",
    limit: "20",
  });

  const response = await fetch(
    `${SPOTIFY_API_BASE_URL}/search?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tracks: ${response.statusText}`);
  }

  const data: SpotifySearchResponse = await response.json();
  return data.tracks.items;
}

export async function fetchArtistMetadata(
  accessToken: string,
  artistId: string
): Promise<SpotifyArtist | null> {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/artists/${artistId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch artist metadata:", response.statusText);
    return null;
  }

  const data: SpotifyArtist = await response.json();
  return data; // Return artist metadata, including genres
}

export async function fetchAudioFeatures(
  accessToken: string,
  trackId: string
): Promise<SpotifyAudioFeatures | null> {
  console.log("Fetching audio features for track ID:", trackId);

  const response = await fetch(
    `${SPOTIFY_API_BASE_URL}/audio-features/${trackId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    console.error("Failed to fetch audio features:", response.statusText);
    console.error("Response status:", response.status);
    console.error("Response body:", await response.text());
    return null;
  }

  const data: SpotifyAudioFeatures = await response.json();
  return data; // Return audio features, including valence and energy
}
