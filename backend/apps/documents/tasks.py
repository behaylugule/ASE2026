import logging
import re

from celery import shared_task
from django.db import transaction
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from apps.documents.models import Document, DocumentStatus
from apps.rag.models import DocumentChunk
from apps.rag.services.embeddings import embed_texts

logger = logging.getLogger(__name__)


def _extract_pdf(path: str) -> list[tuple[str, int | None]]:
    """Return list of (text, page_number) per page."""
    reader = PdfReader(path)
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        pages.append((text, i))
    return pages


def _extract_docx(path: str) -> list[tuple[str, int | None]]:
    from docx import Document as DocxDocument

    doc = DocxDocument(path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    full = "\n\n".join(paragraphs)
    return [(full, None)]


def _chunk_pages(
    pages: list[tuple[str, int | None]],
    chunk_size: int = 450,
    chunk_overlap: int = 80,
) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        encoding_name="cl100k_base",
    )
    out: list[dict] = []
    chunk_index = 0
    for text, page_num in pages:
        if not text.strip():
            continue
        for chunk in splitter.split_text(text):
            if not chunk.strip():
                continue
            out.append(
                {
                    "content": chunk,
                    "page_number": page_num,
                    "chunk_index": chunk_index,
                }
            )
            chunk_index += 1
    return out


@shared_task
def ingest_document(document_id: str):
    try:
        doc = Document.objects.select_related("project").get(pk=document_id)
    except Document.DoesNotExist:
        logger.warning("Document %s not found", document_id)
        return

    doc.status = DocumentStatus.PROCESSING
    doc.error_message = ""
    doc.save(update_fields=["status", "error_message", "updated_at"])

    path = doc.file.path
    name_lower = doc.original_filename.lower()

    try:
        if name_lower.endswith(".pdf"):
            pages = _extract_pdf(path)
            doc.page_count = len(pages)
        elif name_lower.endswith(".docx"):
            pages = _extract_docx(path)
            doc.page_count = None
        else:
            raise ValueError("Unsupported file type")

        chunks = _chunk_pages(pages)
        if not chunks:
            raise ValueError("No text could be extracted from the document")

        texts = [c["content"] for c in chunks]
        vectors = embed_texts(texts)

        project_id = str(doc.project_id)
        document_name = doc.original_filename

        with transaction.atomic():
            DocumentChunk.objects.filter(document=doc).delete()
            bulk = []
            for i, ch in enumerate(chunks):
                token_estimate = len(re.split(r"\s+", ch["content"].strip())) or 0
                meta = {
                    "project_id": project_id,
                    "document_id": str(doc.id),
                    "document_name": document_name,
                    "page_number": ch["page_number"],
                    "chunk_id": f"{doc.id}:{ch['chunk_index']}",
                }
                bulk.append(
                    DocumentChunk(
                        document=doc,
                        chunk_index=ch["chunk_index"],
                        content=ch["content"],
                        token_count=min(token_estimate, 65535),
                        page_number=ch["page_number"],
                        metadata=meta,
                        embedding=vectors[i],
                    )
                )
            DocumentChunk.objects.bulk_create(bulk)

        doc.status = DocumentStatus.READY
        doc.save(update_fields=["status", "page_count", "updated_at"])
    except Exception as exc:
        logger.exception("Ingest failed for %s", document_id)
        doc.status = DocumentStatus.FAILED
        doc.error_message = str(exc)[:2000]
        doc.save(update_fields=["status", "error_message", "updated_at"])
