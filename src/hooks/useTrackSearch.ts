import { useState } from 'react';
import { Track } from '../types/track';

export const useTrackSearch = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  const searchTracks = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setSearchLoading(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();
      setSearchResults(data.tracks);
    } catch (error) {
      console.error('Failed to search tracks:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearchResults = () => {
    setSearchResults([]);
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchTracks,
    clearSearchResults,
  };
};
