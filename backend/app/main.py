import re
import json
import random
from typing import Optional

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select

from .config import settings
from datetime import datetime, timedelta

from .models import (Item, Attempt, Mastery, ProcessMastery, Reflexe, Flag,
                     MissedQueue, engine, init_db, get_session)
from . import llm
from . import saas
from .prompts import build_system
from .mastery import (apply_result, light, recommend, KA, KA_IDS, TOTAL_N,
                      difficulties_for, SR_INTERVALS_DAYS, SR_MAX_STAGE,
                      recency_confidence, stale_level, effective_mastery,
                      readiness_from_masteries, AREA_DOMAIN)

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
    # spaced-repetition queue (Rule D) — only when we know the specific item
    if item_external_id:
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

    # choose area: requested (if it has items) else best weakness x weight among areas that have items
    if area not in areas_with_items:
        mm = mastery_map(session, learner_id)
        best, best_p = None, -1.0
        for k in KA:
            if k["id"] not in areas_with_items:
                continue
            m = mm.get(k["id"]); mastery = m["score"] if m and m["attempts"] > 0 else 0.0
            p = (k["n"] / TOTAL_N) * (1.0 - mastery)
            if p > best_p:
                best_p, best = p, k["id"]
        area = best

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
    if it is None:
        return {"error": "unknown item"}
    # Anti-abuse ceiling only (spec: freemium is feature-based, not usage-punitive).
    # This is set high enough to never hit in normal study; it just guards cost/abuse.
    user = saas.get_or_create_user(session, body.learner_id)
    if not saas.can_answer(session, user.id):
        return {"error": "rate_limited", "plan": saas.effective_plan(session, user.id),
                "limit": saas.FREE_LIMIT_PER_DAY,
                "message_fr": "Vous avez répondu à énormément de questions aujourd'hui. Faites une pause et revenez demain — votre progression est enregistrée.",
                "message_en": "You've answered a great many questions today. Take a break and come back tomorrow — your progress is saved."}
    correct = (body.choice_index == it.answer_index)
    result = "correct" if correct else "incorrect"
    record(session, body.learner_id, it.knowledge_area, result, "quiz",
           item_external_id=it.external_id, pmbok_ref=it.pmbok_ref)
    # Count this answer against the daily quota only for free users.
    if saas.effective_plan(session, user.id) == "free":
        saas.record_answer(session, user.id)
    ml = mastery_list(session, body.learner_id)
    return {"correct": correct, "answer_index": it.answer_index,
            "rationale": {"fr": it.rationale_fr, "en": it.rationale_en},
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


@app.get("/api/readiness")
def get_readiness(learner_id: str = "demo", session: Session = Depends(get_session)):
    rows = _mastery_rows(session, learner_id)
    r = readiness_from_masteries(rows)
    # top 4 priority levers: exam_weight(area) x (1 - mastery), KA-based
    mm = {row["area"]: row for row in rows}
    levers = []
    for k in KA:
        row = mm.get(k["id"])
        score = row["score"] if row and row["attempts"] > 0 else 0.0
        levers.append({"area": k["id"], "fr": k["fr"], "en": k["en"],
                       "score": round(score, 4),
                       "priority": round((k["n"] / TOTAL_N) * (1.0 - score), 4),
                       "domain": AREA_DOMAIN.get(k["id"], "")})
    levers.sort(key=lambda x: x["priority"], reverse=True)
    # stale-but-mastered areas (maintenance candidates)
    stale = [{"area": row["area"], "score": round(row["score"], 4),
              "level": stale_level(row["days_since"])}
             for row in rows
             if row["attempts"] > 0 and row["score"] >= 0.75
             and stale_level(row["days_since"]) in ("stale", "critical")]
    return {"readiness": r, "top_levers": levers[:4], "stale_mastered": stale}


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
    by_area: dict[str, list[Item]] = {}
    for it in all_items:
        by_area.setdefault(it.knowledge_area, []).append(it)
    mm = mastery_map(session, learner_id)
    rows = _mastery_rows(session, learner_id)
    now = datetime.utcnow()
    chosen: list[Item] = []
    used: set[str] = set()

    def take(area: str, n: int):
        pool = by_area.get(area, [])
        if not pool:
            return
        m = mm.get(area)
        want = difficulties_for(m["score"] if m else 0.0, m["attempts"] if m else 0)
        ranked = ([it for it in pool if it.difficulty in want and it.external_id not in used]
                  or [it for it in pool if it.external_id not in used])
        random.shuffle(ranked)
        for it in ranked[:n]:
            chosen.append(it); used.add(it.external_id)

    # priority levers (KA weakness x weight)
    levers = sorted(
        KA, key=lambda k: (k["n"] / TOTAL_N) * (1.0 - (mm.get(k["id"], {}).get("score", 0.0)
                          if mm.get(k["id"], {}).get("attempts", 0) > 0 else 0.0)),
        reverse=True)
    lever_ids = [k["id"] for k in levers if by_area.get(k["id"])]

    # 4 from top weak areas
    for aid in lever_ids[:4]:
        take(aid, 1)

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

    # 2 exam-weighted (heaviest areas regardless of mastery)
    for k in sorted(KA, key=lambda k: k["n"], reverse=True):
        if len([c for c in chosen]) >= size - 1:
            break
        take(k["id"], 1)

    # 1 maintenance from a stale mastered area
    stale_areas = [row["area"] for row in rows
                   if row["attempts"] > 0 and row["score"] >= 0.75
                   and stale_level(row["days_since"]) in ("stale", "critical")]
    if stale_areas:
        take(random.choice(stale_areas), 1)

    # top up to size with remaining priority areas
    i = 0
    while len(chosen) < size and i < len(lever_ids):
        take(lever_ids[i], 1); i += 1

    return {"size": len(chosen[:size]),
            "items": [item_public(it) for it in chosen[:size]],
            "composition": {"weak_priority": min(4, len(lever_ids)),
                            "missed_due": n_missed,
                            "maintenance": 1 if stale_areas else 0}}


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

    Priority (server-side scoping — spec §4):
    1. If a trainer_id is given, restrict to the learners of THAT trainer's
       cohorts via CohortMembership (real cloisonnement). A trainer never sees
       learners outside their cohorts.
    2. Else if a cohort code is given, use the real Cohort + memberships.
    3. Else fall back to the legacy prefix behavior (demo / all learners).
    """
    # 1) trainer-scoped: only their cohorts' learners (strict cloisonnement).
    # Applies to any provided trainer_id, including "formateur" (demo trainer).
    if trainer_id:
        tu = session.exec(select(saas.User).where(saas.User.public_id == trainer_id)).first()
        pubs: list[str] = []
        if tu:
            for cid in saas.cohorts_where_trainer(session, tu.id):
                pubs.extend(saas.learner_public_ids_for_cohort(session, cid))
        # A named trainer only ever sees their own cohorts — unknown or cohort-less
        # trainers see nothing. Never fall through to "all learners".
        return sorted(set(pubs))

    # 2) explicit cohort code -> real cohort membership
    if cohort_id and cohort_id not in ("", "all"):
        coh = session.exec(select(saas.Cohort).where(saas.Cohort.code == cohort_id)).first()
        if coh:
            pubs = saas.learner_public_ids_for_cohort(session, coh.id)
            if pubs:
                return sorted(set(pubs))
        # fall through to legacy prefix if no real cohort found

    # 3) legacy: all non-reserved learners, optional string-prefix filter
    rows = session.exec(select(Mastery.learner_id).distinct()).all()
    ids = [r for r in rows if r and r not in _RESERVED_LEARNERS]
    if cohort_id and cohort_id not in ("", "all"):
        pref = cohort_id if cohort_id.endswith(":") else cohort_id + ":"
        scoped = [i for i in ids if i.startswith(pref)]
        if scoped:
            ids = scoped
    return sorted(ids)


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
                                        item_ids=body.item_ids or None)


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
        # the trainer validated an exact selection in preview -> serve exactly it, in order
        by_id = {it.external_id: it for it in
                 session.exec(select(Item).where(Item.external_id.in_(frozen))).all()}
        items = [by_id[eid] for eid in frozen if eid in by_id]
    else:
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
    Reuses the exact same per-learner math (readiness, levers, staleness).
    When trainer_id is given, results are cloisonnés to that trainer's cohorts."""
    learner_ids = _cohort_learner_ids(session, cohort_id, trainer_id)
    n = len(learner_ids)

    # per-learner readiness + activity
    learners = []
    now = datetime.utcnow()
    for lid in learner_ids:
        rows = _mastery_rows(session, lid)
        rd = readiness_from_masteries(rows)
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
