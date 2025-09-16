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
    "mood": "romantic"
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
      "mood": "romantic"
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

1. **Track Similarity** (Weight: 2, capped) - **Highest Priority**
   - Artist similarity matching (50% weight)
   - Title similarity scoring (30% weight)
   - Popularity similarity (20% weight)
   - Compares against all selected reference tracks
   - Maximum contribution: 2 points

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
Score = (Track Similarity × 2, capped) + (Genre Match × 3) + (Mood Similarity × 3) + (Context Score × 2) + (Popularity Bonus × 1)
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

### Recommendation Engine - Step-by-Step Process

#### **Phase 1: Input Collection & Validation**
1. **User Input Gathering**
   - User selects tracks from Spotify search results
   - User optionally sets mood preferences (happy, sad, energetic, calm, romantic)
   - User optionally sets context (time of day: morning/afternoon/evening/night)
   - User optionally sets activity (workout/study/party/relax)

2. **Input Validation**
   - System validates that at least one track is selected before proceeding
   - If no tracks selected, shows error message and stops

#### **Phase 2: Authentication & Data Fetching**
3. **Spotify Authentication**
   - System obtains Spotify access token using client credentials flow
   - Uses `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` from environment variables

4. **Genre Extraction from Selected Tracks**
   - For each selected track, system fetches artist metadata from Spotify
   - Extracts all genres associated with each artist
   - Creates a comprehensive list of genres from all selected tracks
   - This helps understand the user's musical taste profile

#### **Phase 3: Search Query Generation**
5. **Multi-Query Strategy**
   - **Track-based queries**: Creates search queries using track names + artist names (up to 3)
   - **Genre-based queries**: Uses extracted genres from selected tracks (up to 3)
   - **Mood-based queries**: If mood is set, adds preferred genres for that mood (up to 2)
   - Example: If user selected "Bohemian Rhapsody" and mood is "energetic", queries might include:
     - "Bohemian Rhapsody Queen" (track-based)
     - "rock" (genre-based)
     - "electronic dance" (mood-based)

#### **Phase 4: Track Discovery**
6. **Parallel Track Fetching**
   - Executes all search queries simultaneously using `Promise.all()`
   - Each query returns up to 20 tracks from Spotify
   - Handles API failures gracefully (continues with successful queries)

7. **Deduplication**
   - Removes duplicate tracks based on Spotify track ID
   - Ensures each unique track appears only once in the candidate pool

#### **Phase 5: Track Scoring & Ranking**
8. **Metadata Enrichment**
   - For each candidate track, fetches artist metadata to get genre information
   - Builds comprehensive `TrackMetadata` objects with:
     - Track ID, title, artist, genre
     - Popularity score, release year, album name

9. **Multi-Factor Scoring System**
   The system calculates a score for each track using weighted factors:

   **a) Genre Match (Weight: 3)**
   - +3 points if track genre matches any extracted genre from selected tracks

   **b) Selected Track Similarity (Weight: 2, capped at 2)**
   - Artist similarity (50% weight): Checks if artist names contain each other
   - Title similarity (30% weight): Compares track titles with fuzzy matching
   - Popularity similarity (20% weight): Compares popularity scores
   - Applies penalty for remix/cover versions (multiplies by 0.7)

   **c) Mood Similarity (Weight: 3)**
   - Maps mood to preferred genres and popularity ranges:
     - Happy: pop, dance, electronic, indie-pop (60-100 popularity)
     - Sad: indie, folk, acoustic, alternative (20-80 popularity)
     - Energetic: rock, electronic, dance, hip-hop, metal (40-100 popularity)
     - Calm: ambient, classical, jazz, acoustic, chill (10-70 popularity)
     - Romantic: r&b, soul, jazz, acoustic, indie, pop, folk (30-90 popularity)
   - +3 points for good mood match, -1.5 points for poor mood match

   **d) Context Scoring (Weight: 2)**
   - **Time of Day**: Different genres preferred for morning/afternoon/evening/night
   - **Activity**: Different genres preferred for workout/study/party/relax
   - Combines both factors with 60% time weight, 40% activity weight

   **e) Popularity Bonus (Weight: 1)**
   - +1 point for tracks with popularity > 70

#### **Phase 6: Filtering & Finalization**
10. **Quality Filtering**
    - Removes selected tracks from recommendations (no self-recommendations)
    - Deduplicates by title + artist combination
    - Sorts by calculated score (highest first)

11. **Result Limiting**
    - Returns top 20 recommendations maximum
    - Ensures manageable result set for user interface

#### **Phase 7: Evaluation & Response**
12. **Quality Metrics Calculation**
    - **Genre Coherence**: Ratio of dominant genre in recommendations
    - **Popularity Smoothness**: How smoothly popularity varies across recommendations
    - **Genre Consistency**: Diversity ratio of genres in recommendations

13. **API Response**
    - Returns recommendations with scores
    - Includes evaluation metrics for quality assessment
    - Provides search strategy and query information for debugging
    - Shows total tracks found and extracted genres

### Key Features of the Engine:

- **Multi-signal approach**: Combines track similarity, mood, context, and popularity
- **Fuzzy matching**: Handles variations in artist names and track titles
- **Context awareness**: Considers time of day and activity for better recommendations
- **Quality control**: Removes duplicates and applies penalties for remixes/covers
- **Parallel processing**: Efficiently fetches data from multiple sources simultaneously
- **Graceful degradation**: Continues working even if some API calls fail
- **Evaluation metrics**: Provides feedback on recommendation quality

## 🎨 Mood Support

The system supports mood-based recommendations with predefined mappings:

- **Happy**: Pop, dance, electronic, indie-pop (popularity 60-100)
- **Sad**: Indie, folk, acoustic, alternative (popularity 20-80)
- **Energetic**: Rock, electronic, dance, hip-hop, metal (popularity 40-100)
- **Calm**: Ambient, classical, jazz, acoustic, chill (popularity 10-70)
- **Romantic**: R&B, soul, jazz, acoustic, indie, pop, folk (popularity 30-90)

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
      mood: 'romantic'
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
      "mood": "romantic"
    }
  }'

# Test search functionality
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "The Beatles"}'
```

---

Built using Next.js and Spotify API