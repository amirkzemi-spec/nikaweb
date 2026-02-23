"""
FAISS Index Builder
===================
Auto-discovers every *.json file in backend/data/,
embeds each entry, and writes:
  rag/faiss_index.bin   — the vector index
  rag/store.json        — parallel list of readable texts

Usage (from project root):
    python -m rag.build_index
Or called programmatically from ingest.py:
    from rag.build_index import build; build()
"""

import os
import json
import glob
import numpy as np
import faiss
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

BASE_DIR     = os.path.dirname(__file__)          # backend/rag/
BACKEND_DIR  = os.path.dirname(BASE_DIR)          # backend/
DATA_DIR     = os.path.join(BACKEND_DIR, "data")
OUTPUT_INDEX = os.path.join(BASE_DIR, "faiss_index.bin")
OUTPUT_STORE = os.path.join(BASE_DIR, "store.json")


def embed(text: str, client: OpenAI) -> list:
    resp = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return resp.data[0].embedding


def build():
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # ── Discover all JSON files in data/ ────────────────────────────────────
    data_files = sorted(glob.glob(os.path.join(DATA_DIR, "*.json")))
    if not data_files:
        print("No JSON files found in data/. Nothing to build.")
        return

    print(f"Found {len(data_files)} data file(s):")
    for f in data_files:
        print(f"  {os.path.basename(f)}")

    # ── Collect all entries ─────────────────────────────────────────────────
    all_texts = []
    store     = []

    for filepath in data_files:
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                items = json.load(f)
            except json.JSONDecodeError as e:
                print(f"  ! Skipping {filepath}: invalid JSON ({e})")
                continue

        if not isinstance(items, list):
            print(f"  ! Skipping {filepath}: expected a JSON array")
            continue

        for item in items:
            title       = item.get("title", "")
            description = item.get("description", item.get("text", ""))
            combined    = f"{title} - {description}".strip(" -")
            if not combined:
                continue
            all_texts.append(combined)
            store.append({
                "title":  title,
                "text":   combined,
                "source": os.path.basename(filepath),
            })

    if not all_texts:
        print("No entries found. Check your data files.")
        return

    print(f"\nEmbedding {len(all_texts)} entries...")

    # ── Embed ────────────────────────────────────────────────────────────────
    vectors = []
    for i, text in enumerate(all_texts):
        vectors.append(embed(text, client))
        if (i + 1) % 10 == 0 or (i + 1) == len(all_texts):
            print(f"  {i + 1}/{len(all_texts)}")

    vectors = np.array(vectors, dtype="float32")

    # ── Build & save FAISS index ─────────────────────────────────────────────
    dimension = vectors.shape[1]
    index     = faiss.IndexFlatL2(dimension)
    index.add(vectors)

    faiss.write_index(index, OUTPUT_INDEX)
    with open(OUTPUT_STORE, "w", encoding="utf-8") as f:
        json.dump(store, f, indent=2, ensure_ascii=False)

    print(f"\nFAISS index built — {len(store)} vectors saved.")
    print(f"  {OUTPUT_INDEX}")
    print(f"  {OUTPUT_STORE}")


if __name__ == "__main__":
    build()
