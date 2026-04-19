import time
from typing import Optional
from openai import AsyncOpenAI

_cache: dict[str, str] = {}


def clear_cache() -> None:
    _cache.clear()


async def generate_food_image(
    client: AsyncOpenAI,
    food_name: str,
    food_keyword: str,
) -> Optional[str]:
    cache_key = food_keyword.lower().strip()
    if cache_key in _cache:
        return _cache[cache_key]

    prompt = (
        f"Extreme close-up of {food_name} served beautifully on a clean white plate. "
        f"The food and plate completely fill the entire frame edge to edge. "
        f"Viewed from slightly above, soft natural lighting, shallow depth of field, restaurant quality. "
        f"Nothing else exists in the image. "
        f"STRICT RULES — every single one must be followed with zero exceptions: "
        f"[1] Zero humans, zero people, zero faces, zero skin, zero eyes, zero fingers, zero hands, zero arms, zero wrists, zero body parts of any kind. "
        f"[2] Zero cameras, zero lenses, zero tripods, zero smartphones, zero screens, zero photography equipment, zero recording devices of any kind. "
        f"[3] Zero props, zero text, zero logos, zero watermarks, zero decorative objects unrelated to food. "
        f"[4] The only subjects allowed in this image are: {food_name} and the white plate. Absolutely nothing else. "
        f"Generating any human body part or any device is a complete and total failure of this task."
    )

    try:
        t_start = time.time()
        response = await client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            response_format="b64_json",
            n=1,
        )
        elapsed = time.time() - t_start
        print(f"[image] '{food_keyword}' generated in {elapsed:.2f}s")
        b64 = response.data[0].b64_json
        if not b64:
            return None
        data_url = f"data:image/png;base64,{b64}"
        _cache[cache_key] = data_url
        return data_url
    except Exception as e:
        print(f"[image_service] ERROR: {e}")
        return None
