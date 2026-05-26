import os
import time
from typing import List

from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
EMBEDDING_MODEL = "gemini-embedding-001"

def embed_text(text: str) -> List[float]:
    while True:
        try:
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )
            return response.embeddings[0].values
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print("Rate limit hit, waiting 60s...")
                time.sleep(60)
            else:
                raise


def embed_texts(texts: List[str]) -> List[List[float]]:
    results = []
    for i, text in enumerate(texts):
        results.append(embed_text(text))
        if (i + 1) % 10 == 0:
            time.sleep(2)  # small pause every 10 chunks
    return results


def embed_query(query: str) -> List[float]:
    while True:
        try:
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=query,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
            )
            return response.embeddings[0].values
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print("Rate limit hit, waiting 60s...")
                time.sleep(60)
            else:
                raise