"""Génère docs/pmp-eco-2026-reference.md depuis le référentiel canonique.

⚠️ Le Markdown est un ARTEFACT GÉNÉRÉ — la source de vérité est
backend/reference/pmp_eco_2026_canonical.json. Ne jamais éditer le .md à la main.

Usage :  python3 backend/reference/generate_reference_md.py
"""
import json
import os

HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))

canonical = json.load(open(os.path.join(HERE, "pmp_eco_2026_canonical.json"), encoding="utf-8"))
policy = json.load(open(os.path.join(HERE, "certifizer_eco_design_policy.json"), encoding="utf-8"))
tr = policy["certifizer_translations_fr"]

L = []
m = canonical["_meta"]
L.append("# PMP Examination Content Outline — Juillet 2026 · Référence")
L.append("")
L.append("> ⚠️ **Document GÉNÉRÉ** depuis `backend/reference/pmp_eco_2026_canonical.json` — ne pas éditer à la main.")
L.append(f"> Source : {m['source_url']} · récupéré le {m['retrieved_at']} · SHA-256 du PDF : "
         f"{m['pdf_sha256'] or '**à renseigner (vérification humaine)**'}")
L.append(">")
L.append("> Les intitulés officiels sont en **anglais** (`official_title_en`). Les traductions françaises sont")
L.append("> des **traductions Certifizer, non officielles** (`certifizer_translation_fr`).")
L.append(">")
L.append(f"> {m['task_weight_note']}")
L.append("")
L.append("| Domaine | Poids officiel | Tâches |")
L.append("|---|---|---|")
for d in canonical["domains"]:
    L.append(f"| {d['official_title_en']} | {int(d['weight']*100)} % | {d['task_count']} |")
L.append("")
for d in canonical["domains"]:
    L.append(f"## {d['official_title_en']} — {int(d['weight']*100)} % *(p.{d['source_page']}+)*")
    L.append("")
    for t in canonical["tasks"]:
        if t["domain"] != d["id"]:
            continue
        L.append(f"### {t['id']} — {t['official_title_en']}")
        L.append(f"*certifizer_translation_fr : {tr[t['id']]}* · source p.{t['source_page']}")
        L.append("")
        for e in t["enablers"]:
            L.append(f"- {e}")
        L.append("")
out = os.path.join(ROOT, "docs", "pmp-eco-2026-reference.md")
open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
print(f"généré : {out} ({len(L)} lignes)")
