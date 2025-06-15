"use client";

import { useState } from "react";
import preferences from "@/data/preferences.json";

export default function Home() {
  const [recommendations, setRecommendations] = useState([]);
  const [preferredGenre, setPreferredGenre] = useState<string | undefined>();
  const [mood, setMood] = useState<string | undefined>();
  const [currentTrack, setCurrentTrack] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null); // Track ID for the player
  const [loading, setLoading] = useState<boolean>(false); // Loading state for the button

  const getRecommendations = async () => {
    if (!preferredGenre) {
      setErrorMessage("Please select a genre.");
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
          preferences: {
            preferredGenres: [preferredGenre],
            mood: mood || undefined,
            currentTrack: currentTrack || undefined,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();
      setRecommendations(data.recommendations);

      // Clear the selected track ID when new recommendations are fetched
      setSelectedTrackId(null);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
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
              Preferred Genre
            </label>
            <select
              className="mt-1 block w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
              onChange={(e) => setPreferredGenre(e.target.value || undefined)}
            >
              <option value="">Select a genre</option>
              {preferences.genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
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
        {recommendations.map((rec: any) => (
          <div
            key={rec.track?.id || Math.random()}
            className="p-6 bg-gray-50 rounded shadow-lg flex flex-col space-y-3"
          >
            <div className="text-xl font-bold text-gray-800">
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
