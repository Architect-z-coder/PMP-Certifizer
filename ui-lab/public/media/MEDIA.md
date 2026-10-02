# Certifizer media — rules

Files in media/ (all compressed, about 2 MB in total):
- Films (no sound): site.mp4, board.mp4, pm.mp4, each with a -poster.webp
- Photos (1000 px WebP): site-engineer, team-roadmap, colleagues, scenario, learner, trainer, whiteboard, pm-portrait

Where each one goes (see certifizer-chantier.html):
- site-engineer.webp: hero photo, the schedule card floats over it
- site.mp4: full-width film that grows while scrolling, after the hero
- board.mp4: beside "Réviser en produisant du vrai travail"
- team-roadmap.webp: first card of the deliverables row
- colleagues / scenario / learner.webp: "Pour qui" section, mask reveal
- trainer.webp: trainers section, widens on scroll
- pm.mp4: background of the final call to action
- whiteboard.webp, pm-portrait.webp: spare

Rules:
1. Films only on story pages (entry page). Never on working screens (Aujourd'hui, S'entraîner, Mon projet).
2. Films are muted, looping, playsinline, with a poster image.
3. Films pause when off-screen (IntersectionObserver).
4. With prefers-reduced-motion: no autoplay, show the poster only.
5. Every photo has a French alt text. Mark the section "Photos d'illustration".
6. Photos and films are illustrations, never shown as real learners or clients.
