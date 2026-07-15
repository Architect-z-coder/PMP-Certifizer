"""v47 — le moteur pense dans les 26 tâches officielles. Tests.

Couvre notamment :
- la reproduction de l'EXPLOIT confirmé par l'audit (une seule zone parfaite
  donnait 100 % de son domaine, soit readiness 41 %) et sa correction ;
- les trois natures de rattachement (direct / closest_fit / secondaire) ;
- le composeur : les questions ECO natives entrent enfin dans « Ma préparation » ;
- la robustesse sur PE6 (0 question) ;
- la cohérence readiness entre apprenant, cockpit et portrait (même fonction).
"""
import os

import pytest

from datetime import datetime, timedelta  # noqa: E402

sqlmodel = pytest.importorskip("sqlmodel")
from fastapi.testclient import TestClient  # noqa: E402

from app import eco  # noqa: E402
from app.models import Attempt, engine, init_db  # noqa: E402
from app.seed import load_item_banks  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    init_db()
    load_item_banks()
    with TestClient(app) as c:
        yield c


def _att(lid, qid, result, at=None):
    return Attempt(learner_id=lid, knowledge_area="", item_external_id=qid,
                   result=result, created_at=at or datetime.utcnow())


# ---------- unité : module eco ----------

def test_26_taches_et_poids():
    assert len(eco.ECO_TASKS) == 26
    for dom, w in (("people", 0.33), ("process", 0.41), ("business", 0.26)):
        s = sum(eco.task_weight(t["id"]) for t in eco.ECO_TASKS if t["domain"] == dom)
        assert abs(s - w) < 1e-9, (dom, s)


def test_natures_de_rattachement():
    # direct : pleine contribution, compte pour la couverture
    c = eco.contributions("sh-x-6.5-01")
    assert ("PR8", 1.0, True) in c
    # closest_fit : demi-contribution, ne compte PAS pour la couverture
    c = eco.contributions("int-d2-07")
    assert ("PR1", 0.5, False) in c
    # secondaire : quart, pas de couverture
    c = eco.contributions("pe-x-PE.1-02")  # PE8 primaire ; PE2, PE3 secondaires
    assert ("PE8", 1.0, True) in c
    assert ("PE2", 0.25, False) in c and ("PE3", 0.25, False) in c


def test_replay_ewma_et_couverture():
    t0 = datetime(2026, 7, 1)
    st = eco.replay_task_mastery([
        _att("x", "sh-x-6.5-01", "correct", t0),
        _att("x", "sh-x-6.5-02", "incorrect", t0 + timedelta(hours=1)),
    ])
    pr8 = st["PR8"]
    assert pr8["direct_attempts"] == 2 and pr8["attempts"] == 2
    # 1er : score = 1.0 ; 2e : 1.0 + 0.4*(0.0-1.0) = 0.6
    assert abs(pr8["score"] - 0.6) < 1e-9
    assert pr8["last_practiced_at"] == t0 + timedelta(hours=1)


def test_closest_fit_ne_prouve_pas_la_couverture():
    st = eco.replay_task_mastery([_att("x", "int-d2-07", "correct")])
    pr1 = st["PR1"]
    assert pr1["attempts"] == 1 and pr1["direct_attempts"] == 0
    assert pr1["score"] > 0  # contribue à la maîtrise…
    r = eco.readiness_from_tasks(st)
    assert r["domains"]["process"]["covered_tasks"] == 0  # …mais pas à la couverture


def test_exploit_de_l_audit_corrige():
    """AVANT v47 : une seule zone Process parfaite -> domaine 100 %, readiness 41 %.
    APRÈS : une tâche parfaite sur 10 -> domaine 10 %, readiness ≈ 4,1 %."""
    st = eco.replay_task_mastery([_att("x", "sc-x-5.4-01", "correct")])  # PR2 parfait
    r = eco.readiness_from_tasks(st)
    assert abs(r["domains"]["process"]["score"] - 0.1) < 1e-9
    assert abs(r["score"] - 0.041) < 1e-9
    assert r["domains"]["process"]["coverage"] == "1/10"


# ---------- endpoints ----------

def test_readiness_endpoint_leviers_officiels(client):
    r = client.get("/api/readiness", params={"learner_id": "neuf"}).json()
    assert r["readiness"]["score"] == 0.0
    lever_ids = {l["area"] for l in r["top_levers"]}
    assert lever_ids <= set(eco.TASK_IDS)
    # les libellés sont les tâches officielles, pas les anciennes zones
    prs = [l for l in r["top_levers"] if l["area"] == "PR2"]
    if prs:
        assert prs[0]["en"] == "Develop and manage project scope"


def test_eco_mastery_endpoint(client):
    r = client.get("/api/eco/mastery", params={"learner_id": "neuf"}).json()
    assert r["task_count"] == 26 and len(r["tasks"]) == 26
    assert r["covered_tasks"] == 0
    assert "hypothèse" in r["note"]


def test_composeur_sert_les_taches_eco_natives(client):
    """Le défaut confirmé par les revues : 0 question ECO native sur ~1000
    composées. v47 : les tâches BE/PE natives entrent dans « Ma préparation »."""
    domains_seen, be_native = set(), 0
    for i in range(12):
        s = client.get("/api/session/next",
                       params={"learner_id": f"frais-{i}", "size": 10}).json()
        assert s["size"] > 0
        for it in s["items"]:
            t = eco.primary_task_of(it["external_id"])
            assert t is not None
            domains_seen.add(eco.TASK_BY_ID[t]["domain"])
            if t in ("BE1", "BE2", "BE5", "BE6", "BE7", "BE8", "BE4"):
                be_native += 1
    assert domains_seen == {"people", "process", "business"}
    assert be_native > 0, "aucune question BE native composée — régression v46/v47"


def test_composeur_robuste_sur_taches_vides(client):
    """PE6 a 0 question : le composeur doit l'ignorer sans erreur ni trou."""
    s = client.get("/api/session/next", params={"learner_id": "vide", "size": 10}).json()
    assert s["size"] == 10


def test_readiness_coherent_apprenant_portrait(client):
    lid = "coherence-1"
    with sqlmodel.Session(engine) as s:
        s.add(_att(lid, "sc-x-5.4-01", "correct"))
        s.add(_att(lid, "be-x-BE.5-03", "correct"))
        s.commit()
        s.close()
    r1 = client.get("/api/readiness", params={"learner_id": lid}).json()["readiness"]["score"]
    r2 = client.get("/api/portrait", params={"learner_id": lid}).json()
    p_readiness = r2.get("readiness", {})
    val = p_readiness.get("score", p_readiness) if isinstance(p_readiness, dict) else p_readiness
    assert abs(float(val) - r1) < 1e-6, "portrait et apprenant doivent voir le MÊME readiness"
