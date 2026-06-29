export const C = {
  ink: "#0E1A2B", ink2: "#16263B", inkLine: "rgba(255,255,255,0.09)",
  paper: "#EDF1F5", card: "#FFFFFF", text: "#16202E", muted: "#5E6E7F",
  amber: "#E89A3C", teal: "#2E8C9E", line: "#DCE3EA",
  green: "#3DA776", red: "#D2664E", grey: "#54657A",
};

export const KA = [
  { id: "integration", fr: "Intégration", en: "Integration" },
  { id: "scope", fr: "Périmètre", en: "Scope" },
  { id: "schedule", fr: "Échéancier", en: "Schedule" },
  { id: "cost", fr: "Coûts", en: "Cost" },
  { id: "quality", fr: "Qualité", en: "Quality" },
  { id: "resource", fr: "Ressources", en: "Resource" },
  { id: "comms", fr: "Communications", en: "Communications" },
  { id: "risk", fr: "Risques", en: "Risk" },
  { id: "procurement", fr: "Approvisionnement", en: "Procurement" },
  { id: "stakeholder", fr: "Parties prenantes", en: "Stakeholder" },
];

export const FOCUS = [
  { id: "overview", fr: "Vue d'ensemble (Day 1)", en: "Overview (Day 1)", code: "D1" },
  ...KA.map((k, i) => ({ ...k, code: String(i + 1) })),
  { id: "triangle", fr: "Triangle des contraintes", en: "Triple constraint", code: "Δ" },
  { id: "process", fr: "Groupes & 49 processus", en: "Groups & 49 processes", code: "PG" },
];

export const STARTERS = {
  explain: { fr: "Explique ce sujet simplement, avec un exemple.", en: "Explain this topic simply, with an example." },
  quiz: { fr: "Pose-moi une question à choix multiple.", en: "Ask me a multiple-choice question." },
  scenario: { fr: "Donne-moi un cas concret type-examen.", en: "Give me a realistic exam scenario." },
  relate: { fr: "Comment ce concept s'applique à mon projet ?", en: "How does this concept apply to my project?" },
};

export const T = {
  tagline: { fr: "Conseiller de révision PMP · adaptatif", en: "PMP revision advisor · adaptive" },
  focus: { fr: "Sujet", en: "Focus" }, mode: { fr: "Mode", en: "Mode" },
  project: { fr: "Mon projet (pour « relier »)", en: "My project (for relate)" },
  projectPh: { fr: "Ex : réhabilitation d'une station de pompage, équipe de 8…", en: "e.g. pumping-station overhaul, team of 8…" },
  readiness: { fr: "Préparation", en: "Readiness" },
  reco: { fr: "À travailler en priorité", en: "Focus here next" },
  start: { fr: "Tester", en: "Quiz" },
  placeholder: { fr: "Pose ta question…", en: "Ask your question…" },
  empty1: { fr: "Choisis un sujet et un mode, puis lance-toi.", en: "Pick a focus and a mode, then dive in." },
  empty2: { fr: "Le mode « Me tester » fait monter ta préparation.", en: "Quiz me mode grows your readiness." },
  thinking: { fr: "Réflexion…", en: "Thinking…" },
  err: { fr: "Connexion impossible. Réessaie.", en: "Couldn't connect. Try again." },
  untested: { fr: "non testé", en: "untested" },
};

export function lightColor(state) {
  if (!state || state.attempts === 0) return C.grey;
  if (state.score < 0.5) return C.red;
  if (state.score < 0.75) return C.amber;
  return C.green;
}
