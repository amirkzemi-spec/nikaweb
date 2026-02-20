import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

# ============================================================
# INIT APP
# ============================================================
load_dotenv()

app = FastAPI(title="Nika Visa AI Backend")

# -------------------------
# CORS
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# OpenAI Client
# -------------------------
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ============================================================
# STATIC FILE SERVING (SVG images)
# ============================================================
BASE_DIR = os.path.dirname(__file__)
IMAGE_DIR = os.path.join(BASE_DIR, "data", "blog", "images")

# Frontend loads: /blog_images/<slug>/header.svg
app.mount("/blog_images", StaticFiles(directory=IMAGE_DIR), name="blog_images")

# ============================================================
# VISA PROGRAMS DB
# ============================================================
DATA_PATH = os.path.join(BASE_DIR, "data", "visa_programs.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    VISA_PROGRAMS = json.load(f)


# ============================================================
# MODELS
# ============================================================
class AssessmentInput(BaseModel):
    country: str
    visa_type: str
    ielts: float | None = None
    education: str | None = None
    budget: str | None = None


# ============================================================
# HEALTH CHECK
# ============================================================
@app.get("/")
def health():
    return {"status": "ok", "message": "Nika Visa AI backend running"}


# ============================================================
# ASSESSMENT ENDPOINT
# ============================================================
@app.post("/api/assess")
async def assess(input: AssessmentInput):
    prompt = f"""
You are Nika Visa AI. Evaluate the user's immigration eligibility.

COUNTRY: {input.country}
VISA TYPE: {input.visa_type}
IELTS: {input.ielts}
EDUCATION: {input.education}
BUDGET: {input.budget}

Return JSON:
{{
  "score": number,
  "visa": string,
  "summary": string,
  "missing_docs": [],
  "risks": [],
  "steps": []
}}
"""

    response = client.responses.create(
        model="gpt-4o-mini",
        input=prompt
    )

    return json.loads(response.output_text)


# ============================================================
# SEARCH ENDPOINT
# ============================================================
@app.get("/api/search")
async def search_programs(q: str):
    q = q.lower().strip()
    results = []

    for program in VISA_PROGRAMS:
        text = (
            (program.get("visa") or "").lower()
            + " "
            + (program.get("country") or "").lower()
            + " "
            + " ".join(program.get("keywords", [])).lower()
        )

        if q in text:
            results.append(program)

    return {"query": q, "count": len(results), "results": results}


# ============================================================
# ROUTERS  
# ============================================================
from backend.routers.blog import router as blog_router


# Register routers (each has its own prefix)
app.include_router(blog_router)

# ============================================================
# OPTIONAL STATIC (only if folder exists)
# ============================================================
STATIC_DIR = os.path.join(BASE_DIR, "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
