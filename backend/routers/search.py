from fastapi import APIRouter
from rag.search_engine import RAGSearchEngine
from ai.openai_client import ai_suggest
import json

router = APIRouter()

engine = RAGSearchEngine(
    index_path="rag/faiss_index.bin",
    store_path="rag/store.json"
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
