
## Task list (status)

### Completed

- [x] Django backend (DRF) with JWT auth (`/api/auth/*`)
- [x] Project CRUD (`/api/projects/*`) with per-user project isolation
- [x] Document upload/list/delete endpoints (`/api/projects/{id}/documents/*`)
- [x] Async ingestion (Celery + Redis): extract PDF/DOCX → chunk (300–500 tokens) → embed → store chunks + metadata
- [x] PostgreSQL + pgvector storage for chunks/embeddings + relational entities
- [x] Docker Compose stack: `db`, `redis`, `backend`, `worker`, `frontend`
- [x] CPU-only PyTorch in Docker (no NVIDIA/CUDA required)
- [x] LangGraph RAG pipeline: load memory → embed query → project-scoped cosine retrieval → re-rank → multi-doc aggregation → generate → citations → save memory
- [x] Chat API + history (`/api/projects/{id}/chat/*`)
- [x] Next.js UI (auth, projects, upload/status, chat with citations)
- [x] Dark theme support (default: light) with UI toggle
- [x] Home route redirect: `/` → `/login` if unauthenticated, otherwise `/projects`
- [x] Upload fixes:
  - [x] Increased `Document.file` max length (avoids `SuspiciousFileOperation`)
  - [x] Fixed tokenizer selection for chunking (`encoding_name="cl100k_base"`)

### Remaining

- [ ] Stream chat responses (SSE/WebSocket) for token-by-token UX
- [ ] Better citation precision (character offsets, snippet highlighting, stronger page mapping)
- [ ] Access token refresh handling in frontend (auto refresh on 401)
- [ ] Background job monitoring UI (ingestion progress + retry controls)
- [ ] Vector index tuning (HNSW/IVFFlat indexing, performance tuning for large corpora)



# ASE2026 — AI-Powered Academic Research Assistant

### Title

AI-Powered Academic Research Assistant with Scalable System Architecture (RAG-Based Platform)

### 1. Introduction

The rapid growth of academic publications has made it increasingly difficult for researchers and students to efficiently locate, analyze, and synthesize relevant information. Traditional research methods require extensive manual effort to search for papers, evaluate their relevance, and extract key insights. While recent advances in artificial intelligence have introduced tools to assist with these tasks, many of these systems lack reliability, often generating responses without verifiable sources or producing inaccurate information.

### 2. Problem Statement

The primary problem addressed in this project is the inefficiency and lack of trust in current academic research workflows. Researchers face information overload due to the vast number of available academic papers. The process of reviewing and summarizing literature is time-consuming and labor-intensive. Existing AI-based tools often produce unreliable or non-cited responses, limiting their usefulness in academic contexts.

### 3. Proposed Solution

This project proposes an AI-powered academic research assistant based on a Retrieval-Augmented Generation (RAG) architecture. The system integrates document retrieval with generative AI to provide accurate, context-aware, and source-grounded responses. It includes retrieval of relevant documents, grounded answer generation, automatic citations, and a scalable backend.

### 4. Objectives

The objectives are to reduce research time, improve accuracy of AI-generated responses, ensure scalability, and enhance user trust through verifiable citations.

### 5. Methodology

The system will use a RAG pipeline including data ingestion, embedding and indexing, retrieval, generation, and a user interface. A scalable architecture ensures performance and reliability.

### 6. Expected Outcomes

The system is expected to reduce research time, improve trust in AI outputs, enhance academic workflows, and demonstrate the effectiveness of RAG in research applications.

### 7. Conclusion

This project combines retrieval and generative AI to address challenges in academic research, ensuring outputs are grounded in real sources and improving both efficiency and reliability.


Django REST API, Celery workers, PostgreSQL + pgvector, and a Next.js UI for project-scoped document chat with retrieval, cross-encoder re-ranking, and citations.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (optional, only if running Next.js outside Docker)

## Quick start

1. Copy environment files:

   ```bash
   cp .env.example .env
   cp frontend/.env.local.example frontend/.env.local
   ```

2. Set `OPENAI_API_KEY` in `.env` for chat answers (embeddings and re-ranking use local `sentence-transformers` models on first run).

3. Start the stack:

   ```bash
   docker compose up --build
   ```

   The backend image installs **CPU-only PyTorch** from [download.pytorch.org/whl/cpu](https://download.pytorch.org/whl/cpu), so no NVIDIA GPU drivers or CUDA wheels are required on your machine.

   - API: `http://localhost:8000` (Postgres and Redis are **not** published to the host by default; only the API port is mapped.)
   - Health: `http://localhost:8000/health/`
   - Admin: `http://localhost:8000/admin/` (create a superuser with `docker compose exec backend python manage.py createsuperuser`)
   - Frontend: `http://localhost:3000`

4. Optional: run the frontend locally instead of Docker:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:3000` (ensure `NEXT_PUBLIC_API_URL` points at your backend).

## API overview (Completed)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/` | Register `{ username, email, password }` |
| POST | `/api/auth/token/` | JWT `{ username, password }` |
| POST | `/api/auth/token/refresh/` | Refresh token |
| GET/POST | `/api/projects/` | List / create projects |
| GET/PATCH/DELETE | `/api/projects/{id}/` | Project detail |
| GET/POST | `/api/projects/{id}/documents/` | List / upload PDF or DOCX |
| GET/DELETE | `/api/projects/{id}/documents/{doc_id}/` | Document detail / delete |
| POST | `/api/projects/{id}/chat/` | `{ "message": "..." }` — LangGraph RAG pipeline |
| GET | `/api/projects/{id}/chat/messages/` | Chat history |

All project routes require `Authorization: Bearer <access>`.

## Configuration

Key variables in `.env`:

- `DATABASE_URL` — overridden in Compose to point at the `db` service
- `EMBEDDING_DIMENSION` — must match the embedding model (384 for `all-MiniLM-L6-v2`)
- `RETRIEVE_TOP_K`, `RERANK_TOP_K` — retrieval and re-rank sizes
- `CORS_ALLOWED_ORIGINS` — include your Next.js origin

## Architecture

- **Ingestion**: Celery task chunks PDF/DOCX, embeds with sentence-transformers, stores rows in `DocumentChunk` with pgvector.
- **Query**: LangGraph nodes — load memory → embed query → project-filtered ANN-style cosine retrieval → cross-encoder re-rank → multi-document context → OpenAI chat → citation list → persist messages.

