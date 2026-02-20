import os
import json
import faiss
import numpy as np
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class RAGSearchEngine:
    def __init__(self, index_path, store_path):
        self.index = faiss.read_index(index_path)
        with open(store_path, "r") as f:
            self.store = json.load(f)

    def embed(self, text):
        emb = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return np.array(emb.data[0].embedding, dtype="float32")

    def search(self, query, k=5):
        vector = np.array([self.embed(query)])
        distances, indices = self.index.search(vector, k)

        results = []
        for idx in indices[0]:
            if idx == -1:
                continue
            results.append(self.store[idx])

        return results
