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
