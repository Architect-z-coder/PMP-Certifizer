"""Tests du mapping questions → tâches ECO officielles (étape 2).

INDÉPENDANTS du produit : chargent uniquement le canonique, le mapping et
les banques. N'importent ni pmp.js, ni AREA_DOMAIN, ni l'ancien crosswalk.

Vérifient les INVARIANTS (couverture, validité, gel du texte, cohérence des
domaines) — jamais la justesse du jugement, qui relève de la contre-
vérification (seconde IA, décision Zoubir 15/07/2026).
"""
import glob
import hashlib
import json
import os

BASE = os.path.join(os.path.dirname(__file__), "..")
CAN = os.path.join(BASE, "reference", "pmp_eco_2026_canonical.json")
MAP = os.path.join(BASE, "reference", "question_eco_mapping.json")
DATA = os.path.join(BASE, "app", "data")


def _bank_ids():
    ids = []
    for f in sorted(glob.glob(os.path.join(DATA, "*.json"))):
        d = json.load(open(f, encoding="utf-8"))
        ids += [it["id"] for it in (d["items"] if isinstance(d, dict) else d)]
    return ids


def test_couverture_150_sur_150_sans_orpheline():
    m = json.load(open(MAP, encoding="utf-8"))["mappings"]
    bank = set(_bank_ids())
    assert len(bank) == 150
    assert set(m) == bank, (f"non mappées: {sorted(bank - set(m))[:5]} | "
                            f"fantômes: {sorted(set(m) - bank)[:5]}")


def test_taches_valides_et_domaines_coherents():
    can = json.load(open(CAN, encoding="utf-8"))
    dom = {t["id"]: t["domain"] for t in can["tasks"]}
    m = json.load(open(MAP, encoding="utf-8"))["mappings"]
    for qid, e in m.items():
        assert e["eco_primary_task"] in dom, (qid, e["eco_primary_task"])
        assert e["eco_domain"] == dom[e["eco_primary_task"]], qid
        for s in e.get("eco_secondary_tasks", []):
            assert s in dom, (qid, s)
            assert s != e["eco_primary_task"], f"{qid}: secondaire = primaire"


def test_gel_du_texte_des_banques():
    """Le mapping porte l'empreinte de chaque banque au moment du réaudit.
    Si une banque change, ce test casse : le mapping doit être ré-examiné."""
    frozen = json.load(open(MAP, encoding="utf-8"))["_meta"]["text_freeze_proof_sha256"]
    for f in sorted(glob.glob(os.path.join(DATA, "*.json"))):
        name = os.path.basename(f)
        actual = hashlib.sha256(open(f, "rb").read()).hexdigest()
        assert name in frozen, f"banque non gelée au réaudit : {name}"
        assert actual == frozen[name], f"{name} a changé depuis le réaudit — remapper"


def test_statut_proposition_explicite():
    meta = json.load(open(MAP, encoding="utf-8"))["_meta"]
    assert "PROPOSITION" in meta["status"], "le mapping ne doit jamais se présenter comme validé"
    assert meta["doctrinal_choices"], "les choix doctrinaux doivent rester visibles"
