"use client";

import { useState, useEffect } from "react";
import EmptyState from "./EmptyState";

interface NowPlayingProps {
  selectedTrackId: string | null;
}

export default function NowPlaying({ selectedTrackId }: NowPlayingProps) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (selectedTrackId && !isDismissed) {
      // Show login prompt after a short delay to let the iframe load
      const timer = setTimeout(() => {
        setShowLoginPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowLoginPrompt(false);
    }
  }, [selectedTrackId, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowLoginPrompt(false);
  };
  return (
    <div className="p-6 glass rounded-2xl shadow-2xl border border-white/10 flex-shrink-0">
      <h2 className="text-2xl font-bold mb-6 text-white text-center flex items-center justify-center">
        <span className="gradient-text">Now Playing</span>
      </h2>
      {selectedTrackId ? (
        <div>
          <iframe
            style={{ borderRadius: "12px" }}
            src={`https://open.spotify.com/embed/track/${selectedTrackId}?autoplay=true`}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
          {showLoginPrompt && (
            <div className="mt-3 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg relative">
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-amber-300 hover:text-amber-100 transition-colors"
                aria-label="Dismiss warning"
              >
                ✕
              </button>
              {/* Warning message as if not logged in, can only hear previews */}
              <div className="text-sm text-amber-200 text-center pr-6">
                <div className="font-semibold mb-1">🎵 Only hearing previews?</div>
                <div className="text-xs">
                  To play full songs, you need to be logged into Spotify in this browser.
                  <br />
                  <a 
                    href="https://open.spotify.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-100 transition-colors"
                  >
                    Open Spotify Web Player
                  </a> and log in, then refresh this page.
                </div>
              </div>
            </div>
          )}
        </div>
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
