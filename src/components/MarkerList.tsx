import type { Marker } from "../lib/types";
import { formatTime } from "../lib/time";

interface MarkerListProps {
  markers: Marker[];
  onSeek: (seconds: number) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, seconds: number) => void;
}

export function MarkerList({ markers, onSeek, onRemove, onUpdate }: MarkerListProps) {
  if (markers.length === 0) {
    return <p className="muted">マーカーがありません。再生位置で「マーカー追加」を押してください。</p>;
  }

  return (
    <ul className="marker-list">
      {markers.map((marker, index) => (
        <li key={marker.id} className={`marker-item ${marker.source}`}>
          <span className="marker-index">{index + 1}</span>
          <button type="button" className="link-btn" onClick={() => onSeek(marker.seconds)}>
            {formatTime(marker.seconds)}
          </button>
          <span className={`badge ${marker.source}`}>
            {marker.source === "auto" ? "自動" : "手動"}
          </span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={Number(marker.seconds.toFixed(3))}
            onChange={(e) => onUpdate(marker.id, parseFloat(e.target.value) || 0)}
            className="marker-time-input"
          />
          <button type="button" className="danger-btn" onClick={() => onRemove(marker.id)}>
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
