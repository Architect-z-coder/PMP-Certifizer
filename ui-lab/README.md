# Certifizer — UI lab

Test lab only. `frontend/` and `backend/` are untouched; everything here lives on the `ui-lab` branch.

Two apps share one Vite project:

| App | Entry | What it is |
|---|---|---|
| Observatoire lab | `index.html` → `src/` | 23 screens rebuilt on 21st.dev components (see `21st-manifest.md`), single-file artifact build |
| **Chantier** (approved direction) | `chantier.html` → `src/chantier/` | the story entry page (GSAP ScrollTrigger + Lenis, media pack) and five working screens |

## Run locally

```
cd ui-lab
npm install
npm run dev
```

Then open:

- Chantier entry page: http://localhost:5173/chantier.html#/
- Aujourd'hui: http://localhost:5173/chantier.html#/aujourdhui
- Parcours · S'entraîner · Mon projet · Portrait: `#/parcours` · `#/entrainer` · `#/projet` · `#/portrait`
- Observatoire lab: http://localhost:5173/

## Checks

```
npm run build:chantier                      # dist-chantier/
npm run test:a11y:chantier                  # axe on every Chantier route at 1366 and 390 px (dev server on :5173)
npm run build && npx vite preview --port 4173 && npm run test:a11y   # Observatoire lab
npm run manifest                            # regenerates 21st-manifest.md from src/manifest.js
```

Media rules (films muted/looping/poster, paused off-screen, poster only with reduced motion, no film on working screens) are in `public/media/MEDIA.md` and enforced by `src/chantier/components/Film.jsx`.
