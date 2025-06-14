const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

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
): Promise<any[]> {
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

  const data = await response.json();
  return data.tracks.items;
}
