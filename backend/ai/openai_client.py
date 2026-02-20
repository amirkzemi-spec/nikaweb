import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def ai_suggest(query, top_docs):
    """
    Generate AI-aided smart suggestions based on user query & retrieved documents
    """
    context = "\n\n".join([d["text"] for d in top_docs])

    prompt = f"""
You are an AI immigration expert. The user searched: "{query}"

Based on the documents below, generate:
- Smart visa recommendations
- Missing documents or eligibility hints
- Similar visa programs they may want
- Clear, short, helpful suggestions

Documents:
{context}

Respond in JSON with:
{{"suggestions": [...], "summary": "..."}}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content
