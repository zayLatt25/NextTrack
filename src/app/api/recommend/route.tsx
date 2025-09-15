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
  popularity?: number;
  releaseYear?: number;
  album?: string;
};

type SpotifyTrack = {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  popularity: number;
  album: {
    name: string;
    release_date: string;
  };
};

type UserPreferences = {
  mood?: string;
};

type SelectedTrack = {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string };
  popularity: number;
};

type RecommendationRequest = {
  selectedTracks?: SelectedTrack[];
  preferences: UserPreferences;
  context?: {
    timeOfDay?: "morning" | "afternoon" | "evening" | "night";
    activity?: "workout" | "study" | "party" | "relax";
  };
};

// ---------------- Mood Mapping ----------------
function getMoodPreferences(mood: string): {
  preferredGenres: string[];
  popularityRange: [number, number];
} {
  const moodMappings: Record<
    string,
    { preferredGenres: string[]; popularityRange: [number, number] }
  > = {
    happy: {
      preferredGenres: ["pop", "dance", "electronic", "indie-pop"],
      popularityRange: [60, 100],
    },
    sad: {
      preferredGenres: ["indie", "folk", "acoustic", "alternative"],
      popularityRange: [20, 80],
    },
    energetic: {
      preferredGenres: ["rock", "electronic", "dance", "hip-hop", "metal"],
      popularityRange: [40, 100],
    },
    calm: {
      preferredGenres: ["ambient", "classical", "jazz", "acoustic", "chill"],
      popularityRange: [10, 70],
    },
    romantic: {
      preferredGenres: ["r&b", "soul", "jazz", "acoustic", "indie", "pop", "folk"],
      popularityRange: [30, 90],
    },
  };

  return (
    moodMappings[mood.toLowerCase()] || {
      preferredGenres: [],
      popularityRange: [0, 100],
    }
  );
}

// ---------------- Similarity + Scoring ----------------
function calculateMoodSimilarity(
  track: TrackMetadata,
  moodPreferences: { preferredGenres: string[]; popularityRange: [number, number] }
): number {
  let similarity = 0;

  // Genre match (weight 0.6)
  if (moodPreferences.preferredGenres.includes(track.genre.toLowerCase())) {
    similarity += 0.6;
  }

  // Popularity match (weight 0.4)
  if (track.popularity !== undefined) {
    const [minPop, maxPop] = moodPreferences.popularityRange;
    if (track.popularity >= minPop && track.popularity <= maxPop) {
      similarity += 0.4;
    } else {
      const distance = Math.min(
        Math.abs(track.popularity - minPop),
        Math.abs(track.popularity - maxPop)
      );
      similarity += Math.max(0, 0.4 - distance / 50);
    }
  }

  return similarity;
}

function scoreTrack(
  track: TrackMetadata,
  prefs: UserPreferences,
  selectedTracks?: SelectedTrack[],
  extractedGenres?: string[],
  context?: { timeOfDay?: string; activity?: string }
): number {
  let score = 0;

  // 1. Genre match scoring (weight 3) - using extracted genres
  if (extractedGenres && extractedGenres.includes(track.genre)) {
    score += 3;
  }

  // 2. Selected tracks similarity scoring (CAPPED at 2)
  if (selectedTracks && selectedTracks.length > 0) {
    const trackSimilarity = calculateTrackSimilarity(track, selectedTracks);
    score += Math.min(trackSimilarity * 2, 2); // cap contribution
  }

  // 3. Mood-based metadata scoring (weight 3 + override)
  if (prefs.mood) {
    const moodPreferences = getMoodPreferences(prefs.mood);
    const moodSimilarity = calculateMoodSimilarity(track, moodPreferences);

    if (moodSimilarity < 0.2) {
      score -= 1.5; // penalty for failing mood
    } else {
      score += moodSimilarity * 3;
    }
  }

  // 4. Context-based scoring (weight 2)
  if (context) {
    const contextScore = calculateContextScore(track, context);
    score += contextScore * 2;
  }

  // 5. Popularity bonus (weight 1)
  if (track.popularity && track.popularity > 70) {
    score += 1;
  }

  return Math.round(score * 100) / 100; // Round to 2 decimals
}


function calculateTrackSimilarity(
  track: TrackMetadata,
  selectedTracks: SelectedTrack[]
): number {
  let maxSimilarity = 0;

  for (const selectedTrack of selectedTracks) {
    let similarity = 0;

    // Artist similarity (weight 0.5)
    if (
      track.artist
        .toLowerCase()
        .includes(selectedTrack.artists[0]?.name.toLowerCase()) ||
      selectedTrack.artists[0]?.name
        .toLowerCase()
        .includes(track.artist.toLowerCase())
    ) {
      similarity += 0.5;
    }

    // Title similarity (weight 0.3)
    const titleSimilarity = calculateTitleSimilarity(
      track.title,
      selectedTrack.name
    );
    similarity += titleSimilarity * 0.3;

    // Popularity similarity (weight 0.2)
    if (track.popularity && selectedTrack.popularity) {
      const popularityDiff = Math.abs(
        track.popularity - selectedTrack.popularity
      );
      const popularitySimilarity = Math.max(0, 1 - popularityDiff / 100);
      similarity += popularitySimilarity * 0.2;
    }

    maxSimilarity = Math.max(maxSimilarity, similarity);
  }

  return maxSimilarity;
}

// ---- Remix/cover penalty added here ----
function calculateTitleSimilarity(title1: string, title2: string): number {
  const s1 = title1.toLowerCase().trim();
  const s2 = title2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter((word) => words2.includes(word));
  let base = commonWords.length / Math.max(words1.length, words2.length);

  const remixKeywords = [
    "remix",
    "live",
    "cover",
    "version",
    "piano",
    "acoustic",
  ];
  if (
    remixKeywords.some(
      (k) => s1.includes(k.toLowerCase()) || s2.includes(k.toLowerCase())
    )
  ) {
    base *= 0.7;
  }

  return base;
}

// ---------------- Context Scoring ----------------
function calculateContextScore(
  track: TrackMetadata,
  context: { timeOfDay?: string; activity?: string }
): number {
  let score = 0;

  if (context.timeOfDay) {
    score += getTimeOfDayScore(track, context.timeOfDay) * 0.6;
  }

  if (context.activity) {
    score += getActivityScore(track, context.activity) * 0.4;
  }

  return Math.min(score, 1.0);
}

function getTimeOfDayScore(track: TrackMetadata, timeOfDay: string): number {
  const genre = track.genre.toLowerCase();
  const popularity = track.popularity || 50;

  switch (timeOfDay) {
    case "morning":
      if (["pop", "dance", "electronic"].includes(genre) && popularity > 60)
        return 1.0;
      if (["rock", "indie-pop"].includes(genre) && popularity > 40) return 0.8;
      if (["jazz", "acoustic"].includes(genre)) return 0.6;
      return 0.3;

    case "afternoon":
      if (["pop", "indie", "alternative"].includes(genre)) return 0.9;
      if (["rock", "electronic"].includes(genre) && popularity > 30) return 0.7;
      if (["jazz", "acoustic", "folk"].includes(genre)) return 0.8;
      return 0.5;

    case "evening":
      if (["indie", "alternative", "acoustic"].includes(genre)) return 1.0;
      if (["pop", "electronic"].includes(genre) && popularity > 40) return 0.8;
      if (["jazz", "ambient"].includes(genre)) return 0.9;
      if (["rock"].includes(genre)) return 0.6;
      return 0.4;

    case "night":
      if (["ambient", "chill", "electronic"].includes(genre)) return 1.0;
      if (["jazz", "acoustic", "indie"].includes(genre)) return 0.9;
      if (["dance", "electronic"].includes(genre) && popularity > 70)
        return 0.8;
      if (["rock", "metal"].includes(genre)) return 0.5;
      return 0.3;

    default:
      return 0.5;
  }
}

function getActivityScore(track: TrackMetadata, activity: string): number {
  const genre = track.genre.toLowerCase();
  const popularity = track.popularity || 50;

  switch (activity) {
    case "workout":
      if (["rock", "electronic", "dance", "hip-hop", "metal"].includes(genre))
        return 1.0;
      if (["pop"].includes(genre) && popularity > 60) return 0.8;
      if (["indie", "alternative"].includes(genre) && popularity > 40)
        return 0.6;
      return 0.2;

    case "study":
      if (["ambient", "classical", "jazz", "acoustic"].includes(genre))
        return 1.0;
      if (["indie", "folk"].includes(genre)) return 0.8;
      if (["electronic"].includes(genre) && popularity < 50) return 0.6;
      if (["rock", "metal", "dance"].includes(genre)) return 0.2;
      return 0.4;

    case "party":
      if (["dance", "electronic", "pop"].includes(genre) && popularity > 60)
        return 1.0;
      if (["hip-hop", "rock"].includes(genre) && popularity > 50) return 0.8;
      if (["indie-pop"].includes(genre) && popularity > 40) return 0.7;
      if (["ambient", "classical", "acoustic"].includes(genre)) return 0.1;
      return 0.3;

    case "relax":
      if (["ambient", "classical", "jazz", "acoustic", "chill"].includes(genre))
        return 1.0;
      if (["indie", "folk"].includes(genre)) return 0.9;
      if (["electronic"].includes(genre) && popularity < 60) return 0.7;
      if (["rock", "metal", "dance"].includes(genre)) return 0.2;
      return 0.5;

    default:
      return 0.5;
  }
}

// ---------------- Genre Extraction ----------------
async function extractGenresFromTracks(
  accessToken: string,
  selectedTracks: SelectedTrack[]
): Promise<string[]> {
  const allGenres = new Set<string>();

  for (const track of selectedTracks) {
    try {
      const artistName = track.artists[0]?.name;
      if (artistName) {
        const artistSearchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            artistName
          )}&type=artist&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (artistSearchResponse.ok) {
          const artistSearchData = await artistSearchResponse.json();
          const artist = artistSearchData.artists?.items?.[0];

          if (artist?.id) {
            const artistMetadata = await fetchArtistMetadata(
              accessToken,
              artist.id
            );
            if (artistMetadata?.genres) {
              artistMetadata.genres.forEach((genre: string) =>
                allGenres.add(genre)
              );
            }
          }
        }
      }
    } catch (error) {
      console.warn(
        `Failed to extract genres for track ${track.name}:`,
        error
      );
    }
  }

  return Array.from(allGenres);
}

// ---------------- Main POST ----------------
export async function POST(req: Request) {
  const body = await req.json();
  const { selectedTracks, preferences, context }: RecommendationRequest = body;

  if (!selectedTracks || selectedTracks.length === 0) {
    return NextResponse.json(
      { message: "Selected tracks are required" },
      { status: 400 }
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  try {
    const accessToken = await getSpotifyAccessToken(clientId, clientSecret);

    // Extract genres from selected tracks
    const extractedGenres = await extractGenresFromTracks(
      accessToken,
      selectedTracks
    );

    let searchQueries: string[] = [];
    let allTracks: SpotifyTrack[] = [];

    // Create search queries based on selected tracks and extracted genres
    const trackQueries = selectedTracks.map(track =>
      `${track.name} ${track.artists[0]?.name}`
    ).slice(0, 3);

    const genreQueries = extractedGenres.slice(0, 3);

    // Add mood-preferred genre queries
    let moodGenreQueries: string[] = [];
    if (preferences.mood) {
      const moodPrefs = getMoodPreferences(preferences.mood);
      moodGenreQueries = moodPrefs.preferredGenres.slice(0, 2); // limit to 2
    }

    searchQueries = [...trackQueries, ...genreQueries, ...moodGenreQueries];

    // Fetch tracks for all queries
    const trackPromises = searchQueries.map(async (query) => {
      try {
        const tracks = await fetchSpotifyTracks(accessToken, query);
        return tracks;
      } catch (error) {
        console.warn(`Failed to fetch tracks for query "${query}":`, error);
        return [];
      }
    });

    const trackResults = await Promise.all(trackPromises);
    allTracks = trackResults.flat();

    // Deduplicate by ID
    const uniqueTracks = allTracks.filter(
      (track, index, self) =>
        index === self.findIndex((t) => t.id === track.id)
    );

    // Build recommendations
    const recommendations = await Promise.all(
      uniqueTracks.map(async (track) => {
        try {
          const artistMetadata = await fetchArtistMetadata(
            accessToken,
            track.artists[0]?.id
          );

          const trackMetadata: TrackMetadata = {
            id: track.id,
            title: track.name,
            artist: track.artists[0]?.name || "Unknown Artist",
            genre:
              artistMetadata?.genres?.[0] ||
              extractedGenres[0] ||
              "Unknown Genre",
            popularity: track.popularity,
            releaseYear: track.album?.release_date
              ? new Date(track.album.release_date).getFullYear()
              : undefined,
            album: track.album?.name,
          };

          const score = scoreTrack(
            trackMetadata,
            preferences,
            selectedTracks,
            extractedGenres,
            context
          );

          return { track: trackMetadata, score };
        } catch {
          const trackMetadata: TrackMetadata = {
            id: track.id,
            title: track.name,
            artist: track.artists[0]?.name || "Unknown Artist",
            genre: "Unknown Genre",
            popularity: track.popularity,
            releaseYear: track.album?.release_date
              ? new Date(track.album.release_date).getFullYear()
              : undefined,
            album: track.album?.name,
          };

          const score = scoreTrack(
            trackMetadata,
            preferences,
            selectedTracks,
            extractedGenres,
            context
          );

          return { track: trackMetadata, score };
        }
      })
    );

    // Deduplicate by title+artist+genre
    const uniqueRecommendations = recommendations.filter(
      (rec, index, self) =>
        index ===
        self.findIndex(
          (r) =>
            r.track.title.toLowerCase() === rec.track.title.toLowerCase() &&
            r.track.artist.toLowerCase() === rec.track.artist.toLowerCase()
        )
    );

    // Remove selected tracks
    const selectedTrackIds = new Set(selectedTracks.map((t) => t.id));
    const filteredRecommendations = uniqueRecommendations.filter(
      (rec) => !selectedTrackIds.has(rec.track.id)
    );

    filteredRecommendations.sort((a, b) => b.score - a.score);

    const evaluationMetrics = calculateEvaluationMetrics(
      filteredRecommendations
    );

    return NextResponse.json(
      {
        recommendations: filteredRecommendations,
        evaluationMetrics,
        searchStrategy: "track-based",
        searchQueries,
        totalTracksFound: uniqueTracks.length,
        selectedTracksCount: selectedTracks?.length || 0,
        extractedGenres,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching Spotify data:", error);
    return NextResponse.json(
      { message: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}

// ---------------- Evaluation Metrics ----------------
function calculateEvaluationMetrics(
  recommendations: { track: TrackMetadata }[]
): {
  genreCoherence: number;
  popularitySmoothness: number;
  genreConsistency: number;
} {
  if (recommendations.length < 2)
    return { genreCoherence: 1, popularitySmoothness: 1, genreConsistency: 1 };

  const genres = recommendations
    .map((r) => r.track.genre)
    .filter((g) => g !== "Unknown Genre");
  const popularities = recommendations
    .map((r) => r.track.popularity)
    .filter((p): p is number => p !== undefined);

  let genreCoherence = 0;
  let genreConsistency = 0;
  let popularitySmoothness = 0;

  if (genres.length > 0) {
    const total = genres.length;
    const unique = new Set(genres);
    const counts: Record<string, number> = {};
    genres.forEach((g) => (counts[g] = (counts[g] || 0) + 1));
    const dominantCount = Math.max(...Object.values(counts));

    genreCoherence = dominantCount / total; // dominant genre ratio
    genreConsistency = unique.size / total; // diversity ratio
  }

  if (popularities.length > 1) {
    let totalDiff = 0;
    for (let i = 1; i < popularities.length; i++) {
      totalDiff += Math.abs(popularities[i] - popularities[i - 1]);
    }
    const avgDiff = totalDiff / (popularities.length - 1);
    popularitySmoothness = Math.max(0, 1 - avgDiff / 100);
  }

  return {
    genreCoherence: Math.round(genreCoherence * 100) / 100,
    popularitySmoothness: Math.round(popularitySmoothness * 100) / 100,
    genreConsistency: Math.round(genreConsistency * 100) / 100,
  };
}
