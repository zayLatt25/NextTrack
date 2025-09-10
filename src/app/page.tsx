"use client";

import { useState } from "react";
import preferences from "@/data/preferences.json";

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
  const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
  const [mood, setMood] = useState<string | undefined>();
  const [currentTrack, setCurrentTrack] = useState<string | undefined>();
  const [listeningHistory, setListeningHistory] = useState<string>(""); // New: listening history input
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null); // Track ID for the player
  const [loading, setLoading] = useState<boolean>(false); // Loading state for the button

  const getRecommendations = async () => {
    if (preferredGenres.length === 0) {
      setErrorMessage("Please select at least one genre.");
      return;
    }

    setErrorMessage(null);
    setRecommendations([]);
    setLoading(true); // Set loading state to true

    try {
      // Parse listening history from comma-separated string
      const historyArray = listeningHistory 
        ? listeningHistory.split(',').map(id => id.trim()).filter(id => id.length > 0)
        : [];

      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listeningHistory: historyArray,
          preferences: {
            preferredGenres: preferredGenres,
            mood: mood || undefined,
            currentTrack: currentTrack || undefined,
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
              Current Listening Track
            </label>
            <input
              type="text"
              placeholder="Enter track name"
              className="mt-1 block w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
              onChange={(e) => setCurrentTrack(e.target.value || undefined)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-md font-medium text-gray-900">
              Preferred Genres
            </label>
            <div className="mt-1">
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded p-2 bg-white">
                {preferences.genres.map((genre) => (
                  <label key={genre} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      value={genre}
                      checked={preferredGenres.includes(genre)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreferredGenres([...preferredGenres, genre]);
                        } else {
                          setPreferredGenres(preferredGenres.filter(g => g !== genre));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{genre}</span>
                  </label>
                ))}
              </div>
              {preferredGenres.length > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">Selected: </span>
                    <span className="text-sm text-blue-600 font-medium">
                      {preferredGenres.join(', ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferredGenres([])}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Clear All
                  </button>
                </div>
              )}
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
              {preferences.moods.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-md font-medium text-gray-900">
              Listening History (Track IDs)
            </label>
            <input
              type="text"
              className="mt-1 block w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
              placeholder="Enter track IDs separated by commas (e.g., 4iV5W9uYEdYUVa79Axb7Rh, 3n3Ppam7vgaVa1iaRUmn9T)"
              value={listeningHistory}
              onChange={(e) => setListeningHistory(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Enter Spotify track IDs to get sequence-based recommendations
            </p>
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
