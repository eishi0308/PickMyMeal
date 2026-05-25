import json
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
from openai import AsyncOpenAI
from services.image_service import generate_food_image, clear_cache, clear_cache
from services.recipe_library import RECIPE_LIBRARY, RECIPE_KEYS

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class RecommendRequest(BaseModel):
    preferences: Dict[str, str]
    exclude: List[str] = []


class RecommendResponse(BaseModel):
    category: str
    reason: str
    description: Optional[str] = None
    image_url: Optional[str] = None


@app.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    want = {k: v for k, v in request.preferences.items() if not k.startswith('avoid_')}
    avoid = {k: v for k, v in request.preferences.items() if k.startswith('avoid_')}

    pref_lines = "\n".join(f"- {k}: {v}" for k, v in want.items())

    avoid_clause = ""
    if avoid:
        avoid_items = []
        for k, v in avoid.items():
            label = k.replace('avoid_', '').replace('_', ' ')
            avoid_items.append(f"{label}: {v}")
        avoid_clause = (
            f"\n\nThe user does NOT want the following — you MUST strictly exclude these:\n"
            + "\n".join(f"- {item}" for item in avoid_items)
        )

    exclude_clause = ""
    if request.exclude:
        excluded = ", ".join(request.exclude)
        exclude_clause = (
            f"\n\nThe user has already seen these recommendations this session: {excluded}. "
            "You MUST NOT recommend any of these again. "
            "You MUST also avoid dishes in the same narrow category cluster — "
            "for example, if 'sushi' is excluded, also avoid nigiri, chirashi, temaki, maki and other sushi variants. "
            "Pick something genuinely different."
        )

    prompt = (
        f"A person selected the following food preferences:\n{pref_lines}"
        f"{avoid_clause}"
        f"{exclude_clause}\n\n"
        "Based on these signals, recommend exactly ONE specific food (e.g. ramen, pizza, pho, tacos, sushi). "
        "Pick the single best match. Be specific — not a cuisine, but a dish.\n\n"
        'Respond with valid JSON only, in this exact shape: {"category": "<dish name>", "reason": "<one sentence, max 20 words>", "description": "<what this dish is in plain English, 1-2 sentences, max 35 words, suitable for someone who has never heard of it>"}'
    )

    try:
        chat_response = await client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=200,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": "You are a food recommendation assistant. Always respond with valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
        )

        text = chat_response.choices[0].message.content
        data = json.loads(text)
        category = data["category"]

        return RecommendResponse(category=category, reason=data["reason"], description=data.get("description"))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ImageRequest(BaseModel):
    food_name: str
    food_keyword: str


class ImageResponse(BaseModel):
    image_url: Optional[str] = None


@app.post("/image", response_model=ImageResponse)
async def get_food_image(request: ImageRequest):
    url = await generate_food_image(client, request.food_name, request.food_keyword)
    return ImageResponse(image_url=url)


class CookAlternativeRequest(BaseModel):
    dish: str
    variant: Optional[str] = None  # "easier" | "closer" | None


class CookAlternativeResponse(BaseModel):
    alternative_name: str
    time_minutes: int
    effort: str
    delivery_estimate: str
    home_estimate: str
    saving_estimate: str
    ingredients: List[str]
    steps: List[str]
    explanation: str


@app.post("/cook-alternative", response_model=CookAlternativeResponse)
async def cook_alternative(request: CookAlternativeRequest):
    # Step 1: Match dish to best recipe key
    keys_list = ", ".join(RECIPE_KEYS)
    match_resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=60,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a recipe matching assistant. Always respond with valid JSON."},
            {"role": "user", "content": (
                f'Match "{request.dish}" to the best key from this list: [{keys_list}]. '
                f'If none match well, use "generic". '
                f'Respond with JSON only: {{"key": "chosen_key"}}'
            )},
        ],
    )
    key_data = json.loads(match_resp.choices[0].message.content)
    recipe_key = key_data.get("key", "generic")
    if recipe_key not in RECIPE_LIBRARY:
        recipe_key = "generic"

    # Step 2: If generic, use OpenAI to generate a custom recipe for this specific dish
    if recipe_key == "generic":
        variant_steps_json = ', "steps": [...]' if request.variant else ''
        variant_task = ""
        if request.variant == "easier":
            variant_task = '\n4. Also simplify the steps to be even easier (max 4 short steps).'
        elif request.variant == "closer":
            variant_task = f'\n4. Also make the steps closely resemble "{request.dish}" (1–2 tweaks).'

        custom_prompt = (
            f'Create a realistic home-cook alternative for someone craving "{request.dish}".\n'
            f'Rules: beginner-friendly, 5–20 minutes, max 7 ingredients, max 5 steps, '
            f'suitable for one person, close to the craving, common supermarket ingredients.\n'
            f'Also write a specific 1-sentence explanation (max 25 words) of WHY this home version differs from "{request.dish}". '
            f'Name the actual hard-to-find ingredient, specialist equipment, or complex technique that was simplified. '
            f'Be dish-specific — never say generic things like "cooking at home saves money".\n'
            f'Estimate realistic delivery/restaurant cost and home-cooked cost in USD.\n'
            f'{variant_task}\n'
            f'Respond with JSON:\n'
            f'{{"alternative_name":"...","time_minutes":15,"effort":"Easy",'
            f'"delivery_min":18,"delivery_max":28,"home_min":4,"home_max":8,'
            f'"ingredients":["..."],"steps":["..."],"explanation":"..."{variant_steps_json}}}'
        )
        custom_resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=600,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a practical home cooking assistant. Always respond with valid JSON."},
                {"role": "user", "content": custom_prompt},
            ],
        )
        d = json.loads(custom_resp.choices[0].message.content)
        alt_name = d.get("alternative_name", f"Home-cooked {request.dish}")
        time_min = int(d.get("time_minutes", 20))
        effort = d.get("effort", "Easy")
        del_min = int(d.get("delivery_min", 18))
        del_max = int(d.get("delivery_max", 28))
        hom_min = int(d.get("home_min", 4))
        hom_max = int(d.get("home_max", 8))
        ingredients = d.get("ingredients", [])
        steps = d.get("steps", [])
        explanation = d.get("explanation", "Cook at home for a fraction of the delivery price.")
        delivery_estimate = f"${del_min}–${del_max}"
        home_estimate = f"~${hom_min}–${hom_max}"
        saving_estimate = f"~${del_min - hom_max}–${del_max - hom_min}"
        return CookAlternativeResponse(
            alternative_name=alt_name,
            time_minutes=time_min,
            effort=effort,
            delivery_estimate=delivery_estimate,
            home_estimate=home_estimate,
            saving_estimate=saving_estimate,
            ingredients=ingredients,
            steps=steps,
            explanation=explanation,
        )

    # Library recipe path
    recipe = RECIPE_LIBRARY[recipe_key]
    steps = list(recipe["steps"])

    delivery_estimate = f"${recipe['delivery_min']}–${recipe['delivery_max']}"
    home_estimate = f"~${recipe['home_min']}–${recipe['home_max']}"
    saving_min = recipe['delivery_min'] - recipe['home_max']
    saving_max = recipe['delivery_max'] - recipe['home_min']
    saving_estimate = f"~${saving_min}–${saving_max}"

    # Step 3: Explanation + optional variant modification
    variant_instruction = ""
    if request.variant == "easier":
        steps_str = json.dumps(steps)
        variant_instruction = (
            f'\n3. Simplify the steps to be even easier (max 4 very short steps, use simpler techniques). '
            f'Current steps: {steps_str}\n'
            f'Include a "steps" array in your response.'
        )
    elif request.variant == "closer":
        steps_str = json.dumps(steps)
        variant_instruction = (
            f'\n3. Modify the steps by 1–2 small tweaks to make the dish taste closer to "{request.dish}". '
            f'Keep it simple and realistic. Current steps: {steps_str}\n'
            f'Include a "steps" array in your response.'
        )

    steps_field = ', "steps": [...]' if variant_instruction else ''
    explain_prompt = (
        f'The user wanted "{request.dish}" but will cook "{recipe["alternative_name"]}" at home instead.\n'
        f'Write a specific 1-sentence explanation (max 25 words) of WHY this home version differs from the original. '
        f'Name the actual hard-to-find ingredient, specialist equipment, or complex restaurant technique that was simplified. '
        f'Be dish-specific — never say generic things like "cooking at home saves money" or "customize to your taste".\n'
        f'Respond with JSON: {{"explanation": "..."{steps_field}}}'
        f'{variant_instruction}'
    )

    explain_resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=350,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a helpful cooking assistant. Always respond with valid JSON."},
            {"role": "user", "content": explain_prompt},
        ],
    )
    explain_data = json.loads(explain_resp.choices[0].message.content)
    explanation = explain_data.get("explanation", "Cook at home for a fraction of the delivery price.")

    if request.variant and "steps" in explain_data:
        steps = explain_data["steps"]

    return CookAlternativeResponse(
        alternative_name=recipe["alternative_name"],
        time_minutes=recipe["time_minutes"],
        effort=recipe["effort"],
        delivery_estimate=delivery_estimate,
        home_estimate=home_estimate,
        saving_estimate=saving_estimate,
        ingredients=recipe["ingredients"],
        steps=steps,
        explanation=explanation,
    )


class CookExactRequest(BaseModel):
    dish: str


class CookExactResponse(BaseModel):
    dish_name: str
    time_minutes: int
    effort: str
    serves: int
    ingredients: List[str]
    steps: List[str]
    tip: Optional[str] = None


@app.post("/cook-exact", response_model=CookExactResponse)
async def cook_exact(request: CookExactRequest):
    prompt = (
        f'Generate an authentic home recipe for "{request.dish}".\n'
        f'Rules: real ingredients with measurements, clear step-by-step instructions, '
        f'serves 1-2 people, as close to the real dish as possible (not simplified).\n'
        f'Include an optional single pro tip.\n'
        f'Respond with JSON:\n'
        f'{{"dish_name":"...","time_minutes":45,"effort":"Medium","serves":2,'
        f'"ingredients":["250g ingredient","..."],"steps":["..."],"tip":"..."}}'
    )
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=900,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are an expert home cooking instructor. Always respond with valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )
    d = json.loads(resp.choices[0].message.content)
    return CookExactResponse(
        dish_name=d.get("dish_name", request.dish),
        time_minutes=int(d.get("time_minutes", 45)),
        effort=d.get("effort", "Medium"),
        serves=int(d.get("serves", 2)),
        ingredients=d.get("ingredients", []),
        steps=d.get("steps", []),
        tip=d.get("tip"),
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/clear-image-cache")
async def clear_image_cache():
    clear_cache()
    return {"status": "cleared"}
