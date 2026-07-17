"""v47 — Le moteur pense dans les 26 tâches officielles ECO 2026.

Source de vérité : reference/pmp_eco_2026_canonical.json (faits PMI) +
reference/question_eco_mapping.json (mapping audité, arbitré le 16/07/2026).

Principes (issus de l'audit adversarial et du noyau OJT) :
- La maîtrise par tâche est DÉRIVÉE de l'historique des tentatives (rejeu
  chronologique). Elle n'est jamais stockée ni déclarée : zéro migration,
  impossible à désynchroniser du réel.
- Trois natures de rattachement, à poids distincts :
    primaire 'direct'       -> pleine contribution (alpha)
    primaire 'closest_fit'  -> demi-contribution (alpha/2), ne prouve PAS la couverture
    secondaire              -> quart de contribution (alpha/4), ne prouve pas la couverture
- La COUVERTURE d'une tâche exige au moins une tentative primaire directe.
- Le readiness compte les tâches non couvertes comme 0 (défaut corrigé :
  une seule zone parfaite ne vaut plus 100 % de son domaine).
- La répartition égale du poids de domaine entre ses tâches est une
  HYPOTHÈSE PRODUIT Certifizer — PMI ne publie aucun poids par tâche.
"""
import json
import os
from typing import Optional

from .mastery import ALPHA, RESULT_VALUE, readiness_label

_REF = os.path.join(os.path.dirname(__file__), "..", "reference")

_canonical = json.load(open(os.path.join(_REF, "pmp_eco_2026_canonical.json"), encoding="utf-8"))
_mapping = json.load(open(os.path.join(_REF, "question_eco_mapping.json"), encoding="utf-8"))
_policy = json.load(open(os.path.join(_REF, "certifizer_eco_design_policy.json"), encoding="utf-8"))
_tr = _policy["certifizer_translations_fr"]

# Domaines canoniques -> clés courtes historiques (compatibilité frontend)
_DOM_SHORT = {"PEOPLE": "people", "PROCESS": "process", "BUSINESS_ENVIRONMENT": "business"}
DOMAIN_WEIGHT = {d["id"]: d["weight"] for d in _canonical["domains"]}
DOMAIN_WEIGHT_SHORT = {_DOM_SHORT[k]: v for k, v in DOMAIN_WEIGHT.items()}

ECO_TASKS = [
    {
        "id": t["id"],
        "n": t["n"],
        "domain": _DOM_SHORT[t["domain"]],
        "en": t["official_title_en"],
        "fr": _tr[t["id"]],
    }
    for t in _canonical["tasks"]
]
TASK_BY_ID = {t["id"]: t for t in ECO_TASKS}
TASK_IDS = [t["id"] for t in ECO_TASKS]

_N_IN_DOMAIN = {}
for t in ECO_TASKS:
    _N_IN_DOMAIN[t["domain"]] = _N_IN_DOMAIN.get(t["domain"], 0) + 1


def task_weight(task_id: str) -> float:
    """Poids d'examen d'une tâche = poids officiel du domaine / nb de tâches.
    ⚠️ Répartition intra-domaine = hypothèse produit, pas un poids PMI."""
    t = TASK_BY_ID.get(task_id)
    if not t:
        return 0.0
    return DOMAIN_WEIGHT_SHORT[t["domain"]] / _N_IN_DOMAIN[t["domain"]]


# ---- mapping question -> tâches ------------------------------------------
PRIMARY = {}          # qid -> (task_id, mapping_type)
SECONDARY = {}        # qid -> [task_id, ...]
for qid, e in _mapping["mappings"].items():
    PRIMARY[qid] = (e["eco_primary_task"], e.get("mapping_type", "direct"))
    SECONDARY[qid] = list(e.get("eco_secondary_tasks", []))

# Contribution d'une tentative à la maîtrise d'une tâche, selon la nature.
CONTRIB_DIRECT = 1.0
CONTRIB_CLOSEST_FIT = 0.5
CONTRIB_SECONDARY = 0.25


def contributions(item_external_id: str):
    """[(task_id, poids, compte_pour_la_couverture)] pour une question."""
    out = []
    prim = PRIMARY.get(item_external_id)
    if prim:
        task, mtype = prim
        if mtype == "closest_fit":
            out.append((task, CONTRIB_CLOSEST_FIT, False))
        else:
            out.append((task, CONTRIB_DIRECT, True))
    for s in SECONDARY.get(item_external_id, []):
        out.append((s, CONTRIB_SECONDARY, False))
    return out


# ---- maîtrise par tâche : rejeu chronologique des tentatives ---------------
def replay_task_mastery(attempts: list) -> dict:
    """attempts : itérable d'objets/dicts avec item_external_id, result, created_at
    (DÉJÀ triés chronologiquement). Retourne
    {task_id: {score, attempts, direct_attempts, last_practiced_at}}.
    EWMA identique au moteur zone (ALPHA), pondérée par la nature du rattachement
    (une contribution de poids w applique un pas alpha*w)."""
    state = {t: {"score": 0.0, "attempts": 0, "direct_attempts": 0, "last_practiced_at": None}
             for t in TASK_IDS}
    for a in attempts:
        qid = a["item_external_id"] if isinstance(a, dict) else a.item_external_id
        result = a["result"] if isinstance(a, dict) else a.result
        created = a["created_at"] if isinstance(a, dict) else a.created_at
        if not qid:
            continue
        v = RESULT_VALUE.get(result, 0.0)
        for task, w, counts_coverage in contributions(qid):
            s = state[task]
            if s["attempts"] == 0:
                s["score"] = v  # première trace : la valeur elle-même (comme le moteur zone)
            else:
                s["score"] = s["score"] + (ALPHA * w) * (v - s["score"])
            s["attempts"] += 1
            if counts_coverage:
                s["direct_attempts"] += 1
            s["last_practiced_at"] = created
    return state


def task_mastery_rows(state: dict) -> list[dict]:
    rows = []
    for t in ECO_TASKS:
        s = state[t["id"]]
        rows.append({
            "task": t["id"], "fr": t["fr"], "en": t["en"], "domain": t["domain"],
            "score": round(s["score"], 4), "attempts": s["attempts"],
            "direct_attempts": s["direct_attempts"],
            "covered": s["direct_attempts"] > 0,
            "weight": round(task_weight(t["id"]), 6),
            "last_practiced_at": s["last_practiced_at"],
        })
    return rows


# ---- readiness honnête : la couverture compte -----------------------------
def readiness_from_tasks(state: dict) -> dict:
    """Score de domaine = moyenne sur TOUTES les tâches du domaine, les tâches
    non couvertes comptant 0. Corrige le défaut confirmé par l'audit : une
    seule zone parfaite donnait 100 % du domaine entier."""
    per_dom = {}
    for t in ECO_TASKS:
        s = state[t["id"]]
        val = s["score"] if s["direct_attempts"] > 0 else 0.0
        per_dom.setdefault(t["domain"], []).append((val, s["direct_attempts"] > 0))
    domains = {}
    score = 0.0
    for dom, vals in per_dom.items():
        avg = sum(v for v, _ in vals) / len(vals)
        covered = sum(1 for _, c in vals if c)
        domains[dom] = {"score": round(avg, 4), "weight": DOMAIN_WEIGHT_SHORT[dom],
                        "coverage": f"{covered}/{len(vals)}",
                        "covered_tasks": covered, "task_count": len(vals)}
        score += avg * DOMAIN_WEIGHT_SHORT[dom]
    return {"score": round(score, 4), "label": readiness_label(score), "domains": domains}


def task_priorities(state: dict) -> list[dict]:
    """Priorité = poids de tâche x (1 - maîtrise couverte). Les tâches sans
    couverture directe ont une maîtrise effective de 0 (donc priorité maximale
    à poids égal)."""
    out = []
    for t in ECO_TASKS:
        s = state[t["id"]]
        eff = s["score"] if s["direct_attempts"] > 0 else 0.0
        out.append({"task": t["id"], "fr": t["fr"], "en": t["en"], "domain": t["domain"],
                    "score": round(eff, 4),
                    "priority": round(task_weight(t["id"]) * (1.0 - eff), 6)})
    out.sort(key=lambda x: x["priority"], reverse=True)
    return out


def primary_task_of(item_external_id: str) -> Optional[str]:
    p = PRIMARY.get(item_external_id)
    return p[0] if p else None


def primary_is_direct(item_external_id: str) -> bool:
    p = PRIMARY.get(item_external_id)
    return bool(p) and p[1] != "closest_fit"

# ---- Quarantaine de contenu (gouvernance, 16/07/2026) ----------------------
# Une question n'est visible par l'apprenant QUE si elle est mappée au référentiel
# (donc auditée ECO). Ce n'est PAS de la dégradation gracieuse : une question non
# auditée ne doit atteindre AUCUNE route apprenant. Cycle de vie visé :
#   draft -> mapped -> audited -> approved -> published (seul 'published' est servable)
# Aujourd'hui, "mappée dans question_eco_mapping.json" = publiée. Quand un statut
# explicite existera (Lot A+), ce garde lira ce statut.
PUBLISHED_IDS = frozenset(PRIMARY.keys())


def is_servable(item_external_id: str) -> bool:
    return item_external_id in PUBLISHED_IDS


def servable_filter(items):
    """Filtre une liste d'Item : ne conserve que le contenu publié/audité."""
    return [it for it in items if is_servable(it.external_id)]
