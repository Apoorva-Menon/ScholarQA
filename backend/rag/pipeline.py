import os
from typing import List

from google import genai
from google.genai import types
from dotenv import load_dotenv

from rag.retrieval import hybrid_retrieve

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"),)
LLM_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

SYSTEM_PROMPT = """You are ScholarQA, an expert research assistant that answers questions about academic papers.

You have access to two types of context:
1. Knowledge Graph Context — structured entities and relationships extracted from the papers
2. Document Chunks — raw text passages retrieved from the papers

Guidelines:
- Answer based ONLY on the provided context. Do not use outside knowledge.
- If the context does not contain enough information, say so clearly.
- Always cite the source paper when referencing specific findings e.g. (Source: paper.pdf)
- For multi-hop questions, use the knowledge graph relationships to chain facts together.
- Be precise and academic in tone.
- If asked to compare papers or methods, structure your answer clearly.
"""


def build_messages(query: str, context: str, history: List[dict]) -> List[dict]:
    messages = []

    if context:
        messages.append({
            "role": "user",
            "parts": [{"text": f"Here is the retrieved context for this conversation:\n\n{context}"}],
        })
        messages.append({
            "role": "model",
            "parts": [{"text": "Understood. I have reviewed the retrieved context and am ready to answer your questions."}],
        })

    for turn in history:
        role = "model" if turn["role"] == "assistant" else "user"
        messages.append({
            "role": role,
            "parts": [{"text": turn["content"]}],
        })

    messages.append({
        "role": "user",
        "parts": [{"text": query}],
    })

    return messages


async def run_pipeline(query: str, history: List[dict], top_k: int = 5) -> dict:
    retrieval = hybrid_retrieve(query, top_k=top_k)
    context = retrieval["context"]

    messages = build_messages(query, context, history)

    response = client.models.generate_content(
        model=LLM_MODEL,
        contents=messages,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
        ),
    )

    answer = response.text.strip()

    return {
        "answer": answer,
        "vector_chunks": retrieval["vector_chunks"],
        "graph_results": retrieval["graph_results"],
        "entities_found": retrieval["entities_found"],
        "context_used": bool(context),
    }