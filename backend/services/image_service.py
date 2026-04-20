import time
from typing import Optional
from openai import AsyncOpenAI

_cache: dict[str, str] = {}


def clear_cache() -> None:
    _cache.clear()


async def _verify_image(client: AsyncOpenAI, b64: str) -> bool:
    """Returns True if image is clean (food only). False if camera/hands/people detected."""
    try:
        result = await client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=20,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "low"},
                        },
                        {
                            "type": "text",
                            "text": (
                                "Does this image contain any of the following: camera, lens, tripod, smartphone, "
                                "screen, photography equipment, human hands, fingers, arms, face, or any person? "
                                "Reply with only YES or NO."
                            ),
                        },
                    ],
                }
            ],
        )
        answer = result.choices[0].message.content.strip().upper()
        passed = answer.startswith("NO")
        print(f"[verify] {'✅ clean' if passed else '❌ FAILED — contains prohibited content'}")
        return passed
    except Exception as e:
        print(f"[verify] ERROR: {e} — accepting image")
        return True


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

    for attempt in range(1, 4):
        attempt_prompt = prompt if attempt == 1 else (
            prompt +
            f" CRITICAL RETRY {attempt}: Previous attempt included prohibited objects and was rejected. "
            f"This image MUST contain only {food_name} on a white plate. Zero cameras, zero hands, zero people, zero equipment. Nothing else."
        )
        try:
            t_start = time.time()
            response = await client.images.generate(
                model="dall-e-3",
                prompt=attempt_prompt,
                size="1024x1024",
                quality="standard",
                response_format="b64_json",
                n=1,
            )
            elapsed = time.time() - t_start
            print(f"[image] '{food_keyword}' attempt {attempt} generated in {elapsed:.2f}s")

            b64 = response.data[0].b64_json
            if not b64:
                continue

            clean = await _verify_image(client, b64)
            if not clean:
                print(f"[image] '{food_keyword}' attempt {attempt} rejected — regenerating...")
                continue

            data_url = f"data:image/png;base64,{b64}"
            _cache[cache_key] = data_url
            return data_url

        except Exception as e:
            print(f"[image_service] ERROR attempt {attempt}: {e}")

    print(f"[image] '{food_keyword}' failed all 3 attempts — returning None")
    return None
