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
ALLOWED_ORIGINS = [
    # Production frontend domain(s)
    "https://assistant.nikavisa.com",
    "https://www.assistant.nikavisa.com",

    # Optional: local dev (keep if you use it)
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
os.makedirs(IMAGE_DIR, exist_ok=True)

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
    goal: str
    age_range: str | None = None
    nationality: str | None = None
    education: str | None = None
    english: str | None = None
    budget: str | None = None
    timeline: str | None = None
    deep_dive: dict = {}
    contact: dict = {}


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
    deep = "\n".join(f"  {k}: {v}" for k, v in input.deep_dive.items()) or "  N/A"
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

    return json.loads(response.choices[0].message.content)

class ChatInput(BaseModel):
    message: str

@app.post("/api/chat")
async def chat(input: ChatInput):
    prompt = f"You are Nika Visa AI, an immigration assistant. Reply helpfully and concisely.\n\nUser: {input.message}"

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )

    return {"reply": response.choices[0].message.content}

# ============================================================
# ROUTERS
# ============================================================
from routers.blog import router as blog_router
from routers.search import router as search_router

# Register routers (each has its own prefix)
app.include_router(blog_router)
app.include_router(search_router, prefix="/api")

# ============================================================
# OPTIONAL STATIC (only if folder exists)
# ============================================================
STATIC_DIR = os.path.join(BASE_DIR, "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")