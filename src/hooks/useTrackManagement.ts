import { useState } from 'react';
import { Track } from '../types/track';

export const useTrackManagement = (initialTracks: Track[] = []) => {
  const [selectedTracks, setSelectedTracks] = useState<Track[]>(initialTracks);

  const addTrack = (track: Track) => {
    if (!selectedTracks.find(t => t.id === track.id)) {
      setSelectedTracks(prev => [...prev, track]);
    }
  };

  const removeTrack = (trackId: string) => {
    setSelectedTracks(prev => prev.filter(track => track.id !== trackId));
  };

  const isTrackSelected = (trackId: string) => {
    return selectedTracks.some(track => track.id === trackId);
  };

  const toggleTrack = (track: Track) => {
    if (isTrackSelected(track.id)) {
      removeTrack(track.id);
    } else {
      addTrack(track);
    }
  };

  const clearAllTracks = () => {
    setSelectedTracks([]);
  };

  return {
    selectedTracks,
    addTrack,
    removeTrack,
    isTrackSelected,
    toggleTrack,
    clearAllTracks,
    setSelectedTracks,
  };
};
