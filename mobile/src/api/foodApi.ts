import { RecommendRequest, RecommendResponse, ImageResponse, CookAlternativeResponse } from '../types';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export async function recommend(request: RecommendRequest): Promise<RecommendResponse> {
  const response = await fetch(`${API_BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export async function getCookAlternative(dish: string, variant?: string): Promise<CookAlternativeResponse> {
  const response = await fetch(`${API_BASE}/cook-alternative`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dish, variant }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export async function generateImage(foodName: string, foodKeyword: string): Promise<ImageResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_BASE}/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_name: foodName, food_keyword: foodKeyword }),
      signal: controller.signal,
    });
    if (!response.ok) return { image_url: null };
    return response.json();
  } catch {
    return { image_url: null };
  } finally {
    clearTimeout(timer);
  }
}
