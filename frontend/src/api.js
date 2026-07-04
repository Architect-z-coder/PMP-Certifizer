const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export async function postChat(payload) {
  const r = await fetch(`${BASE}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`chat ${r.status}`);
  return r.json();
}

export async function getMastery(learnerId) {
  const r = await fetch(`${BASE}/api/mastery/${encodeURIComponent(learnerId)}`);
  if (!r.ok) throw new Error(`mastery ${r.status}`);
  return r.json();
}

export async function getQuizNext(learnerId, area) {
  const u = new URL(`${BASE}/api/quiz/next`);
  u.searchParams.set("learner_id", learnerId);
  if (area) u.searchParams.set("area", area);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`quiz/next ${r.status}`);
  return r.json();
}

export async function postQuizAnswer(payload) {
  const r = await fetch(`${BASE}/api/quiz/answer`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`quiz/answer ${r.status}`);
  return r.json();
}

export async function getReflexes(learnerId) {
  const r = await fetch(`${BASE}/api/reflexes/${encodeURIComponent(learnerId)}`);
  if (!r.ok) throw new Error(`reflexes ${r.status}`);
  return r.json();
}

export async function saveReflexe(payload) {
  const r = await fetch(`${BASE}/api/reflexes`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`reflexes/save ${r.status}`);
  return r.json();
}

export async function deleteReflexe(id, learnerId) {
  const u = new URL(`${BASE}/api/reflexes/${id}`);
  u.searchParams.set("learner_id", learnerId);
  const r = await fetch(u, { method: "DELETE" });
  if (!r.ok) throw new Error(`reflexes/delete ${r.status}`);
  return r.json();
}

export async function getReadiness(learnerId) {
  const u = new URL(`${BASE}/api/readiness`);
  u.searchParams.set("learner_id", learnerId);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`readiness ${r.status}`);
  return r.json();
}

export async function getSessionNext(learnerId, size = 10) {
  const u = new URL(`${BASE}/api/session/next`);
  u.searchParams.set("learner_id", learnerId);
  u.searchParams.set("size", String(size));
  const r = await fetch(u);
  if (!r.ok) throw new Error(`session/next ${r.status}`);
  return r.json();
}

export async function getMissed(learnerId, dueOnly = true) {
  const u = new URL(`${BASE}/api/missed`);
  u.searchParams.set("learner_id", learnerId);
  u.searchParams.set("due_only", String(dueOnly));
  const r = await fetch(u);
  if (!r.ok) throw new Error(`missed ${r.status}`);
  return r.json();
}

export async function pingHealth() {
  try { await fetch(`${BASE}/health`, { cache: "no-store" }); } catch { /* warming */ }
}

export async function flagItem(payload) {
  const r = await fetch(`${BASE}/api/flag`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`flag ${r.status}`);
  return r.json();
}

export async function getCohortOverview(cohortId, trainerId) {
  const u = new URL(`${BASE}/api/cohort/overview`);
  if (cohortId) u.searchParams.set("cohort_id", cohortId);
  if (trainerId) u.searchParams.set("trainer_id", trainerId);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`cohort/overview ${r.status}`);
  return r.json();
}

export async function getMe(learnerId) {
  const u = new URL(`${BASE}/api/me`);
  u.searchParams.set("learner_id", learnerId);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`me ${r.status}`);
  return r.json();
}

export async function seedDemoCohort(trainerId) {
  const u = new URL(`${BASE}/api/admin/seed-demo-cohort`);
  if (trainerId) u.searchParams.set("trainer_id", trainerId);
  const r = await fetch(u, { method: "POST" });
  if (!r.ok) throw new Error(`seed ${r.status}`);
  return r.json();
}

export async function createTargetedSession(trainerId, opts = {}) {
  const r = await fetch(`${BASE}/api/cohort/targeted-session`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trainer_id: trainerId, ...opts }),
  });
  if (!r.ok) throw new Error(`targeted-session ${r.status}`);
  return r.json();
}

export async function getTargetedSessions(trainerId) {
  const u = new URL(`${BASE}/api/cohort/targeted-sessions`);
  u.searchParams.set("trainer_id", trainerId);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`targeted-sessions ${r.status}`);
  return r.json();
}

export async function getAssignedSessions(learnerId) {
  const u = new URL(`${BASE}/api/learner/assigned-sessions`);
  u.searchParams.set("learner_id", learnerId);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`assigned-sessions ${r.status}`);
  return r.json();
}

export async function getAssignedSessionItems(assignmentId, learnerId) {
  const u = new URL(`${BASE}/api/learner/assigned-session/${assignmentId}/items`);
  u.searchParams.set("learner_id", learnerId);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`assigned items ${r.status}`);
  return r.json();
}

export async function completeAssignedSession(assignmentId, learnerId) {
  const u = new URL(`${BASE}/api/learner/assigned-session/${assignmentId}/complete`);
  u.searchParams.set("learner_id", learnerId);
  const r = await fetch(u, { method: "POST" });
  if (!r.ok) throw new Error(`complete ${r.status}`);
  return r.json();
}

export async function getSessionPreview(trainerId, concepts, questionCount = 10) {
  const u = new URL(`${BASE}/api/cohort/session-preview`);
  u.searchParams.set("trainer_id", trainerId);
  if (concepts && concepts.length) u.searchParams.set("concepts", concepts.join(","));
  u.searchParams.set("question_count", questionCount);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`session-preview ${r.status}`);
  return r.json();
}

// ---- v34 : boîte à outils d'édition du formateur ----
export async function getQuestionBank(trainerId, { area, difficulty, search } = {}) {
  const u = new URL(`${BASE}/api/cohort/question-bank`);
  u.searchParams.set("trainer_id", trainerId);
  if (area) u.searchParams.set("area", area);
  if (difficulty) u.searchParams.set("difficulty", difficulty);
  if (search) u.searchParams.set("search", search);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`question-bank ${r.status}`);
  return r.json();
}

export async function createTrainerItem(trainerId, payload) {
  const r = await fetch(`${BASE}/api/cohort/trainer-item`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trainer_id: trainerId, ...payload }),
  });
  if (!r.ok) throw new Error(`trainer-item ${r.status}`);
  return r.json();
}

export async function polishQuestion(trainerId, payload) {
  const r = await fetch(`${BASE}/api/cohort/polish-question`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trainer_id: trainerId, ...payload }),
  });
  if (!r.ok) throw new Error(`polish-question ${r.status}`);
  return r.json();
}
