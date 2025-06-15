import { NextResponse } from "next/server";
import {
  getSpotifyAccessToken,
  fetchSpotifyTracks,
  fetchArtistMetadata,
} from "@/utils/spotify";

type TrackMetadata = {
  id: string;
  title: string;
  artist: string;
  genre: string;
};

type UserPreferences = {
  preferredGenres: string[];
  mood?: string;
  currentTrack?: string;
};

type Recommendation = {
  track: TrackMetadata;
  score: number;
};

function scoreTrack(track: TrackMetadata, prefs: UserPreferences): number {
  let score = 0;

  // Score based on preferred genres
  if (prefs.preferredGenres?.includes(track.genre)) {
    score += 3;
  }

  // Score based on current track similarity (e.g., title similarity)
  if (
    prefs.currentTrack &&
    track.title.toLowerCase().includes(prefs.currentTrack.toLowerCase())
  ) {
    score += 5;
  }

  return score;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { preferences }: { preferences?: UserPreferences } = body;

  if (!preferences || !Array.isArray(preferences.preferredGenres)) {
    return NextResponse.json(
      { message: "Invalid preferences provided" },
      { status: 400 }
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  try {
    const accessToken = await getSpotifyAccessToken(clientId, clientSecret);

    let tracks = [];
    if (preferences.currentTrack) {
      // Fetch tracks related to the current listening track
      tracks = await fetchSpotifyTracks(accessToken, preferences.currentTrack);
    } else {
      // Fetch tracks based on the preferred genre
      tracks = await fetchSpotifyTracks(
        accessToken,
        preferences.preferredGenres[0]
      );
    }

    const recommendations = await Promise.all(
      tracks.map(async (track) => {
        const artistMetadata = await fetchArtistMetadata(
          accessToken,
          track.artists[0]?.id
        );

        const trackMetadata: TrackMetadata = {
          id: track.id,
          title: track.name,
          artist: track.artists[0]?.name || "Unknown Artist",
          genre: artistMetadata?.genres?.[0] || "Unknown Genre", // Fetch genre from artist metadata
        };

        const score = scoreTrack(trackMetadata, preferences);

        return {
          track: trackMetadata,
          score,
        };
      })
    );

    return NextResponse.json({ recommendations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching Spotify data:", error);
    return NextResponse.json(
      { message: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
