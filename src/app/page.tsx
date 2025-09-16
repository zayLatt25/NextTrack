"use client";

import { useState } from "react";
import SetPreferences from "../components/SetPreferences";
import NowPlaying from "../components/NowPlaying";
import Recommendations from "../components/Recommendations";

// TypeScript interfaces for type safety
interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
}

interface Recommendation {
  track: TrackMetadata;
  score: number;
}

interface APIResponse {
  recommendations: Recommendation[];
}

export default function Home() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [mood, setMood] = useState<string | undefined>();
  const [timeOfDay, setTimeOfDay] = useState<string | undefined>();
  const [activity, setActivity] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTracks, setSelectedTracks] = useState<Array<{
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: { name: string };
    popularity: number;
  }>>([]);

  const getRecommendations = async () => {
    // Validate that tracks are selected before making API call
    if (selectedTracks.length === 0) {
      setErrorMessage("Please add some tracks for recommendations");
      setTimeout(() => setErrorMessage(null), 1000);
      return;
    }

    //clear previous state and set loading indicator
    setErrorMessage(null);
    setRecommendations([]);
    setLoading(true);

    try {
      // POST request to recommendations API with selected tracks and preferences
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Transform tracks to include only necessary data for API
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

      // Handle API response errors
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} - ${res.statusText}`);
      }

      // parse successful responses
      const data = await res.json() as APIResponse;
      setRecommendations(data.recommendations);
      //Clear currently playing track when new recommendations arrive
      setSelectedTrackId(null);
    } catch (error) {
      // handle any errors during the API call
      console.error("Failed to fetch recommendations:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      // Always stop loading state regardless of success or failure
      setLoading(false);
    }
  };

  const handleTrackSelect = (trackId: string) => {
    setSelectedTrackId(trackId);
  };

  return (
    <div className="h-screen overflow-hidden p-4 animated-bg flex flex-col">
      <h1 className="text-4xl font-black mb-6 text-center flex-shrink-0 gradient-text tracking-tight">
        NextTrack
      </h1>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Set Preferences Component */}
        <SetPreferences
          selectedTracks={selectedTracks}
          onTracksChange={setSelectedTracks}
          mood={mood}
          onMoodChange={setMood}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
          activity={activity}
          onActivityChange={setActivity}
          onGetRecommendations={getRecommendations}
          loading={loading}
          errorMessage={errorMessage}
        />

        {/* right side - now playing and recommendations */}
        <div className="flex flex-col h-[700px] space-y-6">
          {/* now playing component */}
          <NowPlaying selectedTrackId={selectedTrackId} />

          {/* recommendations component */}
          <Recommendations
            recommendations={recommendations}
            loading={loading}
            onTrackSelect={handleTrackSelect}
          />
        </div>
      </div>
    </div>
  );
}
