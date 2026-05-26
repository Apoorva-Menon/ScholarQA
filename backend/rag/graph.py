import json
import os
from typing import List

import networkx as nx
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"),)
LLM_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

graph = nx.DiGraph()
GRAPH_PERSIST_PATH = os.getenv("GRAPH_PERSIST_PATH", "./graph.json")

EXTRACTION_PROMPT = """You are a knowledge graph extractor for academic research papers.

Given the following text chunk, extract entities and relationships.

Return ONLY a valid JSON object in this exact format, nothing else:
{{
  "entities": [
    {{"id": "unique_id", "name": "entity name", "type": "PERSON|INSTITUTION|MODEL|DATASET|METHOD|CONCEPT|PAPER"}}
  ],
  "relationships": [
    {{"source": "entity_id", "target": "entity_id", "relation": "relation label"}}
  ]
}}

Guidelines:
- Entity types: PERSON (authors), INSTITUTION (universities, labs), MODEL (e.g. BERT, GPT-4), DATASET (e.g. ImageNet), METHOD (techniques, algorithms), CONCEPT (ideas, topics), PAPER (paper titles)
- Relationship examples: proposes, evaluates_on, outperforms, cites, authored_by, affiliated_with, based_on, compares_with
- Only extract clear, factual relationships — do not infer
- Keep entity IDs short and snake_case (e.g. "bert_model", "imagenet_dataset")
- If nothing meaningful can be extracted, return {{"entities": [], "relationships": []}}

Text chunk:
{chunk}
"""


def extract_entities_and_relations(chunk: str) -> dict:
    prompt = EXTRACTION_PROMPT.format(chunk=chunk)
    response = client.models.generate_content(
        model=LLM_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.0),
    )
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"entities": [], "relationships": []}


def add_to_graph(extracted: dict, source: str) -> None:
    entities = extracted.get("entities", [])
    relationships = extracted.get("relationships", [])

    for entity in entities:
        entity_id = entity["id"]
        existing_sources = set(graph.nodes[entity_id].get("sources", []) if entity_id in graph else [])
        graph.add_node(
            entity_id,
            name=entity["name"],
            type=entity["type"],
            sources=list({source} | existing_sources),
        )

    for rel in relationships:
        src = rel["source"]
        tgt = rel["target"]
        if src in graph.nodes and tgt in graph.nodes:
            graph.add_edge(src, tgt, relation=rel["relation"], source=source)


def graph_search(query_entities: List[str], hops: int = 2) -> List[dict]:
    if not graph.nodes:
        return []

    query_lower = [q.lower() for q in query_entities]
    seed_nodes = [
        node for node, data in graph.nodes(data=True)
        if data.get("name", "").lower() in query_lower
        or node.lower() in query_lower
    ]

    if not seed_nodes:
        return []

    visited = set()
    context = []

    def traverse(node, depth):
        if depth > hops or node in visited:
            return
        visited.add(node)

        node_data = graph.nodes[node]
        context.append({
            "type": "entity",
            "id": node,
            "name": node_data.get("name"),
            "entity_type": node_data.get("type"),
            "sources": node_data.get("sources", []),
        })

        for neighbor in graph.successors(node):
            edge_data = graph.edges[node, neighbor]
            context.append({
                "type": "relationship",
                "source": node_data.get("name"),
                "target": graph.nodes[neighbor].get("name"),
                "relation": edge_data.get("relation"),
            })
            traverse(neighbor, depth + 1)

        for predecessor in graph.predecessors(node):
            edge_data = graph.edges[predecessor, node]
            context.append({
                "type": "relationship",
                "source": graph.nodes[predecessor].get("name"),
                "target": node_data.get("name"),
                "relation": edge_data.get("relation"),
            })
            traverse(predecessor, depth + 1)

    for node in seed_nodes:
        traverse(node, 0)

    return context


def save_graph() -> None:
    data = nx.node_link_data(graph)
    with open(GRAPH_PERSIST_PATH, "w") as f:
        json.dump(data, f, indent=2)


def load_graph() -> None:
    global graph
    if os.path.exists(GRAPH_PERSIST_PATH):
        with open(GRAPH_PERSIST_PATH, "r") as f:
            data = json.load(f)
        graph = nx.node_link_graph(data)


def delete_document_from_graph(source: str) -> None:
    nodes_to_remove = []
    for node, data in graph.nodes(data=True):
        sources = list(data.get("sources", []))
        if source in sources:
            sources.remove(source)
            if not sources:
                nodes_to_remove.append(node)
            else:
                graph.nodes[node]["sources"] = sources
    graph.remove_nodes_from(nodes_to_remove)


def get_graph_stats() -> dict:
    entity_types = {}
    for _, data in graph.nodes(data=True):
        t = data.get("type", "UNKNOWN")
        entity_types[t] = entity_types.get(t, 0) + 1
    return {
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
        "entity_types": entity_types,
    }