# Rapport de vérification — référentiel canonique ECO 2026

**Fichier vérifié** : `backend/reference/pmp_eco_2026_canonical.json`
**Source** : PDF officiel PMI « PMP Examination Content Outline – 2026 » (July 2026 Update)
`https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/new-pmp-examination-content-outline-2026.pdf`
**Récupéré le** : 2026-07-15 (extraction de texte via session Claude — le binaire PDF n'a pas transité)

| Contrôle | Résultat |
|---|---|
| Tâches transcrites contre le PDF | **26/26** — transcription confirmée par audit indépendant du 16/07 : 26/26 intitulés exacts, 138/138 enablers, 0 divergence |
| Enablers transcrits contre le PDF | **138/138** (People 39 · Process 64 · Business Environment 35) |
| Poids de domaine | 33 / 41 / 26 — conformes p.5 |
| Sentinelles sémantiques (PE4-6, PR3, PR9, BE4-7) | vertes (`tests/test_eco_canonical.py`) |
| **Contre-vérification** | **Décision Zoubir (15/07)** : confiée à une **seconde IA** (exercice de solidification) — pas de réviseur humain à ce stade. ⚠️ Limite assumée : une IA de contrôle n'est pas un formateur PMI. |
| **Date de vérification humaine** | ⏳ à renseigner |
| **SHA-256 du PDF source** | ✅ `8aefc40be4528a8b75de432b1912de8abb574456efff1c4d63af1a55e96d2654` (1 471 802 octets, 23 pages) — calculée indépendamment par DEUX auditeurs IA, valeurs convergentes (15-16/07). Anomalie « June 2019 » élucidée : métadonnée interne d'un gabarit Word PMI non actualisé, sans effet sur le contenu |

## Procédure de vérification humaine
1. Télécharger le PDF à l'URL ci-dessus ; calculer et consigner son SHA-256 ici ET dans `pdf_sha256` du JSON canonique.
2. Comparer chaque intitulé de tâche (26) et chaque enabler (138) du JSON aux pages 7–12 du PDF.
3. Toute divergence → corriger le JSON, relancer `generate_reference_md.py`, relancer les tests.
4. Renseigner Réviseur + Date ci-dessus.

## Critère de sortie de l'étape 1
Une personne peut supprimer entièrement le crosswalk historique et reconstruire sans ambiguïté
les 26 tâches officielles à partir du seul fichier canonique, sans rencontrer une seule
hypothèse Certifizer présentée comme un fait PMI.
