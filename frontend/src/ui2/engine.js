// Shared readings of the API payloads, with the ECO 2026 structure of pmp.js (never a second copy).
// Everything here derives from what the API returns; no number is invented.
import { ECO_DOMAINS, ECO_TASKS, areaLabel } from "../pmp.js";

/** pmp.js domain id -> key used by /api/readiness `domains` and by item `process_group`-less payloads. */
export const DOMAIN_KEY = { people: "people", process: "process", biz: "business" };
export const DOMAIN_OF_KEY = { people: "people", process: "process", business: "biz" };
export const DOMAIN_VAR = { people: "--people", process: "--process", biz: "--biz" };
export const DOMAIN_SHORT = { people: { fr: "Les gens", en: "People" }, process: { fr: "Le projet", en: "Process" }, biz: { fr: "L'entreprise", en: "Business" } };
export const DOMAIN_CHIP = { people: "pe", process: "pr", biz: "bz" };

/** The 26 tasks of pmp.js, flattened: {id, d, fr, en, area, refs}. */
export const ALL_TASKS = [];
ECO_DOMAINS.forEach((d) => (ECO_TASKS[d.id] || []).forEach((t) => ALL_TASKS.push({ id: t.id, d: d.id, fr: t.fr, en: t.en, area: t.area, refs: t.refs || [] })));
export const TASK_BY_ID = Object.fromEntries(ALL_TASKS.map((t) => [t.id, t]));
export const DOMAIN_BY_ID = Object.fromEntries(ECO_DOMAINS.map((d) => [d.id, d]));

export const pct = (x) => Math.round((x || 0) * 100);
export const L = (o, lang) => (o ? (lang === "en" ? o.en : o.fr) || o.fr || "" : "");

/** Per-task evidence from getMastery(): same rollup as the current Journey view
 *  (process refs first — they carry the ECO-native banks — then the knowledge area). */
export function taskScore(task, procByRef, areaById) {
  if (task.refs && task.refs.length) {
    const rows = task.refs.map((r) => procByRef[r]).filter((p) => p && p.attempts > 0);
    if (rows.length) return { score: rows.reduce((a, p) => a + p.score, 0) / rows.length, attempts: rows.reduce((a, p) => a + p.attempts, 0), has: true };
  }
  if (task.area) {
    const m = areaById[task.area];
    if (m && m.attempts > 0) return { score: m.score, attempts: m.attempts, has: true };
  }
  return { score: 0, attempts: 0, has: false };
}

/** {taskId: {score, attempts, has}} for all 26 tasks. `mastery` = payload of getMastery(). */
export function taskRollup(masteryPayload) {
  const procByRef = Object.fromEntries(((masteryPayload && masteryPayload.processes) || []).map((p) => [p.pmbok_ref, p]));
  const areaById = Object.fromEntries(((masteryPayload && masteryPayload.mastery) || []).map((m) => [m.area, m]));
  const out = {};
  ALL_TASKS.forEach((t) => { out[t.id] = taskScore(t, procByRef, areaById); });
  return out;
}

/** Node state rules of the brief: 0 attempts → untested; ≥ .75 → mastered; .5–.75 → progress;
 *  < .5 with ≥ 3 attempts → fragile; < .5 with fewer attempts → progress (not enough evidence). */
export function nodeState({ score = 0, attempts = 0 } = {}) {
  if (!attempts) return "untested";
  if (score >= 0.75) return "mastered";
  if (score >= 0.5) return "progress";
  return attempts >= 3 ? "fragile" : "progress";
}
export const STATE_TEXT = {
  untested: { fr: "Pas encore ouvert", en: "Not open yet" },
  mastered: { fr: "Maîtrisé", en: "Mastered" },
  progress: { fr: "En cours", en: "In progress" },
  fragile: { fr: "Fragile · à reprendre", en: "Fragile · to redo" },
};
export const STATE_CHIP = { untested: "", mastered: "ok", progress: "mid", fragile: "ko" };

/** Aggregate several tasks (a station): attempts summed, score = attempt-weighted mean of tested tasks. */
export function aggregate(ids, roll) {
  let attempts = 0, acc = 0;
  ids.forEach((id) => { const r = roll[id]; if (r && r.has) { attempts += r.attempts; acc += r.score * r.attempts; } });
  return { attempts, score: attempts ? acc / attempts : 0, has: attempts > 0 };
}

/** ECO task a quiz item belongs to (crosswalk of pmp.js: by pmbok_ref first, then by knowledge area). */
export function taskOfItem(item) {
  if (!item) return null;
  const ref = item.pmbok_ref;
  if (ref) { const t = ALL_TASKS.find((x) => x.refs.includes(ref)); if (t) return t; }
  const area = item.knowledge_area || item.area;
  return ALL_TASKS.find((x) => x.area === area) || null;
}

/** Label of a quiz area (10 classic + 13 ECO-native), from pmp.js. */
export const areaName = (id, lang) => areaLabel(id, lang);

/** Evidence line: "N réponses · score %" — only what the API knows. */
export function evidenceLine(r, lang) {
  if (!r || !r.has) return lang === "en" ? "no answer yet" : "aucune réponse pour l'instant";
  const n = r.attempts;
  return lang === "en" ? `${n} answer${n > 1 ? "s" : ""} · ${pct(r.score)} %` : `${n} réponse${n > 1 ? "s" : ""} · ${pct(r.score)} %`;
}
