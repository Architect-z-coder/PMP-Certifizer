# Certifizer — adaptive PMP study advisor

*by Zoubir DAHIA*

A small web app: an LLM study advisor that **explains**, **quizzes**, runs **exam scenarios**, and **relates PMBOK concepts to a learner's real project** — while tracking per-topic mastery and recommending what to study next (weakness × exam weight).

- **Frontend:** React (Vite)
- **Backend:** FastAPI (Python) — holds the model key, builds prompts, persists mastery
- **Database:** any SQL via `DATABASE_URL` (SQLite for dev → Supabase/Neon Postgres for deploy)
- **LLM:** provider-agnostic — `gemini` (free) · `groq` (free) · `anthropic` (paid). One env var switches.

```
Browser ── React ──▶ FastAPI ──▶ LLM provider (key lives here, never in the browser)
                        └──▶ Database (attempts, mastery)
```

---

## Why a backend (vs the Claude prototype)
The Claude artifact called the model with no key because Claude's sandbox injected it. A public web app **cannot** ship a key in the browser, so the FastAPI backend holds it and proxies every call. The React UI, the adaptive math, and the EVAL-verdict parsing are otherwise identical to the prototype.

---

## Run locally

### 1. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then set LLM_PROVIDER + the matching API key
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:8000
npm run dev                   # http://localhost:5173
```

---

## Get a free LLM key (pick one)
- **Gemini (default, free):** https://aistudio.google.com/app/apikey → set `LLM_PROVIDER=gemini`, `GEMINI_API_KEY=…`
  - Free tier ≈ 1,500 requests/day on Gemini Flash, no card, no expiry.
- **Groq (free, very fast, open-weight):** https://console.groq.com/keys → `LLM_PROVIDER=groq`, `GROQ_API_KEY=…`
- **Anthropic (paid / premium):** https://console.anthropic.com → `LLM_PROVIDER=anthropic`, `ANTHROPIC_API_KEY=…`

> Note for institutional use: free LLM tiers may use prompts to train the provider's models. Fine for study Q&A; flag it for sensitive data. Paid tiers and the standalone setup avoid this.

---

## Deploy (all free tier)
| Piece | Free host | Notes |
|---|---|---|
| Frontend (Vite build) | **Vercel** / **Netlify** / **Cloudflare Pages** | `npm run build` → deploy `dist/`. Set `VITE_API_URL` to the backend URL. |
| Backend (FastAPI) | **Render** (free web service) or **Hugging Face Spaces** (Docker) | A `Dockerfile` is included. Free Render spins down when idle (~30–50s cold start) — keep warm with a free cron ping to `/health` (e.g. cron-job.org). |
| Database | **Supabase** or **Neon** (free Postgres) | Set `DATABASE_URL` to the connection string. SQLite won't persist on serverless. |
| Auth (later) | **Supabase Auth** (free) | Replace the hard-coded `LEARNER_ID="demo"` with the signed-in user id. |

Set the backend env vars (`LLM_PROVIDER`, the key, `DATABASE_URL`, `CORS_ORIGINS`) in your host's dashboard — never commit `.env`.

---

## How the adaptive loop works
1. Quiz/scenario answer is graded by the LLM, which appends a hidden verdict: `<<<EVAL {"area":"risk","result":"correct"}>>>`.
2. The backend strips it, records an `Attempt`, and updates `Mastery` (EWMA, α = 0.4).
3. The recommendation = the area with the highest **exam_weight × (1 − mastery)** (exam_weight = PMBOK-6 process count / 49; refine with real ECO weights).
4. The readiness panel and the "focus here next" banner update live.

See `Adaptive Learning — Data model & loop (design).md` for the full model.

---

## Roadmap
- [x] Curated bilingual question bank powering quiz mode (no LLM cost)
- [ ] Auth + per-learner history (Supabase)
- [ ] Spaced repetition (Leitner boxes, `due_at`) across sessions
- [ ] Cohort dashboard for the trainer (group weak areas)
- [ ] Reuse the engine for CAPLPA / a competency framework → competency management

## Question bank
Curated questions live in `backend/app/data/*.json` (see `day2-integration.json`). **To add a day**, drop a new bank file in that folder — it loads automatically on startup (idempotent, keyed by each item's `id`). Quiz mode serves these curated items with **no LLM call** (free + deterministic); the model is used only for Explain / Scenario / Relate.

## API
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/chat` | LLM advisor turn (Explain/Scenario/Relate; grades + updates mastery) |
| GET | `/api/quiz/next?learner_id=&area=` | next curated question (adaptive pick; answer hidden) |
| POST | `/api/quiz/answer` | grade a choice, record attempt, update mastery |
| GET | `/api/mastery/{learner_id}` | readiness + recommendation |
| GET | `/api/items?area=` | list curated items |
| GET | `/health` | liveness + active provider |
