"use client";

import EmptyState from "./EmptyState";

interface NowPlayingProps {
  selectedTrackId: string | null;
}

export default function NowPlaying({ selectedTrackId }: NowPlayingProps) {
  return (
    <div className="p-6 glass rounded-2xl shadow-2xl border border-white/10 flex-shrink-0">
      <h2 className="text-2xl font-bold mb-6 text-white text-center flex items-center justify-center">
        <span className="gradient-text">Now Playing</span>
      </h2>
      {selectedTrackId ? (
        <iframe
          style={{ borderRadius: "12px" }}
          src={`https://open.spotify.com/embed/track/${selectedTrackId}?autoplay=true`}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      ) : (
        <div className="h-[152px] flex items-center justify-center">
          <EmptyState
            icon="🎧"
            title="No track selected"
            description="Select a track to play it here"
          />
        </div>
      )}
    </div>
  );
}
