"""Adaptive mastery math — mirrors the prototype.

mastery score: EWMA, recent answers weigh more (alpha = 0.4)
priority:      exam_weight(area) x (1 - mastery)
exam_weight:   PMBOK 6 process count per area / 49  (proxy; refine with real ECO weights)
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


def recommend(mastery_map: dict):
    """mastery_map: {area_id: {'score': float, 'attempts': int}} -> best KA dict."""
    best, best_p = None, -1.0
    for k in KA:
        m = mastery_map.get(k["id"])
        mastery = m["score"] if m and m["attempts"] > 0 else 0.0
        p = (k["n"] / TOTAL_N) * (1.0 - mastery)
        if p > best_p:
            best_p, best = p, k
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
