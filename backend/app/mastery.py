"""Adaptive mastery math — mirrors the prototype.

mastery score: EWMA, recent answers weigh more (alpha = 0.4)
priority:      exam_weight(area) x (1 - mastery)
exam_weight:   PMBOK 6 process count per area / 49  (proxy; refine with real ECO weights)
"""

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
