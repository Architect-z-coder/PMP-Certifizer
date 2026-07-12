"""v40 — Portrait d'apprentissage.

Trois idées, toutes déterministes (aucun appel LLM) :

1. DÉPENDANCES entre domaines. Les domaines PMP ne s'apprennent pas côte à côte :
   ils s'appuient les uns sur les autres. Première cartographie, basée sur les
   enchaînements les plus établis du PMBOK. Volontairement simple et modifiable
   ici, sans toucher au reste du code.

2. CHEMIN CRITIQUE. Dans un réseau de dépendances, le chemin critique est la
   chaîne la plus « coûteuse ». Ici, le coût d'un domaine = ce qu'il reste à
   acquérir (1 - score), pondéré par son poids à l'examen. Le chemin critique
   est donc la chaîne de domaines qui commande réellement la date de réussite :
   travailler ailleurs ne l'avance pas. C'est vrai, pas décoratif.

3. PROJECTION. À partir des instantanés hebdomadaires, on estime la date
   d'atteinte du seuil. Jamais une promesse : une projection, avec garde-fous
   (pas assez d'historique → on ne projette pas ; progression nulle ou négative
   → on ne projette pas non plus).
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from .mastery import KA_BY_ID, KA_IDS

# ----------------------------------------------------------------------
# 1. Dépendances entre domaines (première cartographie — à affiner)
# ----------------------------------------------------------------------
# "X dépend de [A, B]" = pour bien tenir X, il faut d'abord tenir A et B.
# Lecture : le périmètre (WBS) précède l'estimation des coûts et de l'échéancier ;
# la valeur acquise (dans les coûts) suppose une ligne de base ; le plan de
# communication suppose l'analyse des parties prenantes ; etc.
DEPENDS_ON: dict[str, list[str]] = {
    "integration":  [],                          # le socle : la charte, le plan
    "scope":        ["integration"],             # on cadre avant de découper
    "schedule":     ["scope"],                   # pas d'échéancier sans WBS
    "cost":         ["scope", "schedule"],       # estimer suppose périmètre + durées
    "quality":      ["scope"],                   # la qualité se juge contre le périmètre
    "resource":     ["schedule"],                # affecter suppose un échéancier
    "stakeholder":  ["integration"],             # identifier tôt
    "comms":        ["stakeholder"],             # le plan de comm découle de l'analyse PP
    "risk":         ["scope", "schedule", "cost"],  # le risque porte sur les 3 contraintes
    "procurement":  ["scope", "risk"],           # acheter suppose périmètre + risques
}

# Poids à l'examen : le nombre de processus par domaine sert de proxy honnête.
def _weight(ka_id: str) -> float:
    k = KA_BY_ID.get(ka_id)
    return float(k["n"]) if k else 1.0


# ----------------------------------------------------------------------
# 2. Chemin critique
# ----------------------------------------------------------------------
def _remaining_cost(ka_id: str, scores: dict[str, float]) -> float:
    """Ce qu'il reste à acquérir sur ce domaine, pondéré par son poids d'examen."""
    s = scores.get(ka_id, 0.0)
    return max(0.0, 1.0 - s) * _weight(ka_id)


def critical_path(scores: dict[str, float]) -> list[str]:
    """La chaîne de dépendances la plus coûteuse — celle qui commande la date.

    On remonte chaque domaine jusqu'à ses racines, on somme le reste-à-faire de
    la chaîne, et on garde la plus lourde. Mémoïsé : le graphe est petit et acyclique.
    """
    best_chain: dict[str, tuple[float, list[str]]] = {}

    def chain_for(ka: str, seen: Optional[set] = None) -> tuple[float, list[str]]:
        if ka in best_chain:
            return best_chain[ka]
        seen = (seen or set()) | {ka}
        own = _remaining_cost(ka, scores)
        best_cost, best_prefix = 0.0, []
        for dep in DEPENDS_ON.get(ka, []):
            if dep in seen:            # garde-fou anti-cycle
                continue
            c, path = chain_for(dep, seen)
            if c > best_cost:
                best_cost, best_prefix = c, path
        result = (own + best_cost, best_prefix + [ka])
        best_chain[ka] = result
        return result

    heaviest_cost, heaviest = 0.0, []
    for ka in KA_IDS:
        cost, path = chain_for(ka)
        if cost > heaviest_cost:
            heaviest_cost, heaviest = cost, path
    return heaviest


# ----------------------------------------------------------------------
# 3. Lecture interprétative (règles, pas de LLM)
# ----------------------------------------------------------------------
def _state(score: float, attempts: int) -> str:
    if attempts == 0:
        return "untouched"          # vous attend
    if score >= 0.70:
        return "acquired"
    if score >= 0.45:
        return "in_progress"
    return "fragile"


def reading(scores: dict[str, float], attempts: dict[str, int], lang: str = "fr") -> str:
    """Interprète le chemin critique en une phrase utile. Toujours honnête."""
    # Carte vierge : rien à interpréter, on invite simplement à commencer.
    if not any(attempts.get(k, 0) > 0 for k in KA_IDS):
        return ("Votre carte commence tout juste. Répondez à quelques questions et elle prendra forme."
                if lang != "en" else
                "Your map is just beginning. Answer a few questions and it will take shape.")

    path = critical_path(scores)
    if not path:
        return ("Votre carte commence tout juste. Répondez à quelques questions et elle prendra forme."
                if lang != "en" else
                "Your map is just beginning. Answer a few questions and it will take shape.")

    def name(k):
        return KA_BY_ID[k]["fr" if lang != "en" else "en"]

    # Le maillon faible du chemin critique = celui au plus faible score.
    weakest = min(path, key=lambda k: scores.get(k, 0.0))
    w_state = _state(scores.get(weakest, 0.0), attempts.get(weakest, 0))

    # Ses appuis (déjà solides ?) et ce qui en dépend.
    supports = [d for d in DEPENDS_ON.get(weakest, []) if scores.get(d, 0.0) >= 0.70]
    downstream = [k for k, deps in DEPENDS_ON.items() if weakest in deps]

    if lang == "en":
        if w_state == "untouched":
            s = f"The chain that governs your date runs through **{name(weakest)}**, which you haven't started yet. It's the next door to open."
        else:
            s = f"Your weakest link on the critical chain is **{name(weakest)}**."
        if supports:
            s += f" It rests on {', '.join(name(x) for x in supports)}, which you already hold — so the ground is solid."
        if downstream:
            s += f" Strengthen it and {', '.join(name(x) for x in downstream)} will follow."
        s += " Order matters more than volume."
        return s

    if w_state == "untouched":
        s = f"La chaîne qui commande votre date passe par **{name(weakest)}**, que vous n'avez pas encore abordé. C'est la prochaine porte à ouvrir."
    else:
        s = f"Votre maillon le plus faible sur la chaîne critique est **{name(weakest)}**."
    if supports:
        s += f" Il s'appuie sur {', '.join(name(x) for x in supports)}, que vous maîtrisez déjà — le terrain est solide."
    if downstream:
        s += f" Renforcez-le et {', '.join(name(x) for x in downstream)} suivra."
    s += " C'est l'ordre qui compte, pas le volume."
    return s


# ----------------------------------------------------------------------
# 4. Projection (honnête, avec garde-fous)
# ----------------------------------------------------------------------
TARGET = 0.80          # seuil visé
MIN_POINTS = 3         # en dessous, on ne projette pas


def projection(snapshots: list[dict], lang: str = "fr") -> dict:
    """snapshots = [{"at": datetime, "readiness": float}, …] triés par date.

    Renvoie {"enough": bool, "note": str, ...}. Ne projette JAMAIS sans base
    suffisante, et ne projette pas si la progression est nulle ou négative :
    une fausse promesse coûte plus cher qu'une absence de projection.
    """
    if len(snapshots) < MIN_POINTS:
        return {"enough": False,
                "note": ("Votre trajectoire se dessine. Encore quelques séances et une projection sera possible."
                         if lang != "en" else
                         "Your trajectory is taking shape. A few more sessions and a projection becomes possible.")}

    first, last = snapshots[0], snapshots[-1]
    current = float(last["readiness"])
    if current >= TARGET:
        return {"enough": True, "reached": True, "current": current,
                "note": ("Vous avez atteint le seuil visé. Maintenez-le : la rétention se travaille aussi."
                         if lang != "en" else
                         "You've reached the target. Now hold it — retention needs work too.")}

    days = max(1.0, (last["at"] - first["at"]).total_seconds() / 86400.0)
    weeks = days / 7.0
    gain = current - float(first["readiness"])
    per_week = gain / weeks if weeks > 0 else 0.0

    if per_week <= 0.001:
        return {"enough": True, "reached": False, "current": current, "per_week": per_week,
                "note": ("Votre progression marque une pause. Une séance sur le chemin critique la relancera."
                         if lang != "en" else
                         "Your progress has paused. One session on the critical path will restart it.")}

    remaining = TARGET - current
    weeks_left = remaining / per_week
    eta = datetime.now(timezone.utc) + timedelta(weeks=weeks_left)

    return {
        "enough": True, "reached": False,
        "current": current,
        "per_week": per_week,
        "remaining_points": round(remaining * 100),
        "weeks_left": round(weeks_left, 1),
        "eta": eta.isoformat(),
        "note": ("Projection calculée sur votre rythme réel — ce n'est pas une promesse. "
                 "Elle se recalcule à chaque séance, et se rapproche quand vous travaillez le chemin critique."
                 if lang != "en" else
                 "Projected from your real pace — not a promise. It recalculates every session, "
                 "and moves closer when you work the critical path."),
    }
