"""Project-scoped vector retrieval."""

from uuid import UUID

from django.conf import settings
from pgvector.django import CosineDistance

from apps.rag.models import DocumentChunk


def retrieve_chunks(
    project_id: str | UUID,
    query_embedding: list[float],
    limit: int | None = None,
) -> list[dict]:
    k = limit if limit is not None else settings.RETRIEVE_TOP_K
    qs = (
        DocumentChunk.objects.filter(document__project_id=project_id)
        .select_related("document")
        .annotate(distance=CosineDistance("embedding", query_embedding))
        .order_by("distance")[:k]
    )
    out: list[dict] = []
    for row in qs:
        meta = row.metadata or {}
        out.append(
            {
                "chunk_id": str(row.id),
                "content": row.content,
                "document_id": str(row.document_id),
                "document_name": meta.get("document_name") or row.document.original_filename,
                "page_number": row.page_number,
                "distance": float(row.distance) if row.distance is not None else None,
            }
        )
    return out
