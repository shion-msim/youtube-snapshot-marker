import type { Marker } from "./types";

const MERGE_EPSILON = 0.5;

export function mergeMarkers(existing: Marker[], incoming: Marker[]): Marker[] {
  const combined = [...existing, ...incoming];
  combined.sort((a, b) => a.seconds - b.seconds);

  const merged: Marker[] = [];
  for (const marker of combined) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.seconds - marker.seconds) < MERGE_EPSILON) {
      if (last.source === "manual") continue;
      if (marker.source === "manual") {
        merged[merged.length - 1] = marker;
      }
      continue;
    }
    merged.push(marker);
  }
  return merged;
}

export function sortMarkers(markers: Marker[]): Marker[] {
  return [...markers].sort((a, b) => a.seconds - b.seconds);
}
