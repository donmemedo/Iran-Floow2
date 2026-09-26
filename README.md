# Floow2 Iran (فلوتو)

B2B asset-sharing marketplace: rent, sell or request equipment, services and skilled crews between companies.

- `backend/` FastAPI + SQLite (seeded on first start). Docs: http://localhost:8060/docs
- `frontend/` Next.js 16, Tailwind 4, Motion. `/fa` (RTL, default) and `/en`, light/dark.

## Run

```bash
docker compose up -d --build     # http://localhost:3060
```

Dev without Docker:

```bash
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/uvicorn app.main:app --reload
cd frontend && npm install && npm run dev
```

Tests: `cd backend && .venv/bin/pip install httpx pytest && .venv/bin/pytest -q`
