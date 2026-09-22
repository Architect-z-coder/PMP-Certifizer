"""Audit mécanique d'un lot de banque Certifizer.

Enchaîne les 9 contrôles de réception et rend un verdict GO / BLOQUÉ.
Ne juge PAS le fond (seconde bonne réponse, niveau 3, omnibus) : cela reste
l'affaire de l'audit adversarial en session neuve.

Usage :
    python3 backend/tools/audit_lot.py chemin/vers/qbank-2026.MM-X/
    python3 backend/tools/audit_lot.py lot.zip
    python3 backend/tools/audit_lot.py <lot> --json rapport.json

Sortie : rapport lisible + code retour 0 (GO) ou 1 (BLOQUÉ).
"""
import glob
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(HERE, "..")
sys.path.insert(0, HERE)
from detect_duplicates import _fingerprints, compare, published_items  # noqa: E402

SEUIL_LONGUEUR = 0.40
TERMES_BANNIS = ["répétition espacée", "repetition espacee", "spaced repetition"]


class Rapport:
    def __init__(self):
        self.lignes = []
        self.bloquants = 0
        self.avertissements = 0

    def ok(self, nom, detail=""):
        self.lignes.append(("OK", nom, detail))

    def bloque(self, nom, detail=""):
        self.lignes.append(("BLOQUANT", nom, detail))
        self.bloquants += 1

    def alerte(self, nom, detail=""):
        self.lignes.append(("ALERTE", nom, detail))
        self.avertissements += 1

    def json_contrat(self):
        """Rapport strictement lisible par l'orchestrateur.
        Un contrôle mécanique en échec = REJET (structurel, non négociable).
        Ce script ne mesure PAS le taux de défaut de fond : il rend 0.0 et
        laisse ce champ à l'auditeur. Il ne s'auto-déclare jamais conforme
        au-delà de ce qu'il a calculé."""
        cats = [nom for statut, nom, _ in self.lignes if statut == "BLOQUANT"]
        items = [f"{nom} : {detail}" for statut, nom, detail in self.lignes
                 if statut == "BLOQUANT"]
        return {
            "verdict": "REJET" if self.bloquants else "GO",
            "taux_defaut": 0.0,
            "categories_defauts": cats,
            "items_defectueux": items,
            "avertissements": [nom for statut, nom, _ in self.lignes if statut == "ALERTE"],
            "resume": (f"{self.bloquants} contrôle(s) mécanique(s) en échec"
                       if self.bloquants else "porte mécanique franchie"),
        }

    def afficher(self, lot):
        print(f"\n{'=' * 72}\n  AUDIT MÉCANIQUE — {lot}\n{'=' * 72}")
        for statut, nom, detail in self.lignes:
            marque = {"OK": "  ok  ", "ALERTE": " ⚠︎    ", "BLOQUANT": " ✗    "}[statut]
            print(f"{marque}{nom}")
            if detail:
                for l in str(detail).split("\n"):
                    print(f"        {l}")
        print(f"{'-' * 72}")
        if self.bloquants:
            print(f"  VERDICT : BLOQUÉ — {self.bloquants} contrôle(s) en échec"
                  + (f", {self.avertissements} alerte(s)" if self.avertissements else ""))
        else:
            print("  VERDICT : GO MÉCANIQUE"
                  + (f" — {self.avertissements} alerte(s) à examiner" if self.avertissements else "")
                  + "\n  → passer à l'audit adversarial de fond, EN SESSION NEUVE.")
        print(f"{'=' * 72}\n")


def _charger(dossier):
    """Retourne (items, mappings, manifest) ou lève."""
    q = os.path.join(dossier, "questions.json")
    m = os.path.join(dossier, "mapping.json")
    d = json.load(open(q, encoding="utf-8"))
    items = d["items"] if isinstance(d, dict) else d
    mappings = json.load(open(m, encoding="utf-8"))["mappings"]
    manifest = {}
    mp = os.path.join(dossier, "manifest.json")
    if os.path.exists(mp):
        manifest = json.load(open(mp, encoding="utf-8"))
    return items, mappings, manifest


def auditer(dossier, attendu=None):
    r = Rapport()
    items, mappings, manifest = _charger(dossier)
    ids = [it["id"] for it in items]

    # 1 — checksums
    cs = os.path.join(dossier, "checksums.sha256")
    if os.path.exists(cs):
        mauvais = []
        for ligne in open(cs, encoding="utf-8"):
            ligne = ligne.strip()
            if not ligne:
                continue
            parts = ligne.replace("*", " ").split()
            if len(parts) < 2:
                continue
            somme, nom = parts[0], parts[-1]
            chemin = os.path.join(dossier, os.path.basename(nom))
            if not os.path.exists(chemin):
                mauvais.append(f"{nom} : absent")
            elif hashlib.sha256(open(chemin, "rb").read()).hexdigest() != somme:
                mauvais.append(f"{nom} : empreinte différente")
        r.bloque("1. Checksums", "\n".join(mauvais)) if mauvais else r.ok(
            "1. Checksums", f"tous les fichiers listés sont intègres")
    else:
        r.alerte("1. Checksums", "checksums.sha256 absent du paquet")

    # 2 — biais de longueur
    detail = []
    depasse = False
    for lang in ("fr", "en"):
        n = plus_long = 0
        for it in items:
            opts = it["options"][lang] if isinstance(it["options"], dict) else it["options"]
            longueurs = [len(o) for o in opts]
            n += 1
            if longueurs[it["answer_index"]] == max(longueurs):
                plus_long += 1
        ratio = plus_long / n if n else 0
        detail.append(f"{lang} : bonne réponse = la plus longue {plus_long}/{n} = {ratio:.0%}")
        if ratio > SEUIL_LONGUEUR:
            depasse = True
    (r.bloque if depasse else r.ok)("2. Biais de longueur (seuil 40 %)", "\n".join(detail))

    # 3 — compteurs, quotas, difficultés, positions
    par_tache, difficultes, positions = {}, {}, {}
    for it in items:
        t = mappings.get(it["id"], {}).get("eco_primary_task", "?")
        par_tache[t] = par_tache.get(t, 0) + 1
        difficultes[it["difficulty"]] = difficultes.get(it["difficulty"], 0) + 1
        positions[it["answer_index"]] = positions.get(it["answer_index"], 0) + 1
    detail = [f"items : {len(items)}" + (f" (commandé : {attendu})" if attendu else ""),
              f"tâches : {dict(sorted(par_tache.items()))}",
              f"difficultés : {dict(sorted(difficultes.items()))}",
              f"positions : {dict(sorted(positions.items()))}"]
    if attendu and len(items) != attendu:
        r.bloque("3. Compteurs", "\n".join(detail))
    else:
        # position dominante ?
        if positions and max(positions.values()) > 0.45 * len(items):
            r.alerte("3. Compteurs", "\n".join(detail) + "\n⚠︎ une position de réponse domine (>45 %)")
        else:
            r.ok("3. Compteurs", "\n".join(detail))

    # 4 — unicité + collisions
    pub_ids = {it["id"] for it in published_items()}
    doublons_internes = [i for i in set(ids) if ids.count(i) > 1]
    collisions = sorted(set(ids) & pub_ids)
    if doublons_internes or collisions:
        r.bloque("4. Unicité des ids",
                 f"doublons internes : {doublons_internes}\ncollisions avec la banque : {collisions}")
    else:
        r.ok("4. Unicité des ids", f"{len(set(ids))} ids distincts, aucune collision")

    # 5 — traçabilité au canonique
    canon = json.load(open(os.path.join(BACKEND, "reference", "pmp_eco_2026_canonical.json"),
                           encoding="utf-8"))
    enablers = {t["id"]: set(t["enablers"]) for t in canon["tasks"]}
    domaines = {t["id"]: t["domain"] for t in canon["tasks"]}
    fautes = []
    for qid, e in mappings.items():
        tache = e.get("eco_primary_task")
        if tache not in enablers:
            fautes.append(f"{qid} : tâche inconnue « {tache} »")
            continue
        ed = e.get("decisive_enabler")
        if not ed:
            fautes.append(f"{qid} : decisive_enabler absent")
        elif ed not in enablers[tache]:
            fautes.append(f"{qid} : l'enabler ne figure pas dans {tache}")
        if e.get("eco_domain") and e["eco_domain"] != domaines[tache]:
            fautes.append(f"{qid} : domaine incohérent")
    (r.bloque if fautes else r.ok)("5. Traçabilité au canonique",
                                   "\n".join(fautes[:8]) if fautes else f"{len(mappings)}/{len(mappings)} enablers vérifiés")

    # 6 — parité bilingue
    fautes = []
    for it in items:
        for champ in ("prompt", "rationale"):
            v = it.get(champ, {})
            if not (isinstance(v, dict) and v.get("fr") and v.get("en")):
                fautes.append(f"{it['id']} : {champ} incomplet")
        o = it.get("options", {})
        if not (isinstance(o, dict) and len(o.get("fr", [])) == len(o.get("en", [])) == 4):
            fautes.append(f"{it['id']} : options non appariées (4 attendues)")
    (r.bloque if fautes else r.ok)("6. Parité bilingue",
                                   "\n".join(fautes[:8]) if fautes else f"{len(items)}/{len(items)} items complets FR+EN")

    # 7 — termes bannis
    trouves = []
    for it in items:
        blob = json.dumps(it, ensure_ascii=False).lower()
        for t in TERMES_BANNIS:
            if t in blob:
                trouves.append(f"{it['id']} : « {t} »")
    (r.bloque if trouves else r.ok)("7. Termes bannis",
                                    "\n".join(trouves) if trouves else "aucun")

    # 8 — quarantaine
    pub = manifest.get("publishable", manifest.get("status"))
    if manifest.get("publishable") is True:
        r.bloque("8. Quarantaine", "publishable est à true — un lot non audité ne doit jamais être publiable")
    else:
        r.ok("8. Quarantaine", f"publishable : {manifest.get('publishable', 'absent')} · statut : {manifest.get('status', '—')}")

    # 9 — doublons
    fp_lot = _fingerprints(items)
    fp_pub = _fingerprints(published_items())
    intra = [h for h in compare(fp_lot) if h[0] == "ROUGE"]
    contre = [h for h in compare(fp_lot, fp_pub) if h[0] == "ROUGE"]
    oranges = len(compare(fp_lot)) + len(compare(fp_lot, fp_pub)) - len(intra) - len(contre)
    if intra or contre:
        lignes = [f"intra-lot : {h[3]} ≈ {h[4]} (énoncé {h[1]}, réponse {h[2]})" for h in intra]
        lignes += [f"contre la banque : {h[3]} ≈ {h[4]} (énoncé {h[1]}, réponse {h[2]})" for h in contre]
        r.bloque("9. Doublons", "\n".join(lignes))
    else:
        r.ok("9. Doublons", f"aucun doublon probable" + (f" ({oranges} paire(s) ORANGE à examiner)" if oranges else ""))

    return r


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    cible = args[0]
    attendu = None
    for a in sys.argv[1:]:
        if a.startswith("--attendu="):
            attendu = int(a.split("=")[1])

    tmp = None
    if cible.endswith(".zip"):
        tmp = tempfile.mkdtemp()
        zipfile.ZipFile(cible).extractall(tmp)
        trouve = glob.glob(os.path.join(tmp, "**", "questions.json"), recursive=True)
        if not trouve:
            print("questions.json introuvable dans l'archive")
            return 2
        dossier = os.path.dirname(trouve[0])
    else:
        dossier = cible
        if not os.path.exists(os.path.join(dossier, "questions.json")):
            trouve = glob.glob(os.path.join(dossier, "**", "questions.json"), recursive=True)
            if not trouve:
                print("questions.json introuvable")
                return 2
            dossier = os.path.dirname(trouve[0])

    sortie_json = None
    for a in sys.argv[1:]:
        if a.startswith("--json="):
            sortie_json = a.split("=", 1)[1]
        elif a == "--json":
            i = sys.argv.index(a)
            if i + 1 < len(sys.argv):
                sortie_json = sys.argv[i + 1]

    r = auditer(dossier, attendu)
    r.afficher(os.path.basename(os.path.normpath(dossier)))
    if sortie_json:
        json.dump(r.json_contrat(), open(sortie_json, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
    return 1 if r.bloquants else 0


if __name__ == "__main__":
    sys.exit(main())
