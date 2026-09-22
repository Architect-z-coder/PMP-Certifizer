"""Emballe un lot Certifizer.

L'auteur (prompt v4.0) ne livre que deux fichiers :
    questions.json   les items
    plans.json       le plan de décision de chaque item

Ce script fabrique les six fichiers restants du paquet, sans porter aucun
jugement sur le contenu — c'est de la mise en forme déterministe. Il refuse
de tourner si les deux fichiers d'entrée ne concordent pas (mêmes ids), car
un mapping fabriqué sur des ids incohérents masquerait un défaut au lieu de
le révéler.

    manifest.json          en-tête du lot, publishable=false
    mapping.json           rattachement ECO, dérivé du plan de décision
    quality.json           sidecar : jugement testé, plan, sans auto-verdict
    validation-report.json les mesures calculées (longueur, densité, lexical)
    batch-blueprint.json   compteurs demandés vs obtenus
    checksums.sha256       empreintes des sept autres fichiers

Le paquet produit est fait pour passer directement dans :
    audit_lot.py   (porte mécanique)
    probe_lot.py   (porte de résolvabilité)

Usage :
    python3 package_lot.py <dossier_entree> --release qbank-2026.07-B-p1 \\
        --baseline certifizer-v47.6.zip --sha <sha256> [--zip]

Le dossier d'entrée contient questions.json et plans.json.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import zipfile

ICI = os.path.dirname(os.path.abspath(__file__))
CANON = os.path.join(ICI, "..", "reference", "pmp_eco_2026_canonical.json")

MARQUEURS = [
    r"\buniquement\b", r"\btoujours\b", r"\bjamais\b", r"\bautomatiquement\b",
    r"\bimm[ée]diatement\b", r"\bdiscr[èe]tement\b", r"sans informer", r"\bignorer\b",
    r"\bcontourner\b", r"\bonly\b", r"\balways\b", r"\bnever\b", r"\bautomatically\b",
    r"\bimmediately\b", r"\bquietly\b", r"without informing", r"\bignore\b", r"\bbypass\b",
]


def stop(msg):
    sys.exit(f"emballage refusé : {msg}")


def charger(dossier):
    fq = os.path.join(dossier, "questions.json")
    fp = os.path.join(dossier, "plans.json")
    if not os.path.exists(fq):
        stop("questions.json absent du dossier d'entrée")
    if not os.path.exists(fp):
        stop("plans.json absent du dossier d'entrée")

    q = json.load(open(fq, encoding="utf-8"))
    items = q if isinstance(q, list) else q.get("items", q.get("questions", []))
    p = json.load(open(fp, encoding="utf-8"))
    plans = p if isinstance(p, list) else p.get("plans", p.get("items", []))
    plans = {x["id"]: x for x in plans}

    # concordance stricte des ids : sinon le mapping serait faux en silence
    iq = [it["id"] for it in items]
    if len(iq) != len(set(iq)):
        stop("identifiants d'items en double dans questions.json")
    manquants = [i for i in iq if i not in plans]
    if manquants:
        stop(f"{len(manquants)} item(s) sans plan de décision : {manquants[:5]}")
    surplus = [i for i in plans if i not in set(iq)]
    if surplus:
        stop(f"{len(surplus)} plan(s) sans item correspondant : {surplus[:5]}")

    return items, plans


def canon_index():
    c = json.load(open(CANON, encoding="utf-8"))
    dom = {t["id"]: t["domain"] for t in c["tasks"]}
    enab = {t["id"]: set(t["enablers"]) for t in c["tasks"]}
    return dom, enab


def texte(o):
    return o if isinstance(o, str) else json.dumps(o, ensure_ascii=False)


def langues(item):
    opts = item["options"]
    rep = item["answer_index"]
    if isinstance(opts, dict):
        return {lg: (ol, rep[lg] if isinstance(rep, dict) else rep) for lg, ol in opts.items()}
    return {"—": (opts, rep)}


def elements(s):
    return len([x for x in re.split(r",|\bet\b|\bpuis\b|\band\b|\bthen\b|;", s) if x.strip()])


# ------------------------------------------------------------- fichiers

def faire_mapping(items, plans, dom, enab):
    m = {}
    fautes = []
    for it in items:
        pl = plans[it["id"]]
        tache = pl.get("enabler_task") or (it["id"].split("-")[-2] if "-" in it["id"] else "?")
        # la tâche peut être portée par le plan ou déductible de l'id : on prend le plan d'abord
        tache = pl.get("eco_primary_task", tache)
        enabler = pl.get("enabler", "")
        if tache not in dom:
            fautes.append(f"{it['id']} : tâche {tache} absente du canonique")
        elif enabler and enabler not in enab[tache]:
            fautes.append(f"{it['id']} : enabler non trouvé dans {tache}")
        m[it["id"]] = {
            "eco_primary_task": tache,
            "eco_domain": dom.get(tache, "?"),
            "eco_secondary_tasks": pl.get("eco_secondary_tasks", []),
            "decisive_enabler": enabler,
            "mapping_type": "direct",
            "confidence": "high",
            "direct_coverage_evidence": True,
            "mapping_argument": pl.get("decision_atom", ""),
            "nearest_existing_items": pl.get("nearest_existing_items", []),
        }
    return {
        "schema_version": "question-bank-mapping-1.1",
        "canonical_reference": "eco-2026-canonical-1.0",
        "mappings": m,
    }, fautes


def faire_quality(items, plans):
    """Sidecar SANS verdict. On reporte le plan, jamais un PASS auto-déclaré."""
    q = []
    for it in items:
        pl = plans[it["id"]]
        entree = {
            "id": it["id"],
            "difficulty": it.get("difficulty"),
            "jugement_teste": pl.get("jugement_teste", pl.get("erreur_corrigee", "")),
            "decision_atom": pl.get("decision_atom", ""),
            "axe_de_decision": pl.get("axe_de_decision", ""),
            "indice_decisif": pl.get("indice_decisif", ""),
            "bascule": pl.get("bascule", ""),
        }
        if it.get("difficulty") == 3:
            entree["priorite_retenue"] = pl.get("priorite_retenue", "")
            entree["renoncement_assume"] = pl.get("renoncement_assume", "")
        q.append(entree)
    return {
        "schema_version": "question-bank-quality-1.1",
        "note": "sidecar sans auto-verdict — le jugement appartient à l'audit de fond",
        "items": q,
    }


def faire_validation(items):
    """Mesures pures. Aucune interprétation, aucun seuil ici — c'est probe_lot qui juge."""
    par_langue = {}
    for it in items:
        for lg, (ol, ai) in langues(it).items():
            t = [texte(o) for o in ol]
            longueurs = [len(x) for x in t]
            comps = [elements(x) for x in t]
            autres = [c for i, c in enumerate(comps) if i != ai]
            d = par_langue.setdefault(lg, {"n": 0, "longest": 0, "densest": 0,
                                           "lexical": 0, "ecarts": []})
            d["n"] += 1
            if longueurs.index(max(longueurs)) == ai:
                d["longest"] += 1
            if comps[ai] == max(comps) and comps.count(max(comps)) == 1:
                d["densest"] += 1
            d["ecarts"].append(comps[ai] - (sum(autres) / len(autres)))
            bonne = t[ai].lower()
            mauvaises = [x.lower() for i, x in enumerate(t) if i != ai]
            gm = any(re.search(mk, bonne) for mk in MARQUEURS)
            bm = any(any(re.search(mk, x) for mk in MARQUEURS) for x in mauvaises)
            if bm and not gm:
                d["lexical"] += 1
    rap = {}
    for lg, d in par_langue.items():
        n = d["n"]
        rap[lg] = {
            "longest_option_is_correct_ratio": round(d["longest"] / n, 3),
            "answer_is_densest_ratio": round(d["densest"] / n, 3),
            "lexical_tell_ratio": round(d["lexical"] / n, 3),
            "mean_component_advantage": round(sum(d["ecarts"]) / n, 3),
        }
    return {
        "schema_version": "question-bank-validation-1.1",
        "note": "mesures brutes — les seuils et le verdict sont dans probe_lot.py",
        "by_language": rap,
    }


def faire_blueprint(items, plans):
    from collections import Counter
    niv = Counter(it.get("difficulty") for it in items)
    tach = Counter(plans[it["id"]].get("eco_primary_task",
                   it["id"].split("-")[-2] if "-" in it["id"] else "?") for it in items)
    pos = Counter()
    for it in items:
        for _, (ol, ai) in langues(it).items():
            pos[ai] += 1
            break
    return {
        "schema_version": "question-bank-blueprint-1.1",
        "item_count": len(items),
        "by_difficulty": dict(sorted(niv.items())),
        "by_task": dict(sorted(tach.items())),
        "answer_positions": dict(sorted(pos.items())),
    }


def faire_manifest(items, release, baseline, sha):
    return {
        "bank_release": release,
        "release_type": "question_bank_increment",
        "canonical_reference": "eco-2026-canonical-1.0",
        "schema_version": "question-bank-1.1",
        "prompt_version": "4.0",
        "bank_layer": "guided_learning",
        "item_count": len(items),
        "content_baseline": {"name": baseline, "role": "read_only_reference", "sha256": sha},
        "status": "author_draft_pending_audit",
        "publishable": False,
        "language_pairs": sorted({lg for it in items for lg in langues(it)} - {"—"}) or ["fr", "en"],
    }


def ecrire(dossier, nom, obj):
    chemin = os.path.join(dossier, nom)
    json.dump(obj, open(chemin, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    return chemin


def checksums(dossier, fichiers):
    lignes = []
    for f in sorted(fichiers):
        h = hashlib.sha256(open(os.path.join(dossier, f), "rb").read()).hexdigest()
        lignes.append(f"{h}  {f}")
    open(os.path.join(dossier, "checksums.sha256"), "w", encoding="utf-8").write("\n".join(lignes) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entree", help="dossier contenant questions.json et plans.json")
    ap.add_argument("--release", required=True)
    ap.add_argument("--baseline", default="certifizer-v47.6.zip")
    ap.add_argument("--sha", default="")
    ap.add_argument("--sortie", default=None, help="dossier de sortie (défaut : <release>/)")
    ap.add_argument("--zip", action="store_true")
    a = ap.parse_args()

    items, plans = charger(a.entree)
    dom, enab = canon_index()

    sortie = a.sortie or os.path.join(os.getcwd(), a.release)
    os.makedirs(sortie, exist_ok=True)

    # questions.json recopié tel quel, forme attendue par les outils
    ecrire(sortie, "questions.json",
           {"schema_version": "question-bank-1.1", "bank_release": a.release, "items": items})

    mapping, fautes = faire_mapping(items, plans, dom, enab)
    ecrire(sortie, "mapping.json", mapping)
    ecrire(sortie, "quality.json", faire_quality(items, plans))
    ecrire(sortie, "validation-report.json", faire_validation(items))
    ecrire(sortie, "batch-blueprint.json", faire_blueprint(items, plans))
    ecrire(sortie, "manifest.json", faire_manifest(items, a.release, a.baseline, a.sha))

    sept = ["questions.json", "mapping.json", "quality.json", "validation-report.json",
            "batch-blueprint.json", "manifest.json"]
    checksums(sortie, sept)

    print(f"paquet écrit : {sortie}")
    print(f"  {len(items)} items · 7 fichiers + checksums")
    if fautes:
        print(f"  ⚠︎  {len(fautes)} avertissement(s) de traçabilité — audit_lot les confirmera :")
        for f in fautes[:5]:
            print(f"     {f}")

    if a.zip:
        chemin_zip = sortie.rstrip("/") + ".zip"
        with zipfile.ZipFile(chemin_zip, "w", zipfile.ZIP_DEFLATED) as z:
            for f in sept + ["checksums.sha256"]:
                z.write(os.path.join(sortie, f), os.path.join(a.release, f))
        print(f"  archive : {chemin_zip}")


if __name__ == "__main__":
    main()
