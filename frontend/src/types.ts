export type PreferenceMap = Record<string, string>;

export interface RecommendRequest {
  preferences: PreferenceMap;
  exclude?: string[];
}

export interface RecommendResponse {
  category: string;
  reason: string;
  image_url: string | null;
}

export interface ImageResponse {
  image_url: string | null;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  preferences: PreferenceMap;
  category: string;
  reason: string;
}

export type Screen = 'home' | 'result' | 'history';
