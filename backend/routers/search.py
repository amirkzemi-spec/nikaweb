import os
from fastapi import APIRouter
from pydantic import BaseModel
from backend.rag.search_engine import RAGSearchEngine
from backend.ai.openai_client import ai_suggest, ai_chat
import json

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # backend/

engine = RAGSearchEngine(
    index_path=os.path.join(BASE_DIR, "rag", "faiss_index.bin"),
    store_path=os.path.join(BASE_DIR, "rag", "store.json")
)

@router.get("/search")
async def search(q: str):
    results = engine.search(q, k=5)

    # ---- AI SUGGESTIONS ----
    raw_ai = ai_suggest(q, results)

    # Try to clean and parse JSON from AI output safely
    ai_output = {"suggestions": [], "summary": ""}

    if raw_ai and isinstance(raw_ai, str):
        cleaned = raw_ai.strip()

        # Remove common markdown wrappers
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            idx = cleaned.find("{")
            if idx != -1:
                cleaned = cleaned[idx:]

        try:
            ai_output = json.loads(cleaned)
        except:
            # fallback: return plain text
            ai_output = {
                "suggestions": [cleaned],
                "summary": cleaned
            }

    return {
        "query": q,
        "results": results,
        "ai": ai_output
    }


class ChatRequest(BaseModel):
    message: str
    history: list = []   # [{"role": "user"|"assistant", "content": "..."}]


@router.post("/chat")
async def chat(req: ChatRequest):
    docs = engine.search(req.message, k=5)
    reply = ai_chat(req.message, docs, history=req.history)
    return {"reply": reply}
