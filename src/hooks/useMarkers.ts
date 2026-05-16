import { useCallback, useState } from "react";
import { mergeMarkers, sortMarkers } from "../lib/markers";
import type { Marker, MarkerSource } from "../lib/types";

function newId(): string {
  return crypto.randomUUID();
}

export function useMarkers() {
  const [markers, setMarkers] = useState<Marker[]>([]);

  const addMarker = useCallback((seconds: number, source: MarkerSource = "manual") => {
    setMarkers((prev) =>
      sortMarkers(
        mergeMarkers(prev, [{ id: newId(), seconds, source }]),
      ),
    );
  }, []);

  const addAutoMarkers = useCallback((timestamps: number[]) => {
    const incoming: Marker[] = timestamps.map((seconds) => ({
      id: newId(),
      seconds,
      source: "auto" as const,
    }));
    setMarkers((prev) => sortMarkers(mergeMarkers(prev, incoming)));
  }, []);

  const removeMarker = useCallback((id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMarker = useCallback((id: string, seconds: number) => {
    setMarkers((prev) =>
      sortMarkers(
        prev.map((m) => (m.id === id ? { ...m, seconds: Math.max(0, seconds) } : m)),
      ),
    );
  }, []);

  const clearAutoMarkers = useCallback(() => {
    setMarkers((prev) => prev.filter((m) => m.source === "manual"));
  }, []);

  const setAllMarkers = useCallback((next: Marker[]) => {
    setMarkers(sortMarkers(next));
  }, []);

  const clearAll = useCallback(() => {
    setMarkers([]);
  }, []);

  return {
    markers,
    addMarker,
    addAutoMarkers,
    removeMarker,
    updateMarker,
    clearAutoMarkers,
    setAllMarkers,
    clearAll,
  };
}
