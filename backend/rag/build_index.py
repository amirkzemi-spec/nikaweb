import json
import numpy as np
import faiss
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DATA_FILES = [
    "data/visa_programs.json",
    "data/countries.json",
    "data/blogs.json"
]

OUTPUT_INDEX = "rag/faiss_index.bin"
OUTPUT_STORE = "rag/store.json"

def embed(text):
    emb = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return emb.data[0].embedding

all_texts = []
store = []

for file in DATA_FILES:
    with open(file, "r") as f:
        items = json.load(f)

    for item in items:
        combined = f"{item['title']} - {item.get('description','')}"
        all_texts.append(combined)
        store.append({"title": item["title"], "text": combined, "type": file})

# Embeddings
vectors = np.array([embed(t) for t in all_texts]).astype("float32")

# Create FAISS index
dimension = vectors.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(vectors)

faiss.write_index(index, OUTPUT_INDEX)

with open(OUTPUT_STORE, "w") as f:
    json.dump(store, f)

print("FAISS index built!")
