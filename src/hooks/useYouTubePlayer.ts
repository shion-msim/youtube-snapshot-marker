import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YouTubePlayerApi {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
}

let apiLoading: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoading) return apiLoading;

  apiLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (existing) {
      window.onYouTubeIframeAPIReady = () => resolve();
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.onerror = () => reject(new Error("YouTube IFrame API の読み込みに失敗しました"));
    window.onYouTubeIframeAPIReady = () => resolve();
    document.head.appendChild(tag);
  });

  return apiLoading;
}

export function useYouTubePlayer(
  videoId: string | null,
  onTimeUpdate?: (current: number, duration: number) => void,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!videoId) {
      playerRef.current?.destroy();
      playerRef.current = null;
      setReady(false);
      setDuration(0);
      setCurrentTime(0);
      return;
    }

    let cancelled = false;
    let intervalId: number | undefined;

    const init = async () => {
      await loadYouTubeApi();
      if (cancelled || !containerRef.current || !window.YT) return;

      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            setReady(true);
            setDuration(event.target.getDuration());
          },
          onStateChange: () => {
            if (cancelled || !playerRef.current) return;
            setCurrentTime(playerRef.current.getCurrentTime());
            setDuration(playerRef.current.getDuration());
          },
        },
      });

      intervalId = window.setInterval(() => {
        if (!playerRef.current) return;
        const t = playerRef.current.getCurrentTime();
        const d = playerRef.current.getDuration();
        setCurrentTime(t);
        if (d > 0) setDuration(d);
        onTimeUpdate?.(t, d);
      }, 250);
    };

    void init();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      playerRef.current?.destroy();
      playerRef.current = null;
      setReady(false);
    };
  }, [videoId, onTimeUpdate]);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    setCurrentTime(seconds);
  }, []);

  const getCurrentTime = useCallback(() => {
    return playerRef.current?.getCurrentTime() ?? currentTime;
  }, [currentTime]);

  return {
    containerRef,
    ready,
    duration,
    currentTime,
    seekTo,
    getCurrentTime,
  };
}
