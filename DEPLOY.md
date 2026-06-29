# Certifizer — full install & deploy guide
*by Zoubir DAHIA — all free tier*

You'll put the code on **GitHub**, the database on **Supabase**, the backend on **Render**, and the frontend on **Vercel**, using **Gemini** as the free model.

```
GitHub (code)
   ├── Render   → FastAPI backend (the API + the model key)
   ├── Vercel   → React frontend (what students open)
   └── Supabase → Postgres database (mastery, attempts, item bank)
Gemini API → the free LLM the backend calls
```

> **Why not the backend on Vercel?** Vercel is built to serve a frontend; FastAPI needs a always-running server. Render's free web service runs it directly.

---

## 0. One-time: tools & accounts (all free)

Install locally:
- **Git** — https://git-scm.com
- **Node.js 18+** — https://nodejs.org
- **Python 3.11+** — https://python.org

Create free accounts (sign in with GitHub where possible):
- **GitHub** — https://github.com
- **Google AI Studio** (Gemini key) — https://aistudio.google.com
- **Supabase** — https://supabase.com
- **Render** — https://render.com
- **Vercel** — https://vercel.com

---

## 1. Get your free Gemini key
1. Go to https://aistudio.google.com/app/apikey → **Create API key**.
2. Copy it (starts with `AIza…`). Keep it private — you'll paste it into Render later.

---

## 2. Run it locally first (5 minutes — confirms everything works)

### Backend
```bash
cd certifizer/backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```
Open `.env` and set:
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIza...your key...
DATABASE_URL=sqlite:///./certifizer.db
CORS_ORIGINS=http://localhost:5173
```
Start it:
```bash
uvicorn app.main:app --reload --port 8000
```
Check http://localhost:8000/health → `{"ok": true, "provider": "gemini"}`.

### Frontend (new terminal)
```bash
cd certifizer/frontend
npm install
cp .env.example .env                # VITE_API_URL=http://localhost:8000
npm run dev
```
Open http://localhost:5173 → pick **Me tester / Quiz me** and answer a question; the readiness bars should move. If that works, you're ready to deploy.

---

## 3. Put the code on GitHub
From the project root (`certifizer/`):
```bash
git init
git add .
git commit -m "Certifizer — initial commit"
```
Create the repo and push (using GitHub CLI):
```bash
gh repo create certifizer --public --source=. --push
```
*No GitHub CLI?* Create an empty repo at https://github.com/new (name it `certifizer`), then:
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/certifizer.git
git push -u origin main
```
> `.gitignore` already excludes `.env`, so your keys are **not** uploaded. Good.

---

## 4. Database — Supabase (free Postgres)
1. https://supabase.com → **New project**. Pick a name and a **strong database password** (save it).
2. Wait ~2 min for it to provision.
3. Click **Connect** (top of the dashboard). You'll see three strings: *Direct connection*, *Session pooler*, *Transaction pooler*.
   - **Use the Session pooler** — it's IPv4-compatible (Render free tier is IPv4-only; the Direct connection is IPv6-only and will fail). It looks like:
     ```
     postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres
     ```
   - Note the **port is 5432** (session mode), not 6543 (transaction mode), and the user has the `postgres.<project-ref>` form.
4. Replace `[YOUR-PASSWORD]` with your real password. Keep this string for the next step (it's your `DATABASE_URL`).

> Tables are created automatically the first time the backend boots, and the Day-2 question bank loads itself.

---

## 5. Deploy the backend — Render (free)
1. https://render.com → **New → Web Service** → connect your GitHub and pick the `certifizer` repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance type:** Free
3. **Environment variables** (Add from the dashboard):
   | Key | Value |
   |---|---|
   | `LLM_PROVIDER` | `gemini` |
   | `GEMINI_API_KEY` | your `AIza…` key |
   | `DATABASE_URL` | the Supabase URI from step 4 |
   | `CORS_ORIGINS` | `*` (temporary — we'll tighten it in step 7) |
4. **Create Web Service**. Wait for the build, then open the URL it gives you, e.g. `https://certifizer-api.onrender.com`.
5. Test `https://certifizer-api.onrender.com/health` → should return `ok: true`. Copy this backend URL.

> *Shortcut:* the included `render.yaml` lets you use **New → Blueprint** instead — Render reads the config and only asks for the three secret env vars.

---

## 6. Deploy the frontend — Vercel
1. https://vercel.com → **Add New → Project** → import the `certifizer` repo.
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - Build command / output (`npm run build` → `dist`) are auto-filled.
3. **Environment Variable:**
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | your Render backend URL (e.g. `https://certifizer-api.onrender.com`) |
4. **Deploy**. You'll get a public URL like `https://certifizer.vercel.app`.

> Vite bakes env vars at **build time** — if you ever change `VITE_API_URL`, redeploy on Vercel.

---

## 7. Connect the two (CORS)
1. Back in **Render → your service → Environment**, set:
   ```
   CORS_ORIGINS = https://certifizer.vercel.app
   ```
   (your exact Vercel domain, **no trailing slash**; comma-separate if you have several).
2. Save → Render redeploys automatically.
3. Open your Vercel URL and run a quiz — it should talk to the backend with no CORS error.

---

## 8. Make it public (share it)
- **GitHub:** the repo is already public (step 3). Add a description and the Vercel link.
- **Vercel:** the deployment URL is public by default — share `https://certifizer.vercel.app` with the cohort / SMA.
- Optional: in Vercel → **Settings → Domains**, add a custom domain later.

---

## 9. Keep the free backend awake (recommended for demos)
Render's free service sleeps after ~15 min idle (first hit then takes ~30–50s). For a live demo, ping it:
1. https://cron-job.org (free) → **Create cronjob**.
2. URL: `https://certifizer-api.onrender.com/health`, every **10 minutes**.

---

## Adding a new study day (zero code)
1. I produce the day's question bank as JSON (same shape as `day2-integration.json`).
2. Drop it into `backend/app/data/`.
3. `git add . && git commit -m "Day N item bank" && git push`.
4. Render redeploys; the new questions load automatically. Done.

---

## Troubleshooting
- **CORS error in the browser console** → `CORS_ORIGINS` on Render must equal the Vercel domain exactly (https, no trailing slash); redeploy.
- **Frontend calls localhost in production** → `VITE_API_URL` wasn't set on Vercel, or you didn't redeploy after setting it.
- **Backend 500 on first call / DB errors** → check `DATABASE_URL` (password filled in, no brackets) and that the Supabase project is active.
- **`provider not set` / model errors** → `GEMINI_API_KEY` missing or `LLM_PROVIDER` not `gemini` on Render.
- **First request very slow** → Render free cold start; see step 9.

---

## Cost summary
| Piece | Service | Cost |
|---|---|---|
| Code | GitHub | Free |
| Backend | Render Web Service | Free |
| Frontend | Vercel | Free |
| Database | Supabase Postgres | Free |
| Model | Google Gemini API | Free tier |

Everything stays free. To switch the model later (e.g. Groq, or Anthropic for premium), change `LLM_PROVIDER` + the matching key on Render — no code change.
