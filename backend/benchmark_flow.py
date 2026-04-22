import asyncio, time, json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv()
from openai import AsyncOpenAI
from services.image_service import generate_food_image, clear_cache

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
PREFS = {"flavor": "Salty", "temperature": "Hot", "fullness": "Heavy"}

async def get_rec(exclude=[]):
    pref_lines = "\n".join(f"- {k}: {v}" for k, v in PREFS.items())
    ex = f"\n\nDo NOT recommend: {', '.join(exclude)}. Pick something different." if exclude else ""
    prompt = (f"Food preferences:\n{pref_lines}\n\nRecommend ONE specific dish.{ex}\n\n"
              'JSON only: {"category": "<dish>", "reason": "<one sentence>"}')
    r = await client.chat.completions.create(
        model="gpt-4o-mini", max_tokens=100,
        response_format={"type": "json_object"},
        messages=[{"role": "system", "content": "Food recommendation assistant. Valid JSON only."},
                  {"role": "user", "content": prompt}])
    return json.loads(r.choices[0].message.content)["category"]

async def main():
    clear_cache()
    print("=" * 52)
    print("  Live Timing: Old Flow vs New Flow")
    print("=" * 52)

    t0 = time.time()
    r1 = await get_rec()
    r2 = await get_rec([r1])
    r3 = await get_rec([r1, r2])
    t_recs = time.time() - t0
    print(f"\n  Picks: {r1}, {r2}, {r3}")
    print(f"  3 recommendations done in: {t_recs:.2f}s")

    await asyncio.gather(
        generate_food_image(client, r1, r1),
        generate_food_image(client, r2, r2),
        generate_food_image(client, r3, r3),
    )
    t_total = time.time() - t0
    t_imgs = t_total - t_recs
    saved = t_total - t_recs

    print(f"  3 images loaded in:        {t_imgs:.2f}s (parallel)")
    print(f"  Total old wait:            {t_total:.2f}s")
    print()
    print("=" * 52)
    print(f"  OLD — user waits to see anything:  {t_total:.1f}s")
    print(f"  NEW — result screen appears at:    {t_recs:.1f}s")
    print(f"  Images finish in background at:    {t_total:.1f}s")
    print(f"  Time saved (perceived):            {saved:.1f}s  ({saved/t_total*100:.0f}% faster)")
    print("=" * 52)

asyncio.run(main())
