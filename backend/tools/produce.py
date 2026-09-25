"""
produce.py — unattended production loop for the Certifizer question bank.
Lives in backend/tools/ next to package_lot.py, audit_lot.py, probe_lot.py, detect_duplicates.py.

Per batch:
  author call (prompts/author.md)            -> questions + plans
  answer positions imposed in the command (balanced, no post-hoc shuffle)
  rebalance option lengths, ONE call         -> form only, content untouched
  local form check (length tell, element gap) -> drop batch if outside thresholds
  package_lot.py --zip                        -> <release>.zip
  audit_lot.py --attendu=N   (exit code)      -> 9 mechanical controls
  probe_lot.py --forme       (exit code)      -> form-tell probe
  auditor call (prompts/auditor.md), one per lot, fresh context
                                              -> lot verdict GO/HOLD/REJET + PASS per item
  store PASS items: level 1-2 -> "approved", level 3 -> "pending_sme"
A lot blocked mechanically or judged REJET is discarded whole. A HOLD lot keeps only the items the auditor
marked PASS (KEEP_PASS_ON_HOLD=0 restores whole-lot drop). No item is ever patched (jamais rapiéçage).

Models are routed by name: claude-* -> Anthropic (ANTHROPIC_API_KEY), gemini-* -> Google (GEMINI_API_KEY).
Env: AUTHOR_MODEL (default claude-sonnet-5), AUDITOR_MODEL (default gemini-2.5-flash),
     MAX_ITEMS (40), MAX_USD (5.0), MAX_BATCHES (6), BATCH (5), PACE (6s between Gemini calls),
     BASELINE_SHA, FAKE_AUTHOR=1 (plumbing test, no API)
"""
import os, sys, json, re, time, zlib, subprocess, difflib
from pathlib import Path
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
CANON = HERE.parent / "reference" / "pmp_eco_2026_canonical.json"
BANK = HERE / "bank" / "lots"; BANK.mkdir(parents=True, exist_ok=True)
WORK = HERE / "work";          WORK.mkdir(exist_ok=True)
FAKE = os.getenv("FAKE_AUTHOR") == "1"
AUTHOR_MODEL = os.getenv("AUTHOR_MODEL", "claude-sonnet-5")
AUDITOR_MODEL = os.getenv("AUDITOR_MODEL", "gemini-2.5-flash")
MAX_ITEMS = int(os.getenv("MAX_ITEMS", "40"))
MAX_USD = float(os.getenv("MAX_USD", "5.0"))
KEEP_PASS_ON_HOLD = os.environ.get("KEEP_PASS_ON_HOLD", "1") != "0"   # HOLD lot: store PASS items, drop the flagged ones; REJET always drops whole
MAX_BATCHES = int(os.getenv("MAX_BATCHES", "6"))
BATCH = int(os.getenv("BATCH", "5"))
PACE = float(os.getenv("PACE", "6"))
BASELINE_SHA = os.getenv("BASELINE_SHA", "0" * 64)
DOMAIN_TARGET = {"People": 544, "Process": 676, "Business Environment": 429}
LEVEL_MIX = {1: 0.30, 2: 0.40, 3: 0.30}
PRICES = {"claude-opus": (15e-6, 75e-6), "claude-sonnet": (3e-6, 15e-6), "claude-haiku": (1e-6, 5e-6),
          "gemini-2.5-pro": (1.25e-6, 10e-6), "gemini": (0.30e-6, 2.50e-6)}   # $/token, approximate
UTF8_ENV = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
spent = 0.0
_gemini = _anthropic = None
_last_gemini_call = 0.0

try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass

def log(m): print(f"[{datetime.now():%H:%M:%S}] {m}", flush=True)

class QuotaExhausted(Exception): pass

# ---------- model calls ----------
def provider_of(model): return "anthropic" if model.startswith("claude") else "gemini"

def price_of(model):
    for k, v in PRICES.items():
        if model.startswith(k): return v
    return (3e-6, 15e-6)

def gemini_client():
    global _gemini
    if _gemini is None:
        from google import genai
        _gemini = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _gemini

def anthropic_client():
    global _anthropic
    if _anthropic is None:
        import anthropic
        _anthropic = anthropic.Anthropic()
    return _anthropic

def call(system, user, max_tokens, model, json_mode=True):
    """One fresh model call, no shared context. Retries on 429/503; raises QuotaExhausted on persistent 429."""
    global spent, _last_gemini_call
    pin, pout = price_of(model)
    for attempt in range(4):
        try:
            if provider_of(model) == "gemini":
                wait = PACE - (time.time() - _last_gemini_call)
                if wait > 0: time.sleep(wait)
                from google.genai import types
                cfg = types.GenerateContentConfig(
                    system_instruction=system, max_output_tokens=max_tokens, temperature=0.7,
                    response_mime_type="application/json" if json_mode else None,
                    thinking_config=types.ThinkingConfig(thinking_budget=2048))
                r = gemini_client().models.generate_content(model=model, contents=user, config=cfg)
                _last_gemini_call = time.time()
                u = r.usage_metadata
                spent += (u.prompt_token_count or 0) * pin + (u.candidates_token_count or 0) * pout
                if r.candidates and r.candidates[0].finish_reason and "MAX_TOKENS" in str(r.candidates[0].finish_reason):
                    log(f"  warning: reply truncated at max_output_tokens={max_tokens}")
                return r.text or ""
            # Anthropic: thinking OFF (it silently eats the whole output budget on Sonnet 5);
            # streaming because the SDK requires it for long max_tokens.
            kw = dict(model=model, max_tokens=max_tokens, system=system,
                      messages=[{"role": "user", "content": user}])
            try:
                with anthropic_client().messages.stream(thinking={"type": "disabled"}, **kw) as s:
                    r = s.get_final_message()
            except Exception as e:
                if "thinking" not in str(e).lower(): raise
                with anthropic_client().messages.stream(thinking={"type": "enabled", "budget_tokens": 2048}, **kw) as s:
                    r = s.get_final_message()
            spent += r.usage.input_tokens * pin + r.usage.output_tokens * pout
            txt = "".join(b.text for b in r.content if getattr(b, "type", "") == "text")
            if r.stop_reason == "max_tokens":
                log(f"  warning: reply truncated at max_tokens={max_tokens} ({len(txt)} chars of text, {r.usage.output_tokens} output tokens)")
            return txt
        except Exception as e:
            msg = str(e)
            transient = any(k in msg for k in ("503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED", "overloaded", "timeout", "rate_limit"))
            wait = 30 * (attempt + 1)
            log(f"  api error [{model}] ({msg[:90]}) — {'retry in ' + str(wait) + 's' if transient and attempt < 3 else 'giving up'}")
            if not transient or attempt == 3:
                if "429" in msg or "RESOURCE_EXHAUSTED" in msg: raise QuotaExhausted(model)
                if any(k in msg for k in ("401", "400", "authentication", "API key")): raise QuotaExhausted(model)
                return ""
            time.sleep(wait)
    return ""

def parse_json(text):
    text = re.sub(r"```(?:json)?", "", text or "")
    i = min([k for k in (text.find("{"), text.find("[")) if k >= 0], default=-1)
    if i < 0: return None
    body = text[i:]
    j = max(body.rfind("}"), body.rfind("]"))
    if j >= 0: body = body[:j + 1]
    try: return json.loads(body)
    except json.JSONDecodeError: return None

REPAIR_SYS = ("Tu reçois un texte censé être un objet JSON mais qui contient une erreur de syntaxe (accolade ou crochet mal fermé, "
              "virgule manquante, guillemet non échappé, texte avant ou après l'objet). Rends UNIQUEMENT l'objet JSON valide, "
              "sans aucun texte autour, sans bloc de code. Ne modifie, ne résume et ne traduis AUCUNE valeur : mêmes chaînes, mêmes clés, même ordre.")

def parse_json_or_repair(text, label):
    d = parse_json(text)
    if d is not None or FAKE or not text: return d
    repair_model = os.getenv("REPAIR_MODEL", "claude-haiku-4-5")
    log(f"  {label}: reply not valid JSON ({len(text)} chars) — asking {repair_model} to repair the syntax")
    d = parse_json(call(REPAIR_SYS, text, 16000, repair_model))
    if d is None: log(f"  {label}: repair failed")
    return d

# ---------- targets ----------
PREFIX_DOMAIN = {"PE": "People", "PR": "Process", "BE": "Business Environment"}

def domain_of(t):
    pid = str(t.get("id", "")).upper()[:2]
    if pid in PREFIX_DOMAIN: return PREFIX_DOMAIN[pid]
    d = str(t.get("domain", "")).lower()
    if "peop" in d or "person" in d: return "People"
    if "proc" in d: return "Process"
    if "busin" in d or "environ" in d or "affair" in d: return "Business Environment"
    return None

def load_tasks():
    c = json.loads(CANON.read_text(encoding="utf-8"))
    raw = c["tasks"] if isinstance(c, dict) else c
    if isinstance(raw, dict): raw = list(raw.values())
    per_dom = {}
    for t in raw:
        d = domain_of(t)
        if d: per_dom.setdefault(d, []).append(t)
        else: log(f"task {t.get('id')} skipped: unknown domain '{t.get('domain')}'")
    out = []
    for dom, ts in per_dom.items():
        for t in ts:
            out.append({"id": t["id"], "domain": dom, "enablers": list(t.get("enablers", [])),
                        "title": t.get("title") or t.get("name") or t.get("label") or "",
                        "target": round(DOMAIN_TARGET[dom] / len(ts))})
    log(f"canonical: {len(out)} tasks · " + " · ".join(f"{d} {len(ts)}" for d, ts in per_dom.items())
        + f" · total target {sum(t['target'] for t in out)}")
    if not out: sys.exit("no usable tasks in canonical — check its structure")
    return out

def load_bank():
    items = []
    for f in sorted(BANK.glob("*.json")): items += json.loads(f.read_text(encoding="utf-8")).get("items", [])
    return items

def counts(items):
    c = {}
    for it in items:
        if it.get("status") in ("approved", "pending_sme"):
            k = (it["task_id"], int(it["level"])); c[k] = c.get(k, 0) + 1
    return c

def pick_target(tasks, items, skip):
    c, best = counts(items), None
    for t in tasks:
        for lvl, share in LEVEL_MIX.items():
            if (t["id"], lvl) in skip: continue
            gap = round(t["target"] * share) - c.get((t["id"], lvl), 0)
            if best is None or gap > best[0]: best = (gap, t, lvl)
    return best

def stem_of(q):
    p = q.get("prompt", "")
    return p.get("fr", "") if isinstance(p, dict) else str(p)

def is_dup(stem, stems, thr=0.85):
    s = stem.lower()
    return any(difflib.SequenceMatcher(None, s, e).ratio() > thr for e in stems)

# ---------- author ----------
AXES = ["le moment", "le propriétaire", "le seuil de preuve", "l'ordre des actions",
        "l'escalade", "la réversibilité", "l'autorité", "la proportionnalité de la réponse"]

def target_axes(release, n):
    """Distinct decision axes per item in a lot: two items on different axes cannot test the same judgment."""
    start = zlib.crc32(("axes-" + release).encode()) % len(AXES)
    return [AXES[(start + i) % len(AXES)] for i in range(n)]

def known_judgments(bank, task_id, limit=40):
    """Decision atoms already stored for this task first, then the rest of the same domain (PE/PR/BE):
    a judgment rewritten under another metric or another task is still a duplicate for the candidate."""
    same = [it["decision_atom"] for it in bank if it.get("task_id") == task_id and it.get("decision_atom")]
    dom = task_id[:2]
    other = [it["decision_atom"] for it in bank
             if it.get("task_id") != task_id and str(it.get("task_id", ""))[:2] == dom and it.get("decision_atom")]
    return (same[-limit:] + other[-(limit - len(same[-limit:])):])[:limit] if len(same) < limit else same[-limit:]

def target_positions(release, n):
    """Balanced answer positions, fixed before writing so rationales never go stale."""
    start = zlib.crc32(release.encode()) % 4
    return [(start + i) % 4 for i in range(n)]

def commande(task, level, n, release, known=()):
    pos = target_positions(release, n); axes = target_axes(release, n)
    pos_lines = "\n".join(f"  {release}-{i+1:02d} : answer_index = {pos[i]} · axe_de_decision = {axes[i]}" for i in range(n))
    known_block = ("\nJUGEMENTS DÉJÀ EN BANQUE dans ce domaine (ne les réécris pas sous un autre décor : changer la métrique — SPI pour CPI —, "
                   "le livrable ou le nom de l'instance ne fait pas un nouveau jugement) :\n"
                   + "\n".join(f"  - {k}" for k in known) + "\n") if known else ""
    return f"""COMMANDE DE LOT
release : {release}
tâche ECO : {task['id']} — {task['title']}
enablers autorisés (cite-les LITTÉRALEMENT dans `enabler`) :
""" + "\n".join(f"  - {e}" for e in task["enablers"]) + f"""
niveau (difficulty) : {level}
nombre d'items : {n}
ids : {release}-01 … {release}-{n:02d}

POSITION IMPOSÉE de la bonne réponse et AXE IMPOSÉ par item (0 = première option) :
{pos_lines}
Chaque item se joue sur l'axe indiqué et lui seul : les quatre options diffèrent par leur position sur cet axe. Cinq axes différents = cinq jugements différents. Recopie l'axe imposé dans `axe_de_decision` du plan.
RATIONALE : écrite pour le candidat. Elle ne contient jamais le vocabulaire d'atelier (« rivale », « distracteur », « bonne réponse », « indice décisif », « bascule ») ; elle explique pourquoi chaque option est juste ou fausse par les faits de l'énoncé. Les deux énoncés (fr et en) se terminent par la même question.
L'axe est un ANGLE DE LECTURE de l'enabler, pas un sujet : l'item teste toujours l'enabler assigné, et l'axe dit seulement sur quoi les options se départagent (qui, quand, avec quelle preuve, dans quel ordre…). Un item dont le jugement décisif glisse vers un autre enabler (autorité contractuelle, séquencement, gouvernance) est hors frontière et sera rejeté. Si l'axe imposé ne s'applique pas naturellement à l'enabler, prends un autre axe de la liste non utilisé dans ce lot et écris celui-là dans `axe_de_decision`.
{known_block}
RÈGLES DE CONTENU :
- Dans la rationale, ne désigne JAMAIS une option par son rang (« la deuxième option », « the third ») : cite son contenu (« transmettre au sponsor sans documenter… »).
- Un distracteur décrit une action positive et raisonnable. INTERDIT dans un distracteur : « ne pas », « sans », « ignorer », « skip », « without », « ignore », ou toute formulation qui avoue une omission. Le distracteur se trompe sur le moment, le propriétaire ou la preuve — pas en déclarant qu'il néglige quelque chose.
- Dans au moins un item sur {n}, la bonne réponse consiste à DIFFÉRER ou ATTENDRE (le fait décisif du scénario rend l'attente juste). Dans les autres items, une option « attendre » n'apparaît que si elle est réellement défendable.
- Les {n} items d'un même lot testent {n} jugements DIFFÉRENTS (règle, fait décisif, rivale) — pas la même règle sous deux décors.
- Un distracteur ne porte JAMAIS sa propre réfutation. Interdit : « en présumant que… », « en considérant que X prime », « en supposant… », « assuming… », « treating X as more important », ou toute clause qui expose le raisonnement fautif. Le distracteur énonce une action et un motif légitime ; c'est UN FAIT DE L'ÉNONCÉ qui le rend faux, et ce fait doit être écrit dans l'énoncé.

CONTRAINTES DE FORME (bloquantes — le lot est rejeté mécaniquement sinon) :
- Dans CHAQUE langue, la bonne réponse ne doit PAS être la plus longue des quatre options.
- Les quatre options d'un item ont une longueur similaire (écart maximal 15 % en caractères) et la même structure (même nombre d'éléments, même forme grammaticale).
- Aucune option n'est seule à porter un trait : une condition, un coût, une réserve, une partie prenante nommée.
- Avant de livrer, compte les caractères de chaque option dans chaque langue et corrige si la bonne réponse est la plus longue.

Format de sortie — UNIQUEMENT cet objet JSON, sans texte autour :
{{
  "questions": {{"items": [
    {{"id": "...", "enabler": "<enabler littéral>", "difficulty": {level},
     "prompt": {{"fr": "...", "en": "..."}},
     "options": {{"fr": ["...","...","...","..."], "en": ["...","...","...","..."]}},
     "answer_index": 0,
     "rationale": {{"fr": "...", "en": "..."}}}}
  ]}},
  "plans": {{"plans": [
    {{"id": "...", "eco_primary_task": "{task['id']}", "enabler": "<enabler littéral>",
     "decision_atom": "...", "indice_decisif": "...", "valeurs_en_tension": "...",
     "axe_de_decision": "...", "politique_correcte": "...", "rivale_la_plus_forte": "...",
     "bascule": "...", "erreur_corrigee": "..."}}
  ]}}
}}"""

def fake_author(task, level, n, release):
    """Plumbing test only: distinct stems/answers, same-structure options, answer never the longest."""
    items, plans = [], []
    for i in range(n):
        iid = f"{release}-{i+1:02d}"; ai = i % 4
        tag = zlib.crc32(iid.encode()) % 100000
        u = lambda k: " ".join(f"mot{tag}{k}{j}" for j in range(6))
        pad = ["", " en amont", " avant le jalon suivant", " dès la revue"]
        opts = [f"Option {k} : {u(k)}{pad[(j - ai - 1) % 4]}" for j, k in enumerate("ABCD")]
        opte = [f"Option {k}: {u(k)}{pad[(j - ai - 1) % 4]}" for j, k in enumerate("ABCD")]
        items.append({"id": iid, "enabler": task["enablers"][0], "difficulty": level,
                      "prompt": {"fr": f"Scénario {iid} : {u('S')} {u('T')} {u('U')}. Que faire ?", "en": f"Scenario {iid}: test. What next?"},
                      "options": {"fr": opts, "en": opte}, "answer_index": ai,
                      "rationale": {"fr": "Raison de test.", "en": "Test reason."}})
        plans.append({"id": iid, "eco_primary_task": task["id"], "enabler": task["enablers"][0],
                      "decision_atom": "test", "indice_decisif": "test", "axe_de_decision": "le moment",
                      "bascule": "test", "erreur_corrigee": "test"})
    return items, plans

def produce(task, level, n, author, release, known=()):
    raw = ""
    if FAKE:
        items, plans = fake_author(task, level, n, release)
    else:
        raw = call(author, commande(task, level, n, release, known), 16000, AUTHOR_MODEL)
        d = parse_json_or_repair(raw, "author") or {}
        if not d:
            (WORK / f"{release}-raw.txt").write_text(raw, encoding="utf-8")
            log(f"  author reply unusable — saved to work/{release}-raw.txt")
        q, pj = d.get("questions", {}), d.get("plans", {})
        items = q.get("items", []) if isinstance(q, dict) else q
        plans = pj.get("plans", []) if isinstance(pj, dict) else pj
    for pl in plans:
        pl.setdefault("eco_primary_task", task["id"])
    plan_by_id = {pl.get("id"): pl for pl in plans}
    good = []; dropped_struct = False
    for it in items:
        if not isinstance(it, dict): continue
        ra = it.get("rationale", {})
        if isinstance(ra, dict) and any(ORDINAL.search(str(ra.get(lg, ""))) for lg in ("fr", "en")):
            log(f"  item {it.get('id')} dropped: rationale refers to options by rank"); continue
        if isinstance(ra, dict) and any(LEAK.search(str(ra.get(lg, ""))) for lg in ("fr", "en")):
            log(f"  item {it.get('id')} dropped: rationale uses authoring vocabulary (rivale, distracteur…)"); continue
        pr = it.get("prompt", {})
        if isinstance(pr, dict) and not all("?" in str(pr.get(lg, "")) for lg in ("fr", "en")):
            log(f"  item {it.get('id')} dropped: a prompt has no question sentence (fr/en out of sync)"); continue
        e = snap_enabler(it.get("enabler", ""), task["enablers"])
        if e is None:
            log(f"  item {it.get('id')} dropped: enabler not in {task['id']} ({str(it.get('enabler',''))[:60]}…)"); continue
        it["enabler"] = e
        if it.get("id") in plan_by_id: plan_by_id[it["id"]]["enabler"] = e
        it = normalize_item(it)
        if valid_item(it):
            k = key_matches_plan(it, plan_by_id.get(it["id"]))
            if k is None:
                log(f"  item {it['id']} dropped: key duplicated or not matching the plan's politique_correcte"); continue
            if k != it["answer_index"]:
                log(f"  item {it['id']}: answer_index {it['answer_index']} -> {k} (option matching the plan's politique_correcte)")
                it["answer_index"] = k
            it["difficulty"] = level; good.append(it)
        else:
            log(f"  item {it.get('id')} dropped: incomplete structure ({why_invalid(it)})")
            dropped_struct = True
    without_plan = [it["id"] for it in good if it["id"] not in plan_by_id]
    if without_plan:
        log(f"  {len(without_plan)} item(s) dropped: no decision plan ({', '.join(without_plan)})")
        good = [it for it in good if it["id"] in plan_by_id]
    ids = {it["id"] for it in good}
    plans = [pl for pl in plans if pl.get("id") in ids]
    if dropped_struct and not FAKE:
        (WORK / f"{release}-raw.txt").write_text(raw, encoding="utf-8")
        log(f"  raw author reply saved to work/{release}-raw.txt")
    if not FAKE:
        want = dict(zip([f"{release}-{i+1:02d}" for i in range(n)], target_positions(release, n)))
        off = [it["id"] for it in good if want.get(it["id"]) is not None and it["answer_index"] != want[it["id"]]]
        if off: log(f"  {len(off)} item(s) not at the imposed answer position (kept as written; audit_lot will report the spread)")
        return good, plans
    return shuffle_positions(good), plans

def key_matches_plan(it, plan):
    """The option that restates the plan's politique_correcte must be the key. Returns the matching index,
    the current answer_index when no plan/politique is available, or None when nothing matches at all."""
    if not plan or not isinstance(plan.get("politique_correcte"), str): return it["answer_index"]
    pol = plan["politique_correcte"].lower()
    scores = [difflib.SequenceMatcher(None, pol, o.lower()).ratio() for o in it["options"]["fr"]]
    best = max(range(4), key=lambda i: scores[i])
    ranked = sorted(scores, reverse=True)
    if ranked[0] < 0.45: return it["answer_index"]          # too different to judge (paraphrase) -> trust the author
    if ranked[1] >= 0.60: return None                        # two options both restate the key -> the key is duplicated, drop
    if ranked[0] - ranked[1] < 0.10: return it["answer_index"]  # no clear winner -> trust the author
    return best

def snap_enabler(text, canon, thr=0.72):
    """Map the enabler the author wrote to the canonical wording of the task (exact, then closest above threshold)."""
    if not isinstance(text, str) or not canon: return None
    t = text.strip()
    if t in canon: return t
    tl = t.lower()
    for c in canon:
        if c.lower() == tl: return c
    best = max(canon, key=lambda c: difflib.SequenceMatcher(None, tl, c.lower()).ratio())
    return best if difflib.SequenceMatcher(None, tl, best.lower()).ratio() >= thr else None

def normalize_item(it):
    """Accept the common layout variants a model produces and map them to the canonical shape."""
    if not isinstance(it, dict): return it
    o = it.get("options")
    if isinstance(o, list) and len(o) == 4 and all(isinstance(x, dict) for x in o):     # 4 × {fr, en}
        it["options"] = {"fr": [x.get("fr", "") for x in o], "en": [x.get("en", "") for x in o]}
    elif isinstance(o, list) and len(o) == 4 and all(isinstance(x, str) for x in o):    # monolingual list
        it["options"] = {"fr": o, "en": list(o)}
    for k in ("prompt", "rationale"):
        v = it.get(k)
        if isinstance(v, str): it[k] = {"fr": v, "en": v}
    ai = it.get("answer_index")
    if isinstance(ai, str):
        s = ai.strip().upper()
        it["answer_index"] = "ABCD".index(s) if s in "ABCD" and len(s) == 1 else (int(s) if s.isdigit() else ai)
    if isinstance(it.get("answer_index"), dict):                                           # {"fr": 2, "en": 2}
        it["answer_index"] = it["answer_index"].get("fr", it["answer_index"].get("en"))
    return it

def why_invalid(it):
    try:
        o, pr, ra = it.get("options"), it.get("prompt"), it.get("rationale")
        if not it.get("id"): return "no id"
        if not (isinstance(o, dict) and len(o.get("fr", [])) == 4 and len(o.get("en", [])) == 4): return f"options shape: {type(o).__name__} {list(o)[:2] if isinstance(o, dict) else len(o) if isinstance(o, list) else ''}"
        if not all(isinstance(x, str) and x.strip() for x in o["fr"] + o["en"]): return "empty option"
        if not (isinstance(pr, dict) and pr.get("fr") and pr.get("en")): return f"prompt shape: {type(pr).__name__}"
        if not (isinstance(ra, dict) and ra.get("fr") and ra.get("en")): return f"rationale shape: {type(ra).__name__}"
        if not (isinstance(it.get("answer_index"), int) and 0 <= it["answer_index"] <= 3): return f"answer_index: {it.get('answer_index')!r}"
        return ""
    except Exception as e:
        return f"error {e}"

def valid_item(it):
    try:
        o, pr, ra = it["options"], it["prompt"], it["rationale"]
        return (isinstance(o, dict) and len(o["fr"]) == 4 and len(o["en"]) == 4
                and all(isinstance(x, str) and x.strip() for x in o["fr"] + o["en"])
                and isinstance(pr, dict) and pr.get("fr") and pr.get("en")
                and isinstance(ra, dict) and ra.get("fr") and ra.get("en")
                and isinstance(it["answer_index"], int) and 0 <= it["answer_index"] <= 3 and it.get("id"))
    except (KeyError, TypeError):
        return False

def shuffle_positions(items):
    """Mechanical, no judgment: same permutation FR/EN, correct answer rotates over positions 0-3."""
    start = zlib.crc32(items[0]["id"].encode()) % 4 if items else 0
    for i, it in enumerate(items):
        target, ai = (start + i) % 4, it["answer_index"]
        order = list(range(4))
        order[ai], order[target] = order[target], order[ai]
        for lg in ("fr", "en"):
            it["options"][lg] = [it["options"][lg][k] for k in order]
        it["answer_index"] = target
    return items

# ---------- form: length tell and element gap ----------
def longest_is_correct(it, lg):
    L = [len(o) for o in it["options"][lg]]
    return L[it["answer_index"]] == max(L)          # ties count, exactly like audit_lot

def elements(s):
    """Same enumeration count as probe_lot.py."""
    return len([x for x in re.split(r",|\bet\b|\bpuis\b|\band\b|\bthen\b|;", s) if x.strip()])

def element_gap(items, lg):
    gaps = []
    for it in items:
        c = [elements(o) for o in it["options"][lg]]; ai = it["answer_index"]
        others = [x for i, x in enumerate(c) if i != ai]
        gaps.append(c[ai] - sum(others) / len(others))
    return sum(gaps) / len(gaps) if gaps else 0.0

def densest_alone_ratio(items, lg):
    """Correct answer is the ONLY option with the most elements — same test as probe_lot (threshold 0.30)."""
    n = len(items) or 1
    hit = 0
    for it in items:
        c = [elements(o) for o in it["options"][lg]]; ai = it["answer_index"]
        if c[ai] == max(c) and c.count(max(c)) == 1: hit += 1
    return hit / n

NEG = re.compile(r"\bne pas\b|\bsans\b|\bignor|\bskip\b|\bwithout\b|\bnot\b|\bnever\b|\bjamais\b"
                 r"|\ben pr[ée]sumant\b|\ben supposant\b|\ben consid[ée]rant que\b|\bpresuming\b|\bassuming\b|\btreating\b.{0,40}\bas more important\b", re.I)
LEAK = re.compile(r"\b(rivale|distracteur|distractor|rival|bonne réponse|correct answer|politique correcte|indice décisif|bascule)\b", re.I)
ORDINAL = re.compile(r"\b(la|the)\s+(deuxi[èe]me|troisi[èe]me|quatri[èe]me|second|third|fourth)\b|\b(premi[èe]re|first)\s+(option|réponse|answer)", re.I)

def negation_tell_ratio(items, lg):
    """Item where at least one distractor carries a negation/omission and the correct answer does not."""
    n = len(items) or 1; hit = 0
    for it in items:
        ai = it["answer_index"]; o = it["options"][lg]
        if not NEG.search(o[ai]) and any(NEG.search(x) for i, x in enumerate(o) if i != ai): hit += 1
    return hit / n

def form_ok(items):
    st = length_stats(items)
    gapv = {lg: element_gap(items, lg) for lg in ("fr", "en")}
    dens = {lg: densest_alone_ratio(items, lg) for lg in ("fr", "en")}
    neg = {lg: negation_tell_ratio(items, lg) for lg in ("fr", "en")}
    ok = (max(st.values()) <= 0.40 and max(abs(g) for g in gapv.values()) <= 1.0
          and max(dens.values()) <= 0.30 and max(neg.values()) <= 0.40)
    return ok, (f"length fr {st['fr']:.0%} en {st['en']:.0%} · densest-alone fr {dens['fr']:.0%} en {dens['en']:.0%}"
                f" · negation-tell fr {neg['fr']:.0%} en {neg['en']:.0%} · element gap fr {gapv['fr']:+.2f} en {gapv['en']:+.2f}")

def length_stats(items):
    n = len(items) or 1
    return {lg: sum(longest_is_correct(it, lg) for it in items) / n for lg in ("fr", "en")}

REBALANCE_SYS = """Tu es correcteur de forme pour une banque de questions PMP. Dans les items reçus, la bonne réponse se reconnaît à sa forme : elle est la plus longue et/ou la seule à énumérer le plus d'éléments. Ta seule tâche : réécrire les TROIS distracteurs de chaque item pour effacer cet indice, sans changer ce qu'ils disent.
Règles strictes :
- Ne modifie jamais le texte de la bonne réponse.
- Conserve le sens, l'ordre et l'erreur de chaque distracteur ; n'ajoute rien qui rende un distracteur correct.
- Pour chaque item on te donne `elements_cible` : le nombre d'éléments énumérés de la bonne réponse (segments séparés par des virgules, « et », « puis », « ; »). Chaque distracteur doit compter EXACTEMENT ce nombre d'éléments — ni plus, ni moins. Si un distracteur en a moins, découpe son action en segments de même nature (motif, moyen, destinataire) ; s'il en a plus, fusionne.
- Longueur : chaque distracteur entre 5 % et 20 % plus long que la bonne réponse en caractères, dans chaque langue.
- Chaque item porte des `consignes` par option : applique EXACTEMENT ce qu'elles disent (nombre d'éléments cible, fourchette de longueur) et ne touche pas aux options marquées « ne pas toucher ». Ne dépasse jamais la cible : un distracteur plus dense ou beaucoup plus long que la bonne réponse est un nouvel indice.
- Aucune option ne doit être seule à porter une condition (si / if), un coût ou une réserve (toutefois / however).
- INTERDIT d'ajouter à un distracteur une négation ou un aveu d'omission (« ne pas », « sans », « skip », « without », « ignorer »). Allonge par le contexte de l'action, jamais en disant ce que l'option ne fait pas. Si un distracteur en contient déjà, reformule-le positivement (« transmettre au sponsor et traiter l'omission comme un sujet de gouvernance »).
- Allonge par du CONTENU (un complément qui précise l'action : quel document, quel interlocuteur, quel moment), jamais par du remplissage (« concernés ici », « prévue », « même », « respectifs », « en question », adverbes vides). Chaque mot ajouté doit pouvoir être défendu comme utile au sens.
- Français en vouvoiement.
- RATIONALE : chaque item porte sa `rationale` (fr, en). Quand tu réécris un distracteur, mets à jour la phrase de la rationale qui le décrit pour qu'elle corresponde au nouveau texte (mêmes mots-clés que l'option). Ne touche ni au raisonnement, ni à la phrase sur la bonne réponse, ni à la longueur globale. Jamais de vocabulaire d'atelier (« rivale », « distracteur », « bonne réponse ») ni de renvoi par rang (« la troisième option »).
Réponds UNIQUEMENT par {"items": [{"id": "...", "options": {"fr": [4 chaînes], "en": [4 chaînes]}, "rationale": {"fr": "...", "en": "..."}}, ...]} — un objet par item reçu, même id, bonne réponse inchangée à sa position.
TOUJOURS les deux langues, "fr" ET "en", quatre chaînes chacune, pour chaque item. Une réponse sans "en" est inutilisable.
- L'anglais est la TRADUCTION du français, option par option : ce que tu ajoutes ou retires dans une langue, tu l'ajoutes ou le retires dans l'autre. Jamais un complément présent dans une seule langue."""

def _lang_list(v, orig, ai):
    """One language's options from a model reply -> list of 4 strings, or None."""
    if isinstance(v, dict):                                   # {"0": "...", "1": ...} or {"A": ...}
        def key(k):
            s = str(k).strip().upper()
            return int(s) if s.isdigit() else ("ABCD".index(s) if s in "ABCD" and len(s) == 1 else 99)
        v = [v[k] for k in sorted(v, key=key)]
    if not isinstance(v, list): return None
    v = [x.get("text", x.get("fr", x.get("en", ""))) if isinstance(x, dict) else x for x in v]
    if len(v) == 3 and orig is not None:                      # distractors only -> put the correct answer back
        v = list(v); v.insert(ai, orig[ai])
    if len(v) != 4 or not all(isinstance(x, str) and x.strip() for x in v): return None
    return v

def coerce_options(o, it):
    """Accept the layouts a rebalance reply may use and return {"fr": [4], "en": [4]} or None."""
    ai = it["answer_index"]; orig = it["options"]
    if isinstance(o, list) and len(o) in (3, 4) and all(isinstance(x, dict) for x in o):   # N x {fr, en}
        o = {"fr": [x.get("fr", "") for x in o], "en": [x.get("en", "") for x in o]}
    if isinstance(o, dict) and not ("fr" in o or "en" in o):                                # {"A": {fr, en}, ...}
        vals = [o[k] for k in sorted(o, key=lambda k: str(k))]
        if vals and all(isinstance(x, dict) for x in vals):
            o = {"fr": [x.get("fr", "") for x in vals], "en": [x.get("en", "") for x in vals]}
    if not isinstance(o, dict): return None
    out = {}
    for lg in ("fr", "en"):                             # both languages or nothing: a one-language rewrite desyncs fr/en
        v = _lang_list(o.get(lg), orig[lg], ai)
        if v is None: return None
        out[lg] = v
    return out

def rebalance_lengths(items):
    """Form-only second pass, ONE call per batch: lengthen distractors where the correct answer is the longest."""
    if FAKE: return items
    def flagged(it):
        for lg in ("fr", "en"):
            c = [elements(o) for o in it["options"][lg]]; ai = it["answer_index"]
            if longest_is_correct(it, lg) or (c[ai] == max(c) and c.count(max(c)) == 1) or c[ai] != min(c) or c[ai] != max(c):
                return True
            o = it["options"][lg]
            if not NEG.search(o[ai]) and any(NEG.search(x) for i, x in enumerate(o) if i != ai):
                return True
        return False
    todo = [it for it in items if flagged(it)]
    if not todo: return items
    def brief(it):
        """Per-item, per-option instruction: what to change and in which direction — bounded, so passes don't overshoot."""
        ai = it["answer_index"]; out = {}
        for lg in ("fr", "en"):
            o = it["options"][lg]; Lc = len(o[ai]); Ec = elements(o[ai])
            notes = []
            for i, x in enumerate(o):
                if i == ai: continue
                L, E = len(x), elements(x); n = []
                if E < Ec: n.append(f"élements {E}→{Ec}")
                elif E > Ec: n.append(f"éléments {E}→{Ec}")
                if L <= Lc: n.append(f"longueur {L}→{int(Lc*1.08)}–{int(Lc*1.2)} car.")
                elif L > Lc * 1.3: n.append(f"longueur {L}→{int(Lc*1.08)}–{int(Lc*1.2)} car.")
                if NEG.search(x) and not NEG.search(o[ai]): n.append("retirer la négation/omission")
                notes.append(f"option {i}: " + (", ".join(n) if n else "ne pas toucher"))
            out[lg] = notes
        return out
    user = json.dumps({"items": [{"id": it["id"], "prompt": it["prompt"], "options": it["options"],
                                  "rationale": it.get("rationale", {}),
                                  "answer_index": it["answer_index"],
                                  "elements_cible": {lg: elements(it["options"][lg][it["answer_index"]]) for lg in ("fr", "en")},
                                  "consignes": brief(it)}
                                 for it in todo]}, ensure_ascii=False)
    raw = call(REBALANCE_SYS, user, 8000, AUTHOR_MODEL)
    v = parse_json_or_repair(raw, "rebalance") or {}
    items_out = v.get("items") if isinstance(v, dict) else v
    if isinstance(items_out, dict):                       # {"id": {...}} keyed by item id
        items_out = [dict(x, id=x.get("id", k)) if isinstance(x, dict) else x for k, x in items_out.items()]
    fixed = {}; fixed_ra = {}
    for x in (items_out or []):
        if not isinstance(x, dict): continue
        fixed[str(x.get("id", "")).strip()] = x.get("options", x.get("distracteurs", x.get("distractors", {})))
        fixed_ra[str(x.get("id", "")).strip()] = x.get("rationale")
    unusable = False
    for it in todo:
        ai = it["answer_index"]
        o = fixed.get(it["id"])
        new = coerce_options(o, it) if o is not None else None
        if new is None:
            if it["id"] not in fixed: why = "id missing from reply"
            elif isinstance(o, dict): why = f"options shape dict keys={list(o)[:4]} inner={ {k: type(o[k]).__name__ + ('[%d]' % len(o[k]) if hasattr(o[k], '__len__') else '') for k in list(o)[:2]} }"
            else: why = f"options shape {type(o).__name__}"
            log(f"  {it['id']}: rebalance reply unusable ({why}), kept original"); unusable = True; continue
        for lg in ("fr", "en"):
            new[lg][ai] = it["options"][lg][ai]        # correct answer: always the original text, never the model's copy
        it["options"] = new
        ra = fixed_ra.get(it["id"]); old_ra = it.get("rationale", {})
        if (isinstance(ra, dict) and isinstance(old_ra, dict)
                and all(isinstance(ra.get(lg), str) and ra[lg].strip() for lg in ("fr", "en"))
                and all(0.7 <= len(ra[lg]) / max(1, len(str(old_ra.get(lg, "")))) <= 1.5 for lg in ("fr", "en"))
                and not any(LEAK.search(ra[lg]) or ORDINAL.search(ra[lg]) for lg in ("fr", "en"))):
            it["rationale"] = {"fr": ra["fr"], "en": ra["en"]}   # re-synced with the rewritten distractors
        else:
            log(f"  {it['id']}: rationale not re-synced (reply missing or out of bounds), kept original")
    if unusable and raw:
        p = WORK / f"{todo[0]['id'].rsplit('-', 1)[0]}-rebalance-raw.txt"
        p.write_text(raw, encoding="utf-8"); log(f"  raw rebalance reply saved to work/{p.name}")
    return items

# ---------- gates ----------
def run(cmd, cwd):
    r = subprocess.run([sys.executable] + cmd, cwd=cwd, capture_output=True, text=True,
                       encoding="utf-8", errors="replace", env=UTF8_ENV)
    if r.returncode: log(f"  {Path(cmd[0]).name} rc={r.returncode}\n" + (r.stdout + r.stderr)[-1500:])
    return r.returncode == 0

def mechanical_gate(in_dir, release, n):
    """package_lot -> zip in WORK -> audit_lot + probe_lot, exit codes only. Returns zip path or None."""
    if not run([str(HERE / "package_lot.py"), str(in_dir), "--release", release,
                "--sha", BASELINE_SHA, "--zip"], cwd=WORK): return None
    z = WORK / f"{release}.zip"
    if not z.exists(): log("  package_lot produced no zip"); return None
    ok = run([str(HERE / "audit_lot.py"), str(z), f"--attendu={n}"], cwd=WORK) and \
         run([str(HERE / "probe_lot.py"), str(z), "--forme"], cwd=WORK)
    return z if ok else None

def audit_lot_deep(pkg_dir, plans, auditor, level):
    """One auditor call per lot with the whole package (as prompt-audit.md expects). Returns (verdict, set of PASS ids)."""
    if FAKE: return "GO", {p["id"] for p in plans}
    pkg = {}
    for f in ("questions.json", "mapping.json", "quality.json", "validation-report.json"):
        pkg[f] = json.loads((pkg_dir / f).read_text(encoding="utf-8"))
    pkg["plans.json"] = {"plans": plans}
    contexte = (f"CONTEXTE DU LOT : tous les items ont été commandés au niveau {level} (difficulty={level}). "
                + ("Le contrôle « NIVEAU 3 NON MÉRITÉ » (tension, renoncement positif, arbitrage) ne s'applique PAS à ce lot : "
                   "un item de niveau 2 n'a pas à porter de renoncement. Juge-le comme un item d'application (niveau 2)."
                   if level < 3 else "Applique le contrôle « NIVEAU 3 NON MÉRITÉ » à chaque item.")
                + "\n\nPAQUET :\n")
    raw = call(auditor, contexte + json.dumps(pkg, ensure_ascii=False), 8000, AUDITOR_MODEL)
    v = parse_json_or_repair(raw, "auditor") or {}
    (WORK / f"{pkg_dir.name}-audit.json").write_text(raw, encoding="utf-8")
    verdict = str(v.get("verdict", "REJET")).upper()
    passed = {i.get("id") for i in v.get("items", []) if str(i.get("verdict", "")).upper() == "PASS"}
    log(f"  auditor: {verdict} · taux_defaut {v.get('taux_defaut')} · dominant: {v.get('defaut_dominant', '')} · {v.get('resume', '')[:140]}")
    return verdict, passed

# ---------- main ----------
def main():
    log(f"author {AUTHOR_MODEL} ({provider_of(AUTHOR_MODEL)}) · auditor {AUDITOR_MODEL} ({provider_of(AUDITOR_MODEL)})")
    tasks = load_tasks()
    author = (HERE / "prompts" / "author.md").read_text(encoding="utf-8")
    auditor = (HERE / "prompts" / "auditor.md").read_text(encoding="utf-8")
    bank = load_bank(); stems = [stem_of(i) for i in bank]
    run_id = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M")
    stored, tries, skip = [], {}, set()
    n_prod = n_gate = n_aud = n_dup = n_batches = 0

    while len(stored) < MAX_ITEMS and spent < MAX_USD and n_batches < MAX_BATCHES:
        n_batches += 1
        try:
            tgt = pick_target(tasks, bank + stored, skip)
            if not tgt or tgt[0] <= 0: log("targets reached"); break
            gap, task, level = tgt
            key = (task["id"], level); tries[key] = tries.get(key, 0) + 1
            if tries[key] > 2: skip.add(key); continue
            n = min(BATCH, gap, MAX_ITEMS - len(stored))
            release = f"qL{level}-{task['id']}-{run_id}-{tries[key]}"
            log(f"batch {release} x{n}  (spent ${spent:.2f})")

            items, plans = produce(task, level, n, author, release, known_judgments(bank + stored, task["id"]))
            n_prod += len(items)
            if not items: log("  author returned nothing"); continue
            axes_used = [pl.get("axe_de_decision", "") for pl in plans]
            if len(set(axes_used)) < len(axes_used):
                log(f"  warning: repeated decision axis in lot ({[a for a in axes_used if axes_used.count(a) > 1][0]}) — auditor will judge the doublon")
            ok, desc = form_ok(items)
            log(f"  form before rebalance: {desc}")
            passes = 0
            while not ok and passes < 3:
                passes += 1
                items = rebalance_lengths(items)
                ok, desc = form_ok(items)
                log(f"  form after rebalance {passes}: {desc}")
            if not ok:
                log("  form still outside thresholds — batch dropped before packaging"); n_gate += len(items); continue

            in_dir = WORK / f"{release}-in"; in_dir.mkdir(exist_ok=True)
            (in_dir / "questions.json").write_text(json.dumps({"items": items}, ensure_ascii=False, indent=1), encoding="utf-8")
            (in_dir / "plans.json").write_text(json.dumps({"plans": plans}, ensure_ascii=False, indent=1), encoding="utf-8")

            z = mechanical_gate(in_dir, release, len(items))
            if not z: n_gate += len(items); continue
            verdict, passed = audit_lot_deep(WORK / release, plans, auditor, level)
            if verdict == "REJET" or (verdict != "GO" and not KEEP_PASS_ON_HOLD):
                n_aud += len(items); continue
            if verdict != "GO":
                log(f"  lot on HOLD: keeping the {len(passed)} item(s) the auditor marked PASS, dropping the rest")
            plan_of = {pl.get("id"): pl for pl in plans}
            for q in items:
                if q["id"] not in passed: n_aud += 1; continue
                s = stem_of(q)
                if is_dup(s, stems): n_dup += 1; continue
                pl = plan_of.get(q["id"], {})
                q.update(decision_atom=pl.get("decision_atom", ""), axe_de_decision=pl.get("axe_de_decision", ""),
                         indice_decisif=pl.get("indice_decisif", ""), bascule=pl.get("bascule", ""))
                q.update(task_id=task["id"], level=level, run_id=run_id, release=release,
                         author_model=AUTHOR_MODEL, status="approved" if level < 3 else "pending_sme")
                stored.append(q); stems.append(s)
            skip.add(key)
        except QuotaExhausted as e:
            log(f"stopping this run: {e} refused (quota or key) — nothing more will succeed today"); break

    (BANK / f"lot_{run_id}.json").write_text(json.dumps({"run_id": run_id, "author_model": AUTHOR_MODEL,
                                                         "auditor_model": AUDITOR_MODEL, "items": stored},
                                                        ensure_ascii=False, indent=1), encoding="utf-8")
    line = (f"{run_id} | produced {n_prod} | gate-dropped {n_gate} | auditor-dropped {n_aud} | "
            f"duplicates {n_dup} | stored {len(stored)} | est ${spent:.2f}")
    (HERE / "bank" / "runs.log").open("a", encoding="utf-8").write(line + "\n"); log(line)

if __name__ == "__main__":
    main()
