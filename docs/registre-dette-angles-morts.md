# Registre de dette & angles morts — Certifizer

Issu de l'audit systémique du 16/07/2026 (auditeur externe) + revue interne. Ces points ne sont PAS des fonctions à construire maintenant : chacun porte un **déclencheur** qui dit QUAND il devient bloquant. La règle du projet tient : une chose testable à la fois, on ne gèle pas le développement dans de la gouvernance avant d'avoir prouvé qu'un apprenant apprend.

Légende sévérité : 🔴 critique · 🟠 important · 🟡 à planifier.

| # | Angle mort | Sév. | Déclencheur (quand ça devient bloquant) | État |
|---|---|---|---|---|
| 1 | **Identité liée à session** — le serveur doit dériver l'identité de l'apprenant d'une session authentifiée, jamais d'un `learner_id` fourni par le navigateur. Contradiction du plan corrigée : c'est un **Must** du jalon institutionnel, pas un Could. | 🔴 | Avant tout pilote institutionnel réel | Ouvert (chantier C requalifié Must) |
| 2 | **IDOR résiduel** — endpoints lisant la progression par `learner_id` non vérifié (dont `/api/eco/mastery` ajouté en v47). | 🔴 | Avant tout pilote réel ; résolu par #1 | Ouvert |
| 3 | **Sauvegardes DB + restauration testée** — aucune sauvegarde planifiée de Supabase. « Une sauvegarde n'est prouvée que par une restauration réussie. » | 🔴 | Avant le premier apprenant réel (seul risque IRRÉVERSIBLE du projet) | Ouvert |
| 4 | **Télémétrie de calibration** — `Attempt` n'enregistre ni l'option choisie ni le temps de réponse ; données perdues chaque jour, requises par le programme psychométrique. Migration additive. | 🟠 | Le plus tôt possible (perte continue) | Ouvert |
| 5 | **Quarantaine de contenu** — seul le contenu mappé/audité est servable. | ✅ | — | **FAIT (v47.3)** : garde `is_servable`/`servable_filter`, appliqué à quiz/next + composeur, testé |
| 6 | **Portails de release** — distinguer états techniques (construit/déployé) des états réels : utilisable, sûr, valide pédagogiquement, légal, vendable. 7 portails : Technique / Sécurité / Contenu / Apprentissage / Opérationnel / Légal / Commercial. | 🟠 | À appliquer aux jalons majeurs dès la roadmap scindée | Ouvert |
| 7 | **Staging + monitoring + rollback** — séparation expérimentation / service ; smoke test avant prod ; suivi d'erreurs ; alerte de disponibilité. | 🟠 | Avant le premier pilote réel | Ouvert (staging déjà décidé « au premier pilote ») |
| 8 | **Mention marque PMI** — « PMI et PMP sont des marques déposées du Project Management Institute ; Certifizer n'est ni affilié ni endossé. » Usage nominatif à sécuriser. | 🟠 | Avant vente institutionnelle ; pied de page bon marché à poser tôt | Ouvert |
| 9 | **Contenu « Expliquer » / parcours guidé non réaudité** contre l'ECO 2026 (peut porter des restes de l'ancienne taxonomie). | 🟡 | Avant vente institutionnelle | Ouvert |
| 10 | **Spécification du simulateur d'examen** — 180 q / 240 min, construction de formulaire, pools protégés vs entraînement, blueprint domaine/tâche, reprise après interruption, scoring, rapport post-examen. Une grande banque ne fait pas un simulateur. | 🟡 | Chantier propre, après le programme de contenu | Ouvert (feature déclarée, jamais spécifiée) |
| 11 | **Programme psychométrique** — nb min de réponses avant d'interpréter un item, taux de réussite, temps, discrimination, fonctionnement des distracteurs, différentiel de langue, retrait d'item, fiabilité, items d'ancrage, calibration du readiness. Langage prudent : « indicateur de préparation Certifizer », jamais « vous êtes prêt à 82 % ». | 🟡 | Quand des données apprenants réelles existent | Ouvert |
| 12 | **Programme de production 1 500 questions** — ~45 lots de 30 : taux d'acceptation/rejet, heures par question approuvée, nb et qualification des relecteurs, capacité mensuelle, indépendance des relecteurs, budget, propriété du backlog, capacité de mise à jour/retrait, protection contre la dépendance à une seule personne (aujourd'hui Zoubir est product owner + architecte contenu + validateur + arbitre : risque de continuité). | 🟠 | Avant d'accélérer vers 1 500 | Ouvert |
| 13 | **Analytique produit** — modèle d'événements (signup, 1re question, 1re séance, retour J1/J3/J7, rationale ouverte, simulateur, conversion…) et métriques (time-to-first-value, activation, WAU, complétion, taux de retour, récupération après erreur). Sans ça, on peut écrire 1 500 questions sans savoir ce qui est utilisé. | 🟠 | Avant/pendant le premier pilote | Ouvert |
| 14 | **Corpus légal au-delà de la vie privée** — ToS, usage acceptable, contrat institutionnel, DPA, liste de sous-traitants, notification d'incident, remboursement, propriété IP (questions créées par formateurs, documents projet créés par apprenants), règles marque PMI, provenance/originalité des 1 500 questions, anti-scraping/fuite. | 🟠 | Avant vente institutionnelle | Ouvert (volet ANPDP/vie privée déjà couvert) |
| 15 | **Risque données corporate (OJT)** — modèle de risque DIFFÉRENT du bank : caviardage, avertissement anti-upload de documents restreints, stockage par tenant, rétention/suppression par livrable, propriété, envoi ou non à Gemini, rétention côté fournisseur, scan malware, historique d'audit, interdiction niveau institution. | 🟠 | Avant d'ouvrir l'OJT à des utilisateurs réels | Ouvert (lié à la vision OJT/My PMP) |
| 16 | **Accessibilité & performance comme Definition of Done** — clavier seul, lecteur d'écran, ordre de focus, contraste, reduced-motion, mobile responsive, zoom, expansion bilingue, basse bande passante, compat navigateurs, aménagements d'examen chronométré. | 🟡 | Avant vente institutionnelle | Ouvert |
| 17 | **Gouvernance IA (Gemini)** — ce qui peut/ne doit jamais être envoyé au modèle, suivi version prompt/modèle, rétention fournisseur, fallback, revue d'hallucination, défense anti-injection sur documents uploadés, plafond de coût, monitoring tokens, tests de régression au changement de modèle, responsabilité humaine, divulgation de l'usage d'IA. | 🟠 | Critique dès que l'IA touche des docs OJT / contenu institutionnel | Ouvert |
| 18 | **Cycle de vie de contenu explicite** — `draft → mapped → audited → approved → published → retired` ; seul `published` visible. Aujourd'hui « mappé = publié » (implicite). | 🟡 | Quand le Lot A introduit du contenu à états multiples | Partiel (#5 pose le garde ; statut explicite à venir) |

## Frontière de produit (recommandation de l'auditeur, adoptée comme cadrage)
Séquence commerciale ferme, pour ne pas bâtir trois entreprises avant d'en prouver une :
1. **Entrée commerciale** : Certifizer Exam (préparation PMP).
2. **Extension différenciante** : Certifizer OJT.
3. **Plateforme long terme** : My PMP (compagnon à vie).

## Priorité immédiate corrigée (ordre adopté)
1. Confirmer v47.1 en prod + corriger les vues ECO restantes (v48).
2. Quarantaine de contenu — ✅ fait (v47.3).
3. Staging + monitoring + backup + rollback — au premier pilote.
4. Identité liée à session + fermer l'IDOR résiduel (#1, #2).
5. Portails légaux/vie privée du déploiement (ANPDP).
6. Protocole de pilote réel + critères de succès.
7. Spécifier le simulateur + pools protégés.
8. Lancer le programme contrôlé 1 500 questions.
9. Collecter les données apprenants + calibrer.
10. Ouvrir l'OJT à de vrais utilisateurs seulement après sa validation propre + contrôles de confidentialité.
