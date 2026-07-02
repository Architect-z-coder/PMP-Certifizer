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
    correct = (body.choice_index == it.answer_index)
    result = "correct" if correct else "incorrect"
    record(session, body.learner_id, it.knowledge_area, result, "quiz",
           item_external_id=it.external_id, pmbok_ref=it.pmbok_ref)
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


@app.get("/api/items")
def list_items(area: Optional[str] = None, session: Session = Depends(get_session)):
    q = select(Item)
    if area:
        q = q.where(Item.knowledge_area == area)
    return session.exec(q).all()


# ---------- init (runs at import: works under uvicorn, gunicorn, or a test client) ----------
init_db()
from .seed import load_item_banks  # noqa: E402
load_item_banks()
