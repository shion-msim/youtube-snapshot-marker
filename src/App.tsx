import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { UrlForm } from "./components/UrlForm";
import { YouTubePlayer } from "./components/YouTubePlayer";
import { SeekBarWithMarkers } from "./components/SeekBarWithMarkers";
import { MarkerList } from "./components/MarkerList";
import { ExportPanel } from "./components/ExportPanel";
import { useMarkers } from "./hooks/useMarkers";
import { extractVideoId, normalizeYoutubeUrl } from "./lib/youtube";
import type { TaskProgress, VideoMetadata } from "./lib/types";
import "./App.css";

function App() {
  const [urlInput, setUrlInput] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [sceneThreshold, setSceneThreshold] = useState(0.35);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const seekRef = useRef<((seconds: number) => void) | null>(null);
  const getTimeRef = useRef<(() => number) | null>(null);

  const {
    markers,
    addMarker,
    addAutoMarkers,
    removeMarker,
    updateMarker,
    clearAutoMarkers,
    setAllMarkers,
    clearAll,
  } = useMarkers();

  useEffect(() => {
    const unlisten = listen<TaskProgress>("task-progress", (event) => {
      const p = event.payload;
      setProgressMessage(`${p.message} (${p.current}/${p.total})`);
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  const handleLoad = useCallback(async () => {
    setError(null);
    const id = extractVideoId(urlInput);
    if (!id) {
      setError("有効な YouTube URL または動画 ID を入力してください");
      return;
    }

    const normalized = normalizeYoutubeUrl(id);
    setLoading(true);
    try {
      const meta = await invoke<VideoMetadata>("get_video_metadata", { url: normalized });
      setVideoId(id);
      setUrl(normalized);
      setMetadata(meta);
      setDuration(meta.duration);
      clearAll();

      const saved = await invoke<{
        markers: { id: string; seconds: number; source: string }[];
      } | null>("load_project", { videoId: id });
      if (saved?.markers?.length) {
        setAllMarkers(
          saved.markers.map((m) => ({
            id: m.id,
            seconds: m.seconds,
            source: m.source === "auto" ? "auto" : "manual",
          })),
        );
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [urlInput, clearAll, setAllMarkers]);

  const handleSeek = useCallback((seconds: number) => {
    seekRef.current?.(seconds);
    setCurrentTime(seconds);
  }, []);

  const handleAddMarker = useCallback(() => {
    const t = getTimeRef.current?.() ?? currentTime;
    addMarker(t, "manual");
  }, [addMarker, currentTime]);

  const persistProject = useCallback(async () => {
    if (!videoId || !url) return;
    await invoke("save_project", {
      project: {
        url,
        videoId,
        markers: markers.map((m) => ({
          id: m.id,
          seconds: m.seconds,
          source: m.source,
        })),
      },
    });
  }, [videoId, url, markers]);

  useEffect(() => {
    if (!videoId || markers.length === 0) return;
    const timer = window.setTimeout(() => {
      void persistProject();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [markers, videoId, persistProject]);

  const handleDetectScenes = useCallback(async () => {
    if (!videoId || !url) return;
    setBusy(true);
    setError(null);
    setProgressMessage("カット検出を開始…");
    try {
      const times = await invoke<number[]>("detect_scenes", {
        url,
        videoId,
        threshold: sceneThreshold,
      });
      addAutoMarkers(times);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }, [videoId, url, sceneThreshold, addAutoMarkers]);

  const handleExport = useCallback(async () => {
    if (!videoId || !url || markers.length === 0) return;

    const selected = await open({
      directory: true,
      multiple: false,
      title: "スナップショットの保存先フォルダ",
    });
    if (!selected || typeof selected !== "string") return;

    setBusy(true);
    setError(null);
    setProgressMessage("書き出しを開始…");
    try {
      const result = await invoke<{ paths: string[] }>("export_snapshots", {
        url,
        videoId,
        markers: markers.map((m) => ({ seconds: m.seconds })),
        outputDir: selected,
      });
      setProgressMessage(`${result.paths.length} 枚を保存しました: ${selected}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }, [videoId, url, markers]);

  return (
    <main className="app">
      <header>
        <h1>YouTube Snapshot Marker</h1>
        <p className="subtitle">
          URL で動画を表示し、シークバーにマーカーを付けて最高画質の静止画を書き出します
        </p>
      </header>

      <UrlForm
        urlInput={urlInput}
        onUrlInputChange={setUrlInput}
        onLoad={handleLoad}
        loading={loading}
        error={error}
      />

      {metadata && (
        <p className="video-title">
          {metadata.title}
          {metadata.width && metadata.height
            ? ` (${metadata.width}×${metadata.height})`
            : ""}
        </p>
      )}

      <YouTubePlayer
        videoId={videoId}
        seekRef={seekRef}
        getTimeRef={getTimeRef}
        onTimeUpdate={(t, d) => {
          setCurrentTime(t);
          if (d > 0) setDuration(d);
        }}
      />

      {videoId && (
        <>
          <SeekBarWithMarkers
            duration={duration}
            currentTime={currentTime}
            markers={markers}
            onSeek={handleSeek}
            disabled={!videoId}
          />

          <div className="marker-actions">
            <button type="button" onClick={handleAddMarker} disabled={busy}>
              現在位置にマーカー追加
            </button>
          </div>

          <MarkerList
            markers={markers}
            onSeek={handleSeek}
            onRemove={removeMarker}
            onUpdate={updateMarker}
          />

          <ExportPanel
            sceneThreshold={sceneThreshold}
            onThresholdChange={setSceneThreshold}
            onDetectScenes={handleDetectScenes}
            onClearAuto={clearAutoMarkers}
            onExport={handleExport}
            busy={busy}
            progressMessage={progressMessage}
            markerCount={markers.length}
          />
        </>
      )}
    </main>
  );
}

export default App;
