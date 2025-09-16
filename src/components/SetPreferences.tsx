"use client";

import { useState } from "react";
import EmptyState from "./EmptyState";
import { TrackSkeleton } from "./SkeletonLoader";
import preferences from "../data/preferences.json";

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string };
  popularity: number;
}

interface SetPreferencesProps {
  selectedTracks: Track[];
  onTracksChange: (tracks: Track[]) => void;
  mood: string | undefined;
  onMoodChange: (mood: string | undefined) => void;
  timeOfDay: string | undefined;
  onTimeOfDayChange: (timeOfDay: string | undefined) => void;
  activity: string | undefined;
  onActivityChange: (activity: string | undefined) => void;
  onGetRecommendations: () => void;
  loading: boolean;
  errorMessage: string | null;
}

export default function SetPreferences({
  selectedTracks,
  onTracksChange,
  mood,
  onMoodChange,
  timeOfDay,
  onTimeOfDayChange,
  activity,
  onActivityChange,
  onGetRecommendations,
  loading,
  errorMessage,
}: SetPreferencesProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  // Get preferences data
  const availableMoods = preferences.moods;
  const availableTimeOfDay = preferences.timeOfDay;
  const availableActivities = preferences.activities;

  const searchTracks = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setSearchLoading(true);

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
    } finally {
      setSearchLoading(false);
    }
  };

  const addTrackToCollection = (track: Track) => {
    if (!selectedTracks.find(t => t.id === track.id)) {
      onTracksChange([...selectedTracks, track]);
    }
  };

  const removeTrackFromCollection = (trackId: string) => {
    onTracksChange(selectedTracks.filter(track => track.id !== trackId));
  };

  const isTrackSelected = (trackId: string) => {
    return selectedTracks.some(track => track.id === trackId);
  };

  const clearAllTracks = () => {
    onTracksChange([]);
  };

  return (
    <div className="p-6 glass rounded-2xl shadow-2xl border border-white/10 flex flex-col h-[700px]">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center flex-shrink-0">
        <span className="gradient-text">Set Preferences</span>
      </h2>
      
      {/* Search Section */}
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

      {/* Search Results and Selected Tracks */}
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
                onClick={clearAllTracks}
                disabled={selectedTracks.length === 0}
                className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-lg hover:bg-white/20 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 flex-shrink-0">
        <div>
          <label className="block text-sm font-semibold text-white/90 mb-3">Mood</label>
          <select
            className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300"
            value={mood || ""}
            onChange={(e) => onMoodChange(e.target.value || undefined)}
          >
            <option value="" className="bg-gray-800 text-white">Select mood</option>
            {availableMoods.map((moodOption) => (
              <option key={moodOption.value} value={moodOption.value} className="bg-gray-800 text-white">{moodOption.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-white/90 mb-3">Time of Day</label>
          <select
            className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
            value={timeOfDay || ""}
            onChange={(e) => onTimeOfDayChange(e.target.value || undefined)}
          >
            <option value="" className="bg-gray-800 text-white">Select time</option>
            {availableTimeOfDay.map((time) => (
              <option key={time.value} value={time.value} className="bg-gray-800 text-white">{time.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-white/90 mb-3">Activity</label>
          <select
            className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all duration-300"
            value={activity || ""}
            onChange={(e) => onActivityChange(e.target.value || undefined)}
          >
            <option value="" className="bg-gray-800 text-white">Select activity</option>
            {availableActivities.map((activityOption) => (
              <option key={activityOption.value} value={activityOption.value} className="bg-gray-800 text-white">{activityOption.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Get Recommendations Button */}
      <div className="flex-shrink-0">
        <button
          onClick={onGetRecommendations}
          className={`w-full px-6 py-4 rounded-xl disabled:opacity-50 flex items-center justify-center font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-2xl min-h-[56px] ${
            errorMessage 
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600' 
              : 'bg-gradient-to-r from-purple-600 via-cyan-500 to-amber-500 text-white hover:from-purple-700 hover:via-cyan-600 hover:to-amber-600'
          }`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-7 w-7 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10h2zm2 5.291A7.962 7.962 0 014 12H2c0 3.042 1.135 5.824 3 7.938l1-1.647z"></path>
              </svg>
            </div>
          ) : errorMessage ? (
            errorMessage
          ) : (
            "Get Recommendations"
          )}
        </button>
      </div>
    </div>
  );
}
