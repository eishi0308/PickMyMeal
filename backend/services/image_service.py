from typing import Optional
from openai import AsyncOpenAI

# Simple in-memory cache: food_keyword (lowercased) -> image_url
_cache: dict[str, str] = {}  # cleared on each server restart


async def generate_food_image(
    client: AsyncOpenAI,
    food_name: str,
    food_keyword: str,
) -> Optional[str]:
    """
    Generate a realistic food photo with DALL-E 3.
    Caches results by food_keyword so the same dish isn't regenerated.
    Returns the image URL, or None if generation fails.
    """
    cache_key = food_keyword.lower().strip()
    if cache_key in _cache:
        return _cache[cache_key]

    prompt = (
        f"{food_name} on a white plate, top-down view, soft light, food only, nothing else."
    )

    try:
        response = await client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        url = response.data[0].url
        if url:
            _cache[cache_key] = url
        return url
    except Exception:
        return None
