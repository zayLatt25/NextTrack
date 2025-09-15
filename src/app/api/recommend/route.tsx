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
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    activity?: 'workout' | 'study' | 'party' | 'relax';
  };
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



function scoreTrack(track: TrackMetadata, prefs: UserPreferences, selectedTracks?: SelectedTrack[], extractedGenres?: string[]): number {
  let score = 0;

  // 1. Genre match scoring (weight 3) - using extracted genres
  if (extractedGenres && extractedGenres.includes(track.genre)) {
    score += 3;
  }

  // 2. Selected tracks similarity scoring (weight 4) - highest priority
  if (selectedTracks && selectedTracks.length > 0) {
    const trackSimilarity = calculateTrackSimilarity(track, selectedTracks);
    score += trackSimilarity * 4;
  }

  // 3. Mood-based metadata scoring (weight 3)
  if (prefs.mood) {
    const moodPreferences = getMoodPreferences(prefs.mood);
    const moodSimilarity = calculateMoodSimilarity(track, moodPreferences);
    score += moodSimilarity * 3;
  }

  // 4. Popularity bonus (weight 1)
  if (track.popularity && track.popularity > 70) {
    score += 1;
  }

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

// Calculate similarity between a track and selected tracks
function calculateTrackSimilarity(track: TrackMetadata, selectedTracks: SelectedTrack[]): number {
  let maxSimilarity = 0;
  
  for (const selectedTrack of selectedTracks) {
    let similarity = 0;
    
    // Artist similarity (weight 0.5)
    if (track.artist.toLowerCase().includes(selectedTrack.artists[0]?.name.toLowerCase()) ||
        selectedTrack.artists[0]?.name.toLowerCase().includes(track.artist.toLowerCase())) {
      similarity += 0.5;
    }
    
    // Title similarity (weight 0.3)
    const titleSimilarity = calculateTitleSimilarity(track.title, selectedTrack.name);
    similarity += titleSimilarity * 0.3;
    
    // Popularity similarity (weight 0.2)
    if (track.popularity && selectedTrack.popularity) {
      const popularityDiff = Math.abs(track.popularity - selectedTrack.popularity);
      const popularitySimilarity = Math.max(0, 1 - (popularityDiff / 100));
      similarity += popularitySimilarity * 0.2;
    }
    
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }
  
  return maxSimilarity;
}

// Calculate title similarity using simple string matching
function calculateTitleSimilarity(title1: string, title2: string): number {
  const s1 = title1.toLowerCase().trim();
  const s2 = title2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Simple word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  
  if (commonWords.length === 0) return 0;
  
  return commonWords.length / Math.max(words1.length, words2.length);
}

// Extract genres from selected tracks
async function extractGenresFromTracks(accessToken: string, selectedTracks: SelectedTrack[]): Promise<string[]> {
  const allGenres = new Set<string>();
  
  for (const track of selectedTracks) {
    try {
      // Get artist metadata to extract genres
      const artistId = track.artists[0]?.name; // We'll need to search for the artist ID
      if (artistId) {
        // Search for artist to get their ID
        const artistSearchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistId)}&type=artist&limit=1`,
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
            const artistMetadata = await fetchArtistMetadata(accessToken, artist.id);
            if (artistMetadata?.genres) {
              artistMetadata.genres.forEach((genre: string) => allGenres.add(genre));
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to extract genres for track ${track.name}:`, error);
    }
  }
  
  return Array.from(allGenres);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { 
    selectedTracks,
    preferences
  }: RecommendationRequest = body;

  // Validate input
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
    console.log('Extracting genres from selected tracks:', selectedTracks.length);
    const extractedGenres = await extractGenresFromTracks(accessToken, selectedTracks);
    console.log('Extracted genres:', extractedGenres);

    let searchQueries: string[] = [];
    let allTracks: SpotifyTrack[] = [];
    
    // Create search queries based on selected tracks and extracted genres
    const trackQueries = selectedTracks.map(track => 
      `${track.name} ${track.artists[0]?.name}`
    ).slice(0, 3);
    
    // Add extracted genre queries
    const genreQueries = extractedGenres.slice(0, 3);
    
    searchQueries = [...trackQueries, ...genreQueries];
    
    console.log('Search queries based on selected tracks and extracted genres:', searchQueries);
      
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

          const score = scoreTrack(trackMetadata, preferences, selectedTracks, extractedGenres);
          
          // Debug logging for first few tracks
          if (uniqueTracks.indexOf(track) < 3) {
            console.log(`Scoring track: "${trackMetadata.title}" by ${trackMetadata.artist}`);
            console.log(`  Genre: ${trackMetadata.genre}, Score: ${score}`);
            console.log(`  Extracted genres: ${extractedGenres?.join(', ') || 'none'}`);
            console.log(`  User mood: ${preferences.mood || 'none'}`);
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

          const score = scoreTrack(trackMetadata, preferences, selectedTracks, extractedGenres);

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
    
    // Calculate evaluation metrics
    const evaluationMetrics = {
      genreCoherence: calculateGenreCoherence(uniqueRecommendations),
      popularitySmoothness: calculatePopularitySmoothness(uniqueRecommendations),
      genreConsistency: calculateGenreConsistency(uniqueRecommendations)
    };

    return NextResponse.json(
      { 
        recommendations: uniqueRecommendations,
        evaluationMetrics,
        searchStrategy: 'track-based',
        searchQueries: searchQueries,
        totalTracksFound: uniqueTracks.length,
        selectedTracksCount: selectedTracks?.length || 0,
        extractedGenres: extractedGenres
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
      "POST /api/recommend": "Get music recommendations based on selected tracks (genres auto-extracted)",
      "GET /api/recommend?action=evaluate": "Get evaluation metrics and test data"
    },
    example: {
      selectedTracks: [
        {
          id: "4iV5W9uYEdYUVa79Axb7Rh",
          name: "Song Name",
          artists: [{ name: "Artist Name" }],
          album: { name: "Album Name" },
          popularity: 80
        }
      ],
      preferences: {
        mood: "happy"
      },
      context: {
        timeOfDay: "afternoon",
        activity: "relax"
      }
    }
  });
}
