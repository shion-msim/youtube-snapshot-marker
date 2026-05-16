interface ExportPanelProps {
  sceneThreshold: number;
  onThresholdChange: (value: number) => void;
  onDetectScenes: () => void;
  onClearAuto: () => void;
  onExport: () => void;
  busy: boolean;
  progressMessage: string | null;
  markerCount: number;
}

export function ExportPanel({
  sceneThreshold,
  onThresholdChange,
  onDetectScenes,
  onClearAuto,
  onExport,
  busy,
  progressMessage,
  markerCount,
}: ExportPanelProps) {
  return (
    <section className="export-panel">
      <h2>カット検出・書き出し</h2>
      <div className="export-row">
        <label>
          シーン閾値
          <input
            type="range"
            min={0.15}
            max={0.6}
            step={0.05}
            value={sceneThreshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            disabled={busy}
          />
          <span>{sceneThreshold.toFixed(2)}</span>
        </label>
        <button type="button" onClick={onDetectScenes} disabled={busy}>
          カットを自動検出
        </button>
        <button type="button" onClick={onClearAuto} disabled={busy}>
          自動マーカーを削除
        </button>
        <button type="button" className="primary" onClick={onExport} disabled={busy || markerCount === 0}>
          スナップショット書き出し ({markerCount})
        </button>
      </div>
      {progressMessage && <p className="progress">{progressMessage}</p>}
    </section>
  );
}
