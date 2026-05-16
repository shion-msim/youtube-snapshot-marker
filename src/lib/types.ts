export type MarkerSource = "manual" | "auto";

export interface Marker {
  id: string;
  seconds: number;
  source: MarkerSource;
}

export interface VideoMetadata {
  title: string;
  duration: number;
  width?: number;
  height?: number;
  videoId: string;
}

export interface TaskProgress {
  stage: string;
  message: string;
  current: number;
  total: number;
}
