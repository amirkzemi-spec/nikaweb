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
{{"suggestions": ["plain string 1", "plain string 2", ...], "summary": "..."}}
Each item in "suggestions" must be a plain string, not an object.
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content


def ai_chat(message, top_docs, history=None):
    """
    Conversational assistant with memory.
    - history: list of {"role": "user"|"assistant", "content": "..."} for prior turns
    - Uses RAG context only when the question is about immigration/visas.
    - Responds naturally to greetings and off-topic messages.
    """
    context = "\n\n".join([d["text"] for d in top_docs]) if top_docs else ""

    system = """You are Nika, a friendly AI immigration assistant. You have memory of the full conversation.

- If the user greets you or asks something unrelated to visas/immigration, respond naturally and briefly.
- If the user asks about visas, countries, eligibility, or immigration, answer using the context provided below. Do not invent information not in the context.
- Keep answers concise and helpful.
- If a follow-up question refers to something mentioned earlier in the conversation, use that context to give a coherent answer.

Context from database:
""" + context

    messages = [{"role": "system", "content": system}]

    # Inject prior turns so the model remembers the conversation
    if history:
        for turn in history:
            messages.append({"role": turn["role"], "content": turn["content"]})

    # Append the current user message
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
    )

    return response.choices[0].message.content
