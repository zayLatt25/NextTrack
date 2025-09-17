import { TrackSearchProps } from '../types/track';

export default function TrackSearch({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchLoading,
}: TrackSearchProps) {
  return (
    <div className="mb-6 flex-shrink-0">
      <label className="block text-sm font-semibold text-white/90 mb-3">
        Search for Tracks
      </label>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search for songs, artists, or albums..."
          className="flex-1 p-4 border border-white/20 rounded-xl bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
        />
        <button
          onClick={onSearch}
          disabled={searchLoading}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl hover:from-purple-700 hover:to-cyan-600 disabled:opacity-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-lg"
        >
          {searchLoading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10h2zm2 5.291A7.962 7.962 0 014 12H2c0 3.042 1.135 5.824 3 7.938l1-1.647z"></path>
            </svg>
          ) : (
            'Search'
          )}
        </button>
      </div>
    </div>
  );
}
