"""Détecteur de doublons pour la banque de questions Certifizer.

Un vrai doublon = énoncé proche ET bonne réponse proche.
(La seule similarité d'énoncé produit des faux positifs : les questions de
niveau 1 partagent un moule « Quelle est la sortie de X ? » sans être des
doublons, puisque leurs réponses diffèrent.)

Usage :
    # contrôle de la banque publiée
    python3 backend/tools/detect_duplicates.py

    # contrôle d'un lot reçu CONTRE la banque publiée + contre lui-même
    python3 backend/tools/detect_duplicates.py chemin/vers/questions.json

Seuils (calibrés sur les 150 publiées, juillet 2026) :
    ROUGE  énoncé ≥ 0.55 ET réponse ≥ 0.50  → doublon probable, à traiter
    ORANGE énoncé ≥ 0.40 ET réponse ≥ 0.35  → à examiner
"""
import glob
import itertools
import json
import os
import re
import sys

ROUGE = (0.55, 0.50)
ORANGE = (0.40, 0.35)

_STOP = set("""le la les un une des du de et ou a à au aux en dans pour par sur avec sans que qui
est sont ce cette ces il elle vous votre son sa ses leur leurs plus pas ne se lui nous notre
doit doivent faire fait plus moins tout tous toute toutes autre autres""".split())


def _norm(text):
    text = text.lower()
    text = re.sub(r"[^a-zàâçéèêëîïôûùüÿñæœ0-9 ]", " ", text)
    return set(w for w in text.split() if len(w) > 3 and w not in _STOP)


def _jaccard(a, b):
    union = len(a | b)
    return len(a & b) / union if union else 0.0


def _load(path):
    d = json.load(open(path, encoding="utf-8"))
    return d["items"] if isinstance(d, dict) else d


def _fingerprints(items):
    """id -> (mots de l'énoncé, mots de la bonne réponse)"""
    out = {}
    for it in items:
        prompt = it["prompt"]["fr"] if isinstance(it["prompt"], dict) else it["prompt"]
        opts = it["options"]["fr"] if isinstance(it["options"], dict) else it["options"]
        out[it["id"]] = (_norm(prompt), _norm(opts[it["answer_index"]]))
    return out


def compare(fps_a, fps_b=None):
    """Retourne [(niveau, sim_énoncé, sim_réponse, id1, id2)] trié."""
    hits = []
    pairs = (itertools.combinations(fps_a.items(), 2) if fps_b is None
             else itertools.product(fps_a.items(), fps_b.items()))
    for (i1, (p1, r1)), (i2, (p2, r2)) in pairs:
        if i1 == i2:
            continue
        sp, sr = _jaccard(p1, p2), _jaccard(r1, r2)
        if sp >= ROUGE[0] and sr >= ROUGE[1]:
            hits.append(("ROUGE", round(sp, 3), round(sr, 3), i1, i2))
        elif sp >= ORANGE[0] and sr >= ORANGE[1]:
            hits.append(("ORANGE", round(sp, 3), round(sr, 3), i1, i2))
    hits.sort(key=lambda h: (h[0] != "ROUGE", -h[1]))
    return hits


def published_items():
    base = os.path.join(os.path.dirname(__file__), "..", "app", "data")
    items = []
    for f in sorted(glob.glob(os.path.join(base, "*.json"))):
        items += _load(f)
    return items


def main():
    pub = _fingerprints(published_items())
    if len(sys.argv) > 1:
        lot = _fingerprints(_load(sys.argv[1]))
        print(f"Lot : {len(lot)} questions · banque publiée : {len(pub)}\n")
        intra = compare(lot)
        contre = compare(lot, pub)
        print(f"--- doublons INTRA-LOT ({len(intra)}) ---")
        for h in intra:
            print("   ", h)
        print(f"\n--- doublons CONTRE LA BANQUE PUBLIÉE ({len(contre)}) ---")
        for h in contre:
            print("   ", h)
        rouges = sum(1 for h in intra + contre if h[0] == "ROUGE")
        print(f"\n=> {rouges} ROUGE(S). "
              + ("LOT BLOQUÉ tant qu'ils ne sont pas traités." if rouges else "Aucun doublon probable."))
        return 1 if rouges else 0
    hits = compare(pub)
    print(f"Banque publiée : {len(pub)} questions\n")
    for h in hits:
        print("   ", h)
    print(f"\n=> {sum(1 for h in hits if h[0] == 'ROUGE')} ROUGE(S)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
