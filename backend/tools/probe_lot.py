"""Sonde de résolvabilité d'un lot Certifizer.

Répond à UNE question que les contrôles de forme ne savent pas poser :

    la bonne réponse est-elle trouvable autrement que par le raisonnement ?

Trois sondes :

  --forme     (hors ligne, sans API)
              Mesure les indices de forme : longueur, densité d'éléments,
              marqueurs lexicaux, unicité de traits. Ne juge rien, compte.

  --options   (API)
              Présente les QUATRE OPTIONS SEULES, sans le scénario, à un
              solveur neuf. S'il trouve mieux que le hasard (25 %), un indice
              de forme existe — quelle que soit la dimension. C'est le test
              qui remplace la course aux tells.

  --aveugle   (API)
              Présente scénario + options, sans réponse ni justification.
              Un item que le solveur rate en désignant toujours le même
              distracteur est un candidat « seconde bonne réponse ».

Usage :
    python3 probe_lot.py <lot|zip> --forme
    python3 probe_lot.py <lot|zip> --options --n 3
    python3 probe_lot.py <lot|zip> --aveugle
    python3 probe_lot.py <lot|zip> --forme --options --aveugle --json rapport.json

L'API exige ANTHROPIC_API_KEY dans l'environnement.
Code retour : 0 si aucune sonde ne dépasse son seuil, 1 sinon.
"""
import argparse
import json
import os
import random
import re
import sys
import tempfile
import urllib.error
import urllib.request
import zipfile
from collections import Counter

MODELE = "claude-sonnet-4-6"
HASARD = 0.25

# Seuils. Volontairement peu nombreux.
SEUIL_OPTIONS = 0.40      # au-dessus = indice de forme exploitable
SEUIL_UNIQUE_DENSE = 0.30  # bonne réponse seule la plus dense
SEUIL_ECART = 1.0          # écart moyen d'éléments bonne réponse vs distracteurs

MARQUEURS = [
    r"\buniquement\b", r"\btoujours\b", r"\bjamais\b", r"\bautomatiquement\b",
    r"\bimm[ée]diatement\b", r"\bdiscr[èe]tement\b", r"sans informer", r"\bignorer\b",
    r"\bcontourner\b", r"\bonly\b", r"\balways\b", r"\bnever\b", r"\bautomatically\b",
    r"\bimmediately\b", r"\bquietly\b", r"without informing", r"\bignore\b", r"\bbypass\b",
]


# ---------------------------------------------------------------- chargement

def charger(chemin):
    """Rend (nom_du_lot, [items]). Accepte un dossier ou un zip."""
    tmp = None
    if chemin.endswith(".zip"):
        tmp = tempfile.mkdtemp()
        with zipfile.ZipFile(chemin) as z:
            z.extractall(tmp)
        for racine, _, fichiers in os.walk(tmp):
            if "questions.json" in fichiers:
                chemin = racine
                break
        else:
            sys.exit("questions.json introuvable dans l'archive.")

    fq = os.path.join(chemin, "questions.json")
    if not os.path.exists(fq):
        sys.exit(f"questions.json introuvable dans {chemin}")
    brut = json.load(open(fq, encoding="utf-8"))
    items = brut if isinstance(brut, list) else brut.get("questions", brut.get("items", []))
    return os.path.basename(chemin.rstrip("/")), items


def langues(item):
    """Rend {langue: (options, index_reponse)} — gère mono et bilingue."""
    opts = item["options"]
    rep = item["answer_index"]
    if isinstance(opts, dict):
        return {lg: (ol, rep[lg] if isinstance(rep, dict) else rep) for lg, ol in opts.items()}
    return {"—": (opts, rep)}


def texte(o):
    return o if isinstance(o, str) else json.dumps(o, ensure_ascii=False)


def enonce(item, lg):
    p = item.get("prompt")
    if isinstance(p, dict):
        return p.get(lg) or next(iter(p.values()))
    return p


# ------------------------------------------------------------ sonde de forme

def elements(s):
    """Nombre d'éléments énumérés dans une option."""
    return len([x for x in re.split(r",|\bet\b|\bpuis\b|\band\b|\bthen\b|;", s) if x.strip()])


def sonde_forme(items):
    par_langue = {}
    for item in items:
        for lg, (ol, ai) in langues(item).items():
            t = [texte(o) for o in ol]
            longueurs = [len(x) for x in t]
            comps = [elements(x) for x in t]
            autres = [c for i, c in enumerate(comps) if i != ai]

            d = par_langue.setdefault(lg, {
                "n": 0, "plus_longue": 0, "seule_plus_dense": 0,
                "marqueur": 0, "ecarts": [], "traits_uniques": [],
            })
            d["n"] += 1
            if longueurs.index(max(longueurs)) == ai:
                d["plus_longue"] += 1
            if comps[ai] == max(comps) and comps.count(max(comps)) == 1:
                d["seule_plus_dense"] += 1
            d["ecarts"].append(comps[ai] - (sum(autres) / len(autres)))

            bonne = t[ai].lower()
            mauvaises = [x.lower() for i, x in enumerate(t) if i != ai]
            gm = any(re.search(m, bonne) for m in MARQUEURS)
            bm = any(any(re.search(m, x) for m in MARQUEURS) for x in mauvaises)
            if bm and not gm:
                d["marqueur"] += 1

            # trait de forme porté par une seule option
            traits = {
                "condition": lambda s: bool(re.search(r"\bsi\b|\bif\b|\btant que\b|\bunless\b", s, re.I)),
                "cout": lambda s: bool(re.search(r"co[ûu]t|renonc|suspend|abandonn|accept.*gel|forgo|give up", s, re.I)),
                "reserve": lambda s: bool(re.search(r"toutefois|however|bien que|although", s, re.I)),
            }
            for nom, f in traits.items():
                porteurs = [i for i, x in enumerate(t) if f(x)]
                if porteurs == [ai]:
                    d["traits_uniques"].append(nom)
    return par_langue


# ------------------------------------------------------------------- API

def appeler(messages, systeme, max_tokens=300):
    cle = os.environ.get("ANTHROPIC_API_KEY")
    if not cle:
        sys.exit("ANTHROPIC_API_KEY absente de l'environnement.")
    corps = json.dumps({
        "model": MODELE, "max_tokens": max_tokens,
        "system": systeme, "messages": messages,
    }).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages", data=corps,
        headers={"content-type": "application/json", "x-api-key": cle,
                 "anthropic-version": "2023-06-01"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            d = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"API {e.code} : {e.read().decode()[:300]}")
    return "".join(b.get("text", "") for b in d.get("content", []) if b.get("type") == "text")


def lire_lettre(reponse, n=4):
    m = re.search(r"\b([A-D])\b", reponse.upper())
    return "ABCD".index(m.group(1)) if m and "ABCD".index(m.group(1)) < n else None


SYS_OPTIONS = (
    "Tu vois quatre options d'une question à choix multiple, sans l'énoncé. "
    "Devine laquelle est la bonne réponse. Tu n'as aucun contexte : appuie-toi sur "
    "ce que tu peux. Réponds par une seule lettre : A, B, C ou D. Rien d'autre."
)

SYS_AVEUGLE = (
    "Tu passes un examen PMP. Lis le scénario et choisis la meilleure réponse. "
    "Réponds par la lettre, puis en une phrase le fait du scénario qui a décidé "
    "ton choix. Format : 'B — <fait décisif>'."
)


def sonde_options(items, repetitions=1, langue=None):
    """Options seules, ordre mélangé. Doit rester proche du hasard."""
    res = []
    for item in items:
        lgs = langues(item)
        lg = langue if langue in lgs else next(iter(lgs))
        ol, ai = lgs[lg]
        t = [texte(o) for o in ol]
        justes = 0
        for _ in range(repetitions):
            ordre = list(range(len(t)))
            random.shuffle(ordre)
            bloc = "\n".join(f"{'ABCD'[p]}. {t[o]}" for p, o in enumerate(ordre))
            c = lire_lettre(appeler([{"role": "user", "content": bloc}], SYS_OPTIONS, 10), len(t))
            if c is not None and ordre[c] == ai:
                justes += 1
        res.append({"id": item.get("id"), "taux": justes / repetitions})
    return res


def sonde_aveugle(items, langue=None):
    """Scénario + options, sans réponse. Repère les items non résolubles."""
    res = []
    for item in items:
        lgs = langues(item)
        lg = langue if langue in lgs else next(iter(lgs))
        ol, ai = lgs[lg]
        t = [texte(o) for o in ol]
        bloc = enonce(item, lg) + "\n\n" + "\n".join(f"{'ABCD'[i]}. {x}" for i, x in enumerate(t))
        rep = appeler([{"role": "user", "content": bloc}], SYS_AVEUGLE, 200)
        c = lire_lettre(rep, len(t))
        res.append({
            "id": item.get("id"), "attendu": ai, "choisi": c,
            "juste": c == ai, "motif": rep.strip()[:180],
        })
    return res


# ---------------------------------------------------------------- affichage

def pc(x):
    return f"{round(100 * x)} %"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lot")
    ap.add_argument("--forme", action="store_true")
    ap.add_argument("--options", action="store_true")
    ap.add_argument("--aveugle", action="store_true")
    ap.add_argument("--n", type=int, default=1, help="répétitions de la sonde options")
    ap.add_argument("--langue", default=None)
    ap.add_argument("--json", dest="sortie")
    a = ap.parse_args()

    if not (a.forme or a.options or a.aveugle):
        a.forme = True

    nom, items = charger(a.lot)
    rapport = {"lot": nom, "items": len(items)}
    alertes = 0

    print(f"\n{'=' * 68}\n  SONDE DE RÉSOLVABILITÉ — {nom}  ({len(items)} items)\n{'=' * 68}")

    if a.forme:
        print("\n  FORME (hors ligne)")
        rapport["forme"] = {}
        for lg, d in sonde_forme(items).items():
            n = d["n"]
            ecart = sum(d["ecarts"]) / n
            uniques = Counter(d["traits_uniques"])
            bloc = {
                "plus_longue": d["plus_longue"] / n,
                "seule_plus_dense": d["seule_plus_dense"] / n,
                "marqueur_lexical": d["marqueur"] / n,
                "ecart_moyen_elements": round(ecart, 2),
                "traits_portes_par_la_seule_bonne_reponse": dict(uniques),
            }
            rapport["forme"][lg] = bloc
            print(f"    [{lg}] bonne réponse la plus longue      {pc(bloc['plus_longue'])}")
            print(f"    [{lg}] bonne réponse seule la plus dense {pc(bloc['seule_plus_dense'])}"
                  + ("   ⚠︎" if bloc["seule_plus_dense"] > SEUIL_UNIQUE_DENSE else ""))
            print(f"    [{lg}] marqueur lexical éliminatoire     {pc(bloc['marqueur_lexical'])}")
            print(f"    [{lg}] écart moyen d'éléments            {ecart:+.2f}"
                  + ("   ⚠︎" if abs(ecart) > SEUIL_ECART else ""))
            if uniques:
                print(f"    [{lg}] traits portés par la seule bonne réponse : "
                      + ", ".join(f"{k}×{v}" for k, v in uniques.items()))
            if bloc["seule_plus_dense"] > SEUIL_UNIQUE_DENSE or abs(ecart) > SEUIL_ECART:
                alertes += 1

    if a.options:
        print(f"\n  OPTIONS SEULES (hasard = {pc(HASARD)}, seuil = {pc(SEUIL_OPTIONS)})")
        res = sonde_options(items, a.n, a.langue)
        taux = sum(r["taux"] for r in res) / len(res)
        rapport["options_seules"] = {"taux": round(taux, 3), "detail": res}
        print(f"    taux de réussite sans scénario : {pc(taux)}"
              + ("   ⚠︎  indice de forme exploitable" if taux > SEUIL_OPTIONS else "   ok"))
        devines = [r["id"] for r in res if r["taux"] == 1.0]
        if devines:
            print(f"    devinés à tous les coups : {', '.join(devines[:8])}"
                  + (" …" if len(devines) > 8 else ""))
        if taux > SEUIL_OPTIONS:
            alertes += 1

    if a.aveugle:
        print("\n  RÉSOLUTION AVEUGLE (scénario + options, sans la réponse)")
        res = sonde_aveugle(items, a.langue)
        justes = sum(1 for r in res if r["juste"])
        rapport["aveugle"] = {"taux": round(justes / len(res), 3), "detail": res}
        print(f"    résolus : {justes}/{len(res)} = {pc(justes / len(res))}")
        rates = [r for r in res if not r["juste"]]
        if rates:
            print("    items ratés — candidats seconde bonne réponse ou énoncé ambigu :")
            for r in rates:
                print(f"      {r['id']}  attendu {'ABCD'[r['attendu']]}, "
                      f"choisi {'ABCD'[r['choisi']] if r['choisi'] is not None else '?'}")
                print(f"        {r['motif']}")

    print(f"\n{'-' * 68}")
    print("  RÉSULTAT : aucune sonde au-dessus de son seuil" if not alertes
          else f"  RÉSULTAT : {alertes} sonde(s) au-dessus du seuil")
    print("  Les sondes ne jugent pas le fond. Elles disent si la réponse")
    print("  est trouvable sans raisonner.")
    print(f"{'=' * 68}\n")

    if a.sortie:
        json.dump(rapport, open(a.sortie, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
        print(f"  rapport écrit : {a.sortie}\n")

    sys.exit(1 if alertes else 0)


if __name__ == "__main__":
    main()
