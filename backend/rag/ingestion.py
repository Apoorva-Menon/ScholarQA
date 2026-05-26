import os
from pathlib import Path
from typing import List

import fitz  # PyMuPDF
from docx import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".docx"}


def parse_pdf(path: Path) -> str:
    doc = fitz.open(str(path))
    return "\n\n".join(page.get_text() for page in doc)


def parse_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_docx(path: Path) -> str:
    doc = Document(str(path))
    return "\n\n".join(para.text for para in doc.paragraphs if para.text.strip())


def parse_document(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".pdf":
        return parse_pdf(path)
    elif ext == ".txt":
        return parse_txt(path)
    elif ext == ".docx":
        return parse_docx(path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 100) -> List[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " "],
    )
    return splitter.split_text(text)


def ingest_document(path: Path) -> List[dict]:
    """
    Parse and chunk a document.
    Returns a list of dicts with chunk text and metadata.
    """
    path = Path(path)

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {path.suffix}")

    raw_text = parse_document(path)
    chunks = chunk_text(raw_text)

    return [
        {
            "text": chunk,
            "metadata": {
                "source": path.name,
                "chunk_index": i,
                "total_chunks": len(chunks),
            },
        }
        for i, chunk in enumerate(chunks)
    ]