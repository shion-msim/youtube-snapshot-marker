import { useEffect } from "react";
import { useYouTubePlayer } from "../hooks/useYouTubePlayer";

interface YouTubePlayerProps {
  videoId: string | null;
  seekRef?: React.MutableRefObject<((seconds: number) => void) | null>;
  getTimeRef?: React.MutableRefObject<(() => number) | null>;
  onTimeUpdate?: (current: number, duration: number) => void;
}

export function YouTubePlayer({
  videoId,
  seekRef,
  getTimeRef,
  onTimeUpdate,
}: YouTubePlayerProps) {
  const { containerRef, ready, duration, currentTime, seekTo, getCurrentTime } =
    useYouTubePlayer(videoId, onTimeUpdate);

  useEffect(() => {
    if (seekRef) seekRef.current = seekTo;
    if (getTimeRef) getTimeRef.current = getCurrentTime;
  }, [seekRef, getTimeRef, seekTo, getCurrentTime]);

  return (
    <section className="player-section">
      <div className="player-wrapper">
        {!videoId && (
          <div className="player-placeholder">
            URL を読み込むと動画が表示されます
          </div>
        )}
        <div ref={containerRef} className="player-container" />
      </div>
      {videoId && (
        <p className="player-meta">
          {ready ? `長さ: ${duration.toFixed(1)} 秒` : "プレイヤー準備中…"} / 現在:{" "}
          {currentTime.toFixed(2)} 秒
        </p>
      )}
    </section>
  );
}
