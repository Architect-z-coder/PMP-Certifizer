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
  coreflexion: { fr: "Voici mon cas — réfléchis-le avec moi.", en: "Here's my case — think it through with me." },
};

export const T = {
  tagline: { fr: "Conseiller de révision PMP · adaptatif", en: "PMP revision advisor · adaptive" },
  welcome: { fr: "Bienvenue sur Certifizer", en: "Welcome to Certifizer" },
  welcomeSub: { fr: "Entre ton nom ou un code pour suivre ta progression sur cet appareil.", en: "Enter your name or a code to track your progress on this device." },
  namePh: { fr: "Ton nom ou un code…", en: "Your name or a code…" },
  startBtn: { fr: "Commencer", en: "Start" },
  switchUser: { fr: "changer", en: "switch" },
  flag: { fr: "⚑ Signaler cette question", en: "⚑ Report this question" },
  flagged: { fr: "✓ Signalé — merci", en: "✓ Reported — thanks" },
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

// ---- Process groups (PMBOK 6) ----
export const PG = {
  init:  { fr: "Démarrage", en: "Initiating", c: "#8A6FB0" },
  plan:  { fr: "Planification", en: "Planning", c: "#2E8C9E" },
  exec:  { fr: "Exécution", en: "Executing", c: "#3DA776" },
  mc:    { fr: "Maîtrise", en: "M&C", c: "#E89A3C" },
  close: { fr: "Clôture", en: "Closing", c: "#D2664E" },
};

// ---- The 49 processes, keyed by knowledge-area id ----
// pmbok ref (n) matches the item bank's pmbok_ref, so per-process mastery lines up.
export const PROC = {
  integration: [
    { n: "4.1", fr: "Élaborer la charte du projet", en: "Develop Project Charter", pg: "init", roleFr: "Autorise le projet et nomme le chef de projet.", roleEn: "Authorizes the project and names the PM." },
    { n: "4.2", fr: "Élaborer le plan de management", en: "Develop PM Plan", pg: "plan", roleFr: "Définit comment le projet est exécuté, suivi et clôturé.", roleEn: "Defines how the project is executed, monitored, closed." },
    { n: "4.3", fr: "Diriger et gérer le travail", en: "Direct & Manage Project Work", pg: "exec", roleFr: "Réalise le travail et produit les livrables.", roleEn: "Performs the work and produces deliverables." },
    { n: "4.4", fr: "Gérer les connaissances", en: "Manage Project Knowledge", pg: "exec", roleFr: "Capitalise les connaissances (leçons apprises).", roleEn: "Captures knowledge (lessons learned register)." },
    { n: "4.5", fr: "Maîtriser le travail du projet", en: "Monitor & Control Project Work", pg: "mc", roleFr: "Suit l'avancement par rapport aux références de base.", roleEn: "Tracks progress against the baselines." },
    { n: "4.6", fr: "Maîtrise intégrée des changements", en: "Perform Integrated Change Control", pg: "mc", roleFr: "Évalue et décide des demandes de changement.", roleEn: "Evaluates and decides change requests." },
    { n: "4.7", fr: "Clore le projet ou la phase", en: "Close Project or Phase", pg: "close", roleFr: "Finalise, transfère le livrable, archive.", roleEn: "Finalizes, transfers deliverable, archives." },
  ],
  scope: [
    { n: "5.1", fr: "Planifier le périmètre", en: "Plan Scope Management", pg: "plan" },
    { n: "5.2", fr: "Recueillir les exigences", en: "Collect Requirements", pg: "plan" },
    { n: "5.3", fr: "Définir le périmètre", en: "Define Scope", pg: "plan" },
    { n: "5.4", fr: "Créer la SDP / WBS", en: "Create WBS", pg: "plan" },
    { n: "5.5", fr: "Valider le périmètre", en: "Validate Scope", pg: "mc" },
    { n: "5.6", fr: "Maîtriser le périmètre", en: "Control Scope", pg: "mc" },
  ],
  schedule: [
    { n: "6.1", fr: "Planifier l'échéancier", en: "Plan Schedule Management", pg: "plan" },
    { n: "6.2", fr: "Définir les activités", en: "Define Activities", pg: "plan" },
    { n: "6.3", fr: "Organiser les activités", en: "Sequence Activities", pg: "plan" },
    { n: "6.4", fr: "Estimer les durées", en: "Estimate Activity Durations", pg: "plan" },
    { n: "6.5", fr: "Élaborer l'échéancier", en: "Develop Schedule", pg: "plan" },
    { n: "6.6", fr: "Maîtriser l'échéancier", en: "Control Schedule", pg: "mc" },
  ],
  cost: [
    { n: "7.1", fr: "Planifier les coûts", en: "Plan Cost Management", pg: "plan" },
    { n: "7.2", fr: "Estimer les coûts", en: "Estimate Costs", pg: "plan" },
    { n: "7.3", fr: "Déterminer le budget", en: "Determine Budget", pg: "plan" },
    { n: "7.4", fr: "Maîtriser les coûts", en: "Control Costs", pg: "mc" },
  ],
  quality: [
    { n: "8.1", fr: "Planifier la qualité", en: "Plan Quality Management", pg: "plan" },
    { n: "8.2", fr: "Gérer la qualité", en: "Manage Quality", pg: "exec" },
    { n: "8.3", fr: "Maîtriser la qualité", en: "Control Quality", pg: "mc" },
  ],
  resource: [
    { n: "9.1", fr: "Planifier les ressources", en: "Plan Resource Management", pg: "plan" },
    { n: "9.2", fr: "Estimer les ressources", en: "Estimate Activity Resources", pg: "plan" },
    { n: "9.3", fr: "Obtenir les ressources", en: "Acquire Resources", pg: "exec" },
    { n: "9.4", fr: "Développer l'équipe", en: "Develop Team", pg: "exec" },
    { n: "9.5", fr: "Gérer l'équipe", en: "Manage Team", pg: "exec" },
    { n: "9.6", fr: "Maîtriser les ressources", en: "Control Resources", pg: "mc" },
  ],
  comms: [
    { n: "10.1", fr: "Planifier les communications", en: "Plan Communications Mgmt", pg: "plan" },
    { n: "10.2", fr: "Gérer les communications", en: "Manage Communications", pg: "exec" },
    { n: "10.3", fr: "Surveiller les communications", en: "Monitor Communications", pg: "mc" },
  ],
  risk: [
    { n: "11.1", fr: "Planifier les risques", en: "Plan Risk Management", pg: "plan" },
    { n: "11.2", fr: "Identifier les risques", en: "Identify Risks", pg: "plan" },
    { n: "11.3", fr: "Analyse qualitative", en: "Qualitative Risk Analysis", pg: "plan" },
    { n: "11.4", fr: "Analyse quantitative", en: "Quantitative Risk Analysis", pg: "plan" },
    { n: "11.5", fr: "Planifier les réponses", en: "Plan Risk Responses", pg: "plan" },
    { n: "11.6", fr: "Exécuter les réponses", en: "Implement Risk Responses", pg: "exec" },
    { n: "11.7", fr: "Surveiller les risques", en: "Monitor Risks", pg: "mc" },
  ],
  procurement: [
    { n: "12.1", fr: "Planifier les approvisionnements", en: "Plan Procurement Mgmt", pg: "plan" },
    { n: "12.2", fr: "Procéder aux approvisionnements", en: "Conduct Procurements", pg: "exec" },
    { n: "12.3", fr: "Maîtriser les approvisionnements", en: "Control Procurements", pg: "mc" },
  ],
  stakeholder: [
    { n: "13.1", fr: "Identifier les parties prenantes", en: "Identify Stakeholders", pg: "init" },
    { n: "13.2", fr: "Planifier l'engagement", en: "Plan Stakeholder Engagement", pg: "plan" },
    { n: "13.3", fr: "Gérer l'engagement", en: "Manage Stakeholder Engagement", pg: "exec" },
    { n: "13.4", fr: "Surveiller l'engagement", en: "Monitor Stakeholder Engagement", pg: "mc" },
  ],
};

// ---- Parcours (Journey) view translations ----
export const JT = {
  parcours: { fr: "Parcours", en: "Journey" },
  mapTitle: { fr: "Carte des connaissances", en: "Knowledge map" },
  mapHint: { fr: "Touche un domaine pour ouvrir son parcours détaillé", en: "Tap an area to open its detailed journey" },
  back: { fr: "Carte", en: "Map" },
  mastered: { fr: "Maîtrisés", en: "Mastered" },
  progress: { fr: "Progression", en: "Progress" },
  processes: { fr: "processus", en: "processes" },
  review: { fr: "Réviser", en: "Review" },
  pick: { fr: "Sélectionne un processus à gauche pour voir le détail.", en: "Pick a process on the left to see its detail." },
  notes: { fr: "Notes de session", en: "Session notes" },
  next: { fr: "à suivre", en: "next" },
  soon: { fr: "Détails depuis tes notes — à venir.", en: "Details from your notes — coming soon." },
  legend: { fr: "À découvrir · Fragile · En progrès · Maîtrisé", en: "To explore · Shaky · In progress · Mastered" },
  empty: { fr: "Réponds à des questions pour faire vivre ta carte.", en: "Answer questions to bring your map to life." },
};

// ---- Cas réel (co-reflection) translations + lenses ----
export const CR = {
  casreel: { fr: "Cas réel", en: "Real case" },
  casLabel: { fr: "Ton cas", en: "Your case" },
  casPh: { fr: "Décris ta situation réelle : contexte projet, contrainte, décision en jeu…", en: "Describe your real situation: project context, constraint, decision at stake…" },
  seat: { fr: "Depuis quel siège ?", en: "From which seat?" },
  mesReflexes: { fr: "Mes réflexes", en: "My reflexes" },
  save: { fr: "＋ Sauver dans mes réflexes", en: "＋ Save to my reflexes" },
  saved: { fr: "✓ Sauvé", en: "✓ Saved" },
  emptyRef: { fr: "Les réflexes que tu sauves depuis un cas s'accumulent ici.", en: "The reflexes you save from a case gather here." },
};
export const LENS = [
  { id: "moa", fr: "Maître d'ouvrage", en: "Owner", c: "#2E8C9E", dFr: "Tu possèdes l'actif, le budget, la valeur.", dEn: "You own the asset, budget, value." },
  { id: "moe", fr: "Maître d'œuvre", en: "Delivery lead", c: "#C57B2C", dFr: "Tu portes l'exécution et le contrat.", dEn: "You carry execution and the contract." },
  { id: "both", fr: "Les deux angles", en: "Both angles", c: "#8A6FB0", dFr: "Compare les deux sièges côte à côte.", dEn: "Compare both seats side by side." },
];

// ---- 2026 ECO structure + crosswalk from existing content ----
// Each task maps to existing per-process (refs) or per-area (area) mastery so the
// current content rolls up into the new domain view with NO backend change.
// status: solid (deep bank) | amorce (some content) | build (to write)
export const ECO_DOMAINS = [
  { id: "people",  fr: "Personnes", en: "People", wt: 33, c: "#8A6FB0" },
  { id: "process", fr: "Processus", en: "Process", wt: 41, c: "#2E8C9E" },
  { id: "biz",     fr: "Environnement d'affaires", en: "Business Environment", wt: 26, c: "#E89A3C" },
];
export const ECO_TASKS = {
  people: [
    { id: "pe1", fr: "Bâtir une vision & un climat de confiance", en: "Build shared vision & trust", status: "build" },
    { id: "pe2", fr: "Gérer les conflits", en: "Manage conflict", status: "build" },
    { id: "pe3", fr: "Diriger l'équipe", en: "Lead the team", status: "build" },
    { id: "pe4", fr: "Soutenir la performance de l'équipe", en: "Support team performance", status: "build" },
    { id: "pe5", fr: "Mobiliser les parties prenantes", en: "Engage stakeholders", status: "amorce", area: "stakeholder", srcFr: "↔ Parties prenantes", srcEn: "↔ Stakeholder" },
    { id: "pe6", fr: "Négocier & bâtir le consensus", en: "Negotiate & build consensus", status: "build" },
    { id: "pe7", fr: "Assurer le transfert des connaissances", en: "Ensure knowledge transfer", status: "amorce", refs: ["4.4"], area: "integration", srcFr: "← processus 4.4", srcEn: "← process 4.4" },
    { id: "pe8", fr: "Planifier & gérer la communication", en: "Plan & manage communication", status: "amorce", area: "comms", srcFr: "↔ Communications", srcEn: "↔ Communications" },
  ],
  process: [
    { id: "pr1", fr: "Plan de management intégré & livraison", en: "Integrated PM plan & delivery", status: "solid", refs: ["4.1", "4.2", "4.3", "4.5"], area: "integration", srcFr: "← Intégration (banque approfondie)", srcEn: "← Integration (deep bank)" },
    { id: "pr2", fr: "Gérer le périmètre", en: "Manage scope", status: "solid", area: "scope", srcFr: "← Périmètre 5.x", srcEn: "← Scope 5.x" },
    { id: "pr3", fr: "Livraison par la valeur", en: "Value-based delivery", status: "build" },
    { id: "pr4", fr: "Planifier & gérer les ressources", en: "Plan & manage resources", status: "build", area: "resource" },
    { id: "pr5", fr: "Planifier & gérer les approvisionnements", en: "Plan & manage procurement", status: "build", area: "procurement" },
    { id: "pr6", fr: "Gérer les finances du projet", en: "Manage project finances", status: "build", area: "cost" },
    { id: "pr7", fr: "Gérer la qualité (+ durabilité)", en: "Manage quality (+ sustainability)", status: "build", area: "quality" },
    { id: "pr8", fr: "Planifier & gérer l'échéancier", en: "Plan & manage schedule", status: "solid", area: "schedule", srcFr: "← Échéancier 6.x", srcEn: "← Schedule 6.x" },
    { id: "pr9", fr: "Communiquer le statut du projet", en: "Communicate project status", status: "build" },
    { id: "pr10", fr: "Gérer la clôture du projet", en: "Manage project closure", status: "amorce", refs: ["4.7"], area: "integration", srcFr: "← processus 4.7", srcEn: "← process 4.7" },
  ],
  biz: [
    { id: "be1", fr: "Établir la gouvernance du projet", en: "Establish project governance", status: "build" },
    { id: "be2", fr: "Gérer la conformité (+ durabilité)", en: "Manage compliance (+ sustainability)", status: "build" },
    { id: "be3", fr: "Maîtrise intégrée des changements", en: "Manage integrated change control", status: "amorce", refs: ["4.6"], area: "integration", srcFr: "← processus 4.6", srcEn: "← process 4.6" },
    { id: "be4", fr: "Gérer les risques", en: "Manage risk", status: "amorce", area: "risk", srcFr: "↔ Risques", srcEn: "↔ Risk" },
    { id: "be5", fr: "Soutenir l'amélioration continue", en: "Support continuous improvement", status: "build" },
    { id: "be6", fr: "Soutenir le changement organisationnel", en: "Support organizational change", status: "build" },
    { id: "be7", fr: "Évaluer & livrer la valeur / bénéfices", en: "Evaluate & deliver value / benefits", status: "build" },
    { id: "be8", fr: "Environnement externe (IA, ESG)", en: "External environment (AI, ESG)", status: "build" },
  ],
};
export const ECOT = {
  title: { fr: "Parcours ECO 2026", en: "2026 ECO journey" },
  hint: { fr: "Touche un domaine pour ouvrir ses tâches", en: "Tap a domain to open its tasks" },
  tasks: { fr: "tâches", en: "tasks" },
  agile: { fr: "~60% agile & hybride · tissé partout", en: "~60% agile & hybrid · woven throughout" },
  review: { fr: "Réviser", en: "Review" },
  toBuild: { fr: "À bâtir — contenu à venir", en: "To build — content coming" },
  back: { fr: "Domaines", en: "Domains" },
  legend: { fr: "Solide · Amorcé · À bâtir", en: "Solid · Started · To build" },
  pick: { fr: "Sélectionne une tâche pour voir le détail.", en: "Pick a task to see its detail." },
};
export const ECO_STATUS_COLOR = { solid: "#3DA776", amorce: "#E89A3C", build: "#B8C2CC" };
