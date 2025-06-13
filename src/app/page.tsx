'use client'

import { useState } from 'react'

export default function Home() {
  const [recommendations, setRecommendations] = useState([])
  const [preferredGenre, setPreferredGenre] = useState<string | undefined>()
  const [mood, setMood] = useState<string | undefined>()
  const [tempoRange, setTempoRange] = useState<[number, number] | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const genresOptions = ['lofi', 'ambient', 'hiphop', 'synthwave']
  const moodOptions = ['calm', 'energetic', 'relaxed', 'nostalgic']

  const getRecommendations = async () => {
    if (!preferredGenre) {
      setErrorMessage('Please select a genre.')
      return
    }

    setErrorMessage(null) // Clear any previous error messages

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            preferredGenres: [preferredGenre],
            mood: mood || undefined,
            tempoRange: tempoRange || undefined,
          },
        }),
      })

      if (!res.ok) {
        throw new Error(`Error: ${res.status} - ${res.statusText}`)
      }

      const data = await res.json()
      setRecommendations(data.recommendations)
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900 text-center">Track Recommendations</h1>
      <div className="mb-6 p-4 bg-white rounded shadow-lg max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Set Preferences</h2>
        <div className="mb-4">
          <label className="block text-md font-medium text-gray-900">Preferred Genre</label>
          <select
            className="mt-1 block w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
            onChange={(e) => setPreferredGenre(e.target.value || undefined)}
          >
            <option value="">Select a genre</option>
            {genresOptions.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-md font-medium text-gray-900">Mood</label>
          <select
            className="mt-1 block w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
            onChange={(e) => setMood(e.target.value || undefined)}
          >
            <option value="">Select a mood</option>
            {moodOptions.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-md font-medium text-gray-900">Tempo Range</label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min Tempo"
              className="mt-1 block w-full p-2 border border-gray-300 rounded text-gray-900"
              onChange={(e) => {
                const minTempo = parseInt(e.target.value, 10)
                setTempoRange((prev) => [minTempo, prev?.[1] || 0])
              }}
            />
            <input
              type="number"
              placeholder="Max Tempo"
              className="mt-1 block w-full p-2 border border-gray-300 rounded text-gray-900"
              onChange={(e) => {
                const maxTempo = parseInt(e.target.value, 10)
                setTempoRange((prev) => [prev?.[0] || 0, maxTempo])
              }}
            />
          </div>
        </div>
        {errorMessage && (
          <div className="text-red-600 text-sm mb-4">{errorMessage}</div>
        )}
        <button
          onClick={getRecommendations}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
        >
          Get Recommendations
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec: any) => (
          <div
            key={rec.track.id}
            className="p-6 bg-gray-50 rounded shadow-lg flex flex-col space-y-3"
          >
            <div className="text-xl font-bold text-gray-800">{rec.track.title}</div>
            <div className="text-md text-gray-600">Artist: {rec.track.artist}</div>
            <div className="text-md text-gray-600">Genre: {rec.track.genre}</div>
            <div className="text-md text-gray-600">Mood: {rec.track.mood}</div>
            <div className="text-md text-gray-600">Tempo: {rec.track.tempo} BPM</div>
            <div className="text-md font-semibold text-blue-700">Score: {rec.score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}