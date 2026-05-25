export type PreferenceMap = Record<string, string>;

export interface RecommendRequest {
  preferences: PreferenceMap;
  exclude?: string[];
}

export interface RecommendResponse {
  category: string;
  reason: string;
  description?: string;
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

export interface CookAlternativeResponse {
  alternative_name: string;
  time_minutes: number;
  effort: string;
  delivery_estimate: string;
  home_estimate: string;
  saving_estimate: string;
  ingredients: string[];
  steps: string[];
  explanation: string;
}

export interface CookExactResponse {
  dish_name: string;
  time_minutes: number;
  effort: string;
  serves: number;
  ingredients: string[];
  steps: string[];
  tip?: string | null;
}

export type Screen = 'landing' | 'home' | 'result' | 'order' | 'cook-gateway' | 'cook' | 'cook-exact' | 'history';
