import { RecommendRequest, RecommendResponse, ImageResponse, CookAlternativeResponse, CookExactResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export async function recommend(request: RecommendRequest): Promise<RecommendResponse> {
  const response = await fetch(`${API_BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
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

export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

export async function getCookAlternative(dish: string, variant?: string): Promise<CookAlternativeResponse> {
  const response = await fetch(`${API_BASE}/cook-alternative`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dish, variant: variant ?? null }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export async function getCookExact(dish: string): Promise<CookExactResponse> {
  const response = await fetch(`${API_BASE}/cook-exact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dish }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export { API_BASE };
