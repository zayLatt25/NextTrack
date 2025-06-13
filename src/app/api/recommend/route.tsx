import { NextResponse } from 'next/server'

type TrackMetadata = {
  id: string
  title: string
  artist: string
  genre: string
  mood?: string
  tempo?: number
}

type UserPreferences = {
  preferredGenres: string[]
  mood?: string
  tempoRange?: [number, number]
}

type Recommendation = {
  track: TrackMetadata
  score: number
}

const mockTrackDatabase: TrackMetadata[] = [
  { id: '1', title: 'Chill Vibes', artist: 'LoFi Guy', genre: 'lofi', mood: 'calm', tempo: 80 },
  { id: '2', title: 'Hype Beat', artist: 'Upwave', genre: 'hiphop', mood: 'energetic', tempo: 120 },
  { id: '3', title: 'Night Rain', artist: 'AmbientClouds', genre: 'ambient', mood: 'relaxed', tempo: 60 },
  { id: '4', title: 'Retro Synth', artist: 'SynthFlash', genre: 'synthwave', mood: 'nostalgic', tempo: 100 },
]

function scoreTrack(track: TrackMetadata, prefs: UserPreferences): number {
  let score = 0
  if (prefs.preferredGenres?.includes(track.genre)) score += 3
  if (prefs.mood && track.mood === prefs.mood) score += 2
  if (
    prefs.tempoRange &&
    track.tempo &&
    track.tempo >= prefs.tempoRange[0] &&
    track.tempo <= prefs.tempoRange[1]
  ) {
    score += 1
  }
  return score
}

export async function POST(req: Request) {
  const body = await req.json()
  const { preferences }: { preferences?: UserPreferences } = body

  if (!preferences || !Array.isArray(preferences.preferredGenres)) {
    return NextResponse.json({ message: 'Invalid preferences provided' }, { status: 400 })
  }

  const scored = mockTrackDatabase.map(track => ({
    track,
    score: scoreTrack(track, preferences),
  }))

  const sorted = scored.sort((a, b) => b.score - a.score)

  return NextResponse.json({ recommendations: sorted }, { status: 200 })
}