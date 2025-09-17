"use client";

import TrackSearch from "./TrackSearch";
import TrackList from "./TrackList";
import PreferenceSelectors from "./PreferenceSelectors";
import RecommendationButton from "./RecommendationButton";
import { useTrackSearch } from "../hooks/useTrackSearch";
import { useTrackManagement } from "../hooks/useTrackManagement";
import { Track } from "../types/track";
import preferences from "../data/preferences.json";

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
  // Use custom hooks for track management and search
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchTracks,
  } = useTrackSearch();

  const {
    removeTrack,
    isTrackSelected,
    toggleTrack,
    clearAllTracks,
  } = useTrackManagement(selectedTracks);

  // Get preferences data
  const availableMoods = preferences.moods;
  const availableTimeOfDay = preferences.timeOfDay;
  const availableActivities = preferences.activities;

  // Handle track changes and sync with parent component
  const handleTrackToggle = (track: Track) => {
    toggleTrack(track);
    const updatedTracks = isTrackSelected(track.id) 
      ? selectedTracks.filter(t => t.id !== track.id)
      : [...selectedTracks, track];
    onTracksChange(updatedTracks);
  };

  const handleTrackRemove = (trackId: string) => {
    removeTrack(trackId);
    onTracksChange(selectedTracks.filter(track => track.id !== trackId));
  };

  const handleClearAllTracks = () => {
    clearAllTracks();
    onTracksChange([]);
  };

  return (
    <div className="p-6 glass rounded-2xl shadow-2xl border border-white/10 flex flex-col h-[700px]">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center flex-shrink-0">
        <span className="gradient-text">Set Preferences</span>
      </h2>
      
      {/* Search Section */}
      <TrackSearch
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={searchTracks}
        searchLoading={searchLoading}
      />

      {/* Search Results and Selected Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 flex-1 min-h-0">
        {/* Search Results */}
        <TrackList
          tracks={searchResults}
          onTrackToggle={handleTrackToggle}
          onTrackRemove={handleTrackRemove}
          isTrackSelected={isTrackSelected}
          title="Search Results"
          emptyStateIcon="🔍"
          emptyStateTitle="No search results"
          emptyStateDescription="Search for tracks to see results here"
          loading={searchLoading}
        />

        {/* Selected Tracks */}
        <TrackList
          tracks={selectedTracks}
          onTrackToggle={handleTrackToggle}
          onTrackRemove={handleTrackRemove}
          isTrackSelected={isTrackSelected}
          title={`Selected Tracks (${selectedTracks.length})`}
          emptyStateIcon="🎵"
          emptyStateTitle="No tracks selected"
          emptyStateDescription="Add tracks from search results"
          showClearAll={true}
          onClearAll={handleClearAllTracks}
        />
      </div>

      {/* Preferences */}
      <PreferenceSelectors
        mood={mood}
        onMoodChange={onMoodChange}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={onTimeOfDayChange}
        activity={activity}
        onActivityChange={onActivityChange}
        availableMoods={availableMoods}
        availableTimeOfDay={availableTimeOfDay}
        availableActivities={availableActivities}
      />

      {/* Get Recommendations Button */}
      <RecommendationButton
        onGetRecommendations={onGetRecommendations}
        loading={loading}
        errorMessage={errorMessage}
      />
    </div>
  );
}
