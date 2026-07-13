"""Adaptive mastery math — mirrors the prototype.

mastery score: EWMA, recent answers weigh more (alpha = 0.4)
priority:      exam_weight(area) x (1 - mastery)
exam_weight:   v45 — poids ECO 2026 RÉELS (People 33 / Process 41 / Business Env. 26),
               répartis entre les zones de chaque domaine.
               AVANT : nombre de processus PMBOK 6 / 49 — ce qui sur-priorisait
               Process (71 % au lieu de 41 %) et sous-priorisait Business
               Environment (14 % au lieu de 26 %, alors qu'il a TRIPLÉ à l'examen).
"""

from typing import Optional

ALPHA = 0.4
RESULT_VALUE = {"correct": 1.0, "partial": 0.5, "incorrect": 0.0}

# 10 knowledge areas with their PMBOK 6 process counts (sum = 49)
KA = [
    {"id": "integration", "fr": "Intégration", "en": "Integration", "n": 7},
    {"id": "scope", "fr": "Périmètre", "en": "Scope", "n": 6},
    {"id": "schedule", "fr": "Échéancier", "en": "Schedule", "n": 6},
    {"id": "cost", "fr": "Coûts", "en": "Cost", "n": 4},
    {"id": "quality", "fr": "Qualité", "en": "Quality", "n": 3},
    {"id": "resource", "fr": "Ressources", "en": "Resource", "n": 6},
    {"id": "comms", "fr": "Communications", "en": "Communications", "n": 3},
    {"id": "risk", "fr": "Risques", "en": "Risk", "n": 7},
    {"id": "procurement", "fr": "Approvisionnement", "en": "Procurement", "n": 3},
    {"id": "stakeholder", "fr": "Parties prenantes", "en": "Stakeholder", "n": 4},
]
KA_IDS = [k["id"] for k in KA]
KA_BY_ID = {k["id"]: k for k in KA}
TOTAL_N = sum(k["n"] for k in KA)  # 49


def apply_result(prev_score: float, prev_attempts: int, result: str):
    v = RESULT_VALUE.get(result, 0.0)
    score = v if prev_attempts == 0 else prev_score + ALPHA * (v - prev_score)
    return score, prev_attempts + 1


def light(score: float, attempts: int) -> str:
    if attempts == 0:
        return "untested"
    if score < 0.5:
        return "red"
    if score < 0.75:
        return "amber"
    return "green"


def recommend(mastery_map: dict, only: Optional[set] = None):
    """La zone à travailler en priorité : poids ECO x (1 - maîtrise).

    v45 — parcourt TOUTES les zones (10 classiques + 13 ECO natives), et pondère
    par les poids ECO 2026 réels. Avant, seules les 10 zones PMBOK étaient
    considérées, avec un poids issu du décompte de processus PMBOK 6.

    `only` : restreindre aux zones qui ont réellement des questions.
    """
    best, best_p = None, -1.0
    for a in ALL_AREAS:
        if only is not None and a["id"] not in only:
            continue
        m = mastery_map.get(a["id"])
        mastery = m["score"] if m and m["attempts"] > 0 else 0.0
        p = eco_weight(a["id"]) * (1.0 - mastery)
        if p > best_p:
            best_p, best = p, a
    return best


# ---------------------------------------------------------------------------
# Wave 17 — the adaptive engine additions (difficulty, freshness, SR, readiness)
# ---------------------------------------------------------------------------

# Rule C — difficulty targeting: which difficulties suit a given mastery level.
def difficulties_for(score: float, attempts: int) -> list[int]:
    if attempts == 0 or score < 0.5:
        return [1, 2]          # foundations
    if score < 0.75:
        return [2]             # consolidation
    return [3]                 # exam-level scenarios


# Rule D — spaced repetition intervals (days) by the stage just completed.
SR_INTERVALS_DAYS = {0: 1, 1: 3, 2: 7}   # stage 0->+1d, 1->+3d, 2->+7d, then resolved
SR_MAX_STAGE = 3


# Decay / maintenance — non-punitive. Stored score is never reduced; we derive a
# recency confidence from how long ago the area was last practiced.
def recency_confidence(days_since: Optional[float]) -> float:
    if days_since is None:
        return 1.0
    if days_since <= 7:
        return 1.00
    if days_since <= 14:
        return 0.95
    if days_since <= 30:
        return 0.88
    return 0.80


def stale_level(days_since: Optional[float]) -> str:
    if days_since is None:
        return "fresh"
    if days_since <= 7:
        return "fresh"
    if days_since <= 14:
        return "watch"
    if days_since <= 30:
        return "stale"
    return "critical"


def effective_mastery(score: float, days_since: Optional[float]) -> float:
    return round(score * recency_confidence(days_since), 4)


# Readiness — average mastery weighted by the REAL 2026 ECO domain weights.
# Maps each knowledge area / quiz-area to its ECO domain.
DOMAIN_WEIGHT = {"people": 0.33, "process": 0.41, "business": 0.26}

# area id -> ECO domain. KAs + the non-KA quiz areas introduced in waves 14-15.
AREA_DOMAIN = {
    # People
    "pe_vision": "people", "pe_conflict": "people", "pe_lead": "people",
    "pe_performance": "people", "pe_negotiation": "people", "pe_knowledge": "people",
    "stakeholder": "people", "comms": "people",
    # Process
    "integration": "process", "scope": "process", "schedule": "process",
    "cost": "process", "quality": "process", "resource": "process",
    "procurement": "process", "pr_value": "process",
    # Business Environment
    "risk": "business", "be_governance": "business", "be_compliance": "business",
    "be_improvement": "business", "be_orgchange": "business", "be_value": "business",
    "be_external": "business",
}


# ---------------------------------------------------------------------------
# v45 — Zones ECO natives (celles où vit le contenu écrit POUR l'ECO 2026).
# Elles existaient dans AREA_DOMAIN mais n'étaient PAS dans KA : le moteur ne
# pouvait donc jamais les recommander. 38 questions sur 135 étaient invisibles
# pour la recommandation. Corrigé ici.
# ---------------------------------------------------------------------------
ECO_AREAS = [
    # People
    {"id": "pe_vision", "fr": "Vision & confiance", "en": "Vision & trust"},
    {"id": "pe_conflict", "fr": "Gestion des conflits", "en": "Conflict management"},
    {"id": "pe_lead", "fr": "Diriger l'équipe", "en": "Lead the team"},
    {"id": "pe_performance", "fr": "Performance de l'équipe", "en": "Team performance"},
    {"id": "pe_negotiation", "fr": "Négociation & consensus", "en": "Negotiation & consensus"},
    {"id": "pe_knowledge", "fr": "Transfert des connaissances", "en": "Knowledge transfer"},
    # Process
    {"id": "pr_value", "fr": "Livraison par la valeur", "en": "Value delivery"},
    # Business Environment
    {"id": "be_governance", "fr": "Gouvernance", "en": "Governance"},
    {"id": "be_compliance", "fr": "Conformité & durabilité", "en": "Compliance & sustainability"},
    {"id": "be_improvement", "fr": "Amélioration continue", "en": "Continuous improvement"},
    {"id": "be_orgchange", "fr": "Changement organisationnel", "en": "Organisational change"},
    {"id": "be_value", "fr": "Valeur & bénéfices", "en": "Value & benefits"},
    {"id": "be_external", "fr": "Environnement externe (IA, ESG)", "en": "External environment (AI, ESG)"},
]

# Toutes les zones que le moteur peut recommander : les 10 classiques + les 13 ECO.
ALL_AREAS = KA + ECO_AREAS
ALL_AREA_IDS = [a["id"] for a in ALL_AREAS]
ALL_AREA_BY_ID = {a["id"]: a for a in ALL_AREAS}


def eco_weight(area_id: str) -> float:
    """Poids d'examen d'une zone, dérivé des poids ECO 2026 RÉELS.

    Le poids du domaine (33 / 41 / 26) est réparti entre ses zones. La somme des
    poids d'un domaine redonne donc exactement son poids ECO — ce que l'ancien
    calcul (processus PMBOK 6 / 49) ne faisait pas du tout.
    """
    dom = AREA_DOMAIN.get(area_id)
    if not dom:
        return 0.0
    n_in_dom = sum(1 for a in ALL_AREA_IDS if AREA_DOMAIN.get(a) == dom)
    return DOMAIN_WEIGHT[dom] / n_in_dom if n_in_dom else 0.0

READINESS_LABELS = [
    (0.85, "exam_ready", "Prêt·e pour l'examen", "Exam-ready"),
    (0.70, "close", "Presque prêt·e", "Close"),
    (0.50, "building", "En construction", "Building"),
    (0.0, "not_ready", "Pas encore prêt·e", "Not ready"),
]


def readiness_label(score: float):
    for cut, code, fr, en in READINESS_LABELS:
        if score >= cut:
            return {"code": code, "fr": fr, "en": en}
    return {"code": "not_ready", "fr": "Pas encore prêt·e", "en": "Not ready"}


def readiness_from_masteries(rows: list[dict]) -> dict:
    """rows: [{area, score, attempts}]. Returns weighted readiness + per-domain averages.
    Domains with no attempts count as 0 so readiness reflects real coverage."""
    by_domain = {"people": [], "process": [], "business": []}
    for r in rows:
        dom = AREA_DOMAIN.get(r["area"])
        if dom and r.get("attempts", 0) > 0:
            by_domain[dom].append(r["score"])
    dom_avg = {d: (sum(v) / len(v) if v else 0.0) for d, v in by_domain.items()}
    score = sum(dom_avg[d] * DOMAIN_WEIGHT[d] for d in DOMAIN_WEIGHT)
    return {
        "score": round(score, 4),
        "label": readiness_label(score),
        "domains": {d: {"score": round(dom_avg[d], 4), "weight": DOMAIN_WEIGHT[d]} for d in DOMAIN_WEIGHT},
    }
