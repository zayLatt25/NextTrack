import { NextResponse } from "next/server";
import {
  getSpotifyAccessToken,
  fetchSpotifyTracks,
  fetchArtistMetadata,
  fetchAudioFeatures,
} from "@/utils/spotify";

type AudioFeatures = {
  valence: number; // 0.0 to 1.0 - musical positivity
  energy: number; // 0.0 to 1.0 - intensity and power
  danceability: number; // 0.0 to 1.0 - how suitable for dancing
  acousticness: number; // 0.0 to 1.0 - acoustic vs electronic
  instrumentalness: number; // 0.0 to 1.0 - instrumental vs vocal
  liveness: number; // 0.0 to 1.0 - live performance vs studio
  speechiness: number; // 0.0 to 1.0 - spoken words vs music
  tempo: number; // BPM
  loudness: number; // dB
};

type TrackMetadata = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  audioFeatures?: AudioFeatures;
};

type UserPreferences = {
  preferredGenres: string[];
  mood?: string;
  currentTrack?: string;
};


// Mood to audio features mapping
function getMoodAudioFeatures(mood: string): Partial<AudioFeatures> {
  const moodMappings: Record<string, Partial<AudioFeatures>> = {
    happy: {
      valence: 0.8, // High positivity
      energy: 0.7, // Moderate to high energy
      danceability: 0.8, // Very danceable
      acousticness: 0.3, // More electronic
    },
    sad: {
      valence: 0.2, // Low positivity
      energy: 0.3, // Low energy
      danceability: 0.3, // Less danceable
      acousticness: 0.7, // More acoustic
    },
    energetic: {
      valence: 0.6, // Moderate positivity
      energy: 0.9, // Very high energy
      danceability: 0.8, // Very danceable
      acousticness: 0.2, // More electronic
    },
    calm: {
      valence: 0.5, // Neutral positivity
      energy: 0.2, // Low energy
      danceability: 0.4, // Less danceable
      acousticness: 0.8, // Very acoustic
    },
  };

  return moodMappings[mood.toLowerCase()] || {};
}

// Calculate title similarity using Levenshtein distance
function calculateTitleSimilarity(title1: string, title2: string): number {
  const s1 = title1.toLowerCase().trim();
  const s2 = title2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0) return s2.length === 0 ? 1.0 : 0.0;
  if (s2.length === 0) return 0.0;

  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - (matrix[s2.length][s1.length] / maxLength);
}

// Calculate audio features similarity
function calculateAudioFeaturesSimilarity(
  trackFeatures: AudioFeatures,
  moodFeatures: Partial<AudioFeatures>
): number {
  let similarity = 0;
  let featureCount = 0;

  const featuresToCompare: (keyof AudioFeatures)[] = [
    'valence',
    'energy',
    'danceability',
    'acousticness',
  ];

  for (const feature of featuresToCompare) {
    if (moodFeatures[feature] !== undefined) {
      const trackValue = trackFeatures[feature];
      const moodValue = moodFeatures[feature] as number;
      const diff = Math.abs(trackValue - moodValue);
      similarity += 1 - diff; // Higher similarity for smaller differences
      featureCount++;
    }
  }

  return featureCount > 0 ? similarity / featureCount : 0;
}

function scoreTrack(track: TrackMetadata, prefs: UserPreferences): number {
  let score = 0;

  // 1. Genre match scoring (weight 3)
  if (prefs.preferredGenres?.includes(track.genre)) {
    score += 3;
  }

  // 2. Title similarity scoring (weight 2)
  if (prefs.currentTrack) {
    const titleSimilarity = calculateTitleSimilarity(track.title, prefs.currentTrack);
    score += titleSimilarity * 2;
  }

  // 3. Mood mapping to audio features scoring (weight 4)
  if (prefs.mood && track.audioFeatures) {
    const moodFeatures = getMoodAudioFeatures(prefs.mood);
    const audioSimilarity = calculateAudioFeaturesSimilarity(track.audioFeatures, moodFeatures);
    score += audioSimilarity * 4;
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
        try {
          const [artistMetadata, audioFeatures] = await Promise.all([
            fetchArtistMetadata(accessToken, track.artists[0]?.id),
            fetchAudioFeatures(accessToken, track.id).catch((error) => {
              console.warn(`Audio features unavailable for ${track.name}: ${error.message}`);
              return null; // Gracefully handle audio features API failures
            }),
          ]);

          const trackMetadata: TrackMetadata = {
            id: track.id,
            title: track.name,
            artist: track.artists[0]?.name || "Unknown Artist",
            genre: artistMetadata?.genres?.[0] || "Unknown Genre", // Fetch genre from artist metadata
            audioFeatures: audioFeatures ? {
              valence: audioFeatures.valence,
              energy: audioFeatures.energy,
              danceability: audioFeatures.danceability,
              acousticness: audioFeatures.acousticness,
              instrumentalness: audioFeatures.instrumentalness,
              liveness: audioFeatures.liveness,
              speechiness: audioFeatures.speechiness,
              tempo: audioFeatures.tempo,
              loudness: audioFeatures.loudness,
            } : undefined,
          };

          const score = scoreTrack(trackMetadata, preferences);

          return {
            track: trackMetadata,
            score,
          };
        } catch (error) {
          console.error(`Error processing track ${track.name}:`, error);
          // Return a basic track metadata even if there's an error
          const trackMetadata: TrackMetadata = {
            id: track.id,
            title: track.name,
            artist: track.artists[0]?.name || "Unknown Artist",
            genre: "Unknown Genre",
            audioFeatures: undefined,
          };

          const score = scoreTrack(trackMetadata, preferences);

          return {
            track: trackMetadata,
            score,
          };
        }
      })
    );

    // Remove duplicates based on song name, artist, and genre
    const uniqueRecommendations = recommendations.filter(
      (rec, index, self) =>
        index ===
        self.findIndex(
          (r) =>
            r.track.title === rec.track.title &&
            r.track.artist === rec.track.artist &&
            r.track.genre === rec.track.genre
        )
    );

    // Sort recommendations by score in descending order
    uniqueRecommendations.sort((a, b) => b.score - a.score);

    return NextResponse.json(
      { recommendations: uniqueRecommendations },
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
