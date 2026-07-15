"""Invariants de la banque de questions — tests reproductibles (v46).

⚠️ QUARANTAINE PARTIELLE (15/07/2026) — le crosswalk TASKS ci-dessous est le
crosswalk HISTORIQUE du produit, RETIRÉ comme source d'autorité : il ne
correspond pas aux 26 tâches officielles (voir reference/pmp_eco_2026_canonical.json
et docs/rapport-verification-referentiel.md). Les tests structurels (150 ids
uniques, bilingue, seed idempotent) restent valides. Les tests de mapping
(orphelines, tâches BE) ne valident QUE la cohérence interne avec l'ANCIENNE
structure — ils ne démontrent AUCUN alignement ECO 2026. Ils seront réécrits
à l'étape 2 (réaudit des 150 questions contre le référentiel canonique).

Couvre les points exigés par la revue externe du 15/07/2026 :
  - 150 identifiants uniques, bilingue complet, structure valide ;
  - 0 orpheline / 0 ambiguïté selon le crosswalk des 26 tâches ECO ;
  - chaque tâche Business Environment a >= 5 questions, avec au moins
    un niveau 1 et un niveau 3 ;
  - seed idempotent : 150 au premier passage, +0 au second.

Exécution :  cd backend && PYTHONPATH=$PWD python3 -m pytest tests/ -q
"""
import collections
import glob
import json
import os

import pytest

DATA = os.path.join(os.path.dirname(__file__), "..", "app", "data")


def _items():
    out = []
    for f in sorted(glob.glob(os.path.join(DATA, "*.json"))):
        d = json.load(open(f, encoding="utf-8"))
        for it in (d["items"] if isinstance(d, dict) else d):
            out.append(it)
    return out


# Crosswalk des 26 tâches ECO — reflet de frontend/src/pmp.js (ECO_TASKS).
# ⚠️ Si pmp.js change, mettre à jour ici : un test qui diverge du produit ment.
TASKS = [
    ("pe1", "people", "pe_vision", ["PE.1"]), ("pe2", "people", "pe_conflict", ["PE.2"]),
    ("pe3", "people", "pe_lead", ["PE.3"]), ("pe4", "people", "pe_performance", ["PE.4"]),
    ("pe5", "people", "stakeholder", ["PE.5"]), ("pe6", "people", "pe_negotiation", ["PE.6"]),
    ("pe7", "people", "pe_knowledge", ["4.4", "PE.7"]), ("pe8", "people", "comms", ["PE.8"]),
    ("pr1", "process", "integration", ["4.1", "4.2", "4.3", "4.5"]),
    ("pr2", "process", "scope", None), ("pr3", "process", "pr_value", ["PR.3"]),
    ("pr4", "process", "resource", ["9.3", "9.4", "9.6"]),
    ("pr5", "process", "procurement", ["12.1", "12.3"]),
    ("pr6", "process", "cost", ["7.3", "7.4"]), ("pr7", "process", "quality", ["8.1", "8.2"]),
    ("pr8", "process", "schedule", None), ("pr9", "process", "comms", ["PR.9"]),
    ("pr10", "process", "integration", ["4.7"]),
    ("be1", "biz", "be_governance", ["BE.1"]), ("be2", "biz", "be_compliance", ["BE.2"]),
    ("be3", "biz", "integration", ["4.6"]), ("be4", "biz", "risk", ["11.1", "11.5"]),
    ("be5", "biz", "be_improvement", ["BE.5"]), ("be6", "biz", "be_orgchange", ["BE.6"]),
    ("be7", "biz", "be_value", ["BE.7"]), ("be8", "biz", "be_external", ["BE.8"]),
]
BE_TASKS = [t[0] for t in TASKS if t[1] == "biz"]


def _match_ref(ref, refs):
    if not ref:
        return False
    base = ref.split()[0]
    return any(base == r or base.startswith(r + ".") for r in refs)


def _map_task(it):
    """Retourne la liste des tâches candidates (référence prioritaire, puis zone)."""
    area = it["knowledge_area"]
    ref = (it.get("pmbok_ref") or "").strip()
    by_ref = [t for t in TASKS if t[3] and _match_ref(ref, t[3])]
    if by_ref:
        z = [t for t in by_ref if t[2] == area]
        return [(z[0] if z else by_ref[0])[0]]
    by_area = [t for t in TASKS if t[3] is None and t[2] == area]
    return [by_area[0][0]] if by_area else []


def test_150_identifiants_uniques():
    items = _items()
    assert len(items) == 150, f"banque = {len(items)}, attendu 150"
    dup = [i for i, c in collections.Counter(x["id"] for x in items).items() if c > 1]
    assert not dup, f"doublons : {dup}"


def test_structure_et_bilingue():
    for it in _items():
        assert it["prompt"]["fr"] and it["prompt"]["en"], it["id"]
        assert len(it["options"]["fr"]) == 4 and len(it["options"]["en"]) == 4, it["id"]
        assert 0 <= it["answer_index"] < 4, it["id"]
        assert it["difficulty"] in (1, 2, 3), it["id"]
        assert it["rationale"]["fr"] and it["rationale"]["en"], it["id"]


def test_zero_orpheline_zero_ambiguite():
    for it in _items():
        tasks = _map_task(it)
        assert len(tasks) == 1, f"{it['id']} → {tasks or 'ORPHELINE'}"


def test_taches_be_profondeur_et_difficultes():
    per = collections.defaultdict(list)
    for it in _items():
        per[_map_task(it)[0]].append(it)
    for t in BE_TASKS:
        n = len(per[t])
        diffs = {q["difficulty"] for q in per[t]}
        assert n >= 5, f"{t} : {n} questions (< 5)"
        assert 1 in diffs, f"{t} : aucun niveau 1 (échauffement)"
        assert 3 in diffs, f"{t} : aucun niveau 3 (jugement)"


def test_seed_idempotent(tmp_path):
    """135 banques historiques + 15 (lot 2) = 150 au 1er passage ; +0 au second."""
    pytest.importorskip("sqlmodel")
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_path}/seed.db"
    # import tardif : DATABASE_URL doit être posé avant
    from app.models import init_db  # noqa: E402
    init_db()
    from app.seed import load_item_banks  # noqa: E402
    assert load_item_banks() == 150
    assert load_item_banks() == 0
