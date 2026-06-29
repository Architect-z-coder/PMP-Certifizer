import re
import json
import random
from typing import Optional

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select

from .config import settings
from .models import Item, Attempt, Mastery, engine, init_db, get_session
from . import llm
from .prompts import build_system
from .mastery import apply_result, light, recommend, KA, KA_IDS, TOTAL_N

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


def record(session: Session, learner_id: str, area: str, result: str, mode: str, item_external_id: Optional[str] = None):
    session.add(Attempt(learner_id=learner_id, knowledge_area=area, result=result, mode=mode, item_external_id=item_external_id))
    row = session.exec(
        select(Mastery).where(Mastery.learner_id == learner_id, Mastery.knowledge_area == area)
    ).first()
    if row is None:
        score, attempts = apply_result(0.0, 0, result)
        row = Mastery(learner_id=learner_id, knowledge_area=area, score=score, attempts=attempts)
    else:
        row.score, row.attempts = apply_result(row.score, row.attempts, result)
    session.add(row)
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
    system = build_system(req.lang, req.focus, req.mode, req.project_context, mm)
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
    return {"reply": reply, "verdict": verdict, "mastery": ml, "recommended": rec_payload(ml)}


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
    pool = [it for it in items if it.external_id not in seen] or items
    return {"item": item_public(random.choice(pool)), "area": area}


@app.post("/api/quiz/answer")
def quiz_answer(body: QuizAnswer, session: Session = Depends(get_session)):
    it = session.exec(select(Item).where(Item.external_id == body.external_id)).first()
    if it is None:
        return {"error": "unknown item"}
    correct = (body.choice_index == it.answer_index)
    result = "correct" if correct else "incorrect"
    record(session, body.learner_id, it.knowledge_area, result, "quiz", item_external_id=it.external_id)
    ml = mastery_list(session, body.learner_id)
    return {"correct": correct, "answer_index": it.answer_index,
            "rationale": {"fr": it.rationale_fr, "en": it.rationale_en},
            "mastery": ml, "recommended": rec_payload(ml)}


@app.get("/api/mastery/{learner_id}")
def get_mastery(learner_id: str, session: Session = Depends(get_session)):
    ml = mastery_list(session, learner_id)
    return {"mastery": ml, "recommended": rec_payload(ml)}


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
