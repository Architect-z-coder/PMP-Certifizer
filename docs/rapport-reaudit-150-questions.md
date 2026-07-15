# Réaudit des 150 questions contre l'ECO officiel 2026 — Étape 2 (15/07/2026)

**Méthode** : jugement question par question (énoncé + bonne réponse) contre les 26 tâches et 138 enablers du référentiel canonique (`pmp_eco_2026_canonical.json`). L'ancienne zone `knowledge_area` n'a jamais servi de source d'autorité. Texte des 150 questions **gelé** (empreintes SHA-256 des banques consignées dans `question_eco_mapping.json`, verrouillées par test).
**Statut** : PROPOSITION — contre-vérification confiée à une **seconde IA** (exercice de solidification, décision Zoubir). Aucun réviseur humain à ce stade — limite assumée, cohérente avec l'esprit d'OJT-EXC-01.

## Répartition officielle (tâche primaire)

| Domaine | Q. | Part | Poids ECO | Écart |
|---|---|---|---|---|
| People | 28 | 18,7 % | 33 % | **−14,3** |
| Process | 76 | 50,7 % | 41 % | +9,7 |
| Business Environment | 46 | 30,7 % | 26 % | +4,7 |

Par tâche : PE1 **2**⚠️ · PE2 4 · PE3 7 · PE4 3 · PE5 **1**⚠️ · **PE6 0 🔴** · PE7 8 · PE8 3 ·· PR1 10 · PR2 13 · PR3 9 · PR4 **2**⚠️ · PR5 4 · PR6 4 · PR7 3 · PR8 13 · PR9 9 · PR10 9 ·· BE1 10 · BE2 6 · BE3 9 · BE4 **3** · BE5 4 · BE6 5 · BE7 5 · BE8 4.

## Découvertes

1. 🔴 **PE6 — Manage stakeholder expectations : ZÉRO question.** Le vrai trou de la banque, invisible tant qu'on comptait dans le mauvais référentiel. PE5 (Align stakeholder expectations) n'a qu'**1** question.
2. ✅ **BE4 n'est pas à zéro** : 3 questions couvrent ses enablers (« risque devient problème » ×2, « lever les obstacles de l'équipe » ×1) — dont deux vivaient déguisées en « risque » et « leadership serviteur ». La formulation prudente du §1.ter était la bonne. Aucune question n'a toutefois été *écrite pour* BE4.
3. **Le déficit Personnes est pire que prévu** : 18,7 % (le crosswalk faisait croire 21,5 %). Requalifications sorties de People : performance d'équipe → PE3, négociation fournisseur → PR5, storming → PE3, obstacles → BE4.
4. **Valeur & bénéfices** : les 5 ex-« BE7 » rejoignent **PR3** (9 questions — bien couverte).
5. **BE dépasse son poids** (30,7 %) — porté par BE1 (10, dont 5 issues du choix doctrinal charte→gouvernance).

## À contester en priorité (seconde IA)

- **Choix doctrinal charte→BE1** (5 q. : int-d2-01/02, int-x-4.1-01/02/04) : la charte comme instrument de gouvernance (autorité, seuils, métriques de succès) plutôt que PR1. Alternative défendable : PR1.
- **Confiance faible** (3 q.) : int-d2-07 et int-x-4.3-02 (« sortie de Diriger et gérer = livrables » — vocabulaire processus sans tâche 2026 dédiée, rattachées PR1, candidates à révision de contenu) ; be-x-BE.8-04 (BE2 vs BE8).
- Les requalifications ⭐ notées dans le mapping (PE.3-01→BE4, 9.4-02→PE3, PE.6-02→PR5, PE.1-02→PE2, PE.6-01→PE5).

## Plan de contenu corrigé (remplace l'ancien « lot Personnes +14 »)

Cible minimale ≥3 par tâche, priorité aux zéros et au poids d'examen :
1. **PE6 : +3** (gestion des attentes clients internes/externes — enablers exacts) · **PE5 : +2** · **PE1 : +1** → People ≈ 34.
2. **BE4 : +2** questions *écrites pour* la tâche (stratégie d'intervention, priorisation des obstacles).
3. **PR4 : +1**.
⚠️ À n'écrire qu'APRÈS la contre-vérification du mapping — sinon on vise des trous peut-être mal mesurés.

## Suite de l'ordre figé
Contre-vérification du mapping (seconde IA) → tests de couverture réécrits sur les compteurs validés → **v47 moteur** (26 `eco_task_id`) → lot de contenu ciblé ci-dessus.
