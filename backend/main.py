import json
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
from openai import AsyncOpenAI
from services.image_service import generate_food_image

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "https://pick-my-meal-iota.vercel.app"],
    allow_credentials=True,
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
    image_url: Optional[str] = None


@app.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    pref_lines = "\n".join(f"- {k}: {v}" for k, v in request.preferences.items())

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
        f"A person selected the following food preferences:\n{pref_lines}\n\n"
        "Based on these signals, recommend exactly ONE specific food (e.g. ramen, pizza, pho, tacos, sushi). "
        "Pick the single best match. Be specific — not a cuisine, but a dish."
        f"{exclude_clause}\n\n"
        'Respond with valid JSON only, in this exact shape: {"category": "<dish name>", "reason": "<one sentence, max 20 words>"}'
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

        return RecommendResponse(category=category, reason=data["reason"])

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


@app.get("/health")
async def health():
    return {"status": "ok"}
