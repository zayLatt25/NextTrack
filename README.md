# NextTrack Prototype

A Next.js-based music recommendation system that suggests tracks based on user-selected reference tracks. Built with TypeScript and integrated with the Spotify API.

## 🎯 Features

- **Track-based recommendations**: Analyzes selected reference tracks to suggest similar music
- **Multi-factor scoring**: Track similarity, mood matching, context awareness, and popularity
- **Track search and selection**: Built-in Spotify search interface for finding reference tracks
- **Stateless design**: No user tracking, privacy-focused approach
- **Evaluation metrics**: Built-in quality assessment for recommendation quality
- **Metadata-based**: Uses Spotify API for track metadata (no audio features required)
- **Mood-aware**: Supports mood-based genre and popularity matching
- **Context-aware**: Considers time of day and activity for better recommendations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Spotify Developer Account
- Spotify API credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd NextTrack-Prototype
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📡 API Documentation

### POST `/api/recommend`

Get music recommendations based on selected reference tracks and preferences.

**Request Body:**
```json
{
  "selectedTracks": [
    {
      "id": "track_id_1",
      "name": "Song Name",
      "artists": [{"name": "Artist Name"}],
      "album": {"name": "Album Name"},
      "popularity": 80
    }
  ],
  "preferences": {
    "mood": "happy"
  },
  "context": {
    "timeOfDay": "afternoon",
    "activity": "relax"
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "track": {
        "id": "track_id",
        "title": "Song Title",
        "artist": "Artist Name",
        "genre": "pop",
        "popularity": 85,
        "releaseYear": 2023,
        "album": "Album Name"
      },
      "score": 8.5
    }
  ],
  "evaluationMetrics": {
    "genreCoherence": 0.8,
    "popularitySmoothness": 0.9,
    "genreConsistency": 0.7
  },
  "searchStrategy": "track-based",
  "searchQueries": ["Song Name Artist Name", "pop", "indie"],
  "totalTracksFound": 79,
  "selectedTracksCount": 1,
  "extractedGenres": ["pop", "indie"]
}
```

### POST `/api/search`

Search for tracks using Spotify's search API.

**Request Body:**
```json
{
  "query": "search term"
}
```

**Response:**
```json
{
  "tracks": [
    {
      "id": "track_id",
      "name": "Song Name",
      "artists": [{"name": "Artist Name"}],
      "album": {"name": "Album Name"},
      "popularity": 80,
      "preview_url": "https://...",
      "external_urls": {"spotify": "https://..."}
    }
  ],
  "query": "search term",
  "total": 20
}
```

### GET `/api/recommend`

Get API information and usage examples.

**Response:**
```json
{
  "message": "NextTrack Recommendation API",
  "endpoints": {
    "POST /api/recommend": "Get music recommendations based on selected tracks",
    "GET /api/recommend?action=evaluate": "Get evaluation metrics and test data"
  },
  "example": {
    "selectedTracks": [
      {
        "id": "4iV5W9uYEdYUVa79Axb7Rh",
        "name": "Song Name",
        "artists": [{"name": "Artist Name"}],
        "album": {"name": "Album Name"},
        "popularity": 80
      }
    ],
    "preferences": {
      "mood": "happy"
    },
    "context": {
      "timeOfDay": "afternoon",
      "activity": "relax"
    }
  }
}
```

### GET `/api/search`

Get search API information.

**Response:**
```json
{
  "message": "Spotify Search API",
  "usage": "Send POST request with { query: 'search term' } to search for tracks"
}
```

### GET `/api/recommend?action=evaluate`

Get evaluation metrics and test data for testing the recommendation system.

## 🧮 Scoring Algorithm

The recommendation system uses a balanced multi-factor scoring approach that prioritizes track similarity and user preferences:

1. **Track Similarity** (Weight: 4) - **Highest Priority**
   - Artist similarity matching (50% weight)
   - Title similarity scoring (30% weight)
   - Popularity similarity (20% weight)
   - Compares against all selected reference tracks

2. **Genre Matching** (Weight: 3)
   - Matches against genres extracted from selected tracks
   - Auto-extracts genres from artist metadata
   - Rewards tracks with matching genres

3. **Mood-based Scoring** (Weight: 3)
   - Genre matching based on mood preferences
   - Popularity range matching for mood context
   - Mood-specific genre and popularity combinations

4. **Context Awareness** (Weight: 2)
   - Time of day scoring (60% weight)
   - Activity-based scoring (40% weight)
   - Considers morning/afternoon/evening/night preferences
   - Matches workout/study/party/relax activity contexts

5. **Popularity Bonus** (Weight: 1)
   - Rewards tracks with popularity > 70
   - Helps surface well-known tracks

**Scoring Formula:**
```
Score = (Track Similarity × 4) + (Genre Match × 3) + (Mood Similarity × 3) + (Context Score × 2) + (Popularity Bonus × 1)
```

## 🔍 Track Analysis

The system analyzes selected reference tracks to understand user preferences:

- **Genre Extraction**: Automatically extracts genres from artist metadata
- **Artist Analysis**: Identifies artist patterns and preferences
- **Popularity Analysis**: Understands preferred popularity ranges
- **Mood Mapping**: Maps tracks to mood-based preferences
- **Context Matching**: Matches tracks to time and activity contexts

## 📊 Evaluation Metrics

Built-in quality assessment includes:

- **Genre Coherence**: Measures how well genres flow together in recommendations
- **Popularity Smoothness**: Evaluates smoothness of popularity transitions
- **Genre Consistency**: Assesses consistency of genre selection

## 🎵 How It Works

### User Interface Workflow
1. **Search Tracks**: Use the search bar to find songs, artists, or albums
2. **Select Reference Tracks**: Add tracks to your selection from search results
3. **Set Preferences**: Choose mood, time of day, and activity context
4. **Get Recommendations**: Click "Get Recommendations" to receive personalized suggestions
5. **Play Tracks**: Use the embedded Spotify player to preview recommendations

### Backend Processing
1. **Track Selection**: Users search and select reference tracks using the built-in search interface
2. **Genre Extraction**: System automatically extracts genres from selected tracks' artist metadata
3. **Search Query Generation**: Creates multiple search queries based on:
   - Selected track names and artists
   - Extracted genres from reference tracks
4. **Track Discovery**: Fetches tracks from multiple Spotify API searches and removes duplicates
5. **Multi-Factor Scoring**: Applies scoring algorithm considering:
   - Track similarity to reference tracks
   - Genre matching with extracted genres
   - Mood-based preferences
   - Context awareness (time of day, activity)
   - Popularity bonuses
6. **Filtering**: Removes selected reference tracks from recommendations
7. **Ranking**: Sorts recommendations by calculated scores (rounded to 2 decimal places)
8. **Evaluation**: Calculates quality metrics for assessment

## 🎨 Mood Support

The system supports mood-based recommendations with predefined mappings:

- **Happy**: Pop, dance, electronic, indie-pop (popularity 60-100)
- **Sad**: Indie, folk, acoustic, alternative (popularity 20-80)
- **Energetic**: Rock, electronic, dance, hip-hop, metal (popularity 40-100)
- **Calm**: Ambient, classical, jazz, acoustic, chill (popularity 10-70)

## 🏆 Project Requirements

✅ **Stateless API**: No user tracking or data persistence  
✅ **Track Selection Input**: Accepts selected reference tracks for recommendations  
✅ **External Data Sources**: Integrates with Spotify API for search and metadata  
✅ **Evaluation Strategy**: Built-in quality metrics for recommendation assessment  
✅ **RESTful Design**: Standard HTTP methods and responses  
✅ **Better than Random**: Sophisticated multi-factor scoring algorithm  
✅ **Search Functionality**: Built-in track search interface  
✅ **Context Awareness**: Time of day and activity-based recommendations  

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API Integration**: Spotify Web API
- **Deployment**: Vercel-ready

## 📝 Usage Examples

### Basic Recommendation Request
```javascript
const response = await fetch('/api/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    selectedTracks: [
      {
        id: '4iV5W9uYEdYUVa79Axb7Rh',
        name: 'Song Name',
        artists: [{ name: 'Artist Name' }],
        album: { name: 'Album Name' },
        popularity: 80
      }
    ],
    preferences: {
      mood: 'happy'
    },
    context: {
      timeOfDay: 'afternoon',
      activity: 'relax'
    }
  })
});

const data = await response.json();
console.log(data.recommendations);
```

### Search for Tracks
```javascript
const searchResponse = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'The Beatles'
  })
});

const searchData = await searchResponse.json();
console.log(searchData.tracks);
```

### Test the API
```bash
# Test recommendations with selected tracks
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "selectedTracks": [
      {
        "id": "4iV5W9uYEdYUVa79Axb7Rh",
        "name": "Song Name",
        "artists": [{"name": "Artist Name"}],
        "album": {"name": "Album Name"},
        "popularity": 80
      }
    ],
    "preferences": {
      "mood": "happy"
    }
  }'

# Test search functionality
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "The Beatles"}'
```

---

Built using Next.js and Spotify API