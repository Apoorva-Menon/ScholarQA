import os
from typing import List

import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv

from rag.embeddings import embed_texts, embed_query

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
COLLECTION_NAME = "scholarqa"

def get_client() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(
        path=CHROMA_PERSIST_DIR,
        settings=Settings(anonymized_telemetry=False),
    )


def get_collection(client: chromadb.PersistentClient = None):
    if client is None:
        client = get_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def add_chunks(chunks: List[dict]) -> None:
    """
    Embed and store a list of chunks in ChromaDB.
    Each chunk is a dict with 'text' and 'metadata' keys.
    """
    collection = get_collection()

    texts = [chunk["text"] for chunk in chunks]
    metadatas = [chunk["metadata"] for chunk in chunks]
    embeddings = embed_texts(texts)

    ids = [
        f"{meta['source']}__chunk_{meta['chunk_index']}"
        for meta in metadatas
    ]

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )


def query_chunks(query: str, top_k: int = 5) -> List[dict]:
    """
    Query ChromaDB for the most relevant chunks.
    Returns a list of dicts with text, metadata, and distance.
    """
    collection = get_collection()
    query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for text, metadata, distance in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        chunks.append({
            "text": text,
            "metadata": metadata,
            "score": round(1 - distance, 4),  # cosine similarity
        })

    return chunks


def delete_document(source: str) -> None:
    """Delete all chunks belonging to a document by source filename."""
    collection = get_collection()
    collection.delete(where={"source": source})


def list_documents() -> List[str]:
    """Return a list of unique document sources in the collection."""
    collection = get_collection()
    results = collection.get(include=["metadatas"])
    sources = {meta["source"] for meta in results["metadatas"]}
    return sorted(sources)