"use client";

import { useState } from "react";
import EmptyState from "../components/EmptyState";
import { TrackSkeleton, RecommendationSkeleton } from "../components/SkeletonLoader";

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
  evaluationMetrics?: {
    genreCoherence: number;
    popularitySmoothness: number;
    genreConsistency: number;
  };
  searchStrategy: string;
  searchQueries: string[];
  totalTracksFound: number;
  selectedTracksCount: number;
  extractedGenres: string[];
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
        totalTracksFound: data.totalTracksFound,
        evaluationMetrics: data.evaluationMetrics,
        extractedGenres: data.extractedGenres
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
    <div className="h-screen overflow-hidden p-4 bg-gray-100 flex flex-col">
      <h1 className="text-2xl font-extrabold mb-4 text-gray-900 text-center flex-shrink-0">
        NextTrack
      </h1>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Recommendation Form */}
        <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center flex-shrink-0">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Set Preferences</span>
          </h2>
          
          {/* Search Section */}
          <div className="mb-4 flex-shrink-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search for Tracks
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search for songs, artists, or albums..."
                className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
              />
              <button
                onClick={searchTracks}
                disabled={searchLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 font-medium"
              >
                {searchLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10h2zm2 5.291A7.962 7.962 0 014 12H2c0 3.042 1.135 5.824 3 7.938l1-1.647z"></path>
                  </svg>
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </div>

          {/* Search Results and Selected Tracks - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6 flex-1 min-h-0">
            {/* Search Results */}
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Search Results</h3>
              {searchLoading ? (
                <div className="h-40 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-3">
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <TrackSkeleton key={index} />
                    ))}
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="h-40 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-3">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{track.name}</div>
                        <div className="text-sm text-gray-600 truncate">{track.artists[0]?.name}</div>
                      </div>
                      <button
                        onClick={() => isTrackSelected(track.id) ? removeTrackFromCollection(track.id) : addTrackToCollection(track)}
                        className={`px-3 py-2 text-xs rounded-lg font-medium transition-all duration-200 flex-shrink-0 ${
                          isTrackSelected(track.id) 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                        }`}
                      >
                        {isTrackSelected(track.id) ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg">
                  <EmptyState
                    icon="🔍"
                    title="No search results"
                    description="Search for tracks to see results here"
                  />
                </div>
              )}
            </div>

            {/* Selected Tracks */}
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Tracks ({selectedTracks.length})</h3>
              <div className="h-40 bg-gray-50 rounded-lg">
                {selectedTracks.length > 0 ? (
                  <div className="h-full overflow-y-auto space-y-2 p-3">
                    {selectedTracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{track.name}</div>
                          <div className="text-sm text-gray-600 truncate">{track.artists[0]?.name}</div>
                        </div>
                        <button
                          onClick={() => removeTrackFromCollection(track.id)}
                          className="px-3 py-2 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 font-medium transition-all duration-200 flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState
                      icon="🎵"
                      title="No tracks selected"
                      description="Add tracks from search results to build your collection"
                    />
                  </div>
                )}
              </div>
              <div className="mt-2 h-8 flex items-center">
                <button
                  onClick={() => setSelectedTracks([])}
                  disabled={selectedTracks.length === 0}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 flex-shrink-0">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mood</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                onChange={(e) => setMood(e.target.value || undefined)}
              >
                <option value="">Select mood</option>
                {availableMoods.map((mood) => (
                  <option key={mood} value={mood} className="capitalize">{mood}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time of Day</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                onChange={(e) => setTimeOfDay(e.target.value || undefined)}
              >
                <option value="">Select time</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Activity</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                onChange={(e) => setActivity(e.target.value || undefined)}
              >
                <option value="">Select activity</option>
                <option value="workout">Workout</option>
                <option value="study">Study</option>
                <option value="party">Party</option>
                <option value="relax">Relax</option>
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex-shrink-0">{errorMessage}</div>
          )}
          
          {/* Get Recommendations Button - moved to bottom */}
          <div className="mt-auto">
            <button
              onClick={getRecommendations}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl flex-shrink-0"
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10h2zm2 5.291A7.962 7.962 0 014 12H2c0 3.042 1.135 5.824 3 7.938l1-1.647z"></path>
                </svg>
              ) : (
                "Get Recommendations"
              )}
            </button>
          </div>
        </div>

        {/* Right Side - Now Playing and Recommendations */}
        <div className="flex flex-col h-full space-y-4">
          {/* Now Playing */}
          <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-bold mb-4 text-gray-900 text-center flex items-center justify-center">
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Now Playing</span>
            </h2>
            {selectedTrackId ? (
              <iframe
                style={{ borderRadius: "12px" }}
                src={`https://open.spotify.com/embed/track/${selectedTrackId}?autoplay=true`}
                width="100%"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              ></iframe>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <EmptyState
                  icon="🎧"
                  title="No track selected"
                  description="Select a track to play it here"
                />
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100 flex-1 flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-gray-900 text-center flex items-center justify-center flex-shrink-0">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Recommendations</span>
            </h2>
            <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <RecommendationSkeleton key={index} />
                ))
              ) : recommendations.length > 0 ? (
                recommendations.map((rec: Recommendation) => (
                  <div
                    key={rec.track?.id || Math.random()}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold text-gray-800 truncate group-hover:text-purple-600 transition-colors duration-200"
                        style={{
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {rec.track?.title || "Unknown Title"}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {rec.track?.artist || "Unknown Artist"}
                      </div>
                      <div className="text-xs text-purple-600 font-medium">
                        Score: {rec.score || 0}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        console.log("Selected Track ID:", rec.track?.id);
                        setSelectedTrackId(rec.track?.id);
                      }}
                      className="ml-3 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Play
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <EmptyState
                    icon="🎯"
                    title="No recommendations yet"
                    description="Get personalized recommendations by adding tracks and clicking 'Get Recommendations'"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
