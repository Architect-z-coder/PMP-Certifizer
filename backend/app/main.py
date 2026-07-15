import re
import json
import random
from typing import Optional

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select

from .config import settings
from datetime import datetime, timedelta, timezone

from .models import (Item, Attempt, Mastery, ProcessMastery, Reflexe, Flag,
                     MissedQueue, ReadinessSnapshot, engine, init_db, get_session)
from . import llm
from . import saas
from . import email_service
from . import portrait as portrait_mod
from .prompts import build_system
from . import eco as eco_engine
from .mastery import (apply_result, light, recommend, KA, KA_IDS, TOTAL_N,
                      difficulties_for, SR_INTERVALS_DAYS, SR_MAX_STAGE,
                      recency_confidence, stale_level, effective_mastery,
                      readiness_from_masteries, AREA_DOMAIN, KA_BY_ID)

app = FastAPI(title="Certifizer API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EVAL_RE = re.compile(r"<<<EVAL\s*(\{.*?\})\s*>>>", re.S)


# ---------- schemas ----------
class Msg(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    learner_id: str = "demo"
    lang: str = "fr"
    mode: str = "explain"
    focus: str = "overview"
    project_context: str = ""
    lens: str = ""
    messages: list[Msg]


class QuizAnswer(BaseModel):
    learner_id: str = "demo"
    external_id: str
    choice_index: int


# ---------- helpers ----------
def mastery_map(session: Session, learner_id: str) -> dict:
    rows = session.exec(select(Mastery).where(Mastery.learner_id == learner_id)).all()
    return {r.knowledge_area: {"score": r.score, "attempts": r.attempts} for r in rows}


def mastery_list(session: Session, learner_id: str) -> list[dict]:
    mm = mastery_map(session, learner_id)
    out = []
    for k in KA:
        m = mm.get(k["id"], {"score": 0.0, "attempts": 0})
        out.append({"area": k["id"], "fr": k["fr"], "en": k["en"],
                    "score": m["score"], "attempts": m["attempts"],
                    "light": light(m["score"], m["attempts"])})
    return out


def rec_payload(ml: list[dict]):
    rec = recommend({m["area"]: {"score": m["score"], "attempts": m["attempts"]} for m in ml})
    return {"area": rec["id"], "fr": rec["fr"], "en": rec["en"]} if rec else None


def process_mastery_list(session: Session, learner_id: str) -> list[dict]:
    rows = session.exec(select(ProcessMastery).where(ProcessMastery.learner_id == learner_id)).all()
    return [{"pmbok_ref": r.pmbok_ref, "area": r.knowledge_area,
             "score": r.score, "attempts": r.attempts,
             "light": light(r.score, r.attempts)} for r in rows]


def _update_missed_queue(session: Session, learner_id: str, item_external_id: str,
                         area: str, result: str, now: datetime):
    """Rule D: a wrong answer enters/keeps the item in the queue; a correct one
    advances its review stage (1d -> 3d -> 7d -> resolved)."""
    row = session.exec(
        select(MissedQueue).where(
            MissedQueue.learner_id == learner_id,
            MissedQueue.item_external_id == item_external_id,
        )
    ).first()
    correct = (result == "correct")

    if row is None:
        if correct:
            return  # never-missed correct answers don't enter the queue
        session.add(MissedQueue(
            learner_id=learner_id, item_external_id=item_external_id,
            knowledge_area=area, miss_count=1, review_stage=0,
            next_review_at=now + timedelta(days=SR_INTERVALS_DAYS[0]),
            resolved=False, created_at=now, updated_at=now))
        return

    if correct:
        if row.resolved:
            return
        if row.review_stage >= SR_MAX_STAGE - 1:
            row.resolved = True
        else:
            row.review_stage += 1
            row.next_review_at = now + timedelta(
                days=SR_INTERVALS_DAYS.get(row.review_stage, 7))
    else:
        row.miss_count += 1
        row.review_stage = 0
        row.resolved = False
        row.next_review_at = now + timedelta(days=SR_INTERVALS_DAYS[0])
    row.updated_at = now
    session.add(row)


def record(session: Session, learner_id: str, area: str, result: str, mode: str,
           item_external_id: Optional[str] = None, pmbok_ref: Optional[str] = None):
    session.add(Attempt(learner_id=learner_id, knowledge_area=area, result=result, mode=mode, item_external_id=item_external_id))
    # area-level mastery
    row = session.exec(
        select(Mastery).where(Mastery.learner_id == learner_id, Mastery.knowledge_area == area)
    ).first()
    now = datetime.utcnow()
    if row is None:
        score, attempts = apply_result(0.0, 0, result)
        row = Mastery(learner_id=learner_id, knowledge_area=area, score=score,
                      attempts=attempts, last_practiced_at=now)
    else:
        row.score, row.attempts = apply_result(row.score, row.attempts, result)
        row.last_practiced_at = now
        row.updated_at = now
    session.add(row)
    # spaced-repetition queue (Rule D) — only when we know the specific item.
    # Trainer-authored items (v34) stay OUT of the global adaptive queue: the
    # engine cannot re-serve them (decision: targeted sessions + cohort bank only).
    if item_external_id and not item_external_id.startswith(saas.TRAINER_ITEM_PREFIX):
        _update_missed_queue(session, learner_id, item_external_id, area, result, now)
    # process-level mastery (only when we know which process the question targets)
    if pmbok_ref:
        prow = session.exec(
            select(ProcessMastery).where(
                ProcessMastery.learner_id == learner_id, ProcessMastery.pmbok_ref == pmbok_ref)
        ).first()
        if prow is None:
            pscore, pattempts = apply_result(0.0, 0, result)
            prow = ProcessMastery(learner_id=learner_id, pmbok_ref=pmbok_ref,
                                  knowledge_area=area, score=pscore, attempts=pattempts)
        else:
            prow.score, prow.attempts = apply_result(prow.score, prow.attempts, result)
        session.add(prow)
    session.commit()


def item_public(it: Item) -> dict:
    return {"external_id": it.external_id, "type": it.type, "pmbok_ref": it.pmbok_ref,
            "knowledge_area": it.knowledge_area,
            "process_group": it.process_group, "difficulty": it.difficulty,
            "prompt": {"fr": it.prompt_fr, "en": it.prompt_en},
            "options": {"fr": json.loads(it.options_fr), "en": json.loads(it.options_en)}}


# ---------- routes ----------
@app.get("/health")
def health():
    return {"ok": True, "provider": settings.llm_provider}


@app.post("/api/chat")
async def chat(req: ChatRequest, session: Session = Depends(get_session)):
    mm = mastery_map(session, req.learner_id)
    system = build_system(req.lang, req.focus, req.mode, req.project_context, mm, req.lens)
    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    reply = await llm.chat(system, messages, max_tokens=1000)

    verdict = None
    match = EVAL_RE.search(reply)
    if match:
        try:
            v = json.loads(match.group(1))
            if v.get("area") in KA_IDS and v.get("result") in ("correct", "partial", "incorrect"):
                verdict = v
                record(session, req.learner_id, v["area"], v["result"], req.mode)
        except json.JSONDecodeError:
            pass
        reply = EVAL_RE.sub("", reply).strip()

    ml = mastery_list(session, req.learner_id)
    return {"reply": reply, "verdict": verdict, "mastery": ml, "recommended": rec_payload(ml),
            "processes": process_mastery_list(session, req.learner_id)}


@app.get("/api/quiz/next")
def quiz_next(learner_id: str = "demo", area: Optional[str] = None, session: Session = Depends(get_session)):
    areas_with_items = {a for a in session.exec(select(Item.knowledge_area)).all()}
    if not areas_with_items:
        return {"item": None, "area": area, "reason": "empty_bank"}

    # v45 — choix de la zone : celle demandée (si elle a des questions), sinon la
    # faiblesse la plus coûteuse À L'EXAMEN — pondérée par les poids ECO 2026 RÉELS,
    # et parmi TOUTES les zones qui ont du contenu (y compris les zones ECO natives :
    # gouvernance, conformité, vision, conflits… qui n'étaient jamais recommandées).
    if area not in areas_with_items:
        mm = mastery_map(session, learner_id)
        best = recommend(mm, only=areas_with_items)
        area = best["id"] if best else None

    items = session.exec(select(Item).where(Item.knowledge_area == area)).all()
    seen = {a.item_external_id for a in session.exec(
        select(Attempt).where(Attempt.learner_id == learner_id)).all() if a.item_external_id}

    # Rule C — target difficulty to the learner's mastery of this area.
    mm = mastery_map(session, learner_id)
    m = mm.get(area)
    want = difficulties_for(m["score"] if m else 0.0, m["attempts"] if m else 0)

    unseen = [it for it in items if it.external_id not in seen]
    # Prefer unseen items at the targeted difficulty, then unseen any difficulty,
    # then targeted-difficulty (seen ok), then anything — never return nothing.
    pool = ([it for it in unseen if it.difficulty in want]
            or unseen
            or [it for it in items if it.difficulty in want]
            or items)
    return {"item": item_public(random.choice(pool)), "area": area,
            "target_difficulty": want}


@app.post("/api/quiz/answer")
def quiz_answer(body: QuizAnswer, session: Session = Depends(get_session)):
    it = session.exec(select(Item).where(Item.external_id == body.external_id)).first()
    tit = None
    if it is None and body.external_id.startswith(saas.TRAINER_ITEM_PREFIX):
        # v34 — question rédigée par un formateur (séance ciblée uniquement)
        tit = session.exec(select(saas.TrainerItem)
                           .where(saas.TrainerItem.external_id == body.external_id)).first()
    if it is None and tit is None:
        return {"error": "unknown item"}
    # Anti-abuse ceiling only (spec: freemium is feature-based, not usage-punitive).
    # This is set high enough to never hit in normal study; it just guards cost/abuse.
    user = saas.get_or_create_user(session, body.learner_id)
    if not saas.can_answer(session, user.id):
        return {"error": "rate_limited", "plan": saas.effective_plan(session, user.id),
                "limit": saas.FREE_LIMIT_PER_DAY,
                "message_fr": "Vous avez répondu à énormément de questions aujourd'hui. Faites une pause et revenez demain — votre progression est enregistrée.",
                "message_en": "You've answered a great many questions today. Take a break and come back tomorrow — your progress is saved."}
    if tit is not None:
        correct = (body.choice_index == tit.answer_index)
        result = "correct" if correct else "incorrect"
        # La progression compte (mastery de zone), mais la question ne rejoint pas
        # la file adaptative globale (record() la filtre par son préfixe).
        record(session, body.learner_id, tit.knowledge_area, result, "targeted",
               item_external_id=tit.external_id)
        rationale = {"fr": tit.rationale or "", "en": tit.rationale or ""}
        answer_index = tit.answer_index
    else:
        correct = (body.choice_index == it.answer_index)
        result = "correct" if correct else "incorrect"
        record(session, body.learner_id, it.knowledge_area, result, "quiz",
               item_external_id=it.external_id, pmbok_ref=it.pmbok_ref)
        rationale = {"fr": it.rationale_fr, "en": it.rationale_en}
        answer_index = it.answer_index
    # Count this answer against the daily quota only for free users.
    if saas.effective_plan(session, user.id) == "free":
        saas.record_answer(session, user.id)
    ml = mastery_list(session, body.learner_id)
    return {"correct": correct, "answer_index": answer_index,
            "rationale": rationale,
            "mastery": ml, "recommended": rec_payload(ml),
            "processes": process_mastery_list(session, body.learner_id)}


@app.get("/api/mastery/{learner_id}")
def get_mastery(learner_id: str, session: Session = Depends(get_session)):
    ml = mastery_list(session, learner_id)
    return {"mastery": ml, "recommended": rec_payload(ml),
            "processes": process_mastery_list(session, learner_id)}


# ---------- Wave 17: adaptive engine endpoints ----------

def _mastery_rows(session: Session, learner_id: str) -> list[dict]:
    """[{area, score, attempts, days_since}] for every area the learner has touched."""
    rows = session.exec(select(Mastery).where(Mastery.learner_id == learner_id)).all()
    now = datetime.utcnow()
    out = []
    for r in rows:
        days = None
        if r.last_practiced_at:
            days = (now - r.last_practiced_at).total_seconds() / 86400.0
        out.append({"area": r.knowledge_area, "score": r.score,
                    "attempts": r.attempts, "days_since": days})
    return out


def _task_state(session, learner_id: str):
    """v47 — maîtrise par tâche DÉRIVÉE de l'historique des tentatives (rejeu)."""
    attempts = session.exec(
        select(Attempt).where(Attempt.learner_id == learner_id)
        .order_by(Attempt.created_at, Attempt.id)).all()
    return eco_engine.replay_task_mastery(attempts)


@app.get("/api/readiness")
def get_readiness(learner_id: str = "demo", session: Session = Depends(get_session)):
    """v47 — readiness sur les 26 tâches officielles, avec couverture honnête :
    une tâche jamais tentée en direct compte 0 (une zone parfaite ne vaut plus
    100 % de son domaine). Leviers = poids de tâche x (1 - maîtrise)."""
    state = _task_state(session, learner_id)
    r = eco_engine.readiness_from_tasks(state)
    prio = eco_engine.task_priorities(state)
    levers = [{"area": p["task"], "fr": p["fr"], "en": p["en"],
               "score": p["score"], "priority": p["priority"],
               "domain": p["domain"]} for p in prio]
    rows = _mastery_rows(session, learner_id)
    # stale-but-mastered areas (maintenance candidates)
    stale = [{"area": row["area"], "score": round(row["score"], 4),
              "level": stale_level(row["days_since"])}
             for row in rows
             if row["attempts"] > 0 and row["score"] >= 0.75
             and stale_level(row["days_since"]) in ("stale", "critical")]
    return {"readiness": r, "top_levers": levers[:4], "stale_mastered": stale}


@app.get("/api/eco/mastery")
def eco_mastery(learner_id: str = "demo", session: Session = Depends(get_session)):
    """v47 — maîtrise par tâche officielle ECO 2026, dérivée des tentatives.
    26 lignes : score, tentatives (directes/totales), couverture, poids, fraîcheur."""
    state = _task_state(session, learner_id)
    rows = eco_engine.task_mastery_rows(state)
    for r in rows:
        r["last_practiced_at"] = r["last_practiced_at"].isoformat() if r["last_practiced_at"] else None
        r["light"] = light(r["score"], r["direct_attempts"])
    covered = sum(1 for r in rows if r["covered"])
    return {"tasks": rows, "covered_tasks": covered, "task_count": len(rows),
            "note": "Poids par tâche = hypothèse de conception Certifizer (PMI ne publie que les poids de domaine)."}


@app.get("/api/missed")
def get_missed(learner_id: str = "demo", due_only: bool = True,
               session: Session = Depends(get_session)):
    now = datetime.utcnow()
    q = select(MissedQueue).where(MissedQueue.learner_id == learner_id,
                                  MissedQueue.resolved == False)  # noqa: E712
    rows = session.exec(q).all()
    if due_only:
        rows = [r for r in rows if r.next_review_at <= now]
    rows.sort(key=lambda r: r.next_review_at)
    ext = {r.item_external_id for r in rows}
    items = {it.external_id: it for it in
             session.exec(select(Item).where(Item.external_id.in_(ext))).all()} if ext else {}
    out = []
    for r in rows:
        it = items.get(r.item_external_id)
        out.append({"item_external_id": r.item_external_id,
                    "knowledge_area": r.knowledge_area,
                    "miss_count": r.miss_count, "review_stage": r.review_stage,
                    "next_review_at": r.next_review_at.isoformat(),
                    "prompt": ({"fr": it.prompt_fr, "en": it.prompt_en} if it else None)})
    return {"count": len(out), "items": out}


@app.get("/api/session/next")
def session_next(learner_id: str = "demo", size: int = 10,
                 session: Session = Depends(get_session)):
    """Compose an adaptive session: weak-area priority + due missed + exam-weighted
    + one maintenance item, difficulty-targeted, de-duplicated."""
    all_items = session.exec(select(Item)).all()
    # v47 — les pools sont construits par TÂCHE PRIMAIRE officielle (mapping audité),
    # les questions directes d'abord, les closest_fit en repli.
    by_task: dict[str, list[Item]] = {}
    for it in all_items:
        t = eco_engine.primary_task_of(it.external_id)
        if t:
            by_task.setdefault(t, []).append(it)
    for pool in by_task.values():
        pool.sort(key=lambda it: 0 if eco_engine.primary_is_direct(it.external_id) else 1)
    state = _task_state(session, learner_id)
    rows = _mastery_rows(session, learner_id)
    now = datetime.utcnow()
    chosen: list[Item] = []
    used: set[str] = set()

    def take(task: str, n: int):
        pool = by_task.get(task, [])
        if not pool:
            return
        s = state[task]
        want = difficulties_for(s["score"] if s["direct_attempts"] > 0 else 0.0, s["attempts"])
        directs = [it for it in pool if eco_engine.primary_is_direct(it.external_id)]
        base = directs or pool
        ranked = ([it for it in base if it.difficulty in want and it.external_id not in used]
                  or [it for it in base if it.external_id not in used]
                  or [it for it in pool if it.external_id not in used])
        random.shuffle(ranked)
        for it in ranked[:n]:
            chosen.append(it); used.add(it.external_id)

    # leviers : poids de tâche ECO x (1 - maîtrise couverte).
    # Mélange AVANT tri stable : à priorités égales (apprenant neuf), l'ordre
    # est aléatoire — sinon toutes les premières séances serviraient les mêmes
    # tâches (BE1/BE2) et jamais BE4-BE8.
    prio = eco_engine.task_priorities(state)
    random.shuffle(prio)
    prio.sort(key=lambda p: p["priority"], reverse=True)
    lever_ids = [p["task"] for p in prio if by_task.get(p["task"])]

    # v47 — quotas de domaine : la séance reflète les poids d'examen (33/41/26),
    # modulés par la faiblesse. Sans quotas, un apprenant neuf ne recevrait que
    # du People (poids par tâche légèrement supérieur à poids égal par ailleurs).
    quota = {"people": round(size * 0.33), "process": round(size * 0.41)}
    quota["business"] = size - quota["people"] - quota["process"]
    dom_count = {"people": 0, "process": 0, "business": 0}

    def dom_of(task):
        return eco_engine.TASK_BY_ID[task]["domain"]

    def take_quota(task, n):
        before = len(chosen)
        if dom_count[dom_of(task)] >= quota[dom_of(task)]:
            return
        take(task, n)
        dom_count[dom_of(task)] += len(chosen) - before

    # 4 from top weak tasks (dans les quotas)
    for aid in lever_ids[:6]:
        if sum(dom_count.values()) >= 4:
            break
        take_quota(aid, 1)

    # 3 from due missed queue
    due = session.exec(select(MissedQueue).where(
        MissedQueue.learner_id == learner_id, MissedQueue.resolved == False)).all()  # noqa: E712
    due = sorted([r for r in due if r.next_review_at <= now], key=lambda r: r.next_review_at)
    missed_ids = {it.external_id: it for it in all_items}
    n_missed = 0
    for r in due:
        if n_missed >= 3:
            break
        it = missed_ids.get(r.item_external_id)
        if it and it.external_id not in used:
            chosen.append(it); used.add(it.external_id); n_missed += 1

    # 2 exam-weighted (heaviest ECO tasks regardless of mastery), sous quotas
    _heavy = list(eco_engine.TASK_IDS)
    random.shuffle(_heavy)
    _heavy.sort(key=eco_engine.task_weight, reverse=True)
    for t in _heavy:
        if len([c for c in chosen]) >= size - 1:
            break
        take_quota(t, 1)

    # 1 maintenance from a stale mastered task (fraîcheur dérivée du rejeu)
    stale_tasks = []
    for t, s in state.items():
        if s["direct_attempts"] > 0 and s["score"] >= 0.75 and s["last_practiced_at"]:
            days = (now - s["last_practiced_at"]).total_seconds() / 86400.0
            if stale_level(days) in ("stale", "critical"):
                stale_tasks.append(t)
    if stale_tasks:
        take(random.choice(stale_tasks), 1)

    # top up to size : priorité sous quotas, puis relâche les quotas si besoin
    i = 0
    while len(chosen) < size and i < len(lever_ids):
        take_quota(lever_ids[i], 1); i += 1
    i = 0
    while len(chosen) < size and i < len(lever_ids):
        take(lever_ids[i], 1); i += 1

    return {"size": len(chosen[:size]),
            "items": [item_public(it) for it in chosen[:size]],
            "composition": {"weak_priority": min(4, len(lever_ids)),
                            "missed_due": n_missed,
                            "maintenance": 1 if stale_tasks else 0}}


class ReflexeIn(BaseModel):
    learner_id: str = "demo"
    seat: str = ""
    text: str = ""
    case_excerpt: str = ""


@app.get("/api/reflexes/{learner_id}")
def list_reflexes(learner_id: str, session: Session = Depends(get_session)):
    rows = session.exec(
        select(Reflexe).where(Reflexe.learner_id == learner_id).order_by(Reflexe.created_at.desc())
    ).all()
    return [{"id": r.id, "seat": r.seat, "text": r.text, "case_excerpt": r.case_excerpt} for r in rows]


@app.post("/api/reflexes")
def add_reflexe(body: ReflexeIn, session: Session = Depends(get_session)):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty reflexe")
    # de-dupe identical text for the same learner
    existing = session.exec(
        select(Reflexe).where(Reflexe.learner_id == body.learner_id, Reflexe.text == text)
    ).first()
    if existing:
        return {"id": existing.id, "seat": existing.seat, "text": existing.text, "duplicate": True}
    r = Reflexe(learner_id=body.learner_id, seat=body.seat, text=text, case_excerpt=(body.case_excerpt or "")[:180])
    session.add(r)
    session.commit()
    session.refresh(r)
    return {"id": r.id, "seat": r.seat, "text": r.text, "duplicate": False}


@app.delete("/api/reflexes/{reflexe_id}")
def delete_reflexe(reflexe_id: int, learner_id: str = "demo", session: Session = Depends(get_session)):
    r = session.get(Reflexe, reflexe_id)
    if r and r.learner_id == learner_id:
        session.delete(r)
        session.commit()
    return {"ok": True}


class FlagIn(BaseModel):
    learner_id: str = "demo"
    external_id: str
    reason: str = ""


@app.post("/api/flag")
def add_flag(body: FlagIn, session: Session = Depends(get_session)):
    session.add(Flag(learner_id=body.learner_id, item_external_id=body.external_id, reason=(body.reason or "")[:400]))
    session.commit()
    return {"ok": True}


@app.get("/api/flags")
def list_flags(session: Session = Depends(get_session)):
    rows = session.exec(select(Flag).order_by(Flag.created_at.desc())).all()
    return [{"id": r.id, "learner_id": r.learner_id, "external_id": r.item_external_id,
             "reason": r.reason, "at": r.created_at.isoformat()} for r in rows]


# ---------- COHORT AGGREGATION (trainer cockpit) ----------
# A cohort is, for now, the set of distinct learner_ids present in Mastery,
# excluding reserved/trainer accounts. No schema change: cohort membership is
# derived. `cohort_id` is accepted for forward-compat (learner_ids sharing a
# prefix like "PMP-2026-A:") but defaults to "all real learners".
_RESERVED_LEARNERS = {"demo", "formateur", "trainer"}


def _cohort_learner_ids(session: Session, cohort_id: Optional[str],
                        trainer_id: Optional[str] = None) -> list[str]:
    """Resolve the set of learner_ids the cockpit should aggregate.

    v39 — DURCISSEMENT IDOR : le cloisonnement passe UNIQUEMENT par le formateur.
    Un `trainer_id` valide est désormais OBLIGATOIRE. On ne résout plus jamais
    une cohorte par son seul code (`?cohort_id=PMP-2026-A` ne suffit plus), et on
    ne retombe plus sur « tous les apprenants ». Sans trainer_id valide → liste vide.

    Cette restriction ne casse rien : le cockpit (frontend) et les appels internes
    passent toujours trainer_id, et cohort_id vaut toujours None.
    """
    if not trainer_id:
        return []
    tu = session.exec(select(saas.User).where(saas.User.public_id == trainer_id)).first()
    if not tu:
        return []
    pubs: list[str] = []
    for cid in saas.cohorts_where_trainer(session, tu.id):
        pubs.extend(saas.learner_public_ids_for_cohort(session, cid))
    # Filtrage optionnel par cohorte — mais TOUJOURS à l'intérieur des cohortes
    # du formateur (jamais un moyen d'élargir la portée).
    if cohort_id and cohort_id not in ("", "all"):
        coh = session.exec(select(saas.Cohort).where(saas.Cohort.code == cohort_id)).first()
        if coh and coh.id in saas.cohorts_where_trainer(session, tu.id):
            pubs = saas.learner_public_ids_for_cohort(session, coh.id)
        else:
            return []   # cohorte inconnue ou hors périmètre du formateur
    return sorted(set(pubs))


@app.post("/api/admin/seed-demo-cohort")
def seed_demo_cohort_endpoint(trainer_id: Optional[str] = "formateur",
                              session: Session = Depends(get_session)):
    """One-shot demo setup (Option A): creates org + PMP-2026-A cohort, links all
    existing learners and a trainer. Idempotent. Lets the cloisonné cockpit work."""
    return saas.seed_demo_cohort(session, trainer_id or "formateur")


class TargetedSessionIn(BaseModel):
    trainer_id: str
    title: str = ""
    concepts: list = []
    question_count: int = 10
    objective: str = ""
    item_ids: list = []          # sélection figée validée en aperçu
    learner_ids: list = []       # v36 — destinataires (public_id) ; vide = toute la cohorte


def _compose_items_for_concepts(session: Session, concepts: list, count: int) -> list:
    """Compose a concrete question list from concepts (shared by preview & delivery)."""
    pool = []
    for area in concepts:
        pool.extend(session.exec(select(Item).where(Item.knowledge_area == area)).all())
    random.shuffle(pool)
    return pool[:count]


@app.get("/api/cohort/session-preview")
def targeted_session_preview(trainer_id: str, concepts: Optional[str] = None,
                             question_count: int = 10,
                             session: Session = Depends(get_session)):
    """L'aperçu AVANT assignation : les concepts proposés (chemin critique par défaut)
    et les questions concrètes qui composeront la séance. Rien n'est créé."""
    tu = session.exec(select(saas.User).where(saas.User.public_id == trainer_id)).first()
    if not tu:
        return {"error": "unknown_trainer"}
    if not saas.cohorts_where_trainer(session, tu.id):
        return {"error": "no_cohort"}
    clist = [c.strip() for c in (concepts or "").split(",") if c.strip()]
    if not clist:
        ov = cohort_overview(cohort_id=None, trainer_id=trainer_id, session=session)
        clist = [c["area"] for c in ov.get("critical_path", [])][:2]
    items = _compose_items_for_concepts(session, clist, question_count)
    return {"concepts": clist, "question_count": question_count,
            "items": [{"external_id": it.external_id, "area": it.knowledge_area,
                       "difficulty": it.difficulty,
                       "prompt": {"fr": it.prompt_fr, "en": it.prompt_en}}
                      for it in items]}


@app.post("/api/cohort/targeted-session")
def create_targeted_session_endpoint(body: TargetedSessionIn, session: Session = Depends(get_session)):
    """The cockpit's 'Créer une séance ciblée' — for the trainer's own cohort only.
    Concepts default to the cohort's current critical path if none provided.
    If item_ids are provided (validated in preview), the selection is frozen."""
    tu = session.exec(select(saas.User).where(saas.User.public_id == body.trainer_id)).first()
    if not tu:
        return {"error": "unknown_trainer"}
    cohorts = saas.cohorts_where_trainer(session, tu.id)
    if not cohorts:
        return {"error": "no_cohort"}
    cohort_id = cohorts[0]  # MVP: the trainer's first cohort
    concepts = list(body.concepts or [])
    title = body.title
    if not concepts:
        # default to the cohort's critical path (reuse the aggregation)
        ov = cohort_overview(cohort_id=None, trainer_id=body.trainer_id, session=session)
        concepts = [c["area"] for c in ov.get("critical_path", [])][:2]
    if not title:
        title = "Séance ciblée — " + ", ".join(concepts[:2]) if concepts else "Séance ciblée"
    return saas.create_targeted_session(session, body.trainer_id, cohort_id,
                                        title, concepts, body.question_count, body.objective,
                                        item_ids=body.item_ids or None,
                                        learner_public_ids=body.learner_ids or None)


# ----------------------------------------------------------------------
# v34 — Boîte à outils d'édition du formateur
# ----------------------------------------------------------------------
@app.get("/api/cohort/question-bank")
def cohort_question_bank(trainer_id: str, area: Optional[str] = None,
                         difficulty: Optional[int] = None, search: Optional[str] = None,
                         limit: int = 200, session: Session = Depends(get_session)):
    """La banque consultable par le formateur pour composer une séance : les
    questions officielles + les questions de SON organisation. Cloisonné :
    formateur inconnu ou sans cohorte = rien. Consultation seule, ne crée rien."""
    tu = session.exec(select(saas.User).where(saas.User.public_id == trainer_id)).first()
    if not tu:
        return {"error": "unknown_trainer"}
    orgs = saas.trainer_org_ids(session, tu.id)
    if not orgs:
        return {"error": "no_cohort"}
    limit = max(1, min(int(limit or 200), 400))
    q = (search or "").strip().lower()

    out = []
    # 1) official bank
    stmt = select(Item)
    if area:
        stmt = stmt.where(Item.knowledge_area == area)
    if difficulty in (1, 2, 3):
        stmt = stmt.where(Item.difficulty == difficulty)
    for it in session.exec(stmt).all():
        if q and q not in (it.prompt_fr or "").lower() and q not in (it.prompt_en or "").lower():
            continue
        out.append({"external_id": it.external_id, "area": it.knowledge_area,
                    "difficulty": it.difficulty,
                    "prompt": {"fr": it.prompt_fr, "en": it.prompt_en},
                    "trainer_authored": False})
        if len(out) >= limit:
            break
    # 2) this trainer's org questions (cloisonnées — jamais celles d'une autre org)
    for ti in saas.trainer_items_for_orgs(session, orgs):
        if area and ti.knowledge_area != area:
            continue
        if difficulty in (1, 2, 3) and ti.difficulty != difficulty:
            continue
        if q and q not in (ti.prompt or "").lower():
            continue
        pub = saas.trainer_item_public(session, ti)
        out.append({"external_id": pub["external_id"], "area": pub["area"],
                    "difficulty": pub["difficulty"], "prompt": pub["prompt"],
                    "trainer_authored": True, "author": pub["author"]})
    return {"items": out[: limit + 50], "total": len(out)}


class TrainerItemIn(BaseModel):
    trainer_id: str
    knowledge_area: str = "integration"
    prompt: str = ""
    options: list = []
    answer_index: int = -1
    rationale: str = ""
    difficulty: int = 2
    lang: str = "fr"


@app.post("/api/cohort/trainer-item")
def create_trainer_item_endpoint(body: TrainerItemIn, session: Session = Depends(get_session)):
    """Le formateur crée SA question (v34). Elle rejoint la banque de son
    organisation et peut être placée dans la séance en cours de composition.
    Elle n'entre jamais dans le moteur adaptatif global."""
    return saas.create_trainer_item(session, body.trainer_id,
                                    knowledge_area=body.knowledge_area,
                                    prompt=body.prompt, options=body.options,
                                    answer_index=body.answer_index,
                                    rationale=body.rationale,
                                    difficulty=body.difficulty, lang=body.lang)


class PolishIn(BaseModel):
    trainer_id: str
    prompt: str = ""
    options: list = []
    rationale: str = ""
    lang: str = "fr"


POLISH_SYSTEM = """You are a strict copy editor for professional PMP exam questions.
You receive a draft question written by a trainer (statement, four answer options, explanation).
Rewrite it with:
- correct spelling and grammar,
- formal address (STRICT vouvoiement if the text is French — never 'tu'),
- professional exam form: a clear situational statement ending with a question, four plausible, parallel options,
- plain language, no jargon.
ABSOLUTE RULES:
- NEVER change the meaning of the question or of any option.
- NEVER change which option is the correct one, and never reorder the options.
- Answer in the SAME language as the draft.
- Reply with ONLY a JSON object, no markdown fences, no commentary:
{"prompt": "...", "options": ["...","...","...","..."], "rationale": "..."}"""


def _parse_polish_json(raw: str) -> Optional[dict]:
    """Parse la réponse du modèle (tolère les clôtures ``` et le texte parasite)."""
    if not raw:
        return None
    txt = raw.strip()
    txt = re.sub(r"^```(?:json)?", "", txt).strip()
    txt = re.sub(r"```$", "", txt).strip()
    # au besoin, isoler le premier objet JSON
    if not txt.startswith("{"):
        m = re.search(r"\{.*\}", txt, re.DOTALL)
        if not m:
            return None
        txt = m.group(0)
    try:
        data = json.loads(txt)
    except Exception:
        return None
    prompt = str(data.get("prompt", "")).strip()
    options = data.get("options", [])
    rationale = str(data.get("rationale", "")).strip()
    if not prompt or not isinstance(options, list) or len(options) != 4:
        return None
    options = [str(o).strip() for o in options]
    if any(not o for o in options):
        return None
    return {"prompt": prompt, "options": options, "rationale": rationale}


@app.post("/api/cohort/polish-question")
async def polish_question(body: PolishIn, session: Session = Depends(get_session)):
    """Correction de formulation (v34) : orthographe, vouvoiement, forme d'examen.
    Renvoie une PROPOSITION — rien n'est enregistré, le formateur garde le dernier mot."""
    tu = session.exec(select(saas.User).where(saas.User.public_id == body.trainer_id)).first()
    if not tu or not saas.trainer_org_ids(session, tu.id):
        return {"error": "unknown_trainer"}
    draft_opts = [str(o or "").strip() for o in (body.options or [])]
    if not (body.prompt or "").strip() or len(draft_opts) != 4 or any(not o for o in draft_opts):
        return {"error": "invalid_question",
                "message_fr": "L'énoncé et les quatre réponses sont requis avant la correction.",
                "message_en": "The statement and all four answers are required before polishing."}
    user_msg = json.dumps({"prompt": body.prompt.strip(), "options": draft_opts,
                           "rationale": (body.rationale or "").strip()}, ensure_ascii=False)
    try:
        raw = await llm.chat(POLISH_SYSTEM, [{"role": "user", "content": user_msg}], max_tokens=900)
    except Exception:
        return {"error": "llm_unavailable",
                "message_fr": "La correction est momentanément indisponible. Vous pouvez ajouter votre question telle quelle.",
                "message_en": "Polishing is temporarily unavailable. You can still add your question as written."}
    proposal = _parse_polish_json(raw)
    if not proposal:
        return {"error": "llm_unavailable",
                "message_fr": "La correction est momentanément indisponible. Vous pouvez ajouter votre question telle quelle.",
                "message_en": "Polishing is temporarily unavailable. You can still add your question as written."}
    changed = (proposal["prompt"] != body.prompt.strip()
               or proposal["options"] != draft_opts
               or proposal["rationale"] != (body.rationale or "").strip())
    return {"proposal": proposal, "changed": changed}


# ----------------------------------------------------------------------
# v35 — Étape 11 : Invitations par lien (option A, sans envoi d'email)
# ----------------------------------------------------------------------
class InvitationsIn(BaseModel):
    trainer_id: str
    entries: list = []          # [{name?, email?, role?}]
    lang: str = "fr"
    send_email: bool = True     # v38 — envoyer automatiquement si Brevo configuré


@app.post("/api/cohort/invitations")
async def create_invitations_endpoint(body: InvitationsIn, session: Session = Depends(get_session)):
    """Crée un lien personnel PAR entrée (lot accepté) — cloisonné au formateur.
    v38 : si Brevo est configuré et qu'une entrée a un email, le lien lui est
    envoyé automatiquement. Sinon, comportement v35 inchangé (copie manuelle)."""
    result = saas.create_invitations(session, body.trainer_id, body.entries)
    if result.get("error"):
        return result
    created = result.get("created", [])
    sent, email_configured = 0, email_service.is_configured()
    if body.send_email and email_configured:
        base = settings.public_app_url.rstrip("/")
        for inv in created:
            if inv.get("email"):
                link = f"{base}/?invite={inv['token']}"
                subj, html = email_service.invitation_email(link, inv.get("cohort_code", ""), body.lang)
                r = await email_service.send_email(inv["email"], subj, html, inv.get("name", ""))
                if r.get("ok"):
                    sent += 1
    result["emails_sent"] = sent
    result["email_configured"] = email_configured
    return result


# ----------------------------------------------------------------------
# v37 — Code de classe (rejoindre en libre-service) + email de récupération
# ----------------------------------------------------------------------
@app.get("/api/class/{code}")
def class_code_info_endpoint(code: str, session: Session = Depends(get_session)):
    """Vérifie publiquement qu'un code de classe existe (ne révèle rien d'autre)."""
    return saas.class_code_info(session, code)


class JoinClassIn(BaseModel):
    code: str
    name: str = ""
    existing_public_id: str = ""
    email: str = ""


@app.post("/api/class/join")
def join_class_endpoint(body: JoinClassIn, session: Session = Depends(get_session)):
    return saas.join_by_class_code(session, body.code, name=body.name,
                                   existing_public_id=body.existing_public_id,
                                   email=body.email)


class LinkEmailIn(BaseModel):
    learner_id: str
    email: str = ""


@app.post("/api/me/link-email")
def link_email_endpoint(body: LinkEmailIn, session: Session = Depends(get_session)):
    return saas.link_email(session, body.learner_id, body.email)


# ----------------------------------------------------------------------
# v38 — Lien magique (reconnexion par email, via Brevo)
# ----------------------------------------------------------------------
class MagicRequestIn(BaseModel):
    email: str
    lang: str = "fr"


@app.post("/api/auth/magic/request")
async def magic_request_endpoint(body: MagicRequestIn, session: Session = Depends(get_session)):
    """Envoie un lien magique à l'email fourni — SI un profil y est rattaché.
    Réponse volontairement neutre (ne révèle pas si l'email existe) pour la vie privée.
    Nécessite Brevo configuré ; sinon message clair (dégradation propre)."""
    neutral = {"ok": True,
               "message_fr": "Si un compte est lié à cet email, un lien de connexion vient d'être envoyé.",
               "message_en": "If an account is linked to this email, a sign-in link has just been sent."}
    if not saas._valid_email(body.email):
        return {"error": "invalid_email",
                "message_fr": "Veuillez saisir une adresse email valide.",
                "message_en": "Please enter a valid email address."}
    if not email_service.is_configured():
        return {"error": "email_unavailable",
                "message_fr": "L'envoi d'email n'est pas encore activé. Contactez votre formateur.",
                "message_en": "Email sending is not enabled yet. Please contact your trainer."}
    u = saas.user_by_email(session, body.email)
    if u:
        token = saas.make_magic_token(u.public_id)
        base = settings.public_app_url.rstrip("/")
        link = f"{base}/?magic={token}"
        subj, html = email_service.magic_link_email(link, body.lang)
        await email_service.send_email(u.email, subj, html, u.name)
    return neutral   # même réponse que l'email existe ou non


class MagicConsumeIn(BaseModel):
    token: str


@app.post("/api/auth/magic/consume")
def magic_consume_endpoint(body: MagicConsumeIn, session: Session = Depends(get_session)):
    """Consomme un jeton de lien magique → renvoie l'identité à restaurer côté client."""
    r = saas.resolve_magic_token(session, body.token)
    if r.get("error") == "expired":
        return {"error": "expired",
                "message_fr": "Ce lien de connexion a expiré. Demandez-en un nouveau.",
                "message_en": "This sign-in link has expired. Please request a new one."}
    if r.get("error"):
        return {"error": "invalid_token",
                "message_fr": "Ce lien de connexion n'est pas valide.",
                "message_en": "This sign-in link is not valid."}
    return r


@app.get("/api/cohort/invitations")
def list_invitations_endpoint(trainer_id: str, session: Session = Depends(get_session)):
    return saas.invitations_for_trainer(session, trainer_id)


class RevokeIn(BaseModel):
    trainer_id: str


@app.post("/api/cohort/invitations/{invitation_id}/revoke")
def revoke_invitation_endpoint(invitation_id: int, body: RevokeIn,
                               session: Session = Depends(get_session)):
    return saas.revoke_invitation(session, body.trainer_id, invitation_id)


@app.get("/api/invite/{token}")
def invitation_info_endpoint(token: str, session: Session = Depends(get_session)):
    """Consultation publique d'un lien d'invitation (code cohorte + état seulement)."""
    return saas.invitation_info(session, token)


class AcceptIn(BaseModel):
    name: str = ""
    existing_public_id: str = ""   # profil déjà connu → progression conservée


@app.post("/api/invite/{token}/accept")
def accept_invitation_endpoint(token: str, body: AcceptIn,
                               session: Session = Depends(get_session)):
    return saas.accept_invitation(session, token, name=body.name,
                                  existing_public_id=body.existing_public_id)


@app.get("/api/cohort/targeted-sessions")
def list_targeted_sessions(trainer_id: str, session: Session = Depends(get_session)):
    tu = session.exec(select(saas.User).where(saas.User.public_id == trainer_id)).first()
    if not tu:
        return []
    out = []
    for cid in saas.cohorts_where_trainer(session, tu.id):
        out.extend(saas.sessions_for_cohort(session, cid))
    return out


@app.get("/api/learner/assigned-sessions")
def learner_assigned_sessions(learner_id: str, session: Session = Depends(get_session)):
    """Targeted sessions assigned to this learner (pending first)."""
    import json as _json
    u = session.exec(select(saas.User).where(saas.User.public_id == learner_id)).first()
    if not u:
        return []
    rows = session.exec(select(saas.TargetedSessionAssignment)
                        .where(saas.TargetedSessionAssignment.learner_id == u.id)).all()
    out = []
    for a in rows:
        ts = session.exec(select(saas.TargetedSession)
                          .where(saas.TargetedSession.id == a.session_id)).first()
        if not ts:
            continue
        out.append({"assignment_id": a.id, "session_id": ts.id, "title": ts.title,
                    "concepts": _json.loads(ts.selected_concepts or "[]"),
                    "question_count": ts.question_count, "status": a.status})
    # pending first, then completed
    out.sort(key=lambda x: (x["status"] == "completed", -x["session_id"]))
    return out


@app.get("/api/learner/assigned-session/{assignment_id}/items")
def assigned_session_items(assignment_id: int, learner_id: str,
                           session: Session = Depends(get_session)):
    """Compose the items for an assigned targeted session (its concepts only)."""
    import json as _json
    u = session.exec(select(saas.User).where(saas.User.public_id == learner_id)).first()
    a = session.exec(select(saas.TargetedSessionAssignment)
                     .where(saas.TargetedSessionAssignment.id == assignment_id)).first()
    if not u or not a or a.learner_id != u.id:
        return {"error": "not_your_assignment"}   # server-side scoping
    ts = session.exec(select(saas.TargetedSession)
                      .where(saas.TargetedSession.id == a.session_id)).first()
    concepts = _json.loads(ts.selected_concepts or "[]") if ts else []
    frozen = _json.loads(getattr(ts, "selected_items", None) or "[]") if ts else []
    if frozen:
        # the trainer validated an exact selection in preview -> serve exactly it,
        # in order. v34: the frozen list can mix bank items and trainer-authored
        # items ("trainer-…" ids) — resolve both, keep the trainer's order.
        by_id = {it.external_id: it for it in
                 session.exec(select(Item).where(Item.external_id.in_(frozen))).all()}
        t_by_id = saas.trainer_items_by_external_ids(session, frozen)
        payload_items = []
        for eid in frozen:
            if eid in by_id:
                it = by_id[eid]
                payload_items.append({"external_id": it.external_id, "area": it.knowledge_area,
                                      "type": it.type, "difficulty": it.difficulty,
                                      "prompt": {"fr": it.prompt_fr, "en": it.prompt_en},
                                      "options": {"fr": json.loads(it.options_fr or "[]"),
                                                  "en": json.loads(it.options_en or "[]")}})
            elif eid in t_by_id:
                payload_items.append(saas.trainer_item_public(session, t_by_id[eid]))
        if a.status == "assigned":
            a.status = "started"
            session.add(a); session.commit()
        return {"assignment_id": a.id, "title": ts.title if ts else "",
                "items": payload_items}
    # legacy sessions (no frozen list): compose from concepts
    items = _compose_items_for_concepts(session, concepts, ts.question_count if ts else 10)
    if a.status == "assigned":
        a.status = "started"
        session.add(a); session.commit()
    return {"assignment_id": a.id, "title": ts.title if ts else "",
            "items": [{"external_id": it.external_id, "area": it.knowledge_area,
                       "type": it.type, "difficulty": it.difficulty,
                       "prompt": {"fr": it.prompt_fr, "en": it.prompt_en},
                       "options": {"fr": json.loads(it.options_fr or "[]"),
                                   "en": json.loads(it.options_en or "[]")}}
                      for it in items]}


@app.post("/api/learner/assigned-session/{assignment_id}/complete")
def complete_assigned_session(assignment_id: int, learner_id: str,
                              session: Session = Depends(get_session)):
    """Mark the learner's assignment completed — feeds the trainer's X/N counter."""
    u = session.exec(select(saas.User).where(saas.User.public_id == learner_id)).first()
    a = session.exec(select(saas.TargetedSessionAssignment)
                     .where(saas.TargetedSessionAssignment.id == assignment_id)).first()
    if not u or not a or a.learner_id != u.id:
        return {"error": "not_your_assignment"}
    if a.status != "completed":
        a.status = "completed"
        a.completed_at = datetime.utcnow()
        session.add(a); session.commit()
    return {"ok": True, "assignment_id": a.id, "status": a.status}


@app.get("/api/cohort/overview")
def cohort_overview(cohort_id: Optional[str] = None, trainer_id: Optional[str] = None,
                    session: Session = Depends(get_session)):
    """Everything the trainer cockpit needs, aggregated across the cohort.

    v39 — DURCISSEMENT IDOR : `trainer_id` est OBLIGATOIRE. Sans lui, l'endpoint
    ne renvoie plus rien (auparavant, `?cohort_id=PMP-2026-A` seul exposait la
    progression de toute la cohorte). Le cloisonnement est strictement serveur.
    """
    if not trainer_id:
        return {"error": "trainer_required",
                "message_fr": "Accès réservé au formateur de la cohorte.",
                "message_en": "Access restricted to the cohort's trainer.",
                "n": 0, "learners": []}
    learner_ids = _cohort_learner_ids(session, cohort_id, trainer_id)
    n = len(learner_ids)

    # per-learner readiness + activity
    learners = []
    now = datetime.utcnow()
    for lid in learner_ids:
        rows = _mastery_rows(session, lid)
        # v47 — même calcul que /api/readiness : tâches officielles + couverture
        rd = eco_engine.readiness_from_tasks(_task_state(session, lid))
        total_attempts = sum(int(r.get("attempts", 0) or 0) for r in rows)
        # last activity across this learner's mastery rows
        last = session.exec(select(Mastery.updated_at).where(Mastery.learner_id == lid)
                            .order_by(Mastery.updated_at.desc())).first()
        days_inactive = round((now - last).total_seconds() / 86400.0, 1) if last else None
        # display name = part after "cohort:" prefix if present, else id
        disp = lid.split(":", 1)[1] if ":" in lid else lid
        learners.append({"learner_id": lid, "name": disp,
                         "readiness": round(rd["score"], 4),
                         "attempts": total_attempts,
                         "days_inactive": days_inactive})

    # cohort-average mastery per KA area (only counting learners who attempted it)
    area_scores: dict = {}
    for lid in learner_ids:
        for r in _mastery_rows(session, lid):
            if (r.get("attempts", 0) or 0) > 0:
                area_scores.setdefault(r["area"], []).append(r["score"])
    per_area = []
    for k in KA:
        vals = area_scores.get(k["id"], [])
        avg = sum(vals) / len(vals) if vals else 0.0
        weak = sum(1 for v in vals if v < 0.5)
        per_area.append({"area": k["id"], "fr": k["fr"], "en": k["en"],
                         "domain": AREA_DOMAIN.get(k["id"], ""),
                         "avg": round(avg, 4), "learners_tested": len(vals),
                         "learners_fragile": weak,
                         "priority": round((k["n"] / TOTAL_N) * (1.0 - avg), 4)})

    # cohort readiness = mean of per-learner readiness (real coverage)
    cohort_ready = round(sum(l["readiness"] for l in learners) / n, 4) if n else 0.0
    ready_ct = sum(1 for l in learners if l["readiness"] >= 0.85)
    building_ct = sum(1 for l in learners if 0.5 <= l["readiness"] < 0.85)
    risk_ct = sum(1 for l in learners if l["readiness"] < 0.5)
    active7 = sum(1 for l in learners if l["days_inactive"] is not None and l["days_inactive"] <= 7)

    # fragile topics = weakest ATTEMPTED cohort areas by priority (weight x weakness).
    # Untouched areas (no learner tested) are excluded — a trainer wants topics the
    # cohort is struggling with, not topics simply not yet covered.
    attempted = [a for a in per_area if a["learners_tested"] > 0]
    fragile = sorted(attempted, key=lambda x: x["priority"], reverse=True)[:5]
    not_started = [{"area": a["area"], "fr": a["fr"], "en": a["en"], "domain": a["domain"]}
                   for a in per_area if a["learners_tested"] == 0]

    # critical path (collective) = same priority ordering, top 4 attempted
    crit = [{"area": a["area"], "fr": a["fr"], "en": a["en"], "domain": a["domain"],
             "avg": a["avg"]} for a in fragile[:4]]

    # action groups by readiness band
    def band(l):
        if l["days_inactive"] is not None and l["days_inactive"] > 7:
            return "accompany"
        if l["readiness"] < 0.5:
            return "accompany"
        if l["readiness"] < 0.7:
            return "consolidate"
        if l["readiness"] < 0.85:
            return "challenge"
        return "maintain"
    groups = {"accompany": [], "consolidate": [], "challenge": [], "maintain": []}
    for l in learners:
        groups[band(l)].append(l)

    # flags summary (quality loop) — count per item
    flags = session.exec(select(Flag)).all()
    fmap: dict = {}
    for f in flags:
        e = fmap.setdefault(f.item_external_id, {"external_id": f.item_external_id, "count": 0, "reasons": []})
        e["count"] += 1
        if f.reason:
            e["reasons"].append(f.reason)
    flag_list = sorted(fmap.values(), key=lambda x: x["count"], reverse=True)[:8]

    return {
        "cohort_id": cohort_id or "all",
        "size": n,
        "learners": learners,
        "readiness": {"score": cohort_ready, "ready": ready_ct,
                      "building": building_ct, "at_risk": risk_ct, "active7": active7},
        "per_area": per_area,
        "fragile_topics": fragile,
        "not_started": not_started,
        "critical_path": crit,
        "groups": {k: v for k, v in groups.items()},
        "flags": flag_list,
    }


@app.get("/api/me")
def get_me(learner_id: str, session: Session = Depends(get_session)):
    """Who is connected + effective plan + feature access map + anti-abuse quota.
    The freemium model is FEATURE-BASED: the frontend reads `features` to decide
    what to show full, in preview, or locked. DailyUsage is only anti-abuse."""
    user = saas.get_or_create_user(session, learner_id)
    plan = saas.effective_plan(session, user.id)
    used = saas.usage_today(session, user.id).questions_answered
    remaining = None if plan == "premium" else max(0, saas.FREE_LIMIT_PER_DAY - used)
    return {
        "user": {"id": user.id, "public_id": user.public_id, "name": user.name,
                 "created_from": user.created_from},
        "roles": saas.roles_for(session, user.id),
        "is_trainer": saas.is_trainer(session, user.public_id),   # v41 — pilote la bascule de test
        "effective_plan": plan,
        "features": saas.features_for(session, user.id),
        "anti_abuse_limit": saas.FREE_LIMIT_PER_DAY,
        "questions_used_today": used,
        "questions_remaining_today": remaining,
    }


def list_items(area: Optional[str] = None, session: Session = Depends(get_session)):
    q = select(Item)
    if area:
        q = q.where(Item.knowledge_area == area)
    return session.exec(q).all()


# ---------- init (runs at import: works under uvicorn, gunicorn, or a test client) ----------
init_db()
from .seed import load_item_banks  # noqa: E402
load_item_banks()

# Backfill: turn existing learner_ids into User rows (idempotent, safe every boot).
try:
    with Session(engine) as _s:
        saas.migrate_learners(_s)
except Exception:
    # Never let a backfill probe crash startup; it retries next boot.
    pass


# ======================================================================
# v40 — Portrait d'apprentissage
# ======================================================================
def _snapshot_today(session: Session, learner_id: str, readiness: float) -> None:
    """Enregistre au plus un instantané par jour et par apprenant (idempotent)."""
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = session.exec(select(ReadinessSnapshot).where(
        ReadinessSnapshot.learner_id == learner_id,
        ReadinessSnapshot.day == day)).first()
    if existing:
        existing.readiness = readiness
        session.add(existing)
    else:
        session.add(ReadinessSnapshot(learner_id=learner_id,
                                      readiness=readiness, day=day))
    session.commit()


@app.get("/api/portrait")
def get_portrait(learner_id: str = "demo", lang: str = "fr",
                 session: Session = Depends(get_session)):
    """Le portrait d'apprentissage : la carte, le chemin critique, la lecture,
    la trajectoire, la projection et les réflexes de l'apprenant.

    Tout est calculé à partir de SES données. Aucun appel LLM : déterministe,
    reproductible, gratuit.
    """
    rows = _mastery_rows(session, learner_id)
    # v47 — même calcul que /api/readiness (tâches + couverture) ; la carte des
    # zones du portrait passera aux 26 tâches en v48.
    r = eco_engine.readiness_from_tasks(_task_state(session, learner_id))
    readiness = float(r.get("score", 0.0))

    mm = {row["area"]: row for row in rows}
    scores = {k["id"]: (mm[k["id"]]["score"] if k["id"] in mm and mm[k["id"]]["attempts"] > 0 else 0.0)
              for k in KA}
    attempts = {k["id"]: (mm[k["id"]]["attempts"] if k["id"] in mm else 0) for k in KA}

    # --- la carte : chaque domaine, son état, ses dépendances ---
    def state(ka_id):
        a, s = attempts[ka_id], scores[ka_id]
        if a == 0:
            return "untouched"          # vous attend
        if s >= 0.70:
            return "acquired"
        if s >= 0.45:
            return "in_progress"
        return "fragile"

    nodes = [{
        "area": k["id"],
        "label": k["fr"] if lang != "en" else k["en"],
        "score": round(scores[k["id"]], 4),
        "attempts": attempts[k["id"]],
        "state": state(k["id"]),
        "depends_on": portrait_mod.DEPENDS_ON.get(k["id"], []),
        "domain": AREA_DOMAIN.get(k["id"], ""),
    } for k in KA]

    cpath = portrait_mod.critical_path(scores)
    reading = portrait_mod.reading(scores, attempts, lang)

    # --- trajectoire : on enregistre le point du jour, puis on relit l'historique ---
    if any(a > 0 for a in attempts.values()):
        _snapshot_today(session, learner_id, readiness)
    snaps = session.exec(select(ReadinessSnapshot)
                         .where(ReadinessSnapshot.learner_id == learner_id)
                         .order_by(ReadinessSnapshot.day)).all()
    trajectory = [{"day": s.day, "readiness": round(s.readiness, 4)} for s in snaps]
    proj = portrait_mod.projection(
        [{"at": s.at if s.at.tzinfo else s.at.replace(tzinfo=timezone.utc),
          "readiness": s.readiness} for s in snaps], lang)

    # --- réflexes : les mots de l'apprenant (issus des « Cas réels ») ---
    refl = session.exec(select(Reflexe).where(Reflexe.learner_id == learner_id)
                        .order_by(Reflexe.id.desc())).all()
    SEAT_LABEL = {"moa": ("Maître d'ouvrage", "Owner"),
                  "moe": ("Maître d'œuvre", "Contractor"),
                  "both": ("Les deux angles", "Both seats")}
    reflexes = [{"text": x.text,
                 "seat": x.seat or "",
                 "seat_label": SEAT_LABEL.get(x.seat, ("", ""))[0 if lang != "en" else 1],
                 "at": x.created_at.isoformat() if x.created_at else ""}
                for x in refl]

    # --- pondération ECO : on réutilise le calcul officiel (une seule source de vérité) ---
    eco = {d: round(v["score"], 4) for d, v in (r.get("domains") or {}).items()}

    total_answers = sum(attempts.values())
    acquired = sum(1 for k in KA if state(k["id"]) == "acquired")

    u_self = session.exec(select(saas.User).where(saas.User.public_id == learner_id)).first()
    cohort_code = ""
    if u_self:
        _mem = session.exec(select(saas.CohortMembership).where(
            saas.CohortMembership.user_id == u_self.id,
            saas.CohortMembership.role_in_cohort == "learner")).first()
        if _mem:
            _coh = session.exec(select(saas.Cohort).where(saas.Cohort.id == _mem.cohort_id)).first()
            cohort_code = _coh.code if _coh else ""

    return {
        "learner_id": learner_id,
        "email": (u_self.email if u_self else "") or "",
        "cohort": cohort_code,
        "readiness": round(readiness, 4),
        "acquired": acquired,
        "total_areas": len(KA),
        "total_answers": total_answers,
        "nodes": nodes,
        "critical_path": cpath,
        "reading": reading,
        "trajectory": trajectory,
        "projection": proj,
        "reflexes": reflexes,
        "eco": eco,
        "target": portrait_mod.TARGET,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ----------------------------------------------------------------------
# v41 — Bascule de plan pour les tests (formateur uniquement)
# ----------------------------------------------------------------------
class TestPlanIn(BaseModel):
    learner_id: str
    plan: str = "premium"       # free | premium


@app.post("/api/me/test-plan")
def set_test_plan_endpoint(body: TestPlanIn, session: Session = Depends(get_session)):
    """Permet au FORMATEUR de basculer SON PROPRE plan, pour vérifier les
    fonctions premium. Un apprenant reçoit un refus : l'app est en production,
    une bascule libre laisserait n'importe qui s'auto-promouvoir."""
    return saas.set_test_plan(session, body.learner_id, body.plan)


# ======================================================================
# v41 — Export des données + suppression de compte (droit à l'effacement)
# ======================================================================
@app.get("/api/me/export")
def export_my_data(learner_id: str, lang: str = "fr",
                   session: Session = Depends(get_session)):
    """Télécharge TOUTES les données de l'apprenant en Excel (portabilité).
    Construit à partir du portrait : une seule source de vérité."""
    from fastapi.responses import Response
    from . import export as export_mod

    p = get_portrait(learner_id=learner_id, lang=lang, session=session)
    u = session.exec(select(saas.User).where(saas.User.public_id == learner_id)).first()
    cohort = ""
    if u:
        mem = session.exec(select(saas.CohortMembership).where(
            saas.CohortMembership.user_id == u.id,
            saas.CohortMembership.role_in_cohort == "learner")).first()
        if mem:
            coh = session.exec(select(saas.Cohort).where(saas.Cohort.id == mem.cohort_id)).first()
            cohort = coh.code if coh else ""
    blob = export_mod.build_export(p, (u.name if u else ""), (u.email if u else "") or "", cohort, lang)
    fname = f"certifizer-mes-donnees-{learner_id}.xlsx"
    return Response(content=blob,
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{fname}"'})


class DeleteIn(BaseModel):
    learner_id: str


@app.get("/api/me/deletion")
def deletion_status_endpoint(learner_id: str, session: Session = Depends(get_session)):
    return saas.deletion_status(session, learner_id)


@app.post("/api/me/delete")
async def request_deletion_endpoint(body: DeleteIn, lang: str = "fr",
                                    session: Session = Depends(get_session)):
    """Demande de suppression : le compte est désactivé, le délai de grâce court.
    Rien n'est encore effacé — l'apprenant peut tout récupérer.

    ⭐ Et surtout : on lui ENVOIE ses données par email, sans qu'il l'ait demandé.
    Beaucoup de gens suppriment vite et regrettent plus tard. Son portrait et son
    Excel arrivent dans sa boîte : son travail lui est rendu d'office.
    """
    r = saas.request_deletion(session, body.learner_id)
    if r.get("error"):
        return r

    u = session.exec(select(saas.User).where(saas.User.public_id == body.learner_id)).first()
    r["email_sent"] = False
    if u and u.email and email_service.is_configured():
        try:
            from . import export as export_mod
            from . import portrait_html

            p = get_portrait(learner_id=body.learner_id, lang=lang, session=session)
            mem = session.exec(select(saas.CohortMembership).where(
                saas.CohortMembership.user_id == u.id,
                saas.CohortMembership.role_in_cohort == "learner")).first()
            cohort = ""
            if mem:
                coh = session.exec(select(saas.Cohort).where(saas.Cohort.id == mem.cohort_id)).first()
                cohort = coh.code if coh else ""

            xlsx = export_mod.build_export(p, u.name, u.email or "", cohort, lang)
            html_portrait = portrait_html.render_portrait_html(p, u.name, cohort, lang)

            subj, body_html = email_service.deletion_email(saas.GRACE_DAYS, lang)
            res = await email_service.send_email(
                u.email, subj, body_html, u.name,
                attachments=[
                    {"name": "certifizer-mon-portrait.html", "content": html_portrait.encode("utf-8")},
                    {"name": "certifizer-mes-donnees.xlsx", "content": xlsx},
                ])
            r["email_sent"] = bool(res.get("ok"))
        except Exception as e:
            # L'envoi ne doit JAMAIS empêcher la suppression : le droit à
            # l'effacement prime sur le confort d'un email.
            print(f"[deletion-email] échec : {type(e).__name__} — {e}")
    return r


@app.post("/api/me/delete/cancel")
def cancel_deletion_endpoint(body: DeleteIn, session: Session = Depends(get_session)):
    """Annule la suppression pendant le délai de grâce : tout est restauré."""
    return saas.cancel_deletion(session, body.learner_id)


@app.post("/api/admin/purge-expired")
def purge_expired_endpoint(session: Session = Depends(get_session)):
    """Efface les comptes dont le délai de grâce est écoulé.
    Appelé par le cron keepwarm (idempotent, sans effet s'il n'y a rien à purger)."""
    return saas.purge_expired_accounts(session)


class UnlinkIn(BaseModel):
    learner_id: str


@app.post("/api/me/unlink-email")
def unlink_email_endpoint(body: UnlinkIn, session: Session = Depends(get_session)):
    """Retire l'email (il est facultatif — on doit pouvoir le retirer)."""
    return saas.unlink_email(session, body.learner_id)


@app.post("/api/admin/send-reminders")
async def send_reminders_endpoint(session: Session = Depends(get_session)):
    """Envoie les rappels J-7 et J-1 avant effacement définitif.

    Appelé par le cron. Idempotent : un rappel n'est jamais envoyé deux fois
    (trace en base). Le rappel FINAL rejoint les données — dernière chance de
    récupérer son travail si le premier email s'est perdu.
    """
    if not email_service.is_configured():
        return {"ok": True, "sent": [], "reason": "email_not_configured"}

    from . import export as export_mod
    from . import portrait_html

    due = saas.deletion_reminders_due(session)
    sent = []
    for item in due:
        u, days_left, milestone = item["user"], item["days_left"], item["milestone"]
        final = milestone == 1
        try:
            attachments = None
            if final:
                # Dernière chance : on rejoint son travail.
                p = get_portrait(learner_id=u.public_id, lang="fr", session=session)
                mem = session.exec(select(saas.CohortMembership).where(
                    saas.CohortMembership.user_id == u.id,
                    saas.CohortMembership.role_in_cohort == "learner")).first()
                cohort = ""
                if mem:
                    coh = session.exec(select(saas.Cohort).where(saas.Cohort.id == mem.cohort_id)).first()
                    cohort = coh.code if coh else ""
                attachments = [
                    {"name": "certifizer-mon-portrait.html",
                     "content": portrait_html.render_portrait_html(p, u.name, cohort, "fr").encode("utf-8")},
                    {"name": "certifizer-mes-donnees.xlsx",
                     "content": export_mod.build_export(p, u.name, u.email or "", cohort, "fr")},
                ]
            subj, html = email_service.reminder_email(days_left, final, "fr")
            res = await email_service.send_email(u.email, subj, html, u.name,
                                                 attachments=attachments)
            if res.get("ok"):
                saas._mark_reminder(session, u, milestone)
                sent.append({"learner_id": u.public_id, "milestone": milestone})
        except Exception as e:
            # Un rappel qui échoue ne doit jamais bloquer les autres.
            print(f"[reminder] {u.public_id} J-{milestone} : {type(e).__name__} — {e}")
    return {"ok": True, "sent": sent, "count": len(sent)}
