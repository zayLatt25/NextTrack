export interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string };
  popularity: number;
}

export interface TrackSearchResult {
  tracks: Track[];
}

export interface TrackSearchProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  searchLoading: boolean;
}

export interface TrackListProps {
  tracks: Track[];
  onTrackToggle: (track: Track) => void;
  onTrackRemove: (trackId: string) => void;
  isTrackSelected: (trackId: string) => boolean;
  title: string;
  emptyStateIcon: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  showClearAll?: boolean;
  onClearAll?: () => void;
  loading?: boolean;
}
