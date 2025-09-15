"use client";

import { useState } from "react";

// TypeScript interfaces for type safety
interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  genre: string;
  popularity?: number;
  releaseYear?: number;
  album?: string;
}

interface Recommendation {
  track: TrackMetadata;
  score: number;
}

interface APIResponse {
  recommendations: Recommendation[];
  sequenceAnalysis?: {
    genreTransitions: Record<string, number>;
    artistTransitions: Record<string, number>;
    popularityTrend: number[];
    releaseYearTrend: number[];
    artistDiversity: number;
  };
  evaluationMetrics?: {
    genreCoherence: number;
    popularitySmoothness: number;
    genreConsistency: number;
  };
  totalTracksAnalyzed: number;
  searchStrategy: string;
}

export default function Home() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [mood, setMood] = useState<string | undefined>();
  const [timeOfDay, setTimeOfDay] = useState<string | undefined>();
  const [activity, setActivity] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null); // Track ID for the player
  const [loading, setLoading] = useState<boolean>(false); // Loading state for the button
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: { name: string };
    popularity: number;
    preview_url?: string;
    external_urls: { spotify: string };
  }>>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [selectedTracks, setSelectedTracks] = useState<Array<{
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: { name: string };
    popularity: number;
    preview_url?: string;
    external_urls: { spotify: string };
  }>>([]);

  // Available moods for the dropdown
  const availableMoods = [
    "happy",
    "sad", 
    "energetic",
    "calm"
  ];

  const getRecommendations = async () => {
    if (selectedTracks.length === 0) {
      setErrorMessage("Please add some tracks for recommendations.");
      return;
    }

    setErrorMessage(null);
    setRecommendations([]);
    setLoading(true); // Set loading state to true

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedTracks: selectedTracks.map(track => ({
            id: track.id,
            name: track.name,
            artists: track.artists,
            album: track.album,
            popularity: track.popularity
          })),
          preferences: {
            mood: mood || undefined,
          },
          context: {
            timeOfDay: timeOfDay || undefined,
            activity: activity || undefined,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} - ${res.statusText}`);
      }

      const data = await res.json() as APIResponse;
      setRecommendations(data.recommendations);

      // Log additional data for debugging
      console.log('API Response:', {
        searchStrategy: data.searchStrategy,
        totalTracksAnalyzed: data.totalTracksAnalyzed,
        evaluationMetrics: data.evaluationMetrics,
        sequenceAnalysis: data.sequenceAnalysis
      });

      // Clear the selected track ID when new recommendations are fetched
      setSelectedTrackId(null);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false); // Set loading state to false
    }
  };

  const searchTracks = async () => {
    if (!searchQuery.trim()) {
      setErrorMessage("Please enter a search query.");
      return;
    }

    setSearchLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();
      setSearchResults(data.tracks);
    } catch (error) {
      console.error("Failed to search tracks:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSearchLoading(false);
    }
  };

  const addTrackToCollection = (track: typeof searchResults[0]) => {
    if (!selectedTracks.find(t => t.id === track.id)) {
      setSelectedTracks([...selectedTracks, track]);
    }
  };

  const removeTrackFromCollection = (trackId: string) => {
    setSelectedTracks(selectedTracks.filter(track => track.id !== trackId));
  };

  const isTrackSelected = (trackId: string) => {
    return selectedTracks.some(track => track.id === trackId);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900 text-center">
        Track Recommendations
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommendation Form */}
        <div className="p-4 bg-white rounded shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-900">
            Set Preferences
          </h2>
          <div className="mb-4">
            <label className="block text-md font-medium text-gray-900">
              Search for Tracks
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search for songs, artists, or albums..."
                className="flex-1 p-2 border border-gray-300 rounded bg-white text-gray-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
              />
              <button
                onClick={searchTracks}
                disabled={searchLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {searchLoading ? "..." : "Search"}
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-md font-medium text-gray-900">
              Mood
            </label>
            <select
              className="mt-1 block w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
              onChange={(e) => setMood(e.target.value || undefined)}
            >
              <option value="">Select a mood</option>
              {availableMoods.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-md font-medium text-gray-900">
              Time of Day
            </label>
            <select
              className="mt-1 block w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
              onChange={(e) => setTimeOfDay(e.target.value || undefined)}
            >
              <option value="">Select time of day</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-md font-medium text-gray-900">
              Activity
            </label>
            <select
              className="mt-1 block w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
              onChange={(e) => setActivity(e.target.value || undefined)}
            >
              <option value="">Select activity</option>
              <option value="workout">Workout</option>
              <option value="study">Study</option>
              <option value="party">Party</option>
              <option value="relax">Relax</option>
            </select>
          </div>
          {errorMessage && (
            <div className="text-red-600 text-sm mb-4">{errorMessage}</div>
          )}
          <button
            onClick={getRecommendations}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full flex items-center justify-center"
            disabled={loading} // Disable button while loading
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10h2zm2 5.291A7.962 7.962 0 014 12H2c0 3.042 1.135 5.824 3 7.938l1-1.647z"
                ></path>
              </svg>
            ) : (
              "Get Recommendations"
            )}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="p-4 bg-white rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Search Results
            </h2>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{track.name}</div>
                    <div className="text-sm text-gray-600">{track.artists[0]?.name}</div>
                  </div>
                  <button
                    onClick={() => isTrackSelected(track.id) ? removeTrackFromCollection(track.id) : addTrackToCollection(track)}
                    className={`px-3 py-1 text-sm rounded ${
                      isTrackSelected(track.id) 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isTrackSelected(track.id) ? 'Remove' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Tracks for Recommendations */}
        {selectedTracks.length > 0 && (
          <div className="p-4 bg-white rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Selected Tracks for Recommendations ({selectedTracks.length})
            </h2>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {selectedTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{track.name}</div>
                    <div className="text-sm text-gray-600">{track.artists[0]?.name}</div>
                  </div>
                  <button
                    onClick={() => removeTrackFromCollection(track.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedTracks([])}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Spotify Player */}
        {selectedTrackId && (
          <div className="p-4 bg-white rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900 text-center">
              Now Playing
            </h2>
            <iframe
              style={{ borderRadius: "12px" }}
              src={`https://open.spotify.com/embed/track/${selectedTrackId}?autoplay=true`}
              width="100%"
              height="100"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            ></iframe>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {recommendations.map((rec: Recommendation) => (
          <div
            key={rec.track?.id || Math.random()} // Use a fallback key if `rec.track.id` is undefined
            className="p-6 bg-gray-50 rounded shadow-lg flex flex-col space-y-3"
          >
            <div
              className="text-xl font-bold text-gray-800 truncate"
              style={{
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {rec.track?.title || "Unknown Title"}
            </div>
            <div className="text-md text-gray-600">
              Artist: {rec.track?.artist || "Unknown Artist"}
            </div>
            <div className="text-md text-gray-600">
              Genre: {rec.track?.genre || "Unknown Genre"}
            </div>
            <div className="text-md font-semibold text-blue-700">
              Score: {rec.score || 0}
            </div>
            <button
              onClick={() => {
                console.log("Selected Track ID:", rec.track?.id);
                setSelectedTrackId(rec.track?.id);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Play Track
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
