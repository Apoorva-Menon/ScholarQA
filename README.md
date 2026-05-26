# ScholarQA

A research paper Q&A chatbot powered by hybrid Retrieval-Augmented Generation (RAG). Upload academic papers and ask questions across them — ScholarQA combines vector similarity search with a knowledge graph to answer both semantic and multi-hop questions.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     React Frontend                   │
│  Documents panel │ Chat window │ Sources & Graph     │
└─────────────────────────┬───────────────────────────┘
                          │ HTTP
┌─────────────────────────▼───────────────────────────┐
│                      FastAPI                         │
│  POST /documents/upload                              │
│  POST /chat                                          │
│  GET  /documents  │  DELETE /documents/{filename}    │
│  GET  /graph/stats │ GET /health                     │
└──────┬──────────────────────────────────────────────┘
       │
       ├── Ingestion pipeline
       │     parse (PDF/TXT/DOCX)
       │     → chunk (RecursiveCharacterTextSplitter)
       │     → embed (gemini-embedding-001)
       │     → store (ChromaDB)
       │     → extract entities + relations (Gemini)
       │     → store (NetworkX graph → graph.json)
       │
       └── Query pipeline
             embed query
             → vector search (ChromaDB top-k)
             → entity extraction from query
             → graph traversal (NetworkX, 2 hops)
             → merge context
             → generate answer (Gemini 2.5 Flash)
```

---

## Project Structure

```
ScholarQA/
├── backend/
│   ├── main.py                  # FastAPI app + routes
│   ├── rag/
│   │   ├── ingestion.py         # Document parsing + chunking
│   │   ├── embeddings.py        # Google embedding API
│   │   ├── vector_store.py      # ChromaDB operations
│   │   ├── graph.py             # Entity extraction + NetworkX
│   │   ├── retrieval.py         # Hybrid retrieval
│   │   └── pipeline.py          # Prompt assembly + Gemini call
│   ├── models/
│   │   └── schemas.py           # Pydantic request/response models
│   ├── documents/               # Uploaded files stored here
│   ├── chroma_db/               # ChromaDB persistence (auto-created)
│   ├── graph.json               # Knowledge graph persistence (auto-created)
│   ├── pyproject.toml
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api/client.js
    │   └── components/
    │       ├── DocumentPanel.jsx
    │       ├── ChatWindow.jsx
    │       ├── MessageBubble.jsx
    │       └── SourcesPanel.jsx
    ├── package.json
    └── vite.config.js
```

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) — `curl -LsSf https://astral.sh/uv/install.sh | sh`
- A [Google AI Studio](https://aistudio.google.com/) API key

### Backend

```bash
cd backend

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv sync

# Configure environment
cp .env.example .env
# Add your GOOGLE_API_KEY to .env

# Start the server
uv run uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Swagger docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment variables

Create a `.env` file in the `backend/` directory:

```env
GOOGLE_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
CHROMA_PERSIST_DIR=./chroma_db
GRAPH_PERSIST_PATH=./graph.json
DOCUMENTS_DIR=./documents
```

---

## Usage

1. **Upload papers** — use the Documents panel on the left to upload PDF, TXT, or DOCX files. Each document is chunked, embedded, and indexed. Entities and relationships are extracted into the knowledge graph.

2. **Ask questions** — type a question in the chat. ScholarQA retrieves relevant chunks from ChromaDB and traverses the knowledge graph for related entities, then passes both as context to Gemini.

3. **View sources** — click any assistant message to see which document passages were retrieved and which graph entities and relationships were used to answer the question.

### Example questions

- *"What architecture does the Transformer paper propose?"*
- *"Which papers evaluate on ImageNet?"*
- *"How does BERT differ from the original Transformer?"*
- *"What datasets are mentioned across these papers?"*

---

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server status, doc count, graph node count |
| `POST` | `/documents/upload` | Upload and ingest a document |
| `GET` | `/documents` | List all ingested documents |
| `DELETE` | `/documents/{filename}` | Remove a document and its data |
| `GET` | `/graph/stats` | Knowledge graph node/edge counts by type |
| `POST` | `/chat` | Send a query, get an answer with sources |
