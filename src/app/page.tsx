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
    <div className="h-screen overflow-hidden p-4 animated-bg flex flex-col">
      <h1 className="text-4xl font-black mb-6 text-center flex-shrink-0 gradient-text tracking-tight">
        NextTrack
      </h1>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Recommendation Form */}
        <div className="p-6 glass rounded-2xl shadow-2xl border border-white/10 flex flex-col h-[700px]">
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center flex-shrink-0">
            <span className="gradient-text">Set Preferences</span>
          </h2>
          
          {/* Search Section - Always at the top */}
          <div className="mb-6 flex-shrink-0">
            <label className="block text-sm font-semibold text-white/90 mb-3">
              Search for Tracks
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search for songs, artists, or albums..."
                className="flex-1 p-4 border border-white/20 rounded-xl bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
              />
              <button
                onClick={searchTracks}
                disabled={searchLoading}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl hover:from-purple-700 hover:to-cyan-600 disabled:opacity-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-lg"
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

          {/* Search Results and Selected Tracks - Flexible middle section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 flex-1 min-h-0">
            {/* Search Results */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-sm font-semibold text-white/90 mb-3 flex-shrink-0">Search Results</h3>
              <div className="flex-1 min-h-0">
                {searchLoading ? (
                  <div className="h-full overflow-y-auto space-y-3 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <TrackSkeleton key={index} />
                      ))}
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="h-full overflow-y-auto space-y-3 bg-white/5 rounded-xl p-4">
                    {searchResults.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 hover:shadow-lg transition-all duration-300 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">{track.name}</div>
                          <div className="text-sm text-white/70 truncate">{track.artists[0]?.name}</div>
                        </div>
                        <button
                          onClick={() => isTrackSelected(track.id) ? removeTrackFromCollection(track.id) : addTrackToCollection(track)}
                          className={`px-4 py-2 text-xs rounded-lg font-semibold transition-all duration-300 flex-shrink-0 ${
                            isTrackSelected(track.id) 
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-400/30' 
                              : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-400/30'
                          }`}
                        >
                          {isTrackSelected(track.id) ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-white/5 rounded-xl">
                    <EmptyState
                      icon="🔍"
                      title="No search results"
                      description="Search for tracks to see results here"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Selected Tracks */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-sm font-semibold text-white/90 mb-3 flex-shrink-0">Selected Tracks ({selectedTracks.length})</h3>
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 bg-white/5 rounded-xl">
                  {selectedTracks.length > 0 ? (
                    <div className="h-full overflow-y-auto space-y-3 p-4">
                      {selectedTracks.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 hover:shadow-lg transition-all duration-300 group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">{track.name}</div>
                            <div className="text-sm text-white/70 truncate">{track.artists[0]?.name}</div>
                          </div>
                          <button
                            onClick={() => removeTrackFromCollection(track.id)}
                            className="px-4 py-2 bg-red-500/20 text-red-300 text-xs rounded-lg hover:bg-red-500/30 font-semibold transition-all duration-300 flex-shrink-0 border border-red-400/30"
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
                        description="Add tracks from search results"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-3 h-6 flex items-center flex-shrink-0">
                  <button
                    onClick={() => setSelectedTracks([])}
                    disabled={selectedTracks.length === 0}
                    className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-lg hover:bg-white/20 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences - Always at the bottom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 flex-shrink-0">
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-3">Mood</label>
              <select
                className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300"
                onChange={(e) => setMood(e.target.value || undefined)}
              >
                <option value="" className="bg-gray-800 text-white">Select mood</option>
                {availableMoods.map((mood) => (
                  <option key={mood} value={mood} className="capitalize bg-gray-800 text-white">{mood}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-3">Time of Day</label>
              <select
                className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
                onChange={(e) => setTimeOfDay(e.target.value || undefined)}
              >
                <option value="" className="bg-gray-800 text-white">Select time</option>
                <option value="morning" className="bg-gray-800 text-white">Morning</option>
                <option value="afternoon" className="bg-gray-800 text-white">Afternoon</option>
                <option value="evening" className="bg-gray-800 text-white">Evening</option>
                <option value="night" className="bg-gray-800 text-white">Night</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-3">Activity</label>
              <select
                className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all duration-300"
                onChange={(e) => setActivity(e.target.value || undefined)}
              >
                <option value="" className="bg-gray-800 text-white">Select activity</option>
                <option value="workout" className="bg-gray-800 text-white">Workout</option>
                <option value="study" className="bg-gray-800 text-white">Study</option>
                <option value="party" className="bg-gray-800 text-white">Party</option>
                <option value="relax" className="bg-gray-800 text-white">Relax</option>
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-400/30 text-red-300 rounded-xl text-sm flex-shrink-0">{errorMessage}</div>
          )}
          
          {/* Get Recommendations Button - Always at the bottom */}
          <div className="flex-shrink-0">
            <button
              onClick={getRecommendations}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 via-cyan-500 to-amber-500 text-white rounded-xl hover:from-purple-700 hover:via-cyan-600 hover:to-amber-600 disabled:opacity-50 flex items-center justify-center font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-2xl"
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
        <div className="flex flex-col h-[700px] space-y-6">
          {/* Now Playing */}
          <div className="p-6 glass rounded-2xl shadow-2xl border border-white/10 flex-shrink-0">
            <h2 className="text-2xl font-bold mb-6 text-white text-center flex items-center justify-center">
              <span className="gradient-text">Now Playing</span>
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
              <div className="h-[152px] flex items-center justify-center">
                <EmptyState
                  icon="🎧"
                  title="No track selected"
                  description="Select a track to play it here"
                />
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="p-4 glass rounded-2xl shadow-2xl border border-white/10 flex-1 flex flex-col min-h-0">
            <h2 className="text-xl font-bold mb-3 text-white text-center flex items-center justify-center flex-shrink-0">
              <span className="gradient-text">Recommendations</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 flex-1 overflow-y-auto min-h-0">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <RecommendationSkeleton key={index} />
                ))
              ) : recommendations.length > 0 ? (
                recommendations.map((rec: Recommendation) => (
                  <div
                    key={rec.track?.id || Math.random()}
                    className="p-5 bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 hover:shadow-lg transition-all duration-300 flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-bold text-white truncate group-hover:text-purple-300 transition-colors duration-300"
                        style={{
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {rec.track?.title || "Unknown Title"}
                      </div>
                      <div className="text-sm text-white/70 truncate">
                        {rec.track?.artist || "Unknown Artist"}
                      </div>
                      <div className="text-xs text-amber-400 font-semibold">
                        Score: {rec.score || 0}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        console.log("Selected Track ID:", rec.track?.id);
                        setSelectedTrackId(rec.track?.id);
                      }}
                      className="ml-4 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm rounded-xl hover:from-green-600 hover:to-emerald-700 font-bold transition-all duration-300 shadow-lg hover:shadow-lg"
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
