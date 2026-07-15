"""Tests du référentiel canonique ECO 2026 — INDÉPENDANTS du produit.

Règle absolue : ces tests chargent EXCLUSIVEMENT
backend/reference/pmp_eco_2026_canonical.json. Ils n'importent ni pmp.js,
ni AREA_DOMAIN, ni le crosswalk historique, ni le mapping du moteur.
Un test qui vérifie le produit contre lui-même ne vérifie rien
(leçon du 15/07/2026 : le crosswalk et son test partageaient la même erreur).

Les SENTINELLES SÉMANTIQUES figent les intitulés qui auraient détecté
l'erreur de taxonomie (People 4-6 décalées, BE4 absente, valeur classée BE).

Usage :  cd backend && PYTHONPATH=$PWD python3 -m pytest tests/test_eco_canonical.py -q
"""
import json
import os

CANONICAL_PATH = os.path.join(os.path.dirname(__file__), "..", "reference",
                              "pmp_eco_2026_canonical.json")


def _load():
    return json.load(open(CANONICAL_PATH, encoding="utf-8"))


def test_structure_domaines_et_taches():
    c = _load()
    assert len(c["domains"]) == 3
    assert len(c["tasks"]) == 26
    per = {d["id"]: 0 for d in c["domains"]}
    for t in c["tasks"]:
        per[t["domain"]] += 1
    assert per == {"PEOPLE": 8, "PROCESS": 10, "BUSINESS_ENVIRONMENT": 8}
    for d in c["domains"]:
        assert d["task_count"] == per[d["id"]]


def test_ids_uniques():
    c = _load()
    ids = [t["id"] for t in c["tasks"]]
    assert len(set(ids)) == 26, "identifiants de tâches non uniques"


def test_poids_officiels():
    c = _load()
    w = {d["id"]: d["weight"] for d in c["domains"]}
    assert w == {"PEOPLE": 0.33, "PROCESS": 0.41, "BUSINESS_ENVIRONMENT": 0.26}
    assert abs(sum(w.values()) - 1.0) < 1e-9


def test_aucune_tache_sans_enabler_et_provenance():
    c = _load()
    for t in c["tasks"]:
        assert t["enablers"], f"{t['id']} : aucun enabler"
        assert isinstance(t.get("source_page"), int), f"{t['id']} : provenance (page) absente"
        assert all(isinstance(e, str) and e.strip() for e in t["enablers"]), f"{t['id']} : enabler vide"


def test_aucun_knowledge_area_dans_le_canonique():
    """Le canonique ne doit porter AUCUNE trace du modèle historique du produit."""
    raw = open(CANONICAL_PATH, encoding="utf-8").read()
    assert "knowledge_area" not in raw
    assert "pmbok_ref" not in raw
    # aucune zone d'interface héritée
    for legacy in ("be_governance", "pe_vision", "pr_value", "integration\"", "comms"):
        assert legacy not in raw, f"zone héritée présente dans le canonique : {legacy}"


def test_aucun_poids_par_tache_presente_comme_officiel():
    c = _load()
    for t in c["tasks"]:
        assert "weight" not in t, f"{t['id']} porte un poids — PMI n'en publie pas par tâche"
    assert "task_weight_note" in c["_meta"], "la note d'absence de poids par tâche doit être explicite"


def test_sentinelles_semantiques():
    """TOUS les intitulés officiels, figés (dérogation 15/07 : pas de vérification
    humaine — ces sentinelles sont le seul filet ; ne JAMAIS assouplir)."""
    c = _load()
    titles = {t["id"]: t["official_title_en"] for t in c["tasks"]}
    assert titles == {
        "PE1": "Develop a common vision", "PE2": "Manage conflicts",
        "PE3": "Lead the project team", "PE4": "Engage stakeholders",
        "PE5": "Align stakeholder expectations", "PE6": "Manage stakeholder expectations",
        "PE7": "Help ensure knowledge transfer", "PE8": "Plan and manage communication",
        "PR1": "Develop an integrated project management plan and plan delivery",
        "PR2": "Develop and manage project scope", "PR3": "Help ensure value-based delivery",
        "PR4": "Plan and manage resources", "PR5": "Plan and manage procurement",
        "PR6": "Plan and manage finance", "PR7": "Plan and optimize quality of products/deliverables",
        "PR8": "Plan and manage schedule", "PR9": "Evaluate project status",
        "PR10": "Manage project closure",
        "BE1": "Define and establish project governance", "BE2": "Plan and manage project compliance",
        "BE3": "Manage and control changes", "BE4": "Remove impediments and manage issues",
        "BE5": "Plan and manage risk", "BE6": "Continuous improvement",
        "BE7": "Support organizational change", "BE8": "Evaluate external business environment changes",
    }


def test_markdown_est_genere_et_synchrone():
    """Le .md doit exister et provenir du canonique (sentinelles présentes, avertissement généré)."""
    md_path = os.path.join(os.path.dirname(CANONICAL_PATH), "..", "..",
                           "docs", "pmp-eco-2026-reference.md")
    assert os.path.exists(md_path), "docs/pmp-eco-2026-reference.md absent — lancer generate_reference_md.py"
    md = open(md_path, encoding="utf-8").read()
    assert "Document GÉNÉRÉ" in md
    for probe in ("Remove impediments and manage issues", "Align stakeholder expectations",
                  "Help ensure value-based delivery", "Evaluate project status"):
        assert probe in md, f"le .md a divergé du canonique : {probe} absent"
    assert "certifizer_translation_fr" in md, "les traductions doivent être étiquetées non officielles"
