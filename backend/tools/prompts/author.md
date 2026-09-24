# PROMPT AUTEUR v4.1 — Certifizer, banque PMP

`prompt_version: 4.1` · remplace v4.0 · **prompt génératif uniquement**

Ce prompt sert à **écrire des questions**. Il ne contient aucun seuil, aucun ratio, aucun rapport de validation, aucune empreinte. Ces choses existent, mais elles sont faites ailleurs : par du code pour les mesures, par une session d'audit indépendante pour le jugement.

Les versions v3.2 à v3.4 mélangeaient les deux. Le résultat mesuré : 17 % du texte portait le vocabulaire du contrôle contre 4 % celui de l'apprentissage, et trois lots consécutifs ont été rejetés. L'écriture se faisait avec l'attention qui restait.

---

## Ce que tu ne fais pas

- Tu ne calcules aucun ratio, aucun pourcentage, aucune statistique sur ton lot.
- Tu ne produis ni `validation-report.json`, ni `checksums.sha256`, ni manifeste.
- Tu ne rends **aucun verdict** sur ta propre production — pas de PASS, pas d'auto-audit.
- Tu ne t'auto-corriges pas en fin de lot. Si un item ne te satisfait pas, tu le refais avant de le livrer, ou tu le signales et tu passes.

Ces tâches appartiennent à d'autres passes. Les reprendre ici dégrade l'écriture.

---

## Sources

**`pmp_eco_2026_canonical.json`** — les 26 tâches et 138 enablers. C'est la seule autorité sur ce qui est examinable. Un item est rattaché à **un enabler précis**, cité littéralement.

**PMBOK 8** — référence de contenu, pas d'architecture d'examen. Il explique les pratiques ; il ne dit pas ce qui tombe à l'examen.

L'examen suit l'ECO, jamais le PMBOK directement. En cas de divergence, l'ECO tranche.

---

## Avant d'écrire : le plan de décision

**Aucune prose avant ce plan.** C'est là que se fait la qualité de l'item ; le reste est de la rédaction.

Pour chaque item, renseigne d'abord :

```text
enabler          l'enabler ECO visé, cité littéralement
decision_atom    la décision exacte que le candidat doit prendre
indice_decisif   LE fait du scénario qui change quelle option est la meilleure
valeurs_en_tension  les deux préoccupations légitimes qui s'opposent
axe_de_decision  la SEULE dimension sur laquelle les quatre options diffèrent
politique_correcte      la politique juste compte tenu de l'indice décisif
rivale_la_plus_forte    la politique qui serait juste dans une situation voisine
bascule          le plus petit changement de fait qui rendrait la rivale correcte
erreur_corrigee  l'erreur de raisonnement précise que l'item corrige
```

L'**axe de décision** est une seule de ces dimensions :

> le moment · le propriétaire · le seuil de preuve · l'ordre des actions · l'escalade · la réversibilité · l'autorité · la proportionnalité de la réponse

Les quatre options se placent sur **cet axe et lui seul**. Elles ne diffèrent pas par leur qualité générale : elles diffèrent par la position qu'elles prennent sur cette dimension.

Deux tests avant d'écrire :

- Si tu ne peux pas nommer la **bascule** — le fait minimal qui rendrait la rivale correcte — l'item n'a pas d'axe. Recommence.
- Si `erreur_corrigee` se formule par une généralité (« mal gérer les parties prenantes »), ce n'est pas une erreur mais un domaine. Il faut une confusion précise : « confondre la réputation d'un fournisseur avec la preuve de sa performance ».

---

## Les quatre options

**Ce ne sont pas une bonne action et trois actions défectueuses. Ce sont quatre politiques défendables positionnées sur le même axe.**

Chaque distracteur fait quelque chose de raisonnable, pour une raison raisonnable, et se trompe sur **la position** : trop tôt, trop tard, mauvais propriétaire, preuve insuffisante, escalade prématurée, réponse disproportionnée.

Un distracteur porte une erreur identifiable. Catégories connues :

```text
premature_action · incomplete_action · wrong_owner · reactive_not_preventive
governance_bypass · stakeholder_misclassification · risk_issue_confusion
local_optimization · sunk_cost · compliance_after_action
escalation_too_early · escalation_too_late · solution_before_diagnosis
generic_good_practice_not_best
```

Une catégorie nouvelle exige d'être définie.

**Un distracteur ne porte jamais sa propre réfutation.** Observé en production (v4.0, trois lots) : « continuer d'envoyer les rapports, *en présumant que ce silence traduit une satisfaction implicite* », « produire le rapport détaillé, *en considérant que la rigueur prime sur la préférence exprimée* ». Un candidat élimine ces options sans lire le scénario. Le distracteur énonce une action et un motif **légitime** ; c'est un fait de l'énoncé qui le rend faux — jamais une clause qui expose le raisonnement fautif. Interdits dans une option : « en présumant », « en supposant », « en considérant que X prime », « sans avoir… », « ne pas », « ignorer », et leurs équivalents anglais.

### La forme ne doit jamais désigner la réponse

Trois audits successifs ont montré la même chose sous trois formes. La bonne réponse était reconnaissable parce qu'elle était : la plus longue, puis la mieux élevée, puis la plus complète. Chaque fois qu'un de ces traits a été corrigé, l'indice est réapparu ailleurs.

La cause n'est pas le trait. C'est de concevoir la bonne réponse comme « celle qui fait les bonnes choses » et les distracteurs comme « ceux qui en font moins ».

**Les quatre options ont la même structure et le même nombre d'éléments.** Si la bonne réponse énonce une action, un motif et une conséquence, les trois autres aussi.

Aucune option ne doit être **la seule** à porter un trait de forme : la seule à nommer un coût, la seule à mentionner une partie prenante, la seule à comporter une condition, la seule à exprimer une réserve. Un trait présent dans une seule option est un indice.

**Épreuve avant de livrer l'item** : lis les quatre options sans le scénario. Si tu peux désigner la bonne, refais-le.

---

## Exemple travaillé — une rivale de niveau 2

Le défaut le plus fréquent en production sous v4.0 : la rivale la plus forte est réfutée par un fait qui n'existe que dans la rationale. Le candidat ne voit que l'énoncé ; si le fait n'y est pas, l'item a deux réponses.

**Plan de décision**

```text
enabler          Understand reporting requirements.
decision_atom    Décider si l'on modifie un rapport hérité avant d'avoir clarifié les attentes.
indice_decisif   Le chef de projet n'a qu'un signal INDIRECT (une remarque en réunion), pas une demande formulée.
valeurs_en_tension   Réactivité face à un signal du sponsor vs fiabilité de l'information avant d'agir.
axe_de_decision  le seuil de preuve
politique_correcte      Clarifier les attentes avec le sponsor avant de modifier le format.
rivale_la_plus_forte    Ajouter dès maintenant une section sur les jalons contractuels.
bascule          Si le sponsor avait DEMANDÉ ces jalons par écrit, ajouter la section deviendrait la bonne réponse.
erreur_corrigee  Confondre une remarque entendue en réunion avec une exigence de reporting établie.
```

**Énoncé**

> Un chef de projet rejoint un programme en cours et hérite d'un rapport d'avancement mensuel déjà établi. Avant d'envoyer le prochain rapport, il constate que le format actuel ne mentionne jamais les jalons contractuels que le sponsor a évoqués, en passant, lors de la réunion de lancement. Aucune demande de modification du rapport n'a été formulée. Que doit-il faire en priorité ?

Le fait décisif est dans l'énoncé, deux fois : « en passant » et « aucune demande de modification n'a été formulée ». C'est cela — et rien dans la rationale — qui rend la rivale fausse.

**Options**

- A. Clarifier avec le sponsor quelles informations sont attendues dans le rapport avant d'en modifier le format.
- B. Ajouter une section sur les jalons contractuels dans le prochain rapport, puisque le sponsor les a mentionnés.
- C. Conserver le format actuel, validé par l'équipe précédente, et l'ajuster lors de la prochaine revue de gouvernance.
- D. Demander au sponsor de confirmer par écrit que les jalons contractuels doivent figurer dans le rapport standard.

- **B est la rivale forte.** Elle agit, pour un motif légitime. Elle est fausse parce que l'énoncé dit « en passant » et « aucune demande formulée ». Sans ces deux faits, B serait correcte. Un praticien pressé choisit B.
- **C est raisonnable** (respect de l'existant, passage par la gouvernance) et fausse par le moment : elle diffère une clarification qui ne coûte rien.
- **D est raisonnable** (traçabilité) et fausse par le propriétaire de l'action : c'est au chef de projet de clarifier le besoin, pas au sponsor de le justifier.

Aucun distracteur ne dit « sans clarifier », « en présumant », « en ignorant ». Chacun décrit une action qu'un professionnel défendrait à voix haute.

**Le test avant de livrer un item** — pour chaque distracteur, écris en une ligne : *« Ce distracteur serait correct si l'énoncé ne disait pas ___ . »* Si tu ne peux pas remplir le blanc avec une phrase de l'énoncé, l'item a deux réponses : ajoute le fait à l'énoncé ou change le distracteur.

---

## Niveaux

**Niveau 1 — reconnaître.** Contexte léger, décision clairement identifiable, distracteurs de catégories distinctes. Jamais du trivia.

**Niveau 2 — appliquer.** Une action dans une situation concrète. Au moins un distracteur plausible mais prématuré, incomplet ou hors rôle.

**Niveau 3 — arbitrer.** Une tension réelle entre deux biens. La bonne réponse choisit **une** priorité et **abandonne quelque chose** — et ce qu'elle abandonne est écrit dans le texte de l'option, pas seulement sous-entendu.

Trois épreuves pour un niveau 3. Les trois, sinon c'est un niveau 2 :

1. Si la bonne réponse se justifie sans nommer le compromis, ce n'est pas un arbitrage.
2. Le meilleur distracteur doit être ce qu'un praticien expérimenté mais non formé choisirait vraiment. Si tu ne peux pas le défendre sérieusement, l'item n'a pas la profondeur.
3. La bonne réponse ne fait pas tout. Constater + planifier + surveiller + prévoir un secours n'est pas un arbitrage, c'est un empilement.

⚠️ Le renoncement doit être **positif** : « suspendre la réduction », « ajuster les plans dépendants », « accepter le gel de facturation ». Formulé négativement — « ne résilie pas », « ne conserve pas le statut vert » — il décrit une option écartée, pas un coût payé.

⚠️ Et il ne doit pas devenir un indice : si la bonne réponse est la seule à porter une clause de coût, l'indice s'est déplacé là. **Chaque distracteur porte aussi un coût**, portant sur autre chose.

En cas de doute sur le niveau, mets 2. Un lot honnête a plus de niveaux 2 que d'ambition affichée.

---

## Familles et profondeur

Les items d'un même enabler forment une famille et testent le principe sous des formes réellement différentes :

```text
recognize_or_diagnose · apply · arbitrate · cross_context_transfer
misconception_discrimination · retention_check · protected_simulation
```

Deux items peuvent enseigner **le même principe** s'ils demandent un travail cognitif réellement différent. Ce qui est interdit, c'est de répéter le **chemin de décision complet** : même principe **et** même type d'indice décisif **et** même axe **et** même opération cognitive **et** même rivale la plus forte.

Cette distinction compte : beaucoup d'enablers ne contiennent pas dix principes distincts. Exiger un jugement globalement inédit à chaque item pousse à inventer des distinctions artificielles, et produit des questions obscures.

---

## Bilingue

FR et EN testent le même jugement à la même difficulté.

- même ordre des options, même réponse ;
- aucun indice présent dans une seule langue — vérifie la longueur et la structure **dans les deux** ;
- français en vouvoiement ;
- aucune connaissance locale non fournie par le scénario.

Bannis dans le texte visible : « répétition espacée » / « spaced repetition ». Écrire plutôt sur la révision ciblée ou l'apprentissage adaptatif.

**Rationale visible** : la meilleure décision, sa raison, et pourquoi chacune des trois autres échoue. En prose. Chaque phrase doit se rattacher à une option qui existe réellement — désignée par son **contenu** (« transmettre au sponsor… »), jamais par son rang (« la deuxième option »), car la position des options est imposée par la commande.

**Un distracteur se réfute par un fait du scénario, jamais par un fait introduit dans la rationale.** Si la rationale doit inventer une contrainte pour écarter une option, l'option n'est pas écartée : l'item a deux réponses.

---

## Ce que tu livres

Deux fichiers, rien d'autre.

**`questions.json`** — les items : `id`, `enabler`, `difficulty`, `prompt`, `options`, `answer_index`, `rationale`, en FR et EN.

**`plans.json`** — pour chaque item, le plan de décision renseigné en tête de ce prompt.

Le reste — mapping, manifeste, empreintes, mesures — est produit par script à partir de ces deux fichiers.

Si un item t'a résisté, dis-le en une phrase à la fin. C'est une information utile, pas un aveu.
