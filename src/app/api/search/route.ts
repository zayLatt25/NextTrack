import { NextResponse } from "next/server";
import { getSpotifyAccessToken, fetchSpotifyTracks } from "@/utils/spotify";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { message: "Search query is required" },
        { status: 400 }
      );
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID!;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { message: "Spotify credentials not configured" },
        { status: 500 }
      );
    }

    const accessToken = await getSpotifyAccessToken(clientId, clientSecret);
    const tracks = await fetchSpotifyTracks(accessToken, query);

    // Format tracks for frontend
    const formattedTracks = tracks.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists,
      album: track.album,
      popularity: track.popularity,
      preview_url: track.preview_url,
      external_urls: track.external_urls
    }));

    return NextResponse.json(
      { 
        tracks: formattedTracks,
        query: query,
        total: formattedTracks.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error searching tracks:", error);
    return NextResponse.json(
      { message: "Failed to search tracks" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Spotify Search API",
    usage: "Send POST request with { query: 'search term' } to search for tracks"
  });
}
