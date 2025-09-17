import EmptyState from './EmptyState';
import { TrackSkeleton } from './SkeletonLoader';
import { TrackListProps } from '../types/track';

export default function TrackList({
  tracks,
  onTrackToggle,
  onTrackRemove,
  isTrackSelected,
  title,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
  showClearAll = false,
  onClearAll,
  loading = false,
}: TrackListProps) {
  return (
    <div className="flex flex-col min-h-0">
      <h3 className="text-sm font-semibold text-white/90 mb-3 flex-shrink-0">
        {title}
      </h3>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 bg-white/5 rounded-xl">
          {loading ? (
            <div className="h-full overflow-y-auto space-y-3 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <TrackSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : tracks.length > 0 ? (
            <div className="h-full overflow-y-auto space-y-3 p-4">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                      {track.name}
                    </div>
                    <div className="text-sm text-white/70 truncate">
                      {track.artists[0]?.name}
                    </div>
                  </div>
                  <button
                    onClick={() => isTrackSelected(track.id) ? onTrackRemove(track.id) : onTrackToggle(track)}
                    className={`px-4 py-2 text-xs rounded-lg font-semibold transition-all duration-300 flex-shrink-0 ${
                      isTrackSelected(track.id) 
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-400/30' 
                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-400/30'
                    }`}
                  >
                    {isTrackSelected(track.id) ? 'Remove' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon={emptyStateIcon}
                title={emptyStateTitle}
                description={emptyStateDescription}
              />
            </div>
          )}
        </div>
        {showClearAll && onClearAll && (
          <div className="mt-3 h-6 flex items-center flex-shrink-0">
            <button
              onClick={onClearAll}
              disabled={tracks.length === 0}
              className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-lg hover:bg-white/20 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
