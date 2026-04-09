from typing import Optional
from openai import AsyncOpenAI

_cache: dict[str, str] = {}


async def generate_food_image(
    client: AsyncOpenAI,
    food_name: str,
    food_keyword: str,
) -> Optional[str]:
    cache_key = food_keyword.lower().strip()
    if cache_key in _cache:
        return _cache[cache_key]

    prompt = (
        f"A stunning professional food photo of {food_name}. "
        f"Served beautifully on a clean white plate, shot from slightly above, "
        f"soft natural lighting, shallow depth of field, restaurant quality, "
        f"no text, no people, food only."
    )

    try:
        response = await client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            response_format="b64_json",
            n=1,
        )
        b64 = response.data[0].b64_json
        if not b64:
            return None
        data_url = f"data:image/png;base64,{b64}"
        _cache[cache_key] = data_url
        return data_url
    except Exception as e:
        print(f"[image_service] ERROR: {e}")
        return None
