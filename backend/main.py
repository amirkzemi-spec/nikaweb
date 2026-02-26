import os
import json
import traceback
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
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

# ============================================================
# CORS
# ============================================================
ALLOWED_ORIGINS = [
    # Production frontend domain(s)
    "https://assistant.nikavisa.com",
    "https://www.assistant.nikavisa.com",
    # Optional local dev
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# OPENAI CLIENT
# ============================================================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
client = OpenAI(api_key=OPENAI_API_KEY)

# ============================================================
# PATHS + STATIC FILES
# ============================================================
BASE_DIR = os.path.dirname(__file__)

# Blog images
IMAGE_DIR = os.path.join(BASE_DIR, "data", "blog", "images")
os.makedirs(IMAGE_DIR, exist_ok=True)
app.mount("/blog_images", StaticFiles(directory=IMAGE_DIR), name="blog_images")

# Optional static
STATIC_DIR = os.path.join(BASE_DIR, "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ============================================================
# VISA PROGRAMS DB (safe load)
# ============================================================
DATA_PATH = os.path.join(BASE_DIR, "data", "visa_programs.json")
VISA_PROGRAMS: Any = []

try:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        VISA_PROGRAMS = json.load(f)
except FileNotFoundError:
    print(f"[WARN] visa_programs.json not found at: {DATA_PATH} (continuing)")
except Exception as e:
    print("[WARN] Failed to load visa_programs.json:", str(e))
    print(traceback.format_exc())

# ============================================================
# MODELS
# ============================================================
class AssessmentInput(BaseModel):
    goal: str
    age_range: Optional[str] = None
    nationality: Optional[str] = None
    education: Optional[str] = None
    english: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    deep_dive: Dict[str, Any] = {}
    contact: Dict[str, Any] = {}


class ChatInput(BaseModel):
    message: str


# ============================================================
# HEALTH CHECK
# ============================================================
@app.get("/")
def health():
    return {
        "status": "ok",
        "message": "Nika Visa AI backend running",
        "openai_key_present": bool(OPENAI_API_KEY),
    }


# ============================================================
# ASSESSMENT ENDPOINT
# ============================================================
@app.post("/api/assess")
async def assess(input: AssessmentInput):
    try:
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is missing in Railway variables")

        deep = "\n".join(f"  {k}: {v}" for k, v in (input.deep_dive or {}).items()) or "  N/A"

        prompt = f"""
You are Nika Visa AI. Evaluate this applicant's immigration eligibility and provide a detailed assessment.

PROFILE:
  Goal: {input.goal}
  Age range: {input.age_range}
  Nationality: {input.nationality}
  Education: {input.education}
  English level: {input.english}
  Budget: {input.budget}
  Timeline: {input.timeline}

PATHWAY-SPECIFIC DETAILS:
{deep}

Return ONLY valid JSON (no markdown):
{{
  "score": <integer 0-100>,
  "visa": "<recommended visa name>",
  "summary": "<2-3 sentence personalized evaluation>",
  "missing_docs": ["<doc1>", "<doc2>"],
  "risks": ["<risk1>", "<risk2>"],
  "steps": ["<step1>", "<step2>", "<step3>"]
}}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        print("=== /api/assess ERROR ===")
        print(str(e))
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Assessment failed")


# ============================================================
# CHAT ENDPOINT
# ============================================================
@app.post("/api/chat")
async def chat(input: ChatInput):
    try:
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is missing in Railway variables")

        prompt = (
            "You are Nika Visa AI, an immigration assistant. "
            "Reply helpfully and concisely.\n\n"
            f"User: {input.message}"
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )

        reply = response.choices[0].message.content
        return {"reply": reply}

    except Exception as e:
        print("=== /api/chat ERROR ===")
        print(str(e))
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Chat failed")


# ============================================================
# ROUTERS
# ============================================================
from routers.blog import router as blog_router
from routers.search import router as search_router

# NOTE: If routers/search.py defines router.post("/chat"),
# it will ALSO become /api/chat and may conflict.
# Prefer to rename it to avoid collision (e.g., "/search" or "/rag_chat").
app.include_router(blog_router)
app.include_router(search_router, prefix="/api")