import asyncio
import time
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

PROMPT = (
    "Extreme close-up of ramen served beautifully on a clean white plate. "
    "The food and plate completely fill the entire frame edge to edge. "
    "Viewed from slightly above, soft natural lighting, shallow depth of field, restaurant quality. "
    "Nothing else exists in the image."
)

async def test_model(model: str, quality: str):
    print(f"\nTesting {model} ({quality})...")
    start = time.time()
    try:
        kwargs = dict(model=model, prompt=PROMPT, size="1024x1024", n=1)
        if model == "dall-e-3":
            kwargs["quality"] = quality
            kwargs["response_format"] = "b64_json"
        else:
            kwargs["quality"] = quality
        await client.images.generate(**kwargs)
        elapsed = time.time() - start
        print(f"  ✅ {model} ({quality}): {elapsed:.2f}s")
        return elapsed
    except Exception as e:
        elapsed = time.time() - start
        print(f"  ❌ {model} ({quality}) failed after {elapsed:.2f}s: {e}")
        return None

async def main():
    print("=" * 40)
    print("Image Generation Benchmark")
    print("Food: ramen | Size: 1024x1024")
    print("=" * 40)

    t1 = await test_model("dall-e-3", "standard")
    t2 = await test_model("gpt-image-1", "medium")

    print("\n" + "=" * 40)
    print("Results:")
    if t1: print(f"  DALL-E 3 standard : {t1:.2f}s")
    if t2: print(f"  gpt-image-1 medium: {t2:.2f}s")
    if t1 and t2:
        diff = t1 - t2
        if diff > 0:
            print(f"\n  gpt-image-1 is {diff:.1f}s FASTER ✅")
        else:
            print(f"\n  DALL-E 3 is {abs(diff):.1f}s faster")
    print("=" * 40)

asyncio.run(main())
