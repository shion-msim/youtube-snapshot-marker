import type { Marker } from "../lib/types";
import { formatTime } from "../lib/time";

interface SeekBarWithMarkersProps {
  duration: number;
  currentTime: number;
  markers: Marker[];
  onSeek: (seconds: number) => void;
  disabled?: boolean;
}

export function SeekBarWithMarkers({
  duration,
  currentTime,
  markers,
  onSeek,
  disabled,
}: SeekBarWithMarkersProps) {
  const safeDuration = duration > 0 ? duration : 1;
  const progress = Math.min(100, (currentTime / safeDuration) * 100);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * safeDuration);
  };

  return (
    <section className="seek-section">
      <div className="seek-times">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(safeDuration)}</span>
      </div>
      <div
        className={`seek-bar ${disabled ? "disabled" : ""}`}
        onClick={handleBarClick}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={safeDuration}
        aria-valuenow={currentTime}
      >
        <div className="seek-track" />
        <div className="seek-progress" style={{ width: `${progress}%` }} />
        {markers.map((marker) => {
          const left = (marker.seconds / safeDuration) * 100;
          return (
            <button
              key={marker.id}
              type="button"
              className={`seek-marker ${marker.source}`}
              style={{ left: `${left}%` }}
              title={`${formatTime(marker.seconds)} (${marker.source})`}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(marker.seconds);
              }}
            />
          );
        })}
      </div>
      <input
        type="range"
        min={0}
        max={safeDuration}
        step={0.01}
        value={Math.min(currentTime, safeDuration)}
        disabled={disabled}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        className="seek-range"
      />
    </section>
  );
}
