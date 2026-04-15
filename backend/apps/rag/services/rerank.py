from functools import lru_cache

from django.conf import settings
from sentence_transformers import CrossEncoder


@lru_cache(maxsize=1)
def _cross_encoder() -> CrossEncoder:
    return CrossEncoder(settings.RERANKER_MODEL)


def rerank_chunks(
    query: str,
    chunks: list[dict],
    top_k: int | None = None,
) -> list[dict]:
    if not chunks:
        return []
    k = top_k if top_k is not None else settings.RERANK_TOP_K
    model = _cross_encoder()
    pairs = [(query, c["content"]) for c in chunks]
    scores = model.predict(pairs)
    scored = sorted(zip(scores, chunks), key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:k]]
