import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models.schemas import (
    ChatRequest,
    ChatResponse,
    DeleteResponse,
    DocumentListResponse,
    GraphStatsResponse,
    HealthResponse,
    IngestResponse,
)
from rag.graph import (
    delete_document_from_graph,
    get_graph_stats,
    load_graph,
    save_graph,
    extract_entities_and_relations,
    add_to_graph,
)
from rag.ingestion import ingest_document
from rag.pipeline import run_pipeline
from rag.vector_store import add_chunks, delete_document, list_documents

load_dotenv()

DOCUMENTS_DIR = Path(os.getenv("DOCUMENTS_DIR", "./documents"))
DOCUMENTS_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_graph()
    yield
    # Shutdown
    save_graph()


app = FastAPI(
    title="ScholarQA",
    version="0.1.0",
    description="Research paper Q&A chatbot with hybrid RAG",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
def health():
    stats = get_graph_stats()
    return HealthResponse(
        status="ok",
        model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        documents_loaded=len(list_documents()),
        graph_nodes=stats["nodes"],
    )


# ── Documents ─────────────────────────────────────────────────────────────────

@app.post("/documents/upload", response_model=IngestResponse)
async def upload_document(file: UploadFile = File(...)):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".pdf", ".txt", ".docx"}:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}")

    # Save to disk
    save_path = DOCUMENTS_DIR / file.filename
    content = await file.read()
    save_path.write_bytes(content)

    # Ingest — parse + chunk
    chunks = ingest_document(save_path)

    # Add to ChromaDB
    add_chunks(chunks)

    # Extract entities + relationships and add to graph
    total_entities = 0
    total_relationships = 0

    for chunk in chunks:
        extracted = extract_entities_and_relations(chunk["text"])
        add_to_graph(extracted, source=file.filename)
        total_entities += len(extracted.get("entities", []))
        total_relationships += len(extracted.get("relationships", []))

    save_graph()

    return IngestResponse(
        filename=file.filename,
        chunks_added=len(chunks),
        entities_extracted=total_entities,
        relationships_extracted=total_relationships,
    )


@app.get("/documents", response_model=DocumentListResponse)
def list_docs():
    return DocumentListResponse(documents=list_documents())


@app.delete("/documents/{filename}", response_model=DeleteResponse)
def delete_doc(filename: str):
    delete_document(filename)
    delete_document_from_graph(filename)
    save_graph()

    doc_path = DOCUMENTS_DIR / filename
    if doc_path.exists():
        doc_path.unlink()

    return DeleteResponse(message=f"{filename} deleted successfully.")


# ── Graph ─────────────────────────────────────────────────────────────────────

@app.get("/graph/stats", response_model=GraphStatsResponse)
def graph_stats():
    stats = get_graph_stats()
    return GraphStatsResponse(**stats)


# ── Chat ──────────────────────────────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not list_documents():
        raise HTTPException(
            status_code=400,
            detail="No documents loaded. Upload at least one document before chatting."
        )

    history = [turn.model_dump() for turn in request.history]

    result = await run_pipeline(
        query=request.query,
        history=history,
        top_k=request.top_k,
    )

    return ChatResponse(**result)