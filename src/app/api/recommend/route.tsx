import { NextResponse } from "next/server";
import {
  getSpotifyAccessToken,
  fetchSpotifyTracks,
  fetchArtistMetadata,
} from "@/utils/spotify";

// Audio features removed due to Spotify API deprecation
// Focus on metadata-based recommendations instead

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
  artistTransitions: Record<string, number>;
  popularityTrend: number[];
  releaseYearTrend: number[];
  artistDiversity: number;
};


// Mood to metadata preferences mapping
function getMoodPreferences(mood: string): { preferredGenres: string[], popularityRange: [number, number] } {
  const moodMappings: Record<string, { preferredGenres: string[], popularityRange: [number, number] }> = {
    happy: {
      preferredGenres: ['pop', 'dance', 'electronic', 'indie-pop'],
      popularityRange: [60, 100] // Higher popularity for mainstream feel
    },
    sad: {
      preferredGenres: ['indie', 'folk', 'acoustic', 'alternative'],
      popularityRange: [20, 80] // Mix of popular and niche
    },
    energetic: {
      preferredGenres: ['rock', 'electronic', 'dance', 'hip-hop', 'metal'],
      popularityRange: [40, 100] // Wide range, focus on energetic genres
    },
    calm: {
      preferredGenres: ['ambient', 'classical', 'jazz', 'acoustic', 'chill'],
      popularityRange: [10, 70] // Lower popularity, more niche genres
    },
  };

  return moodMappings[mood.toLowerCase()] || { preferredGenres: [], popularityRange: [0, 100] };
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

// Calculate metadata similarity for mood matching
function calculateMoodSimilarity(
  track: TrackMetadata,
  moodPreferences: { preferredGenres: string[], popularityRange: [number, number] }
): number {
  let similarity = 0;
  
  // Genre match (weight 0.6)
  if (moodPreferences.preferredGenres.includes(track.genre)) {
    similarity += 0.6;
  }
  
  // Popularity match (weight 0.4)
  if (track.popularity !== undefined) {
    const [minPop, maxPop] = moodPreferences.popularityRange;
    if (track.popularity >= minPop && track.popularity <= maxPop) {
      similarity += 0.4;
    } else {
      // Partial credit for close matches
      const distance = Math.min(
        Math.abs(track.popularity - minPop),
        Math.abs(track.popularity - maxPop)
      );
      similarity += Math.max(0, 0.4 - (distance / 50));
    }
  }
  
  return similarity;
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

function calculateArtistTransitions(tracks: TrackMetadata[]): Record<string, number> {
  const transitions: Record<string, number> = {};
  
  for (let i = 0; i < tracks.length - 1; i++) {
    const currentArtist = tracks[i].artist;
    const nextArtist = tracks[i + 1].artist;
    const transition = `${currentArtist}->${nextArtist}`;
    transitions[transition] = (transitions[transition] || 0) + 1;
  }
  
  return transitions;
}

function calculatePopularityTrend(tracks: TrackMetadata[]): number[] {
  return tracks
    .map(track => track.popularity || 50)
    .filter((popularity, index, arr) => index === 0 || Math.abs(popularity - arr[index - 1]) > 10);
}

function calculateReleaseYearTrend(tracks: TrackMetadata[]): number[] {
  return tracks
    .map(track => track.releaseYear || new Date().getFullYear())
    .filter((year, index, arr) => index === 0 || Math.abs(year - arr[index - 1]) > 2);
}

function calculateArtistDiversity(tracks: TrackMetadata[]): number {
  const uniqueArtists = new Set(tracks.map(track => track.artist));
  return uniqueArtists.size / tracks.length;
}

function predictNextGenre(transitions: Record<string, number>, currentGenre: string, allGenres: string[]): string[] {
  // Get direct transitions from current genre
  const directTransitions = Object.keys(transitions)
    .filter(t => t.startsWith(`${currentGenre}->`))
    .sort((a, b) => transitions[b] - transitions[a]);
  
  // Get most common genres in the entire history
  const genreFrequency: Record<string, number> = {};
  allGenres.forEach(genre => {
    genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
  });
  
  const topGenres = Object.entries(genreFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([genre]) => genre);
  
  // Combine direct transitions with top genres
  const predictedGenres = new Set<string>();
  
  // Add direct transitions (up to 2)
  directTransitions.slice(0, 2).forEach(transition => {
    predictedGenres.add(transition.split('->')[1]);
  });
  
  // Add top genres from history
  topGenres.forEach(genre => {
    predictedGenres.add(genre);
  });
  
  // Fallback to current genre if no predictions
  if (predictedGenres.size === 0) {
    predictedGenres.add(currentGenre);
  }
  
  return Array.from(predictedGenres);
}

function isGoodPopularityTransition(
  currentPopularity: number | undefined, 
  nextPopularity: number | undefined, 
  trend: number[]
): boolean {
  if (!currentPopularity || !nextPopularity) return true;
  
  if (trend.length < 2) return true;
  
  const recentTrend = trend.slice(-3).reduce((sum, pop, index, arr) => {
    if (index === 0) return 0;
    return sum + (pop - arr[index - 1]);
  }, 0) / Math.max(1, trend.length - 1);
  
  const popularityChange = nextPopularity - currentPopularity;
  
  // Allow transitions that follow the trend
  return Math.abs(popularityChange - recentTrend) < 20;
}

function isGoodArtistTransition(
  currentArtist: string,
  nextArtist: string,
  artistTransitions: Record<string, number>
): boolean {
  const transition = `${currentArtist}->${nextArtist}`;
  const reverseTransition = `${nextArtist}->${currentArtist}`;
  
  // Check if this transition has happened before
  return (artistTransitions[transition] || 0) > 0 || 
         (artistTransitions[reverseTransition] || 0) > 0 ||
         currentArtist === nextArtist; // Same artist is always good
}

function analyzeListeningSequence(tracks: TrackMetadata[]): SequencePattern {
  return {
    genreTransitions: calculateGenreTransitions(tracks),
    artistTransitions: calculateArtistTransitions(tracks),
    popularityTrend: calculatePopularityTrend(tracks),
    releaseYearTrend: calculateReleaseYearTrend(tracks),
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
  const allGenres = listeningHistory.map(t => t.genre);
  const allArtists = listeningHistory.map(t => t.artist);
  
  // 1. User preference scoring (weight 5) - highest priority
  const preferenceScore = scoreTrack(track, preferences);
  score += preferenceScore * 1.0; // Full weight for user preferences
  
  // 2. Genre transition probability (weight 2) - reduced to give more weight to preferences
  const predictedGenres = predictNextGenre(sequencePattern.genreTransitions, lastTrack.genre, allGenres);
  if (predictedGenres.includes(track.genre)) {
    score += 2;
  }
  
  // 3. Popularity progression (weight 1) - reduced
  if (isGoodPopularityTransition(lastTrack.popularity, track.popularity, sequencePattern.popularityTrend)) {
    score += 1;
  }
  
  // 4. Artist transition (weight 1) - reduced
  if (isGoodArtistTransition(lastTrack.artist, track.artist, sequencePattern.artistTransitions)) {
    score += 1;
  }
  
  // 5. Artist diversity bonus (weight 1)
  const artistFrequency = allArtists.reduce((acc, artist) => {
    acc[artist] = (acc[artist] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const maxArtistFrequency = Math.max(...Object.values(artistFrequency));
  const trackArtistFrequency = artistFrequency[track.artist] || 0;
  
  if (sequencePattern.artistDiversity < 0.3) {
    // Low diversity - encourage new artists
    if (track.artist !== lastTrack.artist && trackArtistFrequency < maxArtistFrequency * 0.3) {
      score += 1.5; // Higher bonus for new artists
    }
  } else if (sequencePattern.artistDiversity > 0.7) {
    // High diversity - can continue with same artist occasionally
    if (track.artist === lastTrack.artist) {
      score += 0.5; // Small bonus for artist continuity
    }
  }
  
  // 6. Genre frequency bonus (weight 1) - new
  const genreFrequency = allGenres.reduce((acc, genre) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const maxFrequency = Math.max(...Object.values(genreFrequency));
  const trackGenreFrequency = genreFrequency[track.genre] || 0;
  if (trackGenreFrequency >= maxFrequency * 0.5) {
    score += 1; // Bonus for genres that appear frequently in history
  }
  
  // 7. Perfect match bonus (weight 2) - tracks that match both user preferences AND history patterns
  const isUserGenreMatch = preferences.preferredGenres?.includes(track.genre) || false;
  const isHistoryGenreMatch = predictedGenres.includes(track.genre);
  const isUserMoodMatch = preferences.mood ? calculateMoodSimilarity(track, getMoodPreferences(preferences.mood)) > 0.5 : false;
  
  if (isUserGenreMatch && isHistoryGenreMatch) {
    score += 2; // Bonus for tracks that match both user genre preference and history pattern
  }
  if (isUserMoodMatch && isHistoryGenreMatch) {
    score += 1.5; // Bonus for tracks that match both user mood and history pattern
  }
  
  return Math.round(score * 100) / 100; // Round to 2 decimal places
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

  // 3. Mood-based metadata scoring (weight 4)
  if (prefs.mood) {
    const moodPreferences = getMoodPreferences(prefs.mood);
    const moodSimilarity = calculateMoodSimilarity(track, moodPreferences);
    score += moodSimilarity * 4;
  }

  // 4. Popularity bonus (weight 1)
  if (track.popularity && track.popularity > 70) {
    score += 1;
  }

  return Math.round(score * 100) / 100; // Round to 2 decimal places
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
        // Fetch track directly by ID instead of using search
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        if (response.ok) {
          const track = await response.json();
          const artistMetadata = await fetchArtistMetadata(accessToken, track.artists[0]?.id);
          
          console.log(`Artist metadata for ${track.artists[0]?.name}:`, artistMetadata?.genres);
          
          // Fallback genre detection if artist metadata fails
          let genre = artistMetadata?.genres?.[0] || "Unknown Genre";
          if (genre === "Unknown Genre") {
            // Try to infer genre from album name or track name
            const albumName = track.album?.name?.toLowerCase() || "";
            const trackName = track.name?.toLowerCase() || "";
            
            if (albumName.includes("classical") || trackName.includes("prelude") || trackName.includes("piano")) {
              genre = "classical";
            } else if (albumName.includes("pop") || trackName.includes("pop")) {
              genre = "pop";
            } else if (albumName.includes("rock") || trackName.includes("rock")) {
              genre = "rock";
            } else if (albumName.includes("jazz") || trackName.includes("jazz")) {
              genre = "jazz";
            } else {
              genre = "pop"; // Default fallback
            }
          }

          historyTracks.push({
            id: track.id,
            title: track.name,
            artist: track.artists[0]?.name || "Unknown Artist",
            genre: genre,
            popularity: track.popularity,
            releaseYear: track.album?.release_date ? new Date(track.album.release_date).getFullYear() : undefined,
            album: track.album?.name,
          });
          
          console.log(`Successfully fetched track: ${track.name} by ${track.artists[0]?.name} (${genre})`);
        } else {
          console.warn(`Failed to fetch track ${trackId}: ${response.status}`);
        }
      } catch (error) {
        console.warn(`Failed to fetch track ${trackId}:`, error);
      }
    }
    
    console.log(`Successfully processed ${historyTracks.length} tracks from listening history:`, 
      historyTracks.map(t => `${t.title} by ${t.artist} (${t.genre})`));

    // Determine search strategy based on listening history
    let searchQueries: string[] = [];
    let allTracks: SpotifyTrack[] = [];
    
    if (historyTracks.length > 0) {
      const sequencePattern = analyzeListeningSequence(historyTracks);
      const allGenres = historyTracks.map(t => t.genre);
      const allArtists = historyTracks.map(t => t.artist);
      
      // Get predicted genres for next track
      const lastTrack = historyTracks[historyTracks.length - 1];
      const predictedGenres = predictNextGenre(sequencePattern.genreTransitions, lastTrack.genre, allGenres);
      
      // Create multiple search queries with balanced approach
      searchQueries = [
        // 1. User preferred genres (highest priority)
        ...(preferences.preferredGenres || []).slice(0, 2),
        // 2. Search by predicted genres from history
        ...predictedGenres.slice(0, 2),
        // 3. Search by most frequent artists in history
        ...Array.from(new Set(allArtists)).slice(0, 2),
        // 4. Search by last track for continuity
        `${lastTrack.title} ${lastTrack.artist}`,
        // 5. Search by genre transitions
        ...Object.keys(sequencePattern.genreTransitions)
          .filter(t => t.includes(lastTrack.genre))
          .slice(0, 2)
          .map(t => t.split('->')[1])
      ];
      
      // Remove duplicates and empty strings
      searchQueries = [...new Set(searchQueries)].filter(q => q && q.trim().length > 0);
      
      // Limit to 6 queries to avoid too many API calls
      searchQueries = searchQueries.slice(0, 6);
      
      console.log('Search queries based on history:', searchQueries);
      
      // Fetch tracks from multiple queries
      const trackPromises = searchQueries.map(async (query, index) => {
        try {
          console.log(`Fetching tracks for query ${index + 1}: "${query}"`);
          const tracks = await fetchSpotifyTracks(accessToken, query);
          console.log(`Found ${tracks.length} tracks for query: "${query}"`);
          return tracks;
        } catch (error) {
          console.warn(`Failed to fetch tracks for query "${query}":`, error);
          return [];
        }
      });
      
      const trackResults = await Promise.all(trackPromises);
      allTracks = trackResults.flat();
      console.log(`Total tracks found from all queries: ${allTracks.length}`);
      
    } else {
      // Fallback to preferred genre
      searchQueries = preferences.preferredGenres.slice(0, 3);
      allTracks = await fetchSpotifyTracks(accessToken, searchQueries[0]);
      console.log('No history - using genre-based search:', searchQueries);
    }

    // Remove duplicate tracks based on ID
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );
    
    console.log(`Found ${uniqueTracks.length} unique tracks from ${searchQueries.length} search queries`);

    const recommendations = await Promise.all(
      uniqueTracks.map(async (track) => {
        try {
          const artistMetadata = await fetchArtistMetadata(accessToken, track.artists[0]?.id);

          const trackMetadata: TrackMetadata = {
            id: track.id,
            title: track.name,
            artist: track.artists[0]?.name || "Unknown Artist",
            genre: artistMetadata?.genres?.[0] || "Unknown Genre",
            popularity: track.popularity,
            releaseYear: track.album?.release_date ? new Date(track.album.release_date).getFullYear() : undefined,
            album: track.album?.name,
          };

          const score = scoreTrackForSequence(trackMetadata, historyTracks, preferences);
          
          // Debug logging for first few tracks
          if (uniqueTracks.indexOf(track) < 3) {
            console.log(`Scoring track: "${trackMetadata.title}" by ${trackMetadata.artist}`);
            console.log(`  Genre: ${trackMetadata.genre}, Score: ${score}`);
            console.log(`  User preferred genres: ${preferences.preferredGenres?.join(', ') || 'none'}`);
            console.log(`  User mood: ${preferences.mood || 'none'}`);
            if (historyTracks.length > 0) {
              const lastTrack = historyTracks[historyTracks.length - 1];
              console.log(`  Last track: "${lastTrack.title}" by ${lastTrack.artist} (${lastTrack.genre})`);
            }
          }

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
            popularity: track.popularity,
            releaseYear: track.album?.release_date ? new Date(track.album.release_date).getFullYear() : undefined,
            album: track.album?.name,
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
    const sequencePattern = sequenceAnalysis;
    
    // Calculate evaluation metrics
    const evaluationMetrics = {
      genreCoherence: calculateGenreCoherence(uniqueRecommendations),
      popularitySmoothness: calculatePopularitySmoothness(uniqueRecommendations),
      genreConsistency: calculateGenreConsistency(uniqueRecommendations)
    };

    return NextResponse.json(
      { 
        recommendations: uniqueRecommendations,
        sequenceAnalysis,
        evaluationMetrics,
        totalTracksAnalyzed: historyTracks.length,
        searchStrategy: historyTracks.length > 0 ? 'sequence-based' : 'genre-based',
        searchQueries: searchQueries,
        totalTracksFound: uniqueTracks.length,
        debugInfo: {
          predictedGenres: historyTracks.length > 0 ? 
            predictNextGenre(analyzeListeningSequence(historyTracks).genreTransitions, historyTracks[historyTracks.length - 1].genre, historyTracks.map(t => t.genre)) : 
            [],
          genreTransitions: sequencePattern?.genreTransitions || {},
          artistDiversity: sequencePattern?.artistDiversity || 0
        }
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

function calculatePopularitySmoothness(recommendations: { track: TrackMetadata }[]): number {
  if (recommendations.length < 2) return 1;
  
  const popularities = recommendations
    .map(r => r.track.popularity)
    .filter(p => p !== undefined) as number[];
  
  if (popularities.length < 2) return 1;
  
  let totalVariation = 0;
  for (let i = 1; i < popularities.length; i++) {
    totalVariation += Math.abs(popularities[i] - popularities[i - 1]);
  }
  
  const avgVariation = totalVariation / (popularities.length - 1);
  return Math.max(0, 1 - (avgVariation / 50)); // Normalize by typical popularity range
}

function calculateGenreConsistency(recommendations: { track: TrackMetadata }[]): number {
  if (recommendations.length < 2) return 1;
  
  const genres = recommendations.map(r => r.track.genre);
  const uniqueGenres = new Set(genres);
  
  // More consistency = fewer unique genres relative to total
  return uniqueGenres.size / genres.length;
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
