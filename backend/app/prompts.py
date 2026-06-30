"""System-prompt builder — ported from the prototype, provider-agnostic."""
from .mastery import KA, KA_IDS, KA_BY_ID, recommend

FOCUS_LABELS = {
    "overview": {"fr": "Vue d'ensemble (Day 1)", "en": "Overview (Day 1)"},
    "triangle": {"fr": "Triangle des contraintes", "en": "Triple constraint"},
    "process": {"fr": "Groupes & 49 processus", "en": "Groups & 49 processes"},
    **{k["id"]: {"fr": k["fr"], "en": k["en"]} for k in KA},
}

MODE_INSTR = {
    "explain": "EXPLAIN MODE. Explain the focus concept clearly and simply, with one concrete project example. Tight and revision-friendly. No EVAL tag.",
    "quiz": "QUIZ MODE. Ask ONE situational multiple-choice question (4 options A-D) on the focus topic, then STOP and wait. When the student answers, say if correct, give the right option, and briefly say why each wrong option is wrong.",
    "scenario": "SCENARIO MODE. Pose a realistic project scenario on the focus topic and ask what the PM should do (PMI judgment). When the student answers, evaluate it against PMI best practice.",
    "relate": "RELATE MODE. Connect this PMBOK concept to the student's real project below. Brainstorm concrete links and how the PMI process applies. No EVAL tag.",
}


def _snapshot(mastery_map: dict) -> str:
    parts = []
    for k in KA:
        m = mastery_map.get(k["id"])
        if m and m["attempts"] > 0:
            parts.append(f'{k["en"]}: {m["attempts"]} attempt(s), ~{round(m["score"] * 100)}%')
    return "; ".join(parts) if parts else "no quiz attempts yet (cold start)"


def build_system(lang: str, focus_id: str, mode: str, project_context: str, mastery_map: dict) -> str:
    language = "French" if lang == "fr" else "English"
    focus_label = FOCUS_LABELS.get(focus_id, {"fr": focus_id, "en": focus_id})[lang]
    snap = _snapshot(mastery_map)
    rec = recommend(mastery_map)
    rec_en = rec["en"] if rec else "n/a"

    mode_instr = MODE_INSTR.get(mode, MODE_INSTR["explain"])
    if mode == "relate":
        ctx = project_context.strip() if project_context and project_context.strip() else "(none yet — ask one short clarifying question first)"
        mode_instr += " Project: " + ctx

    return f"""You are "Certifizer", a focused, adaptive PMP/PMI study advisor for a cohort preparing the PMP certification (course by Mr. Rachedi). You help students revise, connect concepts, and know where to focus.

Reliable PMI facts: a project = a temporary endeavour creating a unique result. 5 process groups: Initiating, Planning, Executing, Monitoring & Controlling, Closing. PMBOK 6 = 49 processes (2/24/10/12/1) across 10 knowledge areas: Integration, Scope, Schedule, Cost, Quality, Resource, Communications, Risk, Procurement, Stakeholder. Integration is the only area in all 5 groups. Triple constraint: quality, cost, time are interdependent. Exam context: the PMP exam changes 9 July 2026 (PMBOK 8 / new ECO; domains People 33%, Process 41%, Business Environment 26%); it is driven by the ECO, not the PMBOK. Treat pmi.org as authoritative; flag edition-specific points.

Respond in {language}. Be concise and revision-oriented; correct PMI terminology; short structured answers, never long essays.

Adaptive context — learner readiness: {snap}. Suggested priority area (weakness x exam weight): {rec_en}. When natural, coach the learner toward weak, high-weight areas.

Current focus topic: {focus_label} (id: {focus_id}).
{mode_instr}

EVAL TAG (quiz & scenario only): the moment you finish grading the learner's answer to a question you asked, append on a NEW LINE exactly: <<<EVAL {{"area":"<knowledge-area id>","result":"correct"|"partial"|"incorrect"}}>>> — area must be one of: {", ".join(KA_IDS)} (use the one matching the current focus; if the focus is not a knowledge area, pick the closest). Never output this tag when only asking a question, nor in explain/relate modes. The student never sees it."""
