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

type RecommendationRequest = {
  listeningHistory: string[]; // Array of track IDs
  preferences: UserPreferences;
  context?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    activity?: 'workout' | 'study' | 'party' | 'relax';
  };
};

type SequencePattern = {
  genreTransitions: Record<string, number>;
  tempoProgression: number[];
  moodFlow: number[];
  artistDiversity: number;
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

// Calculate audio features similarity using cosine similarity
function calculateAudioFeaturesSimilarity(
  trackFeatures: AudioFeatures,
  moodFeatures: Partial<AudioFeatures>
): number {
  const featuresToCompare: (keyof AudioFeatures)[] = [
    'valence',
    'energy',
    'danceability',
    'acousticness',
  ];

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const feature of featuresToCompare) {
    if (moodFeatures[feature] !== undefined) {
      const a = trackFeatures[feature];
      const b = moodFeatures[feature] as number;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Sequence analysis functions
function calculateGenreTransitions(tracks: TrackMetadata[]): Record<string, number> {
  const transitions: Record<string, number> = {};
  
  for (let i = 0; i < tracks.length - 1; i++) {
    const currentGenre = tracks[i].genre;
    const nextGenre = tracks[i + 1].genre;
    const transition = `${currentGenre}->${nextGenre}`;
    transitions[transition] = (transitions[transition] || 0) + 1;
  }
  
  return transitions;
}

function calculateTempoProgression(tracks: TrackMetadata[]): number[] {
  return tracks
    .map(track => track.audioFeatures?.tempo || 120)
    .filter((tempo, index, arr) => index === 0 || Math.abs(tempo - arr[index - 1]) > 5);
}

function calculateMoodFlow(tracks: TrackMetadata[]): number[] {
  return tracks
    .map(track => track.audioFeatures?.valence || 0.5)
    .filter((valence, index, arr) => index === 0 || Math.abs(valence - arr[index - 1]) > 0.1);
}

function calculateArtistDiversity(tracks: TrackMetadata[]): number {
  const uniqueArtists = new Set(tracks.map(track => track.artist));
  return uniqueArtists.size / tracks.length;
}

function predictNextGenre(transitions: Record<string, number>, currentGenre: string): string {
  const possibleTransitions = Object.keys(transitions)
    .filter(t => t.startsWith(`${currentGenre}->`))
    .sort((a, b) => transitions[b] - transitions[a]);
  
  return possibleTransitions[0]?.split('->')[1] || currentGenre;
}

function isGoodTempoTransition(
  currentTempo: number | undefined, 
  nextTempo: number | undefined, 
  progression: number[]
): boolean {
  if (!currentTempo || !nextTempo) return true;
  
  const avgProgression = progression.length > 1 
    ? progression.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, progression.length)
    : currentTempo;
  
  const tempoDiff = Math.abs(nextTempo - currentTempo);
  const expectedDiff = Math.abs(currentTempo - avgProgression);
  
  return tempoDiff <= expectedDiff * 1.5; // Allow some variation
}

function isGoodMoodTransition(
  currentFeatures: AudioFeatures | undefined,
  nextFeatures: AudioFeatures | undefined,
  moodFlow: number[]
): boolean {
  if (!currentFeatures || !nextFeatures) return true;
  
  const currentValence = currentFeatures.valence;
  const nextValence = nextFeatures.valence;
  
  if (moodFlow.length < 2) return true;
  
  const recentMoodTrend = moodFlow.slice(-3).reduce((sum, valence, index, arr) => {
    if (index === 0) return 0;
    return sum + (valence - arr[index - 1]);
  }, 0) / Math.max(1, moodFlow.length - 1);
  
  const valenceChange = nextValence - currentValence;
  
  // If mood is trending up, allow positive changes; if trending down, allow negative changes
  return Math.abs(valenceChange - recentMoodTrend) < 0.3;
}

function analyzeListeningSequence(tracks: TrackMetadata[]): SequencePattern {
  return {
    genreTransitions: calculateGenreTransitions(tracks),
    tempoProgression: calculateTempoProgression(tracks),
    moodFlow: calculateMoodFlow(tracks),
    artistDiversity: calculateArtistDiversity(tracks)
  };
}

function scoreTrackForSequence(
  track: TrackMetadata, 
  listeningHistory: TrackMetadata[], 
  preferences: UserPreferences
): number {
  let score = 0;
  
  if (listeningHistory.length === 0) {
    // Fallback to original scoring if no history
    return scoreTrack(track, preferences);
  }
  
  const lastTrack = listeningHistory[listeningHistory.length - 1];
  const sequencePattern = analyzeListeningSequence(listeningHistory);
  
  // 1. Genre transition probability (weight 4)
  const predictedGenre = predictNextGenre(sequencePattern.genreTransitions, lastTrack.genre);
  if (track.genre === predictedGenre) score += 4;
  
  // 2. Tempo progression (weight 3)
  if (isGoodTempoTransition(lastTrack.audioFeatures?.tempo, track.audioFeatures?.tempo, sequencePattern.tempoProgression)) {
    score += 3;
  }
  
  // 3. Mood flow (weight 3)
  if (isGoodMoodTransition(lastTrack.audioFeatures, track.audioFeatures, sequencePattern.moodFlow)) {
    score += 3;
  }
  
  // 4. Original preference scoring (weight 2)
  score += scoreTrack(track, preferences) * 0.5;
  
  // 5. Artist diversity bonus (weight 1)
  if (sequencePattern.artistDiversity < 0.3 && track.artist !== lastTrack.artist) {
    score += 1; // Encourage diversity if current sequence lacks it
  }
  
  return score;
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
  const { 
    listeningHistory, 
    preferences
  }: RecommendationRequest = body;

  // Validate input
  if (!listeningHistory || !Array.isArray(listeningHistory)) {
    return NextResponse.json(
      { message: "Listening history is required and must be an array" },
      { status: 400 }
    );
  }

  // Allow empty listening history for genre-based recommendations
  if (listeningHistory.length === 0 && (!preferences.preferredGenres || preferences.preferredGenres.length === 0)) {
    return NextResponse.json(
      { message: "Either listening history or preferred genres must be provided" },
      { status: 400 }
    );
  }

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

    // First, fetch metadata for the listening history tracks
    const historyTracks: TrackMetadata[] = [];
    for (const trackId of listeningHistory) {
      try {
        const track = await fetchSpotifyTracks(accessToken, `track:${trackId}`);
        if (track.length > 0) {
          const [artistMetadata, audioFeatures] = await Promise.all([
            fetchArtistMetadata(accessToken, track[0].artists[0]?.id),
            fetchAudioFeatures(accessToken, track[0].id).catch(() => null),
          ]);

          historyTracks.push({
            id: track[0].id,
            title: track[0].name,
            artist: track[0].artists[0]?.name || "Unknown Artist",
            genre: artistMetadata?.genres?.[0] || "Unknown Genre",
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
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch track ${trackId}:`, error);
      }
    }

    // Determine search strategy based on listening history
    let searchQuery = "";
    if (historyTracks.length > 0) {
      const lastTrack = historyTracks[historyTracks.length - 1];
      // Search for similar tracks to the last track in history
      searchQuery = `${lastTrack.title} ${lastTrack.artist}`;
    } else {
      // Fallback to preferred genre
      searchQuery = preferences.preferredGenres[0];
    }

    const tracks = await fetchSpotifyTracks(accessToken, searchQuery);

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

          const score = scoreTrackForSequence(trackMetadata, historyTracks, preferences);

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

          const score = scoreTrackForSequence(trackMetadata, historyTracks, preferences);

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

    // Add sequence analysis to response
    const sequenceAnalysis = historyTracks.length > 0 ? analyzeListeningSequence(historyTracks) : null;
    
    // Calculate evaluation metrics
    const evaluationMetrics = {
      genreCoherence: calculateGenreCoherence(uniqueRecommendations),
      tempoSmoothness: calculateTempoSmoothness(uniqueRecommendations),
      moodConsistency: calculateMoodConsistency(uniqueRecommendations)
    };

    return NextResponse.json(
      { 
        recommendations: uniqueRecommendations,
        sequenceAnalysis,
        evaluationMetrics,
        totalTracksAnalyzed: historyTracks.length,
        searchStrategy: historyTracks.length > 0 ? 'sequence-based' : 'genre-based'
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

// Evaluation functions
function calculateGenreCoherence(recommendations: { track: TrackMetadata }[]): number {
  if (recommendations.length < 2) return 1;
  
  const genres = recommendations.map(r => r.track.genre);
  const uniqueGenres = new Set(genres);
  return uniqueGenres.size / genres.length;
}

function calculateTempoSmoothness(recommendations: { track: TrackMetadata }[]): number {
  if (recommendations.length < 2) return 1;
  
  const tempos = recommendations
    .map(r => r.track.audioFeatures?.tempo)
    .filter(t => t !== undefined);
  
  if (tempos.length < 2) return 1;
  
  let totalVariation = 0;
  for (let i = 1; i < tempos.length; i++) {
    totalVariation += Math.abs(tempos[i] - tempos[i - 1]);
  }
  
  const avgVariation = totalVariation / (tempos.length - 1);
  return Math.max(0, 1 - (avgVariation / 50)); // Normalize by typical tempo range
}

function calculateMoodConsistency(recommendations: { track: TrackMetadata }[]): number {
  if (recommendations.length < 2) return 1;
  
  const valences = recommendations
    .map(r => r.track.audioFeatures?.valence)
    .filter(v => v !== undefined);
  
  if (valences.length < 2) return 1;
  
  const avgValence = valences.reduce((sum, v) => sum + v, 0) / valences.length;
  const variance = valences.reduce((sum, v) => sum + Math.pow(v - avgValence, 2), 0) / valences.length;
  
  return Math.max(0, 1 - variance); // Lower variance = higher consistency
}

// GET endpoint for evaluation
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  
  if (action === 'evaluate') {
    // Return evaluation metrics and test data
    const testSequences = [
      {
        name: "Happy Pop Sequence",
        tracks: ["4iV5W9uYEdYUVa79Axb7Rh", "3n3Ppam7vgaVa1iaRUmn9T"], // Example track IDs
        expectedGenre: "pop",
        expectedMood: "happy"
      },
      {
        name: "Chill Indie Sequence", 
        tracks: ["1mea3bSkSGXuIRvnydlB5b", "6rqhFgbbKwnb9MLmUQDhG6"], // Example track IDs
        expectedGenre: "indie",
        expectedMood: "calm"
      }
    ];
    
    return NextResponse.json({
      evaluation: {
        testSequences,
        metrics: {
          genreCoherence: "Measures how well genres flow together",
          tempoSmoothness: "Measures tempo transition smoothness", 
          moodConsistency: "Measures mood consistency across recommendations"
        },
        usage: "Send POST request with listeningHistory array to get recommendations"
      }
    });
  }
  
  return NextResponse.json({
    message: "NextTrack Recommendation API",
    endpoints: {
      "POST /api/recommend": "Get music recommendations based on listening history",
      "GET /api/recommend?action=evaluate": "Get evaluation metrics and test data"
    },
    example: {
      listeningHistory: ["4iV5W9uYEdYUVa79Axb7Rh", "3n3Ppam7vgaVa1iaRUmn9T"],
      preferences: {
        preferredGenres: ["pop", "rock"],
        mood: "happy"
      },
      context: {
        timeOfDay: "afternoon",
        activity: "relax"
      }
    }
  });
}
