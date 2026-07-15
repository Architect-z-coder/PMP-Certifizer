# Rapport de vérification — référentiel canonique ECO 2026

**Fichier vérifié** : `backend/reference/pmp_eco_2026_canonical.json`
**Source** : PDF officiel PMI « PMP Examination Content Outline – 2026 » (July 2026 Update)
`https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/new-pmp-examination-content-outline-2026.pdf`
**Récupéré le** : 2026-07-15 (extraction de texte via session Claude — le binaire PDF n'a pas transité)

| Contrôle | Résultat |
|---|---|
| Tâches transcrites contre le PDF | **26/26** (transcription machine depuis le texte extrait, session du 15/07/2026) |
| Enablers transcrits contre le PDF | **138/138** (People 39 · Process 64 · Business Environment 35) |
| Poids de domaine | 33 / 41 / 26 — conformes p.5 |
| Sentinelles sémantiques (PE4-6, PR3, PR9, BE4-7) | vertes (`tests/test_eco_canonical.py`) |
| **Réviseur humain** | ⏳ **À RENSEIGNER — la transcription machine ne remplace pas la vérification humaine** |
| **Date de vérification humaine** | ⏳ à renseigner |
| **SHA-256 du PDF source** | ⏳ à renseigner (télécharger le PDF, `sha256sum` ou `certutil -hashfile <pdf> SHA256`) |

## Procédure de vérification humaine
1. Télécharger le PDF à l'URL ci-dessus ; calculer et consigner son SHA-256 ici ET dans `pdf_sha256` du JSON canonique.
2. Comparer chaque intitulé de tâche (26) et chaque enabler (138) du JSON aux pages 7–12 du PDF.
3. Toute divergence → corriger le JSON, relancer `generate_reference_md.py`, relancer les tests.
4. Renseigner Réviseur + Date ci-dessus.

## Critère de sortie de l'étape 1
Une personne peut supprimer entièrement le crosswalk historique et reconstruire sans ambiguïté
les 26 tâches officielles à partir du seul fichier canonique, sans rencontrer une seule
hypothèse Certifizer présentée comme un fait PMI.
