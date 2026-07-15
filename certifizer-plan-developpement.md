# Certifizer — Plan de développement

> État des lieux + feuille de route. Document vivant, à mettre à jour à chaque jalon.
> Dernière mise à jour (15/07/2026) : 🔴 **VERDICT TAXONOMIQUE — vérifié à la source PMI** : le crosswalk `ECO_TASKS` ne correspond pas aux 26 tâches officielles (People 4-6 décalées ; **BE4 « Remove impediments and manage issues » absente** ; « Valeur & bénéfices » est PR3, pas BE7 ; numérotation BE décalée). **v46 : HOLD taxonomique** — banque techniquement saine (150 q.), alignement ECO 2026 **non démontré**. **Ancien crosswalk retiré comme source d'autorité.** ✅ **Étape 1 FAITE** : référentiel canonique officiel (`backend/reference/pmp_eco_2026_canonical.json`, 26 tâches + 138 enablers + sentinelles testées). **Étape suivante : réaudit des 150 questions** contre le canonique. **v47 moteur SUSPENDUE** jusqu'à validation du nouveau mapping · **lot Personnes SUSPENDU**. L'examen PMP actualisé est en vigueur depuis le 09/07/2026 (v44). Droit à l'effacement complet (v41-v43) · portrait (v40) · audit IDOR (v39). **L'OJT reste le cœur du contenu** (modèle d'évidence v2, rubrique v3.2, dérogation OJT-EXC-01 ouverte).
> **Priorisation MoSCoW disponible en §2.3** (cible : premier déploiement institutionnel réel).

---

## 1. Où on en est aujourd'hui

### ✅ Déployé en production et confirmé (v21 → v45)

| Élément | Version | Description |
|---|---|---|
| Moteur adaptatif | v18 | Apprentissage adaptatif des erreurs (1→3→7j), difficulté ciblée, readiness pondéré 33/41/26, composeur de séance, auto-migration |
| « Ma préparation » + lecteur de séance | v20 | Cockpit apprenant, séance du jour jouable, correction immédiate |
| Carte mentale PMP | v21 | Carte organique branchée sur readiness/mastery ; chemin critique ; 13 thèmes / 26 tâches ; mode présentation |
| Cockpit formateur | v22 | `/api/cohort/overview` + `CockpitFormateur.jsx` : brief, blockers, interventions, carte cohorte, groupes, heatmap, qualité. Accueil apprenant-d'abord avec lien discret « Accès formateur » (tout nom → cockpit) |
| **Socle SaaS Phase 1** | v23 | `saas.py` : User (public_id=learner_id), UserRole, Entitlement, DailyUsage ; resolver `effective_plan()` (jamais stocké) ; migration idempotente des apprenants au boot ; **FeatureGate** (matrice free/premium/institution × full\|preview\|none, PREVIEW_LIMITS 3/2/5, FEATURE_LABELS FR-EN sans jargon) exposé dans `/api/me` |
| Badge de plan | v24 | `getMe()` au démarrage, état `me` (plan + features), badge « ● Gratuit / Premium / Institution » dans le header |
| Chemin critique bridé | v25 | Gratuit : 2 étapes visibles + bandeau « + N étapes en Premium » ; premium : complet ; défensif si features absent |
| Cartes-verrous + invitation | v26 | Bloc « Fonctions intelligentes » (simulateur d'examen, apprentissage adaptatif) verrouillé en gratuit ; UpgradeModal cadrage valeur (« utile gratuitement, intelligent en Premium », comparaison, « vous gardez votre progression ») |
| Carte détaillée en preview | v27 | Bouton « 26 tâches 🔒 » en gratuit → bandeau premium ; carte 13 thèmes reste complète et gratuite |
| **Phase 2 — socle B2B** | v28 | Tables Organization, Cohort, CohortMembership ; helpers de cloisonnement (`cohorts_where_trainer`, `learner_public_ids_for_cohort`, `cohorts_in_org`…) |
| Cockpit cloisonné | v29 | `/api/cohort/overview?trainer_id=` : uniquement les cohortes du formateur ; formateur inconnu/sans cohorte → rien (strict) ; legacy sans trainer préservé |
| Seed de démo en un clic | v30 | Cockpit vide → carte « Configurer la cohorte de démonstration » → org Démo + PMP-2026-A + rattachement apprenants existants + formateur. Idempotent |
| Séances ciblées (création) | v31 | TargetedSession + TargetedSessionAssignment ; création cloisonnée ; concepts par défaut = chemin critique cohorte ; assignation auto à la cohorte ; liste avec X/N terminées dans le cockpit |
| **Cycle apprenant complet** | v32 | Carte « 🎯 Assignée par votre formateur » dans Ma préparation → lance le SessionRunner → complétion marquée à la VRAIE fin (`onDone`) → compteur formateur vivant. **Démo complète confirmée en production** |
| **Aperçu formateur avant assignation** | v33 | Modal d'aperçu : questions concrètes, retrait par question (✕), « Confirmer et assigner (N) ». **Sélection figée** (`selected_items` + migration additive) : l'apprenant reçoit exactement les questions vues, dans l'ordre. Sessions legacy préservées. **Confirmé en production** |
| **Boîte à outils d'édition formateur** | v34 | La modal d'aperçu devient un vrai éditeur de séance : **retirer** ✕ · **remplacer** ↻ (suggestion même zone, difficulté proche) · **réordonner** ▲▼ (l'apprenant reçoit cet ordre) · **ajouter depuis la banque** (recherche + filtres, cloisonnée : officielles + celles de SON org). **« ✍️ Créer ma question »** : table `TrainerItem` (additive) ; badge « ✍️ Ma question » ; réutilisable. **« ✨ Corriger la formulation »** via Gemini 2.5 Flash (orthographe, vouvoiement, forme d'examen) : proposition jamais imposée ; dégradation propre si IA indisponible. Notation branchée, progression de zone comptée, mais **jamais dans le moteur adaptatif global**. Endpoints `question-bank`, `trainer-item`, `polish-question` (cloisonnés). Défaut `gemini_model` → `gemini-2.5-flash`. 33 tests. **Confirmé en production** |
| **Invitations par lien** | v35 | Étape 11 (option A). Table `Invitation` (additive). Cockpit : « ✉ Inviter des apprenants » → collage libre (noms/emails mélangés, doublons ignorés) → **un lien personnel à usage unique par personne** → « Copier le lien » / « 📋 Copier tous les liens en attente » / révocation ✕ ; statuts en attente / ✓ acceptée / révoquée. Apprenant : `?invite=TOKEN` → `InviteGate` (vouvoiement) → rejoint la cohorte (profil existant = **progression conservée**). Quota licences souple (si seats>0). Rôle formateur invitable. Email stocké (prêt pour envoi auto futur). 27 tests. **Confirmé en production** |
| **Séances ciblées par apprenant** | v36 | Section « Destinataires » dans l'éditeur : liste apprenants + badges (à risque / en construction / prêt), tous cochés par défaut, Tous/Aucun + toggle individuel. Bouton explicite « Assigner à N apprenants ». Serveur : `learner_ids` optionnel, validés membres de la cohorte (ids hors cohorte filtrés ; aucun valide = refus) ; liste vide = toute la cohorte (zéro régression). Compteur cockpit X/N réel. 8 tests. **Confirmé en production** |
| **Code de classe + email de récupération** | v37 | Porte « J'ai un code de classe » sur l'accueil : rejoindre une cohorte en libre-service via son code (= code de cohorte, ex. PMP-2026-A ; cohorte active rejoignable en permanence). Écran **email de récupération facultatif** après l'entrée (« Plus tard » toujours possible) ; email stocké (prépare le lien magique v38). Profil existant = progression conservée ; un email = un seul profil. Endpoints `GET /api/class/{code}`, `POST /api/class/join`, `POST /api/me/link-email`. `created_from='class_code'`. 24 tests. **Confirmé en production** |
| **Lien magique + envoi auto (Brevo)** | v38 | Auth par email sans mot de passe. Module `email_service.py` (API Brevo, gabarits bilingues, **dégradation propre** si clé absente). **Lien magique** : accueil → « Retrouver ma progression » → email → lien signé HMAC (30 min, usage unique) → reconnexion avec progression conservée (réponse serveur neutre pour la vie privée). **Envoi auto des invitations** v35 si email présent. Endpoints `POST /api/auth/magic/request` + `/consume`. Variables Render : `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `PUBLIC_APP_URL`, `MAGIC_LINK_SECRET` (stable, ne jamais changer). Envoi d'invitation ✓ ET lien magique ✓ confirmés en production. 19 tests. |
| **Durcissement IDOR (overview cohorte)** | v39 | **Sécurité, aucune fonctionnalité.** L'endpoint `GET /api/cohort/overview` exigeait auparavant rien : `?cohort_id=PMP-2026-A` seul exposait la progression de TOUTE la cohorte (or le code de cohorte est fait pour être partagé = code de classe !), et sans paramètre il retombait sur **tous les apprenants**. Désormais **`trainer_id` obligatoire** ; les chemins « cohort_id seul » et « legacy tous apprenants » sont supprimés ; le filtre `cohort_id` ne fonctionne que **dans les cohortes du formateur**. Zéro régression (le cockpit passe toujours `trainer_id`). 17 tests. **Confirmé en production** |
| **Portrait d'apprentissage** | v40 | Un **document**, pas un tableau de bord — emprunte au monde du chef de projet (cartouche de plan, diagramme de réseau, chemin critique). Contient : la **carte des 10 domaines** disposés selon leurs **dépendances réelles** (`portrait.py::DEPENDS_ON`, première cartographie à affiner) ; le **chemin critique** calculé (reste-à-faire pondéré par le poids d'examen — la chaîne qui commande vraiment la date) ; une **lecture interprétative** par règles (aucun LLM : déterministe, gratuit) ; la **trajectoire + projection** avec garde-fous (pas d'historique → pas de projection ; progression nulle → aucune date inventée ; toujours « ce n'est pas une promesse ») ; les **réflexes** de l'apprenant avec leur angle (MOA/MOE) ; l'**ECO** avec la marge restante ; **impression/PDF**. Les domaines non abordés s'affichent en pointillés « vous attend » — **la carte montre la promesse, pas des trous**. Nouveau mode « Mon portrait ». Migration additive : table `ReadinessSnapshot` (1 instantané/jour). 35 tests. **Confirmé en production** |
| **Suppression de compte + export** | v41 | **Droit à l'effacement (RGPD art. 17 / loi 18-07).** Confirmation forte (liste explicite + saisie du mot SUPPRIMER) · **délai de grâce de 30 j** (compte désactivé, PAS effacé ; récupérable d'un clic) · **purge automatique** après le délai (cron) · purge chirurgicale (tout ce qui appartient à la personne, et personne d'autre — testé). **Export Excel** (5 onglets) + **portrait** = portabilité (art. 20). ⭐ **Envoi automatique des données par email** à la demande de suppression (portrait HTML + Excel joints), *sans que la personne l'ait demandé* — « on regrette parfois d'avoir perdu son travail ». **Bascule de plan premium réservée au FORMATEUR** (un apprenant ne peut pas s'auto-promouvoir — vérifié côté serveur). ⚠️ **Correctif Postgres** : `user` est un mot réservé → `ALTER TABLE "user"` ; les tests tournent désormais contre un **vrai PostgreSQL**, plus seulement SQLite. 57 tests. **Confirmé en production** |
| **Réglages** | v42 | Un seul menu regroupant tout : **Mon compte** (nom, cohorte, **email de récupération — lier / modifier / retirer**), **Langue**, **Formateur** (bascule de test premium), **Mes données** (portrait + Excel), **Zone sensible** (suppression). ⭐ **Trou comblé** : un apprenant ayant cliqué « Plus tard » à l'inscription n'avait AUCUN moyen de lier un email ensuite — donc ni lien magique, ni récupération de ses données. **Encart honnête sur la rétention** (email + écran de grâce) : courbe de l'oubli d'Ebbinghaus, « ce qui retient le mieux, c'est l'usage » → renvoie vers les vrais projets. ⚠️ **Aucun taux chiffré** : la logique de décroissance est un outil de priorisation, pas un modèle prédictif — une fausse précision serait une manipulation. **Tests qui protègent cette ligne éthique.** 25 tests. **Confirmé en production** |
| **Rappels J-7 et J-1** | v43 | Rappels avant effacement définitif. **J-7** : sobre, factuel, « un clic suffit encore ». **J-1** : dernier message, **avec les données rejointes** (si le premier email s'est perdu, c'est la dernière chance). ⚠️ **Idempotence** : le cron tourne toutes les 10 min — sans trace en base, le même rappel partirait **144 fois par jour** ; chaque rappel envoyé est marqué. Annuler la suppression **remet les compteurs à zéro**. Ton testé : **aucun langage suppliant ou culpabilisant** — on informe, on ne retient pas. Correctif : `timedelta.days` tronque (à 23h59 du terme il renvoyait « 0 jour »). Migration additive : `deletion_reminders`. 3e job cron. 22 tests. **Confirmé en production** |
| **Correctif obsolescence ECO** | v44 | ⚠️ **L'examen PMP actualisé est EN VIGUEUR depuis le 9 juillet 2026** — il n'est plus « à venir ». Correctif chirurgical : repère latéral (`2·24·10·12·1=49 · ECO 09/07/26` → **`ECO PMP 2026 · en vigueur · 3 domaines · 26 tâches · 33/41/26`**) ; **prompt système** du co-penseur réécrit (ECO = LE blueprint, PMBOK = référence d'accompagnement, examen au présent, **interdiction de présenter un décompte de processus comme l'architecture de l'examen**) ; sujet « Groupes & 49 processus » → « **Groupes de processus** » (contenu gardé comme *référentiel de pratique*, jamais comme structure d'examen). ⚠️ On n'a PAS remplacé 49 par 40 : le 40 n'est pas vérifié à la source PMBOK 8, donc on ne l'affirme pas. Tests = **garde-fous anti-obsolescence durables**. Bonne nouvelle : la carte mentale et le parcours étaient **déjà** ECO 2026 (8+10+8 = 26 tâches vérifiées). 25 tests. **Confirmé en production** |
| **Moteur re-pondéré ECO** | v45 | **Bug 1** : le moteur pondérait par les processus PMBOK 6 (/49) → Process sur-priorisé (71 % au lieu de 41 %), Business Environment sous-priorisé (14 % au lieu de 26 %, alors qu'il a TRIPLÉ). **Bug 2** : `recommend()` ne parcourait que les 10 zones KA → **38 questions / 135 (28 % du contenu ECO) jamais recommandées**. Correctif : `ECO_AREAS` (13 zones natives), `ALL_AREAS` (23 zones recommandables), `eco_weight()` sommant exactement à 33/41/26, libellés `AREA_LABELS` côté front. 320 tests contre PostgreSQL. **Confirmé en production** ⚠️ **Portée réelle (revue externe 15/07)** : seul le chemin de RECOMMANDATION (`recommend()` — quiz/next, bandeau priorité) parcourt les 23 zones. `get_readiness` (priorités n/49), `/api/session/next` (composeur « Ma préparation », tri KA), `mastery_list`, cockpit et portrait itèrent encore sur les 10 zones KA ; l'attribution de domaine ignore les exceptions 4.4→People / 4.6→BE / PR.9→Process (répartition moteur réelle : P 27 · PR 88 · BE 35). → **Correctif v47** |
| **Renfort Business Environment (contenu)** | v46 | ⭐ Issu de l'**audit du mapping** (15/07/2026 — voir §1.bis). `be-deep-2.json` : **+15 questions bilingues**. Les **7 zones BE (unité moteur)** passent chacune à **5 questions** (be_improvement : 2→5) ; les **8 tâches BE (crosswalk ECO)** disposent d'**au moins 5 questions** (be3 = 8 via l'intégration 4.6), chacune avec un niveau 1 (échauffement) et un niveau 3 (jugement). BE = **43/150 = 28,7 % selon le crosswalk des tâches ECO** (poids d'examen 26 %) — ⚠️ le moteur de maîtrise n'interprète pas encore ces 43 comme BE (voir v45/v47). Contenu pur, zéro code moteur. ➕ `tests/test_bank_invariants.py` (5 tests reproductibles : 150 ids uniques, bilingue, 0 orpheline, 0 ambiguë, tâches BE ≥5 avec niveaux 1+3, seed 150→+0) ; caches retirés du paquet. 🔴 **HOLD taxonomique (15/07)** — ne rien publier qui affirme l'alignement ECO 2026 tant que le réaudit n'est pas fait ; statut : *banque de contenu en attente de re-cartographie officielle* |

**Stack live :** Frontend React+Vite → Vercel (`pmp-certifizer.vercel.app`) · Backend FastAPI → Render (`pmp-cerifizer.onrender.com`, typo volontaire) · DB Supabase Postgres · LLM Gemini 2.5 Flash · Repo `Architect-z-coder/PMP-Certifizer`.

### ✅ Tout le déployé est confirmé

*(plus aucune confirmation en attente — le lien magique v38 a été testé avec succès : reconnexion au bon compte, progression conservée.)*

> **Phase 2, Auth, sécurité IDOR (v39) et droit à l'effacement (v41–v43) : TERMINÉS et confirmés en production.**
>
> ### 🎯 Prochains jalons
>
> | | |
> |---|---|
> | **Produit** | ✅ **Audit du mapping FAIT** (15/07/2026, §1.bis) — 0 orpheline, 0 ambiguë ; v46 (renfort BE +15) packagée. ⚠️ **v47 (câblage moteur 23 zones) AVANT le lot Personnes** — revue externe contre-vérifiée |
> | **OJT** | ⏳ **Cas 1** — charte EPC historique **non retouchée**, traité comme **cas exploratoire** *(aucune référence humaine indépendante — voir dérogation `OJT-EXC-01`)* |
> | **Conformité** | ⏳ Politique de confidentialité + consentement *(mockup validé, construction reportée)* · déclaration ANPDP · transferts hors Algérie |



## 1.bis — Audit du mapping des questions → 26 tâches ECO (15/07/2026, sur v45)

**Le mapping est sain** : les questions se rattachent toutes à une tâche ECO, sans orpheline ni ambiguïté (les questions 4.4 rejoignent pe7 par référence, 4.6 → be3, 4.7 → pr10, comms scindé PE.8/PR.9). Le problème n'était pas le câblage, mais la **profondeur**.

**Couverture avant renfort (135 q.)** : Personnes 29 q. = 21,5 % (ECO 33 %, −11,5 pts) · Processus 78 q. = 57,8 % (ECO 41 %, +16,8 pts) · Business Environment 28 q. = 20,7 % (ECO 26 %, −5,3 pts). ⚠️ Depuis v45 le **moteur** recommande selon les poids ECO quelle que soit la banque — le déséquilibre ne fausse plus les recommandations, il crée de l'**épuisement** : 20 tâches sur 26 avaient < 5 questions ; à 3 questions par tâche, le rejeu adaptatif (1→3→7 j) tourne à vide et l'apprenant récite.

**Points critiques identifiés** : be5 (Amélioration continue) à **2 questions** — le point le plus mince du domaine qui a triplé ; be8 (IA/ESG) sans aucune question de niveau 3 ; les tâches minces n'avaient presque aucun niveau 1 (échauffement).

**Plan de renfort décidé (ordre d'impact examen)** :
1. ✅ **v46 — BE d'abord** : +15 questions (`be-deep-2.json`) → toutes les zones BE à 5, un niveau 1 et un niveau 3 par tâche. BE = 43 q. = 28,7 %.
2. ⏳ **Personnes ensuite** : +2 sur les 7 tâches à 3 questions (pe1–pe6, pe8) → +14, Personnes ≈ 43 q.
3. ⏳ **Processus en dernier** (domaine déjà sur-couvert) : pr3–pr7, pr9 (+12) quand le reste sera fait.

*(Méthode : chaque lot inclut au moins un niveau 1 et un niveau 3 par tâche ; ids `xx-x-REF-NN` ; livraison zéro-code par JSON + seed idempotent.)*

### ⚠️ Addendum — revue externe du 15/07/2026 (contre-vérifiée dans le code)

**Deux mappings coexistent, et ils ne disent pas la même chose :**
- le **crosswalk des 26 tâches** (frontend `pmp.js`, et cet audit) : P 29 · PR 78 · BE 43 — c'est la vue ECO, exacte ;
- le **moteur de maîtrise** (`AREA_DOMAIN` sur `knowledge_area` seul) : P 27 · PR 88 · BE 35 — les exceptions par référence (4.4→pe7, 4.6→be3, PE.8/PR.9) ne sont pas appliquées.

**Chemins encore sur l'ancien modèle (10 zones KA, pondération n/49)** : `mastery_list` · `get_readiness` (priorités) · `/api/session/next` (composeur « Ma préparation » — simulation : **0 question ECO native** sur ~1 000 questions composées) · cockpit formateur · portrait. **Seul `recommend()` est passé aux 23 zones en v45.**

**→ v47 (prochaine version de CODE, avant tout nouveau lot de contenu)** :
1. `mastery_list` → 23 zones (`ALL_AREAS`) ;
2. `get_readiness` → priorités par `eco_weight()` + couverture des zones ECO dans le score ;
3. `/api/session/next` → composition sur `ALL_AREAS` ;
4. cockpit + portrait → 23 zones ;
5. attribution de domaine avec les exceptions par référence (4.4/4.6/PE.8/PR.9) — la maîtrise par référence existe déjà (`ProcessMastery`).

**⏸️ Lot Personnes (+14) SUSPENDU jusqu'à la v47 confirmée** — ajouter du contenu qui n'entre pas dans le parcours adaptatif principal serait du contenu mort de plus.

### 🔴 §1.ter — Verdict taxonomique (15/07/2026) — vérifié dans le PDF officiel PMI

**Source lue directement** : `new-pmp-examination-content-outline-2026.pdf` (pmi.org, July 2026 Update). Le crosswalk `ECO_TASKS` de `pmp.js` mélange des concepts de l'**ECO 2021** avec la numérotation et les poids 2026 :

| Officiel 2026 | Certifizer | Écart |
|---|---|---|
| PE4 Engage stakeholders · PE5 Align stakeholder expectations · PE6 Manage stakeholder expectations | Performance équipe · Mobiliser PP · Négociation | ❌ décalées / inexistantes comme tâches 2026 |
| PR9 Evaluate project status | « Communiquer le statut » | ⚠️ réduit à un seul enabler |
| **BE4 Remove impediments and manage issues** | (absente) | ❌ **tâche officielle sans zone ni couverture dédiée — à VÉRIFIER au réaudit, ne pas conclure à zéro** |
| BE5 Risk · BE6 Continuous improvement · BE7 Support organizational change | décalées d'un cran ; « Valeur & bénéfices » placée en BE7 | ❌ la valeur relève de **PR3** (déjà couverte par `pr_value`) |

**Leçons consignées** : (1) le test v44 vérifiait le **compte** (8+10+8), pas la **sémantique** — un garde-fou anti-obsolescence doit porter sur les intitulés ; (2) un test corrélé au produit ne vérifie rien (le test dupliquait le crosswalk) ; (3) `readiness_from_masteries` : une seule zone tentée à 100 % donne 100 % au domaine entier (couverture interne non mesurée) ; (4) la répartition égale intra-domaine est une **hypothèse produit** — PMI ne publie aucun poids par tâche.

**✅ Étape 1 FAITE (cette session)** — l'étalon indépendant :
- `backend/reference/pmp_eco_2026_canonical.json` — faits PMI uniquement : 3 domaines (33/41/26), 26 tâches, **138 enablers**, intitulés anglais officiels, pages sources, provenance ; AUCUN knowledge_area, AUCUN mapping, AUCUN poids par tâche.
- `backend/reference/certifizer_eco_design_policy.json` — hypothèses produit séparées : pondération intra-domaine = hypothèse ; zones UI peuvent regrouper des tâches mais maîtrise/preuves au niveau `eco_task_id` (26 identités nécessaires, 26 zones visibles non) ; futur `eco_primary_task` obligatoire + `eco_secondary_tasks` ; `knowledge_area` = métadonnée historique seulement.
- `docs/pmp-eco-2026-reference.md` — **GÉNÉRÉ** depuis le canonique (`generate_reference_md.py`), jamais édité à la main ; `official_title_en` distinct de `certifizer_translation_fr` (non officielle).
- `backend/tests/test_eco_canonical.py` — 8 tests **indépendants** (aucun import du produit) : 3 domaines · 26 tâches · 8/10/8 · ids uniques · poids 0,33/0,41/0,26 (somme 1,00) · aucune tâche sans enabler ni provenance · aucun knowledge_area dans le canonique · aucun poids par tâche · **sentinelles sémantiques** (PE4/PE5/PE6/PR3/PR9/BE4/BE5/BE6/BE7) · .md synchrone.
- `docs/rapport-verification-referentiel.md` — 26/26 tâches et 138/138 enablers transcrits ; **réviseur humain, date et SHA-256 du PDF à renseigner** (la transcription machine ne remplace pas la vérification humaine).
- Ancien `test_bank_invariants.py` : **quarantaine annotée** — ses tests de mapping ne valident que la cohérence interne avec l'ancienne structure.

**✅ Étape 2 FAITE (15/07)** — réaudit des 150 questions contre le canonique (`backend/reference/question_eco_mapping.json`, texte gelé par empreintes, 17 tests verts). **Répartition officielle : People 28 (18,7 %) · Process 76 (50,7 %) · BE 46 (30,7 %).** 🔴 **PE6 = ZÉRO question** (le vrai trou, invisible dans l'ancien référentiel) ; PE5 = 1 ; PE1 = PR4 = 2 ; ✅ **BE4 = 3** (pas zéro — dont 2 questions déguisées en « risque » et « leadership serviteur »). Les 5 « valeur & bénéfices » requalifiées **PR3**. Statut : **PROPOSITION** — contre-vérification par seconde IA (décision Zoubir : pas de réviseur humain, limite assumée). Choix doctrinal à contester : charte→BE1 (5 q.). Le « lot Personnes +14 » est **remplacé** par le plan ciblé du rapport (`docs/rapport-reaudit-150-questions.md`) : PE6+3 · PE5+2 · PE1+1 · BE4+2 · PR4+1 — à n'écrire qu'après contre-vérification.

**✅ Audit adversarial du mapping PASSÉ (16/07)** — triangle : auteur / seconde IA (verdict HOLD, 4 corrections proposées) / troisième IA (méta-évaluation : 1 forte, 1 probable, 2 contestables ; journal aveugle non conservé → antériorité non reproductible). **Arbitrage auteur avec règle écrite** : 2 corrections appliquées (PE.1-02→PE8, 9.4-02→PE2), 2 différends consignés (PE.6-03 reste PE3, 4.1-02 reste BE1 avec secondaire PR2), closest_fit marqué (int-d2-07, int-x-4.3-02 — la v47 devra distinguer direct/secondaire/closest_fit dans la maîtrise). **Compteurs ADOPTÉS : People 28 · Process 76 · BE 46** (alternatif AI-2 : 28/77/45 = les 2 différends dans son sens). Canonique CONFORME au PDF (SHA-256 convergent de deux auditeurs : 8aefc40b…). PE6=0 et BE4=3 confirmés par les trois parties. Sentinelles des 4 décisions ajoutées aux tests. **→ v47 DÉBLOQUÉE sur le mapping adopté** ; contenu ciblé (PE6+3, PE5+2, PE1+1, BE4+2, PR4+1) après la v47.

**✅ v47 CONSTRUITE (16/07)** — le moteur pense dans les 26 tâches officielles. Nouveau module `app/eco.py` : maîtrise par tâche **DÉRIVÉE du rejeu chronologique des tentatives** (zéro migration, zéro table — la leçon du noyau OJT : dériver, jamais déclarer), trois natures de rattachement pondérées (direct α · closest_fit α/2 · secondaire α/4 ; la couverture exige une tentative directe). **Readiness honnête** : tâche non couverte = 0 → l'exploit de l'audit (une zone parfaite = 41 %) donne désormais 4,1 % avec couverture 1/10 (testé). **Composeur** `/api/session/next` piloté par les tâches avec **quotas de domaine 33/41/26** et bris d'égalités aléatoire — simulation 100 apprenants neufs : 30/40/30, **25/25 tâches pourvues servies** (avant : 0 % ECO natif). Readiness **cohérent partout** : apprenant, cockpit, portrait et snapshots utilisent la même fonction (testé). Nouvel endpoint `/api/eco/mastery` (26 lignes : score, couverture, poids, fraîcheur). `conftest.py` : base de test unique pour la suite (30 tests). ⚠️ Effet visible au déploiement : le readiness BAISSE pour tout le monde (honnêteté de couverture) — à expliquer, pas à « corriger ». **Reste pour v48** : vues par tâche (mastery_list/`Me tester` reste sur les zones, cockpit heatmap, carte du portrait, pmp.js ECO_TASKS à corriger avec les intitulés officiels). ⏳ **À déployer et confirmer**

**Ordre figé** : étape 2 = réaudit des 150 questions (texte GELÉ, `eco_primary_task` + étiquettes secondaires, tâche par tâche contre les enablers) → compteurs officiels corrigés + trous réels (BE4 en tête) → tests de mapping réécrits contre le canonique → **v47 moteur** (maîtrise/readiness avec couverture/composeur/cockpit/portrait pilotés par les 26 `eco_task_id`) → lot Personnes.


## 2. Feuille de route restante

### Phase 2 — Institution ✅ TERMINÉE
| # | Étape | Contenu | État |
|---|---|---|---|
| 11 | **Invitations par lien** (option A) | ✅ v35 — lien personnel à usage unique, collage en lot, révocation, acceptation cloisonnée. Envoi **automatique** d'email reporté (viendra avec l'auth lien magique) | ✅ Fait |

### Phase 3 — Industrialisation
| # | Étape | Contenu | État |
|---|---|---|---|
| 12 | Super-admin | Gestion des organisations et licences (toi, en tant qu'éditeur) | ⏳ |
| 13 | AuditLog | Journal des actions sensibles (spec §2.8) | ⏳ |
| 14 | content_scope | Contenus privés par organisation (spec §2.10) | ⏳ |
| 15 | Période de grâce | Automatisation fin de licence (1 mois, progression conservée) | ⏳ |

### Auth (lien magique + code de classe) — ✅ TERMINÉE (hors bascule domaine)
| # | Étape | Contenu | État |
|---|---|---|---|
| A1 | Code de classe + email de récupération | Libre-service, email facultatif stocké | ✅ v37 (en production) |
| A2 | Lien magique + envoi auto | Reconnexion par email + envoi auto des invitations (Brevo) | ✅ v38 (envoi + lien magique confirmés) |
| A3 | Bascule domaine propre | **`certifizer.app`** (Cloudflare) — Brevo authentifié (DKIM+DMARC), Google Workspace pour la réception, alias `contact@certifizer.app`. `BREVO_SENDER_EMAIL=contact@certifizer.app` sur Render. | ✅ FAIT (emails en boîte de réception) |

### Monétisation (EN DERNIER, décision verrouillée)
| # | Étape | Contenu | État |
|---|---|---|---|
| 16 | Paiement Paddle→Payoneer | Rendre « Passer à Premium » réel (Stripe indisponible en Algérie). Le freemium + B2B facture vivent sans | ⏳ |

### Optionnel / commercial
- Dossier de vente institution (méthode 3 piliers + démo du cycle complet).
- Passe de langage professionnel sur « Ma préparation ».
- Heatmap détaillée apprenant×sujet dans le cockpit.
- Rendre réels les boutons d'intervention du cockpit (Planifier/Ouvrir/Voir/Ajouter, Qualité) — décoratifs aujourd'hui.
- ~~Auth lien magique + code de classe~~ → ✅ **LIVRÉS** (v37 code de classe · v38 lien magique · v42 gestion complète de l'email).
- **Outil d'auteur complet pour formateurs** (brouillons, versions, relecture, gestion de sa banque) — évolution de la création de question v34, à construire **seulement si le besoin se confirme** (décision v34 : rester léger pour l'instant).

### 🌱 Vision future — « Relier à mon projet » comme formation en situation de travail
> Noté au plan, **détails à venir de Zoubir — ne rien construire maintenant.**
- Mode **co-penseur** : l'apprenant apporte son vrai projet (contexte métier réel) et est accompagné pour raisonner en chef de projet sur sa propre situation (prolonge le concept Co-réflexion 2 angles).
- **⭐ Production de vrais documents PMP** (fonction clé, confirmée par Zoubir) : directement dans la section « Relier à mon projet », l'apprenant PRODUIT des livrables PMP réels à partir de son propre projet — charte de projet, registre des risques, WBS, plan de communication, etc. Le co-penseur guide le raisonnement ; le résultat est un artefact concret et exploitable en entreprise. C'est ce qui rend la révision **productive** : apprendre à penser en chef de projet EN PRODUISANT, pas seulement en révisant.
- **Partage de connaissance** : réflexes et livrables deviennent un capital partageable (cohorte / organisation).
- Argument institutionnel : la formation produit du travail réel, pas seulement une préparation à l'examen.

**⭐ KPI d'OJT — mesurer le travail produit ET le raisonnement PM  :**
> Différenciateur clé. ⚠️ **CORRIGÉ** : Certifizer mesure aujourd'hui la **reconnaissance déclarative** (et la fraîcheur des réponses) via le readiness — **PAS la rétention**. La rétention au sens fort exige une **réapplication différée** (voir §2.4, modèle des trois canaux). L'OJT ajoute deux canaux distincts : l'**application** (livrable + rubrique + validation formateur) et la **rétention/transfert** (preuve différée).
> - **Quatre dimensions, toutes retenues** : (1) **conformité au standard PMI** du livrable produit ; (2) **maturité / progression du raisonnement** dans le temps ; (3) **complétude & qualité des livrables** (charte, registre des risques, WBS, plan de communication…) ; (4) **application des principes PMI** au vrai projet de l'apprenant.
> - **Modèle d'évaluation** : l'**IA (co-penseur) propose**, le **formateur valide** (cohérent avec la décision v34 « l'IA propose, l'humain garde le dernier mot »).
> - **Visibilité aux trois niveaux** : l'**apprenant** (sa progression de pensée), le **formateur** (cockpit, par apprenant), l'**institution** (rapport global).
> - Passage de fond : de « sait-il répondre à l'examen » à « **pense-t-il et produit-il comme un chef de projet** ». À cadrer et construire plus tard, avec les détails de Zoubir.
>
> **⭐ Références méthodologiques et cadres de conception de l'évaluation** : l'évaluation ne doit pas reposer sur une impression ; elle s'appuie sur des **références documentées** pour **soutenir** (non remplacer) le jugement du formateur et être **explicite** face à une institution *(explicite ≠ validé)*.
> ⚠️ *Une décision du concepteur confirme l'**adoption** d'un cadre — **jamais sa valeur méthodologique**.*

> ### ⚠️ Ce que ces références font — et ne font PAS
> **Elles orientent la conception et soutiennent l'explicitation des choix.**
> **Elles ne constituent, séparément ou ensemble, NI une validation scientifique, NI une preuve de validité de l'instrument.**
>
> - **PMBOK / ECO** → un **ancrage professionnel** *(pas une validation)*
> - **Rubriques** → une **structure d'évaluation** *(pas une preuve qu'elle mesure juste)*
> - **Bloom** → qualifie la **demande cognitive** ; **ne mesure pas** la qualité d'une compétence
> - **OPM3 / CMMI** → maturité **organisationnelle** ; les appliquer à la progression **cognitive individuelle** est une **inspiration de conception**, pas une validation
> - **Accord inter-évaluateurs** → mesure la **cohérence**, **pas la justesse**
> - **Ancrage PMI officiel** : OPM3 (modèle de maturité du PMI), PMBOK, ECO 2026 comme référentiels des livrables et principes attendus.
> - **Cadres méthodologiques combinés** : (a) **grilles critériées (rubrics)** ancrées PMI pour la qualité des livrables ; (b) **modèle de maturité** (inspiré OPM3/CMMI) pour la progression du raisonnement dans le temps ; (c) **taxonomie de Bloom révisée** pour qualifier le niveau de pensée (se souvenir → comprendre → appliquer → analyser → évaluer → créer) ; (d) **accord inter-évaluateurs IA↔formateur** comme indicateur de **fiabilité** de l'évaluation.
> - Cohérent avec le principe verrouillé : **l'IA propose, le formateur valide.**
>
> **⭐ Cartographie cognitive par IA — aide au diagnostic de l'éducateur ** : l'évaluation ne produit pas qu'un score, elle **aide le formateur à diagnostiquer** où et pourquoi ça coince.
> - **Carte compétence × profondeur de raisonnement** : prolonge la carte mentale existante (13 thèmes / 26 tâches + readiness) en ajoutant, par zone, le **niveau de pensée** (échelle de Bloom : se souvenir → analyser → créer). Colorée par l'IA à partir des **livrables produits** dans « Relier à mon projet » — **auto-alimentée, non intrusive** (pas de test supplémentaire).
**Détection de motifs et d'associations** : repérer des relations **récurrentes** entre difficultés, et formuler des **hypothèses explicatives à faire valider par le formateur**. ⚠️ Des données d'apprenants montrent une **association**, elles n'établissent pas seules une **causalité**. *Exemple : une faiblesse en plan de communication est fréquemment **associée** à une analyse insuffisante des parties prenantes en amont — hypothèse à valider, pas cause établie.*
> - **Même carte, deux focales** : **structurelle** (faiblesses partagées de la cohorte → correction pédagogique globale) et **individuelle** (profil cognitif par apprenant → accompagnement ciblé) — bascule comme le cockpit le fait déjà pour le readiness.
> - **Garde-fou** : présenter ces cartes comme **aide au diagnostic pour l'éducateur**, jamais comme un verdict sur l'apprenant. L'IA propose, le formateur valide.
- Points à trancher le moment venu : fonction premium/institution (couche intelligente) ; cloisonnement serveur par organisation ; partage **opt-in** uniquement (données d'entreprise potentiellement sensibles) ; visibilité des livrables dans le cockpit formateur.

**⭐ Carte vivante des acquis (idée Zoubir — vision future, NE PAS construire maintenant) :**
> Une **nouvelle carte, séparée de la carte d'examen**, structurée par les **concepts PMP et leurs liens** (pas par les 26 tâches de l'ECO). Elle montre l'état de chaque concept selon les **six états à règles de preuve** (Découvert → Compris → Appliqué → Validé → Retenu → Transféré) et **s'actualise en temps réel**.
>
> ⚠️ **MAIS : la carte s'actualise en temps réel — la RÉTENTION, non.** Juste après un livrable, on peut dire « application démontrée » ; on **ne peut pas** dire « compétence retenue ». La rétention est par définition une **preuve différée**. *(Ceci corrige l'idée initiale d'une carte à KPI de rétention en temps réel — voir §2.4.)*
> ⚠️ **Le temps ne modifie JAMAIS l'état.** Une observation contradictoire **ouvre une contestation de la preuve** ; **toute révision de l'état exige l'examen et la décision du formateur.** *(Trois axes indépendants — voir §2.4.)*
> - **Distinction clé** : la carte d'examen dit « **es-tu prêt** » ; la carte des acquis dit « **qu'as-tu vraiment intégré** ». KPI = état de rétention par concept (carte vivante des acquis), pas score d'examen.
> - **⚠️ Le vrai travail n'est pas la carte, c'est la cartographie des concepts** : définir les concepts PMP et leurs **dépendances** (ex. « valeur acquise » ← « ligne de base des coûts » ← « estimation » ← « WBS »). **À créer de zéro** — travail de **conception pédagogique** (expertise PMI), pas du code. Chantier à part entière.
> - **Synergie à ne pas ignorer** : cette carte est **cousine de la cartographie cognitive de l'OJT** (compétence × profondeur de Bloom). Les deux montrent « ce qui est vraiment intégré, concept par concept ». **Les penser ensemble** pour ne pas construire deux cartes qui se ressemblent.
> - **Priorité** : *Could have* au mieux (c'est une fonctionnalité) — Must-have = conformité/sécurité d'abord. Tracé pour ne pas se perdre ; à cadrer avec l'OJT.

---

### ✅ v41 — Suppression de compte — **LIVRÉE ET CONFIRMÉE EN PRODUCTION**
> *(Complétée par v42 — Réglages · et v43 — rappels J-7 / J-1.)*
> Scindée volontairement de la v40 (une chose testable à la fois). Mockup validé : `mockup-v40-suppression-compte.html`.
- **Téléchargement des données AVANT suppression** (droit à la portabilité) — s'appuie sur le portrait v40 déjà construit (PDF) + un Excel de données brutes.
- **Délai de grâce (30 j)** : le compte est **désactivé** (invisible du formateur, inutilisable) mais **pas encore effacé** ; l'apprenant peut **tout récupérer** d'un clic. Passé le délai → effacement automatique et irréversible.
- **Confirmation forte** : liste explicite de ce qui sera effacé + saisie du mot « SUPPRIMER ».
- **Suppression par l'apprenant uniquement** (le formateur ne peut effacer personne).
- **Conformité** : le délai de grâce n'entrave pas le droit à l'effacement — mention d'un effacement immédiat sur demande à `contact@certifizer.app`.
- **Le portrait devient un écran permanent** (v40, fait) : il vit dans l'app, se consulte à tout moment. La suppression y donne simplement accès une dernière fois — le meilleur objet du produit n'est pas un adieu, c'est un miroir.

## 2.1. Décisions d'infrastructure & reports datés

> ## 📦 ARCHIVE — décisions ayant conduit aux versions v35 → v43
> **Ces éléments sont conservés pour la traçabilité historique. Ils ne représentent PLUS des travaux à réaliser.**

**Auth — architecture — ✅ CONSTRUITE ET EN PRODUCTION** *(v37 → v38 → v42)* :
- Deux portes d'entrée : (a) **lien personnel** d'invitation (v35, fait) ; (b) **code de classe** en libre-service (v37). Le **code de classe = le code de cohorte** (ex. PMP-2026-A) ; alternative « code distinct désactivable » **reportée** (à ajouter seulement si un besoin de sécurité se présente).
- Cohorte active **rejoignable en permanence** (pas d'interrupteur formateur) — choix pilote ; interrupteur d'ouverture/fermeture **reporté**.
- Identité : le **nom reste l'identité de départ** (zéro friction) ; l'**email est facultatif**, sert de récupération multi-appareils et de base au lien magique. Proposé **juste après l'entrée**, avec « Plus tard ». Option « ne proposer que dans les réglages » **non retenue** (mais un point d'entrée réglages « Lier un email de récupération » est prévu — libellé `emailRecSettings` déjà en place).

**Email transactionnel (Brevo) :**
- Fournisseur retenu : **Brevo** (plan gratuit 300 emails/jour ≈ 9 000/mois, accès API, **sans carte bancaire** — adapté à l'Algérie). Alternative envisagée : Resend (100/j) — non retenue pour le volume.
- **Démarrage sur l'expéditeur par défaut Brevo** (mention « Sent with Brevo », adresse générique) — acceptable pour le pilote.
- **✅ FAIT — domaine propre `certifizer.app`** (acheté sur **Cloudflare**, ~14 $/an, WHOIS privacy incluse ; `certifizer.com` était pris) :
  - **Brevo** authentifié sur le domaine (DKIM + DMARC ✓, intégration automatique Cloudflare) → **envoi**
  - **Google Workspace** configuré (compte `zoubir_dahia@certifizer.app`) → **réception** ; alias **gratuit** `contact@certifizer.app` (⚠️ un alias, PAS un 2e utilisateur : un utilisateur = ~6 $/mois de plus)
  - `BREVO_SENDER_EMAIL=contact@certifizer.app` sur Render (aucune reprise de code)
  - **Résultat confirmé : les emails arrivent en boîte de réception, plus en spam.**
  - ⚠️ Ne PAS cliquer « Authenticate outgoing emails » côté Google : ajouterait des DKIM concurrents qui perturberaient Brevo (les emails de l'app partent de Brevo, pas de Gmail).

**Envoi automatique d'emails — REPORTÉ à la v38 :**
- v35 (invitations) et v37 (code de classe) **ne font AUCUN envoi** : ils stockent l'email. Le formateur envoie les liens lui-même (option A assumée).
- ✅ La **v38 a livré** : (a) le **lien magique** de reconnexion par email ; (b) l'**envoi automatique des invitations** v35. **Confirmé en production** (Brevo + domaine `certifizer.app` authentifié).

## 2.2. Chantiers à cadrer (ajoutés par Zoubir — pas encore planifiés)

### A. Export de rapports intelligents (Excel) — apprenant ET formateur
> Besoin : pouvoir exporter les profils et la progression sous forme de rapports **intelligents** (structurés et exploitables), pas un vidage brut de tables.
- **Côté apprenant** : rapport de progression personnel — readiness par domaine (People/Process/Business 33/41/26), forces/faiblesses, historique, séances complétées. Format Excel (.xlsx) propre et lisible.
- **Côté formateur / institution** : tableau de bord de cohorte exportable — progression par apprenant, zones à risque, complétion des séances ciblées, synthèse cohorte.
- **Pourquoi** : argument institutionnel (l'institution veut ses propres rapports/dossiers) ET brique de **portabilité** exigée par la loi 18-07 / RGPD (voir §2.2.B — droit d'obtenir une copie de ses données).
- **Note technique** : génération .xlsx côté backend (ex. openpyxl) ou côté front ; cloisonnement serveur habituel (le formateur n'exporte que SES cohortes). À cadrer avec un mockup d'abord, comme toujours.

### B. ⚠️ Protection des données — loi algérienne 18-07 + RGPD + international (SÉRIEUX, avis juridique requis)
> **📄 Livrable produit (07/2026)** : `certifizer-registre-conformite.xlsx` — registre de conformité à 7 onglets (garde/sommaire, traitements, risques, sous-traitants & transferts, violations, droits des personnes, plan d'actions), pré-rempli avec l'architecture réelle. **Gabarit vivant à compléter (`[à définir]`) et à faire valider par un juriste.** Risque n°1 identifié = transfert/hébergement hors Algérie (CRITIQUE).
> **Claude n'est pas juriste** : ce bloc cadre les exigences et la conception technique, mais une mise en conformité réelle exige un **conseil juridique qualifié**, surtout pour un produit multi-pays. À traiter avant tout déploiement institutionnel large.
- **Cadre** : la **loi 18-07** (10 juin 2018) est l'équivalent algérien du RGPD ; **modifiée par la loi 25-11 du 24 juillet 2025**. Autorité de contrôle : **ANPDP** (désormais opérationnelle). S'inspire du RGPD + Convention 108. Viser la conformité RGPD couvre largement l'international.
- **Certifizer est concerné** : la loi s'applique dès qu'un **résident algérien** utilise le produit, même hébergé à l'étranger ; un simple **email/nom** suffit à déclencher les obligations.
- **Obligations clés identifiées (à valider par un juriste)** :
  1. **Déclaration préalable** des traitements à l'ANPDP **avant** mise en œuvre (régime déclaratif).
  2. **Consentement libre, éclairé, explicite** : case à cocher non pré-cochée + mention claire ; retrait possible à tout moment.
  3. **Politique de confidentialité** accessible : identité du responsable, finalité, durée de conservation, droits (accès, rectification, suppression, limitation, portabilité).
  4. **⚠️ Transfert hors Algérie = autorisation préalable ANPDP.** POINT CRITIQUE pour Certifizer : la stack (Supabase, Render, Vercel, Brevo) héberge les données **hors d'Algérie** → traitement à cadrer sérieusement (autorisation, clauses contractuelles, ou hébergement local à terme).
  5. **Registre des traitements** et **registre des violations** de données.
  6. **DPO** (délégué à la protection des données) : obligatoire pour traitements sensibles/à grande échelle (cadre précisé par la délibération ANPDP de fin 2025).
  7. **Minimisation & proportionnalité** : ne traiter que les données strictement nécessaires (déjà l'esprit de Certifizer : email facultatif, cohortes en codes génériques, pas de nom de client).
- **Ce que Claude peut préparer côté produit** (quand on décidera de l'attaquer) : bandeau de consentement, politique de confidentialité (gabarit à faire relire par un juriste), fonctions **accès/export/suppression** du profil apprenant (droit à la portabilité et à l'effacement), minimisation des logs, documentation des traitements.
- **Sanctions** (pour mémoire, motivation) : amendes (ordre du million de DZD) et, pour violations graves, peines pénales — d'où l'importance de ne pas déployer largement sans cadrage.

### C. 🔒 Sécurité de l'authentification & accès aux données (à renforcer avant déploiement institutionnel)
> Déclencheur : rappel (vidéo/veille) — dès qu'on laisse des gens se connecter pour voir leurs données, la priorité n°1 est que **seule cette personne** puisse voir SES données. Certifizer applique déjà le **cloisonnement côté serveur** (décision verrouillée), mais l'auth actuelle est un **MVP léger** (nom + code de classe + lien magique, **sans mot de passe ni vérification forte**) — suffisant pour un pilote, **à renforcer avant un déploiement institutionnel réel**.
- **✅ AUDIT IDOR RÉALISÉ** (35 endpoints passés en revue) :
  - **Bien protégé (rien à faire)** : assignations apprenant (`assigned-session/{id}/items`, `/complete` → vérifient `a.learner_id != u.id`), toutes les actions formateur (`session-preview`, `targeted-session`, `question-bank`, `trainer-item`, `polish-question`, `invitations`, `revoke` → vérifient `cohorts_where_trainer`), lien magique et invitations (jetons signés/aléatoires).
  - **✅ CORRIGÉ en v39** : `GET /api/cohort/overview` exposait toute une cohorte via `?cohort_id=` seul (sans être formateur), et retombait sur « tous les apprenants » sans paramètre. → `trainer_id` désormais obligatoire, chemins de contournement supprimés.
  - **⏳ RESTE À CORRIGER** (dépend de l'auth forte) : les endpoints qui lisent la progression par `learner_id` non vérifié — `GET /api/mastery/{learner_id}`, `/api/readiness?learner_id=`, `/api/missed?learner_id=`, `/api/reflexes/{learner_id}`, `/api/learner/assigned-sessions?learner_id=`. **Risque modéré** (identifiants semi-devinables mais non séquentiels ; données de révision PMP, pas hautement sensibles) mais **réel** (un identifiant fuite facilement). **La correction complète exige une session authentifiée** — donc l'auth forte. Lié au risque R6 du registre.
- **Suppression de compte** : exigence RGPD/18-07 (droit à l'effacement) — pas optionnel. Déjà prévu (registre R5 / action A6).
- **Auth forte (plus tard)** : le jour où une vraie authentification est nécessaire (mots de passe, vérification email, sessions), envisager une solution dédiée à tier gratuit. **Supabase Auth** = choix le plus cohérent (Supabase est déjà la base). Alternatives citées : Better Auth, Clerk. Décision verrouillée actuelle = lien magique + code de classe (MVP) ; ceci est l'évolution.
- **🔐 Connexion Google / auth forte (idée Zoubir — Could have, à ne PAS faire avant les Must-have)** :
  - **Le besoin est réel** : « Se connecter avec Google » est ce que le grand public attend (un clic, pas de mot de passe). Bénéfice secondaire : **l'email arrive automatiquement** → plus aucun apprenant sans email (le trou comblé en v42 deviendrait sans objet).
  - **⚠️ Ce n'est PAS un simple bouton** : Certifizer n'a aujourd'hui **aucune authentification réelle** (l'identité = le nom saisi). Ajouter Google, c'est **introduire une vraie auth** — chantier structurant.
  - **Choix recommandé : Supabase Auth** (Supabase est déjà la base). Fournit Google + magic link + mots de passe, ET **gère les sessions/jetons**. Bénéfice majeur : **cela fermerait enfin les IDOR restants** (les endpoints qui lisent par `learner_id` non vérifié) — parce que le serveur saurait *qui* appelle. Alternative plus légère mais moins propre : Google OAuth branché à la main (on réinvente les sessions).
  - **Priorité : Could have.** Séduisant, mais ne rapproche pas du déploiement institutionnel autant que le volet légal. **À faire APRÈS les Must-have juridiques** (ANPDP, politique de confidentialité, consentement).
- **RLS Supabase (Row Level Security)** : Supabase signale les tables `public.*` sans RLS comme « CRITICAL » (alerte générique automatique). **Risque réel faible pour Certifizer** : le frontend ne parle jamais directement à Supabase — l'accès passe toujours par le backend FastAPI (Render) avec le rôle service (contourne la RLS), et le cloisonnement côté serveur est la vraie protection. **Mais** activer la RLS = bonne défense en profondeur (protège si la clé `anon` fuit ou si un accès direct est un jour exposé) et fait taire l'alerte. ⚠️ **Ne pas cliquer « Ask Assistant » de Supabase à l'aveugle** : des politiques mal calibrées pourraient bloquer le backend. Marche à suivre le moment venu : (1) confirmer que `DATABASE_URL` utilise le rôle postgres/service ; (2) activer RLS sur les tables `public.*` ; (3) vérifier que le backend accède toujours à tout (il contourne la RLS) ; (4) ne PAS créer de politique `anon` permissive. À traiter avec l'audit IDOR.
- **Bonnes pratiques déjà en place** : clés en variables d'environnement, cloisonnement serveur, `MAGIC_LINK_SECRET` stable, jetons de lien magique signés (HMAC, expiration 30 min).

### D. 🌐 Page vitrine publique indexable (Could have — volet commercial)
> Déclencheur : veille (conseil « ne pas coder son site en Vite/React, préférer Next.js pour le SEO »). **Analyse : le conseil est juste en général, mais ne s'applique PAS à l'app Certifizer.**
- **Pourquoi le conseil ne s'applique pas ici** : une app React/Vite génère son HTML dans le navigateur, donc mal indexée par Google et les robots d'IA. Mais **Certifizer est une application derrière identification** (cockpit, carte mentale, séances, quiz) — rien de tout cela n'a vocation à être indexé. Le gain SEO d'une réécriture serait **nul sur ~99 % du produit**.
- **⛔ Ne PAS réécrire l'app en Next.js** : réécriture massive (App.jsx, CockpitFormateur, CarteMentale, routage, build, déploiement), risque de régression sur v21→v38, pour aucun bénéfice. C'est le type de chantier séduisant qui fait dérailler un projet sain.
- **Le noyau légitime** : le jour où il faudra **vendre** Certifizer, une **page vitrine publique** devra être trouvable sur Google et citable par les IA (ChatGPT, Claude…).
- **Solution** : une **page/site statique séparé** (ou pré-rendu) à côté de l'app — aucune réécriture. Deux besoins distincts, deux outils distincts.
- **Priorité** : *Could have* — à faire avec le dossier de vente institution, jamais avant les Must-have (conformité, sécurité).

## 2.3. Priorisation MoSCoW — cible : premier déploiement institutionnel réel

> **Rappel de méthode** : MoSCoW est une technique de **priorisation des exigences** (reconnue en approches agiles/hybrides, ECO 2026), pas une méthode d'assurance qualité. Elle sert la qualité **indirectement** : elle protège le périmètre et rend les arbitrages explicites.
>
> ⚠️ **MoSCoW n'a de sens que par rapport à une cible datée.** Cible retenue ici : **le premier déploiement institutionnel réel** (de vrais apprenants d'une vraie institution, pas une démonstration encadrée). Si le premier pilote reste une **démo encadrée sans données réelles**, plusieurs « Must » redescendent en « Should ».

### 🔴 MUST HAVE — sans ça, on ne déploie pas
| Chantier | Renvoi | Pourquoi bloquant |
|---|---|---|
| Déclaration ANPDP + traitement de la question des **transferts hors Algérie** | §2.2.B (R1, R2) | Obligation légale. Toute la stack héberge les données à l'étranger — point le plus lourd. |
| **Politique de confidentialité** + **consentement explicite** | §2.2.B (R3, R4) | Obligation légale, visible par l'institution. |
| ~~**Suppression de compte**~~ | ✅ **FAIT (v41-v43)** | Droit à l'effacement livré : suppression + délai de grâce + purge auto + export (portabilité) + envoi automatique des données + rappels J-7/J-1. |
| **Reste de l'audit IDOR** (endpoints `learner_id`) | §2.2.C | L'audit est fait et la faille principale corrigée (v39) ; le reste exige l'auth forte. |

### 🟠 SHOULD HAVE — important, à faire vite après
| Chantier | Renvoi | Pourquoi |
|---|---|---|
| **RLS Supabase** | §2.2.C | Défense en profondeur ; l'alerte cesse de masquer les vraies. |
| **Durées de conservation + purge des inactifs** | §2.2.B (R8) | Exigence légale, tolérable quelques semaines. |
| ~~**Export Excel apprenant**~~ | ✅ **FAIT (v41)** | Portabilité livrée (Excel 5 onglets + portrait). Reste : le **tableau de bord cohorte** pour le formateur/institution. |
| **Archiver les DPA des sous-traitants** | §2.2.B (A8) | Pièces du dossier de conformité. |

### 🟡 COULD HAVE — utile, pas maintenant
Phase 3 (super-admin, AuditLog, content_scope, période de grâce) · **auth forte** (Supabase Auth) · heatmap détaillée apprenant×sujet · rendre réels les boutons d'intervention du cockpit · dossier de vente institution · principe de design **F/Z** (mockups A/B/C produits, mis de côté) · **page vitrine publique indexable** (voir §2.2.D) · **connexion Google / auth forte** (Supabase Auth — fermerait aussi les IDOR restants) · **refactoring** des gros fichiers (App.jsx, saas.py, main.py) — *décision : PAS maintenant, on ne refactorise pas du code qui marche ; à reconsidérer seulement si l'audit IDOR révèle un code trop emmêlé pour être sécurisé.*

### ⚪ WON'T HAVE — explicitement pas ce tour-ci
~~**Vision OJT complète**~~ → ⚠️ **REMONTÉE EN PRIORITÉ** (décision Zoubir) : l'OJT n'est **pas un bonus, c'est le cœur du contenu**. Le mode « Relier à mon projet » existe déjà dans le menu — le laisser vide est une **promesse non tenue**, un trou au centre du produit. Sans OJT, Certifizer est un bon outil adaptatif parmi d'autres ; avec, c'est le seul qui fasse **produire du travail réel**. Voir §2.4.
· **outil d'auteur complet** pour formateurs · **paiement Paddle→Payoneer** *(déjà décision verrouillée : en dernier)*.

### 💡 Ce que l'exercice révèle
> **Les « Must have » sont presque tous de la conformité et de la sécurité — aucun n'est une fonctionnalité.** Le produit est déjà fonctionnellement prêt pour un pilote. Ce qui sépare Certifizer d'un déploiement institutionnel réel n'est pas du code, mais du **travail légal et de durcissement**.
> ⚠️ **CORRIGÉ.** L'**OJT** est une **priorité stratégique** (c'est le cœur du contenu, pas un bonus — voir §2.4) — **mais il reste hors du périmètre du prochain jalon institutionnel**, qui demeure gouverné par la conformité juridique.
> **Priorité stratégique ≠ prochain jalon.** Les deux affirmations coexistent sans se contredire.
>
> *Réserve : Claude n'est pas juriste — le caractère strictement bloquant de la déclaration ANPDP relève d'un avis qualifié.*

## 2.4. ⭐ OJT — modèle d'évidence v2
> ⚠️ **Révisé à la suite d'une relecture critique assistée par IA. La revue indépendante par un formateur PMI reste À RÉALISER.**

> **Documents de référence** : `modele-evidence-OJT-v2.md` (le modèle), `rubrique-OJT-charte-v3.1.md` (l'instrument) · `RUBRIQUE-evaluateur.md` (version aveugle) · `protocole-calibration-OJT.md` · `calibration/RAPPORT-test-synthetique.md`, `mockup-OJT-carte-vivante.html` (écran scindé : produire à gauche, carte à droite).

### Le principe fondateur — trois canaux de preuve, JAMAIS fusionnés

> ⛔ **Interdit : un « % de maîtrise » synthétique.** Il masquerait trois construits différents sous un seul chiffre.

| Canal | Question | Comment |
|---|---|---|
| **Reconnaissance** | Reconnaît-il le bon raisonnement ? | Quiz *(existe déjà)* |
| **Application** | Produit-il un livrable défendable sur son **vrai projet** ? | Livrable + rubrique + **validation formateur** |
| **Rétention / transfert** | Sait-il le refaire **plus tard**, **plus seul**, **ailleurs** ? | **Preuve différée** |

### ⚠️ La correction la plus lourde : la rétention n'est PAS temps réel

La carte peut s'actualiser en temps réel, **mais la rétention, non**. Juste après la charte on peut dire « application démontrée » ; on **ne peut pas** dire « compétence retenue ». La rétention est par définition une **preuve différée** (réapplication après délai, sans revoir sa production, avec indépendance suffisante).
*Cela corrige l'idée initiale de « carte vivante avec KPI de rétention en temps réel ».*

### Les six états d'un concept (chacun avec une règle de preuve)

`Découvert → Compris → Appliqué → Validé → Retenu → Transféré`

- **Ce n'est PAS une barre de progression** : c'est une carte de preuves.
### ⚠️ CORRIGÉ — « Retenu » ne se perd PAS automatiquement

> Une version antérieure disait : *« Retenu se perd si la preuve n'est pas renouvelée. »*
> **C'était une décroissance arbitraire déguisée** — exactement ce qu'on a refusé d'inventer ailleurs (le taux d'oubli chiffré).
>
> **Une preuve ancienne ne démontre pas que l'apprenant a oublié.** Elle démontre seulement que **la rétention n'a pas été reconfirmée récemment.** Ce n'est pas la même chose.

**Les trois états honnêtes :**
```
Retenu — preuve récente
Retenu — preuve ancienne, reconfirmation conseillée
Retenu — reconfirmation prioritaire
```

### ⚠️⚠️ CORRECTION DE LA CORRECTION — l'expiration était ENCORE une régression automatique

> Le correctif précédent laissait une porte ouverte : *« une règle d'expiration pédagogique fait redescendre l'état »*.
> **Une expiration temporelle EST une régression automatique.** L'étiqueter « convention » ne change rien pour l'apprenant qui voit sa compétence rétrogradée **parce qu'un calendrier a tourné**.
>
> *(J'y suis revenu trois fois. C'est une pente naturelle — d'où la nécessité d'une règle dure.)*

## ⭐ TROIS AXES INDÉPENDANTS — la séparation est STRUCTURELLE, pas rédactionnelle

> **Pourquoi trois versions successives du texte n'ont pas suffi** : tant que « rétention non confirmée » cohabite avec « preuve récente / ancienne » dans le **même champ**, le code pourra toujours transformer un changement de **fraîcheur** en changement d'**état**. **La correction doit être dans la structure de données.**

```
┌─ AXE 1 ─ competence_state ────────────────────┐
│   Validé  ·  Retenu  ·  Transféré             │
│   ⛔ SEUL un examen de formateur peut l'écrire │
└───────────────────────────────────────────────┘

┌─ AXE 2 ─ retention_evidence ──────────────────┐
│   non_encore_testée  ·  confirmée  ·  contestée│
└───────────────────────────────────────────────┘

┌─ AXE 3 ─ evidence_freshness ──────────────────┐
│   récente  ·  ancienne  ·  reconfirmation_prioritaire │
│   ⏱️ SEUL le temps l'écrit — et il n'écrit QUE là     │
└───────────────────────────────────────────────┘
```

> ### 🔒 L'INVARIANT — à faire respecter par le code, et à TESTER
> ```
> Le temps peut modifier  evidence_freshness.
> Le temps ne doit JAMAIS écrire dans  competence_state.
> ```
> *(Même discipline que le test v42 qui interdit tout taux d'oubli chiffré : **une valeur qu'on tient devient une assertion vérifiable**.)*

### Les règles de transition

```
Validé  +  aucune réapplication différée
   → competence_state   : inchangé (Validé)
   → retention_evidence : non_encore_testée
   ⚠️ L'apprenant n'est PAS « Retenu, non confirmé ». Il est « Validé ».

Réapplication différée RÉUSSIE  +  indépendance ≥ 2
   → competence_state   : Retenu
   → retention_evidence : confirmée
   → evidence_freshness : récente

TEMPS QUI PASSE
   → evidence_freshness : récente → ancienne → reconfirmation_prioritaire
   → competence_state   : ⛔ INCHANGÉ
   → retention_evidence : ⛔ INCHANGÉ

Réapplication ÉCHOUÉE
   → retention_evidence : contestée
   → revue_formateur_requise = VRAI
   → competence_state   : ⛔ INCHANGÉ jusqu'à la décision humaine
```

> ### ⚠️ Une réapplication échouée est une PREUVE CONTRADICTOIRE — pas une décision
> Le formateur doit pouvoir distinguer : un **oubli réel** · une **consigne mal comprise** · un **contexte plus difficile** · une **erreur ponctuelle** · **ou une preuve initiale qui était trop faible dès le départ**.
>
> **Cette dernière possibilité est celle qu'une régression automatique rendrait invisible** : elle accuserait l'apprenant d'avoir oublié, alors que **le système s'était trompé en le déclarant « Retenu »**.

### Vocabulaire — ce qui est banni

| ⛔ Banni | ✅ À la place | Pourquoi |
|---|---|---|
| *« preuve arrivée à échéance »* | **« reconfirmation prioritaire »** | « échéance » garde le vocabulaire de l'**expiration** |
| *« Rétention non confirmée »* (comme fraîcheur) | **`Validé` + `non_encore_testée`** | Ce n'est pas une fraîcheur, c'est un **autre axe** |
| *« on accumule des preuves — ou on en perd »* | **« On accumule des preuves. Certaines peuvent être contredites ou invalidées par de nouvelles observations ET une revue humaine — jamais par leur seule ancienneté. »** | « perdre » suggère une disparition **automatique** |


### ⭐ Le KPI d'indépendance (0–3) — la contribution décisive

`3 = autonome · 2 = probing uniquement (P) · 1 = structure / exemple / étayage substantiel (S,E) · 0 = formulation fournie ou acceptée quasi telle quelle (F,A)`

⚠️ **CORRIGÉ — compter les relances est FAUX.** Une seule relance peut dicter la réponse (*« Écrivez que la ligne aval est hors périmètre »*) ; six questions ouvertes peuvent tout laisser à l'apprenant. **On trace la NATURE de l'aide**, codée à la source : `P` probing · `S` structure · `E` exemple · `F` formulation fournie · `A` accepté tel quel · `R` réécrit par l'apprenant. **L'indépendance est déterminée par l'aide la plus déterminante** : `3` autonome · `2` probing seulement · `1` structure/exemple · `0` formulation fournie ou acceptée.
**Règle dure : l'état « Retenu » exige indépendance ≥ 2.** Sinon on mesurerait la qualité de l'IA, pas celle de l'apprenant.

### La rubrique — points structurants

- **4 niveaux** : Absent · **Générique** · Conforme · Défendable.
- ⭐ **« Générique » est le cœur** : présent mais applicable à n'importe quel projet = le modèle a été rempli, le projet n'a pas été pensé. **C'est le mode d'échec exact du travail assisté par IA.** Contrainte : l'IA doit **citer le passage ancré** dans le projet réel ; pas de citation → niveau 1.
- ⭐ **L'IA peut s'ABSTENIR** : « évidence insuffisante — jugement du formateur requis ». Forcer une note sur une preuve insuffisante, c'est **fabriquer de la donnée**.
- **Aucun pourcentage** : un profil (**9 observations** × 4 niveaux (dont C7a et C7b)) + un niveau global par **règles explicites**.
- **Provenance honnête** de chaque critère : `PMI-PROCESS` / `PMI-ECO` / `PRO` / `CZ` (**critère Certifizer**, à assumer comme tel — ne pas le faire passer pour du PMBOK).

### Le graphe de dépendances — corrigé

⛔ `Charte → WBS` était **faux**. Une charte autorise ; elle ne définit pas assez pour découper.
✅ `Exigences + Périmètre défini → WBS`. Et **le risque naît au démarrage** (le risque global est *dans* la charte) — il n'attend pas le WBS.
Les liens portent un **verbe** : `autorise` · `informe` · `permet` · `affine` · `valide`. *Une flèche muette ne dit rien ; une flèche qui nomme sa relation enseigne.*

### Ce que la carte peut afficher honnêtement

- **Apprenant** : `Compris → Appliqué → Validé → Retenu` (simple, non anxiogène).
- **Formateur** : niveau validé · **indépendance** · réapplication différée · persistance · étendue du transfert · **fraîcheur de la preuve** · nombre de preuves · confiance *dans la preuve* (jamais dans la personne).

### Limites — écrites franchement

- **Rubrique non validée psychométriquement.** Pilote obligatoire avant tout usage institutionnel.
- **Accord IA↔formateur ≠ justesse** : si les deux se trompent pareil, le kappa est excellent et l'évaluation fausse. Il faudra **plusieurs formateurs indépendants**.
- **« Transféré » peut être hors d'atteinte** : la plupart des apprenants n'ont qu'un projet. Le transfert doit rester atteignable (autre livrable, autre situation) — sinon l'état est décoratif.
- **Le délai de 7 jours est un choix pédagogique**, pas une constante dérivée d'Ebbinghaus.

### Ordre de travail — ⚠️ CORRIGÉ

> **Les résultats de calibration dictent le design du nœud OJT — JAMAIS l'inverse.**
> *(La version précédente plaçait le nœud à six états AVANT la validation. Contradiction levée.)*

```
1. ✅ Rubrique complète (v3.1, 9 observations, règle du minimum)
   + corpus synthétique testé (charte-A / B / C)

2. ⏳ Cas 1  — charte EPC RÉELLE, historique, non retouchée
              ⚠️ teste le FAUX NÉGATIF : pénalise-t-on un bon travail ?
              C'est le risque le plus dangereux.

3. ⏳ Cas 5  — décalque contractuel (C8 face à son vrai adversaire)

4. ⏳ Cas 2  — charte adaptative validée par un praticien agile
              🔶 exploratoire tant qu'aucun praticien n'est identifié

5. 🔶 Évaluation indépendante + arbitrage formateur PMI
              ⚠️ INDISPONIBLE — limite assumée. Le profil du cas 1
              n'est donc PAS un étalon, seulement une lecture.
              (Différé au pilote : le formateur du client arbitrera.)

6. ⏳ Conception du NŒUD OJT   ← seulement ici

7. ⏳ Pilote sur livrables réels

8. ⏳ Étude de fiabilité (kappa — exige un volume suffisant)
```

⚠️ **Périmé** : « tester sur 3 chartes (une bonne, une générique, une longue-et-creuse) » — **les cas générique et longue-et-creuse sont FAITS**. Reste la **bonne** (cas 1).


### ✅ Calibration OJT — le corpus synthétique a rempli sa fonction

> **Rapport figé** : `calibration/RAPPORT-test-synthetique.md`

**Conclusion, formulée avec précision** :
> La procédure d'évaluation est **exécutable** et a produit **les profils attendus** sur trois cas synthétiques adversariaux — **avec ce moteur et cette configuration**. **L'instrument est prêt pour un pilote sur des livrables réels. Rien de plus.**

| Document | Ce qu'il teste | Résultat |
|---|---|---|
| `charte-A` | générique **pur** | **9 × 1** → Générique ✅ |
| `charte-B` | ⚠️ **test acide** — 1 263 mots élégants, complétude 3/4 | **9 × 1** → Générique ✅ |
| `charte-C` | ⭐ **cas mixte** — ne pas surclasser | C4 = 1 par la **règle du minimum** ✅ |

**⭐ La règle du minimum** (ajoutée après le test) — un critère composite vaut **sa composante la plus faible**, jamais la moyenne : `C4 = min(frontières, livrables)`. **Effet observé** : même document, même moteur, C4 est passé de **2 à 1**, et le moteur **cite explicitement la règle** dans sa justification. ⚠️ **Une exécution avant, une après — à reproduire. Ce n'est pas une attribution causale établie.**

**⚠️ LE CONTRE-EXEMPLE — à conserver.** ⚠️ **Lors d'une exécution ANTÉRIEURE avec Grok, sur une version antérieure du corpus et de l'instrument** (la règle du minimum n'existait pas ; l'actuelle `charte-C` s'appelait alors `charte-A`), **un appel en bloc a classé `charte-B` en « Applicable »** et commis **les 7 fautes prédites sur 7**.
> ⚠️ *« Même rubrique, même prompt » ne sera défendable qu'avec les empreintes exactes de la rubrique et du prompt des deux exécutions comparées. Elles ne sont pas disponibles.* Il a même cité *« anime, veille, rend compte »* pour accorder un 2 d'autorité — **alors que la rubrique nomme explicitement ces verbes comme insuffisants**.

> ### ⭐ LA LEÇON DE CONCEPTION LA PLUS IMPORTANTE
> **Donner la rubrique à un LLM ne suffit pas. Il faut INSTRUMENTER son application.**
> ```
> PAS :   rubrique + document → une réponse LLM
> MAIS :  extraction de preuve → évaluation critère par critère (appels séparés)
>         → test de généricité → validation citation↔niveau (2ᵉ passe)
>         → règles mécaniques (minimum, verbes insuffisants) → agrégation
> ```

**Ce qui N'EST PAS démontré** : que la rubrique reconnaît la **compétence réelle** (cas 1) · qu'elle détecte le **décalque contractuel** (cas 5) · qu'elle est **fiable** (1 exécution/document).

**⚠️ Prochain risque, et c'est le plus dangereux : LE FAUX NÉGATIF.** Un outil trop indulgent se corrige. **Un outil qui rabaisse injustement un praticien compétent détruit la confiance dans Certifizer.** D'où la priorité au **cas 1** (charte EPC réelle) avant le cas 5.

**⚠️ Contamination à éviter sur le cas 1** : Zoubir connaît désormais trop bien la rubrique pour écrire une charte indépendante d'elle — il produirait involontairement les formulations qui « passent le test ». **Il faut une charte EPC HISTORIQUE, antérieure à la rubrique, anonymisée, NON améliorée avant le test.**


> ## 🔴 DÉROGATION TEMPORAIRE — `OJT-EXC-01`
> ### Revue indépendante de la rubrique **différée**
>
> **Motif** — Aucun formateur PMI indépendant n'est actuellement disponible.
>
> #### ✅ Portée AUTORISÉE
> - tests de développement internes
> - évaluation **exploratoire** du cas 1
> - tests du moteur et des règles mécaniques
> - mockups et conception technique
>
> #### ⛔ HORS PORTÉE — interdits
> - présenter la rubrique comme **« validée »**
> - utiliser un résultat IA comme **évaluation faisant foi**
> - prendre une **décision RH ou pédagogique** importante sur ce résultat
> - afficher **« Validé », « Retenu » ou « Transféré »** sans la preuve humaine requise
> - utiliser ces résultats comme **argument de validité** dans un dossier commercial
>
> #### 🔓 Critère de sortie
> ⚠️ **La dérogation prend fin AVANT LE PREMIER des deux événements suivants :**
> 1. **activation opérationnelle** du module OJT auprès d'apprenants réels ;
> 2. **toute revendication institutionnelle ou commerciale** portant sur la qualité de l'évaluation.
>
> *(Une version antérieure écrivait « ou », ce qui permettait théoriquement d'activer le module sans revue tant qu'aucune revendication n'était faite. **Aucune des deux barrières ne peut remplacer l'autre.**)*
>
> **Responsable** : Zoubir Dahia · **Statut** : *exception ouverte — risque accepté temporairement.*
>
> ---
>
> ### Conséquences, écrites franchement
>
> **Décision Zoubir : on avance sans arbitrage d'expert.** Conséquences, écrites franchement :
>
> | | |
> |---|---|
> | **Le profil du cas 1 n'est PAS un étalon** | C'est *« une charte de praticien + notre meilleure lecture »*. Utilisable — **mais ce n'est pas une vérité de référence**. |
> | **L'accord inter-juges (kappa) est hors champ** | Il exige plusieurs évaluateurs indépendants. |
> | **La validité de contenu reste non établie** | On a un **ancrage documentaire** (PMBOK 8 lu à la source), **pas** une validation. |
> | **⚠️ Ne jamais présenter la rubrique comme « validée »** | Ni à un client, ni dans un dossier de vente. |
>
> **L'arbitrage est DIFFÉRÉ, pas abandonné** : « l'IA propose, le formateur valide » est inscrit dans le produit. Le jour où une institution pilote Certifizer, son formateur validera les jugements portés sur les livrables.
>
> ### ⚠️ MAIS — deux fonctions à ne JAMAIS confondre
>
> | Le formateur du pilote **valide** | Il ne valide **PAS** |
> |---|---|
> | les **jugements portés sur les livrables** (cas par cas) | la **couverture** des critères |
> | | la **pertinence** des niveaux |
> | | le **tailoring** |
> | | les **règles d'agrégation** |
> | | la **validité de contenu** de la rubrique |
>
> > **La validation opérationnelle (cas par cas) ne constitue PAS, à elle seule, une validation méthodologique de l'instrument.**
> > Sinon, une validation au cas par cas pourrait être présentée plus tard comme une validation de la rubrique entière. **Ce serait faux.**


### 🔒 PROTOTYPE OJT VERROUILLÉ — `prototype-OJT-VERROUILLE.html`

> **Parcours vertical complet** : import → preuves → proposition → G1 → validation formateur → résultat.
> **Une charte · un apprenant · un formateur.** Pas de Retenu, pas de Transféré, pas de carte, pas de kappa.

**Les 10 invariants tenus — vérifiés dans le code, pas annoncés :**

| | |
|---|---|
| **1** | Niveau ≥ 2 sans citation → **`return` avant enregistrement**. Pas un avertissement : un refus. |
| **2** | Règle du minimum **calculée ET affichée** : `C4 = min(1, 2) = 1` |
| **3** | **G1 ne plafonne que si `trainerStatus === "confirmed"`** — le moteur détecte, l'humain tranche |
| **4** | ⭐ **Une abstention n'est JAMAIS transformée en 0** |
| **5** | Abstention sur un **essentiel** → **« En attente — jugement du formateur requis »** |
| **6** | Un **vrai 0** garde toutes ses conséquences (Ébauche) |
| **7** | **Le seuil reste 7 des 9. On ne renormalise jamais.** |
| **8** | Statut **`complete` / `partial` / `pending`** — une évaluation incomplète le dit |
| **9** | L'apprenant **ne valide pas** sa propre évaluation |
| **10** | Garde défensive documentée *(inatteignable avec 7 essentiels — conservée si ce nombre change)* |

### ⭐ LE BUG LE PLUS GRAVE QU'ON AIT TROUVÉ — et ce qu'il disait

```js
Number.isInteger(levels[code]) ? levels[code] : 0     // ← l'abstention devenait 0
if(anyEssential0) return ["Ébauche", …]
```

> ### **Un formateur qui disait « je ne peux pas juger » faisait basculer la charte en « Ébauche ».**
> **Le système PUNISSAIT l'honnêteté** — exactement le comportement que toute la rubrique cherche à encourager.

| | |
|---|---|
| **`0`** | Le document **ne dit rien** |
| **Abstention** | **Je n'ai pas de quoi trancher** |

**Ce ne sont pas la même chose. On ne conclut jamais sur ce qu'on n'a pas jugé.**

*Et le même bug existait dans la COULEUR : `scoreClass()` donnait à l'abstention le rouge du niveau 1 — à l'écran, « je ne peux pas juger » ressemblait à un mauvais score.*

**8 cas d'agrégation testés · tous corrects.**

### ➡️ PROCHAINE ÉTAPE — la seule qui compte

> **Faire utiliser le prototype par UNE personne réelle.**
> **Pas une itération théorique de plus.** Regarder où elle hésite, ce qu'elle ne comprend pas, ce qu'elle cherche.
> *« Le prochain risque n'est plus une faiblesse théorique de la rubrique. C'est de continuer à perfectionner l'instrument sans jamais le mettre entre les mains d'un utilisateur. »*

## 3. Décisions verrouillées (ne pas rouvrir)

> **Positionnement produit** : Certifizer n'est PAS réservé à SMA. SMA n'est qu'un point de départ possible (premier pilote) ; la cible est **tout type de client institutionnel** (n'importe quel organisme de formation). Cohérent avec la décision n°7.

1. **Freemium PAR FONCTIONNALITÉS, jamais punitif** : « Gratuit = utile · Premium = intelligent · Institution = supervisée ». Aperçus bridés (3 zones, 2 étapes, 5 historique) ; DailyUsage = anti-abus discret (50/j), message doux.
2. **Chemin critique = fonction premium intelligente** (aperçu 2 étapes en gratuit).
3. **« Répétition espacée » banni en UI** → « Apprentissage adaptatif de vos erreurs » (clé code `spaced_repetition` conservée en interne).
4. **Auth MVP = nom + code de classe + lien magique** (pas de mot de passe/OAuth) — livrée v35/v37/v38. Renforcement (IDOR, auth forte type Supabase Auth, suppression de compte) = chantier §2.2.C, avant déploiement institutionnel réel.
5. **Paiement = Paddle→Payoneer, en dernier.**
6. **learner_id = User.public_id** ; `effective_plan` jamais stocké ; cloisonnement CÔTÉ SERVEUR uniquement.
7. **Cohortes en codes génériques** (PMP-2026-A) ; jamais de nom de client dans le produit.
8. **Questions formateur (v34)** : cloisonnées à leur organisation ; vivent uniquement dans les séances ciblées et la banque de leurs cohortes ; **jamais dans le moteur adaptatif global** ni dans le readiness des 135 questions calibrées ; le formateur écrit dans sa langue (pas de traduction imposée) ; la correction IA est une **proposition, jamais imposée**.
9. **Création de question formateur = volontairement légère** ; l'outil d'auteur complet viendra plus tard, seulement si le besoin se confirme.
10. **« L'IA propose, l'humain (formateur) valide »** — principe transversal : correction de formulation (v34), et à venir l'évaluation OJT et la cartographie cognitive. L'IA amplifie le jugement du formateur, ne le remplace jamais.
11. **Email = récupération facultative** ; le nom reste l'identité de départ (zéro friction). Envoi d'email via **Brevo** ; **`MAGIC_LINK_SECRET` stable** (ne jamais changer, sinon les liens magiques cassent).
12. **Minimisation des données = ethos Certifizer** (email facultatif, codes génériques, pas de nom de client, pas de données sensibles) — atout natif pour la conformité 18-07/RGPD.

---

## 4. Garde-fous à chaque vague de code

- Portes défensives zéro-régression (features/me absent → comportement complet).
- Tester avant de packager : suite backend + `npx vite build` + vérification depuis le zip.
- Packager `certifizer-vNN.zip` en préservant `.github/` (keepwarm).
- Migrations additives via `additive = [...]` dans `models.py` `_ensure_columns()`.
- Vercel : décocher « Use existing Build Cache ». Apostrophe française (') en JS. Bilingue FR/EN.
- Zoubir déploie via GitHub Desktop puis confirme — attendre sa confirmation avant d'enchaîner.

- Mockup de vision : `mockup-vision-OJT-parcours-complet.html` (5 briques OJT en onglets, aperçu de concept).