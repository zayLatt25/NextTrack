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
    if (selectedTracks.length === 0) {
      setErrorMessage("Please add some tracks for recommendations");
      setTimeout(() => setErrorMessage(null), 1000);
      return;
    }

    setErrorMessage(null);
    setRecommendations([]);
    setLoading(true);

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
      setSelectedTrackId(null);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
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

        {/* Right Side - Now Playing and Recommendations */}
        <div className="flex flex-col h-[700px] space-y-6">
          {/* Now Playing Component */}
          <NowPlaying selectedTrackId={selectedTrackId} />

          {/* Recommendations Component */}
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
