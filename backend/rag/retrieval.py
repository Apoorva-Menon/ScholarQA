import re
from typing import List

from rag.graph import graph_search
from rag.vector_store import query_chunks

def extract_entities_from_query(query: str) -> List[str]:
    """
    Simple heuristic to pull potential entity names from a query.
    Looks for capitalised words, quoted strings, and known acronyms.
    """
    entities = []

    # Quoted strings e.g. "BERT" or "ImageNet"
    quoted = re.findall(r'"([^"]+)"', query)
    entities.extend(quoted)

    # Capitalised words/phrases (likely model names, datasets, authors)
    capitalised = re.findall(r'\b[A-Z][a-zA-Z0-9\-]{1,}\b', query)
    entities.extend(capitalised)

    # Deduplicate while preserving order
    seen = set()
    result = []
    for e in entities:
        if e.lower() not in seen:
            seen.add(e.lower())
            result.append(e)

    return result


def format_vector_context(chunks: List[dict]) -> str:
    """Format retrieved chunks into a readable context block."""
    if not chunks:
        return ""

    lines = ["=== Retrieved Document Chunks ===\n"]
    for i, chunk in enumerate(chunks, 1):
        source = chunk["metadata"].get("source", "unknown")
        score = chunk.get("score", 0)
        lines.append(f"[Chunk {i} | Source: {source} | Relevance: {score}]")
        lines.append(chunk["text"])
        lines.append("")

    return "\n".join(lines)


def format_graph_context(graph_results: List[dict]) -> str:
    """Format graph traversal results into a readable context block."""
    if not graph_results:
        return ""

    lines = ["=== Knowledge Graph Context ===\n"]

    entities = [r for r in graph_results if r["type"] == "entity"]
    relationships = [r for r in graph_results if r["type"] == "relationship"]

    if entities:
        lines.append("Entities:")
        for e in entities:
            lines.append(f"  - {e['name']} ({e['entity_type']}) — from: {', '.join(e['sources'])}")

    if relationships:
        lines.append("\nRelationships:")
        for r in relationships:
            lines.append(f"  - {r['source']} --[{r['relation']}]--> {r['target']}")

    lines.append("")
    return "\n".join(lines)


def hybrid_retrieve(query: str, top_k: int = 5) -> dict:
    """
    Hybrid retrieval: vector search + graph traversal.
    Returns both results and a combined formatted context string.
    """
    # Vector retrieval
    vector_chunks = query_chunks(query, top_k=top_k)

    # Graph retrieval
    query_entities = extract_entities_from_query(query)
    graph_results = graph_search(query_entities, hops=2) if query_entities else []

    # Format context
    vector_context = format_vector_context(vector_chunks)
    graph_context = format_graph_context(graph_results)

    combined_context = "\n\n".join(filter(None, [graph_context, vector_context]))

    return {
        "vector_chunks": vector_chunks,
        "graph_results": graph_results,
        "context": combined_context,
        "entities_found": query_entities,
    }