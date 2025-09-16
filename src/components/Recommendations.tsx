"use client";

import EmptyState from "./EmptyState";
import { RecommendationSkeleton } from "./SkeletonLoader";

interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
}

interface Recommendation {
  track: TrackMetadata;
  score: number;
}

interface RecommendationsProps {
  recommendations: Recommendation[];
  loading: boolean;
  onTrackSelect: (trackId: string) => void;
}

export default function Recommendations({ 
  recommendations, 
  loading, 
  onTrackSelect 
}: RecommendationsProps) {
  return (
    <div className="p-4 glass rounded-2xl shadow-2xl border border-white/10 flex-1 flex flex-col min-h-0">
      <h2 className="text-xl font-bold mb-3 text-white text-center flex items-center justify-center flex-shrink-0">
        <span className="gradient-text">Recommendations</span>
      </h2>
      <div className="grid grid-cols-1 gap-3 flex-1 overflow-y-auto min-h-0">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <RecommendationSkeleton key={index} />
          ))
        ) : recommendations.length > 0 ? (
          recommendations.map((rec: Recommendation) => (
            <div
              key={rec.track?.id || Math.random()}
              className="p-5 bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 hover:shadow-lg transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex-1 min-w-0">
                <div
                  className="font-bold text-white truncate group-hover:text-purple-300 transition-colors duration-300"
                  style={{
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {rec.track?.title || "Unknown Title"}
                </div>
                <div className="text-sm text-white/70 truncate">
                  {rec.track?.artist || "Unknown Artist"}
                </div>
                <div className="text-xs text-amber-400 font-semibold">
                  Score: {rec.score || 0}
                </div>
              </div>
              <button
                onClick={() => onTrackSelect(rec.track?.id)}
                className="ml-4 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm rounded-xl hover:from-green-600 hover:to-emerald-700 font-bold transition-all duration-300 shadow-lg hover:shadow-lg"
              >
                Play
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <EmptyState
              icon="🎯"
              title="No recommendations yet"
              description="Get personalized recommendations by adding tracks and clicking 'Get Recommendations'"
            />
          </div>
        )}
      </div>
    </div>
  );
}
