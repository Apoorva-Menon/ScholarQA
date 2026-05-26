from typing import List, Optional
from pydantic import BaseModel


class ChatTurn(BaseModel):
    role: str  # "user" or "model"
    content: str


class ChatRequest(BaseModel):
    query: str
    history: List[ChatTurn] = []
    top_k: int = 5


class ChunkMetadata(BaseModel):
    source: str
    chunk_index: int
    total_chunks: int


class VectorChunk(BaseModel):
    text: str
    metadata: ChunkMetadata
    score: float


class GraphEntity(BaseModel):
    type: str  # "entity" or "relationship"
    id: Optional[str] = None
    name: Optional[str] = None
    entity_type: Optional[str] = None
    sources: Optional[List[str]] = None
    source: Optional[str] = None  # for relationships
    target: Optional[str] = None  # for relationships
    relation: Optional[str] = None  # for relationships


class ChatResponse(BaseModel):
    answer: str
    vector_chunks: List[VectorChunk]
    graph_results: List[GraphEntity]
    entities_found: List[str]
    context_used: bool


class IngestResponse(BaseModel):
    filename: str
    chunks_added: int
    entities_extracted: int
    relationships_extracted: int


class DocumentListResponse(BaseModel):
    documents: List[str]


class DeleteResponse(BaseModel):
    message: str


class GraphStatsResponse(BaseModel):
    nodes: int
    edges: int
    entity_types: dict


class HealthResponse(BaseModel):
    status: str
    model: str
    documents_loaded: int
    graph_nodes: int