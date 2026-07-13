"""v41 — Portrait d'apprentissage en HTML autonome (pièce jointe email).

Le composant React vit dans le navigateur ; ici on regénère le même document
côté serveur, en un seul fichier HTML sans dépendance : il s'ouvre partout, et
s'imprime en PDF d'un clic (Ctrl+P). Mêmes données, même lecture, même carte.

Utilisé quand l'apprenant demande la suppression de son compte : on lui envoie
ses données SANS qu'il ait à y penser. Beaucoup de gens suppriment vite et
regrettent plus tard — leur travail leur est rendu d'office.
"""
from datetime import datetime

STATE_COLOR = {"acquired": "#3DA776", "in_progress": "#E89A3C",
               "fragile": "#D2664E", "untouched": None}


def _layout(nodes):
    """Place les domaines par profondeur de dépendance : ce qui est à gauche
    porte ce qui est à droite. Même logique que le composant React."""
    by_id = {n["area"]: n for n in nodes}
    depth = {}

    def d(area, seen=None):
        if area in depth:
            return depth[area]
        seen = (seen or set()) | {area}
        deps = [x for x in by_id.get(area, {}).get("depends_on", []) if x not in seen]
        depth[area] = 1 + max([d(x, seen) for x in deps], default=-1)
        return depth[area]

    for n in nodes:
        d(n["area"])
    cols = {}
    for n in nodes:
        cols.setdefault(depth[n["area"]], []).append(n["area"])
    maxd = max(cols) if cols else 0
    W, H, padX, padY = 780, 300, 54, 34
    colw = (W - padX * 2) / max(1, maxd)
    pos = {}
    for dd, ids in cols.items():
        x = padX + dd * colw
        rowh = (H - padY * 2) / max(1, len(ids))
        for i, a in enumerate(ids):
            pos[a] = (x, padY + rowh * i + rowh / 2)
    return pos


def render_portrait_html(p: dict, name: str, cohort: str, lang: str = "fr") -> str:
    fr = lang != "en"
    nodes = p.get("nodes", [])
    pos = _layout(nodes)
    cp = p.get("critical_path", [])
    cp_edges = {(cp[i], cp[i + 1]) for i in range(len(cp) - 1)}

    L = {
        "eyebrow": "Portrait d'apprentissage" if fr else "Learning portrait",
        "title": ("Ce que vous avez construit —<br>et ce qui vous attend."
                  if fr else "What you've built —<br>and what awaits you."),
        "prep": "Préparation" if fr else "Readiness",
        "acq": "Acquis" if fr else "Acquired",
        "ans": "Réponses" if fr else "Answers",
        "refl": "Réflexes" if fr else "Reflexes",
        "ed": "Édité le" if fr else "Issued",
        "s1": "Votre carte — et votre chemin critique" if fr else "Your map — and your critical path",
        "lead": ("Ces domaines ne s'apprennent pas côte à côte : ils s'appuient les uns sur les autres. "
                 "La chaîne en ambre est celle qui commande réellement votre date de réussite. "
                 "Les zones pâles ne sont pas des trous — ce sont les domaines qui s'allumeront ensuite. "
                 "Votre carte n'est pas incomplète : elle est en cours."
                 if fr else
                 "These areas aren't learned side by side: they rest on one another. The amber chain is the one "
                 "that actually governs your date. The pale zones aren't gaps — they're the areas that will light "
                 "up next. Your map isn't incomplete: it's in progress."),
        "reading": "Lecture" if fr else "Reading",
        "s3": "Face à l'examen réel" if fr else "Against the real exam",
        "s4": "Vos réflexes" if fr else "Your reflexes",
        "s4h": "ce que vous avez décidé de retenir — vos mots" if fr else "what you chose to keep — your words",
        "own": ("Document généré à partir de vos données — elles vous appartiennent."
                if fr else "Generated from your data — it belongs to you."),
        "print": ("Astuce : Ctrl+P (ou ⌘+P) pour enregistrer ce portrait en PDF."
                  if fr else "Tip: Ctrl+P (or ⌘+P) to save this portrait as a PDF."),
        "acqL": "acquis" if fr else "acquired",
        "progL": "en cours" if fr else "in progress",
        "fragL": "fragile" if fr else "fragile",
        "waitL": "vous attend" if fr else "awaits you",
        "cpL": "chemin critique" if fr else "critical path",
        "noRefl": "Aucun réflexe sauvegardé." if fr else "No reflexes saved.",
    }
    label = {"acquired": L["acqL"], "in_progress": L["progL"],
             "fragile": L["fragL"], "untouched": L["waitL"]}

    # ---- liens ----
    links = []
    for n in nodes:
        for dep in n.get("depends_on", []):
            if dep not in pos or n["area"] not in pos:
                continue
            ax, ay = pos[dep]
            bx, by = pos[n["area"]]
            on_cp = (dep, n["area"]) in cp_edges
            future = n["state"] == "untouched"
            color = "#E89A3C" if on_cp else ("#B7C4CF" if future else "#C9D3DC")
            width = 3.2 if on_cp else 1.6
            dash = ' stroke-dasharray="4 4"' if (future and not on_cp) else ""
            links.append(f'<line x1="{ax+44:.0f}" y1="{ay:.0f}" x2="{bx-44:.0f}" y2="{by:.0f}" '
                         f'stroke="{color}" stroke-width="{width}" stroke-linecap="round"{dash}/>')

    # ---- nœuds ----
    boxes = []
    for n in nodes:
        if n["area"] not in pos:
            continue
        x, y = pos[n["area"]]
        fut = n["state"] == "untouched"
        fill = STATE_COLOR[n["state"]]
        nm = n["label"][:12] + "." if len(n["label"]) > 13 else n["label"]
        sub = label[n["state"]] if fut else f"{label[n['state']]} · {round(n['score']*100)}%"
        rect = (f'<rect x="{x-44:.0f}" y="{y-20:.0f}" width="88" height="40" rx="3" '
                + (f'fill="none" stroke="#B7C4CF" stroke-width="1.5" stroke-dasharray="4 3"'
                   if fut else f'fill="{fill}"') + '/>')
        boxes.append(
            f'<g>{rect}'
            f'<text x="{x:.0f}" y="{y-2:.0f}" text-anchor="middle" font-family="Inter,Arial,sans-serif" '
            f'font-size="9.5" font-weight="600" fill="{"#7E8FA0" if fut else "#fff"}">{nm}</text>'
            f'<text x="{x:.0f}" y="{y+10:.0f}" text-anchor="middle" font-family="monospace" '
            f'font-size="7.5" fill="{"#9AA9B6" if fut else "#fff"}">{sub}</text></g>')

    reading = (p.get("reading") or "").replace("**", "")
    eco = p.get("eco", {})

    def eco_card(key, lbl, w):
        v = eco.get(key, 0)
        col = "#3DA776" if v >= 0.70 else ("#E89A3C" if v >= 0.45 else "#D2664E")
        return f'''<div class="ecard">
          <div class="en"><span>{lbl}</span><span>{w} %</span></div>
          <div class="ev" style="color:{col}">{round(v*100)}<span style="font-size:14px">%</span></div>
          <div class="bar"><span style="width:{v*100:.0f}%;background:{col}"></span></div>
        </div>'''

    refl = p.get("reflexes", [])[:4]
    refl_html = "".join(
        f'''<div class="rq"><div class="q">« {x["text"]} »</div>
            <div class="m"><span>{x.get("seat_label","")}</span><span>{(x.get("at") or "")[:10]}</span></div></div>'''
        for x in refl) or f'<div class="rq" style="border-style:dashed;color:#7E8FA0">{L["noRefl"]}</div>'

    return f'''<!DOCTYPE html><html lang="{lang}"><head><meta charset="UTF-8">
<title>Certifizer — {L["eyebrow"]} — {name}</title>
<style>
  body{{font-family:Inter,Arial,Helvetica,sans-serif;background:#0A1422;margin:0;padding:24px 12px;display:flex;justify-content:center;color:#16202E}}
  .sheet{{width:100%;max-width:820px;background:#F7F9FA;border:1px solid #C9D3DC}}
  .cart{{display:flex;background:#0E1A2B;color:#fff;border-bottom:2px solid #E89A3C;flex-wrap:wrap}}
  .cl{{padding:18px 22px;flex:1;min-width:280px}}
  .eyebrow{{font-family:monospace;font-size:9.5px;letter-spacing:2.2px;text-transform:uppercase;color:#E89A3C;margin-bottom:7px}}
  h1{{font-size:24px;line-height:1.15;margin:0;font-weight:700}}
  .who{{color:#9DB0C2;font-size:13px;margin-top:5px}}
  .cr{{display:grid;grid-template-columns:repeat(2,minmax(92px,1fr));border-left:1px solid rgba(255,255,255,.12)}}
  .f{{padding:9px 14px;border-bottom:1px solid rgba(255,255,255,.10);border-right:1px solid rgba(255,255,255,.10)}}
  .f .fl{{font-family:monospace;font-size:8px;letter-spacing:1.3px;text-transform:uppercase;color:#7E93A8;margin-bottom:3px}}
  .f .fv{{font-family:monospace;font-size:13px;font-weight:600}}
  .body{{padding:22px 20px 24px}}
  .band{{margin-bottom:24px}}
  .bt{{display:flex;align-items:baseline;gap:10px;border-bottom:1px solid #C9D3DC;padding-bottom:6px;margin-bottom:12px}}
  .bt h2{{font-size:15px;margin:0;font-weight:600}}
  .bn{{font-family:monospace;font-size:10px;color:#66788A;border:1px solid #C9D3DC;border-radius:3px;padding:1px 6px}}
  .lead{{font-size:13px;line-height:1.6;margin-bottom:12px;max-width:660px}}
  svg{{width:100%;height:auto;display:block}}
  .leg{{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-family:monospace;font-size:10px;color:#66788A}}
  .leg i{{width:9px;height:9px;border-radius:2px;display:inline-block;margin-right:4px;vertical-align:middle}}
  .read{{margin-top:13px;background:#fff;border:1px solid #C9D3DC;border-left:3px solid #E89A3C;padding:12px 14px;font-size:12.8px;line-height:1.65}}
  .read .rl{{font-family:monospace;font-size:9px;letter-spacing:1.4px;text-transform:uppercase;color:#B5701E;margin-bottom:5px}}
  .eco{{display:grid;grid-template-columns:repeat(3,1fr);gap:11px}}
  .ecard{{background:#fff;border:1px solid #C9D3DC;padding:13px 14px}}
  .en{{font-family:monospace;font-size:9px;letter-spacing:1.3px;text-transform:uppercase;color:#66788A;margin-bottom:8px;display:flex;justify-content:space-between}}
  .ev{{font-size:26px;font-weight:700;line-height:1}}
  .bar{{height:5px;background:#E4EAEF;margin-top:10px}}
  .bar span{{display:block;height:100%}}
  .refl{{display:grid;grid-template-columns:1fr 1fr;gap:11px}}
  .rq{{background:#fff;border:1px solid #C9D3DC;padding:14px 15px}}
  .rq .q{{font-size:13px;line-height:1.55;color:#0E1A2B;font-weight:500}}
  .rq .m{{font-family:monospace;font-size:9px;color:#66788A;margin-top:9px;padding-top:8px;border-top:1px solid #E4EAEF;display:flex;justify-content:space-between;gap:8px}}
  .foot{{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:1px solid #C9D3DC;margin-top:22px;padding-top:11px;font-family:monospace;font-size:9.5px;color:#66788A}}
  .tip{{max-width:820px;margin:0 auto 12px;color:#9DB0C2;font-family:monospace;font-size:11px;text-align:right}}
  @media print{{body{{background:#fff;padding:0}} .sheet{{border:none;max-width:none}} .tip{{display:none}}}}
  @media(max-width:640px){{.refl,.eco{{grid-template-columns:1fr}}}}
</style></head>
<body>
<div style="width:100%;max-width:820px">
  <div class="tip">{L["print"]}</div>
  <div class="sheet">
    <div class="cart">
      <div class="cl">
        <div class="eyebrow">{L["eyebrow"]}</div>
        <h1>{L["title"]}</h1>
        <div class="who">{name}{(" · " + cohort) if cohort else ""}</div>
      </div>
      <div class="cr">
        <div class="f"><div class="fl">{L["prep"]}</div><div class="fv" style="color:#E89A3C">{round(p.get("readiness",0)*100)} %</div></div>
        <div class="f"><div class="fl">{L["acq"]}</div><div class="fv">{p.get("acquired",0)} / {p.get("total_areas",0)}</div></div>
        <div class="f"><div class="fl">{L["ans"]}</div><div class="fv">{p.get("total_answers",0)}</div></div>
        <div class="f"><div class="fl">{L["refl"]}</div><div class="fv">{len(p.get("reflexes",[]))}</div></div>
        <div class="f"><div class="fl">{L["ed"]}</div><div class="fv">{datetime.utcnow().strftime("%d·%m·%y")}</div></div>
        <div class="f"><div class="fl">ECO</div><div class="fv">2026</div></div>
      </div>
    </div>
    <div class="body">
      <div class="band">
        <div class="bt"><span class="bn">01</span><h2>{L["s1"]}</h2></div>
        <div class="lead">{L["lead"]}</div>
        <svg viewBox="0 0 780 300">{"".join(links)}{"".join(boxes)}</svg>
        <div class="leg">
          <span><i style="background:#3DA776"></i>{L["acqL"]}</span>
          <span><i style="background:#E89A3C"></i>{L["progL"]}</span>
          <span><i style="background:#D2664E"></i>{L["fragL"]}</span>
          <span><i style="border:1.5px dashed #B7C4CF"></i>{L["waitL"]}</span>
          <span style="margin-left:auto"><i style="background:#E89A3C;width:18px;height:3px"></i>{L["cpL"]}</span>
        </div>
        <div class="read"><div class="rl">{L["reading"]}</div>{reading}</div>
      </div>
      <div class="band">
        <div class="bt"><span class="bn">02</span><h2>{L["s3"]}</h2></div>
        <div class="eco">{eco_card("people","People",33)}{eco_card("process","Process",41)}{eco_card("business","Business",26)}</div>
      </div>
      <div class="band">
        <div class="bt"><span class="bn">03</span><h2>{L["s4"]}</h2><span style="margin-left:auto;font-size:11px;color:#66788A">{L["s4h"]}</span></div>
        <div class="refl">{refl_html}</div>
      </div>
      <div class="foot">
        <div style="color:#0E1A2B;font-weight:600">Certifizer</div>
        <div>{L["own"]}</div>
        <div>certifizer.app</div>
      </div>
    </div>
  </div>
</div>
</body></html>'''
