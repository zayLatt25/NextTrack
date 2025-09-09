# NextTrack Prototype

A Next.js-based music recommendation system that analyzes listening sequences to suggest the next track. Built with TypeScript and integrated with the Spotify API.

## 🎯 Features

- **Sequence-aware recommendations**: Analyzes listening history patterns to predict the next track
- **Multi-factor scoring**: Genre transitions, artist patterns, popularity trends, and mood matching
- **Stateless design**: No user tracking, privacy-focused approach
- **Evaluation metrics**: Built-in quality assessment for recommendation quality
- **Metadata-based**: Uses Spotify API for track metadata (no audio features required)
- **Mood-aware**: Supports mood-based genre and popularity matching

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

Get music recommendations based on listening history and preferences.

**Request Body:**
```json
{
  "listeningHistory": ["track_id_1", "track_id_2", "track_id_3"],
  "preferences": {
    "preferredGenres": ["pop", "rock", "indie"],
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
  "sequenceAnalysis": {
    "genreTransitions": {"pop->rock": 2, "rock->indie": 1},
    "artistTransitions": {"Artist A->Artist B": 1, "Artist B->Artist C": 1},
    "popularityTrend": [85, 90, 75],
    "releaseYearTrend": [2023, 2022, 2024],
    "artistDiversity": 0.6
  },
  "evaluationMetrics": {
    "genreCoherence": 0.8,
    "popularitySmoothness": 0.9,
    "genreConsistency": 0.7
  },
  "totalTracksAnalyzed": 3,
  "searchStrategy": "sequence-based"
}
```

### GET `/api/recommend`

Get API information and usage examples.

**Response:**
```json
{
  "message": "NextTrack Recommendation API",
  "endpoints": {
    "POST /api/recommend": "Get music recommendations based on listening history",
    "GET /api/recommend?action=evaluate": "Get evaluation metrics and test data"
  },
  "example": {
    "listeningHistory": ["4iV5W9uYEdYUVa79Axb7Rh", "3n3Ppam7vgaVa1iaRUmn9T"],
    "preferences": {
      "preferredGenres": ["pop", "rock"],
      "mood": "happy"
    },
    "context": {
      "timeOfDay": "afternoon",
      "activity": "relax"
    }
  }
}
```

### GET `/api/recommend?action=evaluate`

Get evaluation metrics and test data for testing the recommendation system.

## 🧮 Scoring Algorithm

The recommendation system uses a multi-factor scoring approach with the following weights:

1. **Genre Transition Probability** (Weight: 4)
   - Analyzes genre transitions in listening history
   - Predicts most likely next genre based on patterns

2. **Popularity Progression** (Weight: 3)
   - Ensures smooth popularity transitions
   - Maintains consistent listening level based on trends

3. **Artist Transition** (Weight: 3)
   - Tracks artist patterns in listening history
   - Maintains artist flow consistency

4. **User Preferences** (Weight: 2)
   - Genre preferences matching
   - Mood-based genre and popularity matching
   - Title similarity scoring

5. **Artist Diversity** (Weight: 1)
   - Encourages variety when needed
   - Prevents repetitive artist sequences

## 🔍 Sequence Analysis

The system analyzes listening patterns to understand user behavior:

- **Genre Transitions**: Tracks how genres flow together in listening history
- **Artist Transitions**: Monitors artist patterns and transitions over time
- **Popularity Trends**: Analyzes popularity progression and smoothness
- **Release Year Trends**: Tracks temporal patterns in music selection
- **Artist Diversity**: Measures variety in artist selection

## 📊 Evaluation Metrics

Built-in quality assessment includes:

- **Genre Coherence**: Measures how well genres flow together in recommendations
- **Popularity Smoothness**: Evaluates smoothness of popularity transitions
- **Genre Consistency**: Assesses consistency of genre selection

## 🎵 How It Works

1. **Input Processing**: Validates listening history and preferences
2. **History Analysis**: Fetches metadata for all tracks in listening history
3. **Pattern Recognition**: Analyzes genre, artist, and popularity patterns
4. **Track Discovery**: Searches for similar tracks using Spotify API
5. **Scoring**: Applies multi-factor scoring algorithm
6. **Ranking**: Sorts recommendations by calculated scores
7. **Evaluation**: Calculates quality metrics for assessment

## 🎨 Mood Support

The system supports mood-based recommendations with predefined mappings:

- **Happy**: Pop, dance, electronic, indie-pop (popularity 60-100)
- **Sad**: Indie, folk, acoustic, alternative (popularity 20-80)
- **Energetic**: Rock, electronic, dance, hip-hop, metal (popularity 40-100)
- **Calm**: Ambient, classical, jazz, acoustic, chill (popularity 10-70)

## 🏆 Project Requirements

✅ **Stateless API**: No user tracking or data persistence  
✅ **Listening History Input**: Accepts sequence of track identifiers  
✅ **External Data Sources**: Integrates with Spotify API  
✅ **Evaluation Strategy**: Built-in quality metrics  
✅ **RESTful Design**: Standard HTTP methods and responses  
✅ **Better than Random**: Sophisticated multi-factor scoring algorithm  

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
    listeningHistory: ['4iV5W9uYEdYUVa79Axb7Rh', '3n3Ppam7vgaVa1iaRUmn9T'],
    preferences: {
      preferredGenres: ['pop', 'indie'],
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

### Test the API
```bash
# Test basic functionality
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "listeningHistory": ["4iV5W9uYEdYUVa79Axb7Rh"],
    "preferences": {
      "preferredGenres": ["pop"],
      "mood": "happy"
    }
  }'
```

---

Built using Next.js and Spotify API