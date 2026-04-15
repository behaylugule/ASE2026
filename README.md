# ASE2026 — AI-Powered Academic Research Assistant

Django REST API, Celery workers, PostgreSQL + pgvector, and a Next.js UI for project-scoped document chat with retrieval, cross-encoder re-ranking, and citations.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local Next.js dev)

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

4. Frontend (separate terminal):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:3000`.

## API overview(Completed)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/` | Register `{ username, email, password }` |
| POST | `/api/auth/token/` | JWT `{ username, password }` |
| POST | `/api/auth/token/refresh/` | Refresh token |
| GET/POST | `/api/projects/` | List / create projects |
| GET/PATCH/DELETE | `/api/projects/{id}/` | Project detail |


## API overview(Onprogress)

| Method | Path | Description |
|--------|------|-------------|
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

