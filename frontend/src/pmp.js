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
  { id: "process", fr: "Groupes de processus", en: "Process groups", code: "PG" },
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
  welcomeSub: { fr: "Entrez votre nom ou un code pour suivre votre progression sur cet appareil.", en: "Enter your name or a code to track your progress on this device." },
  namePh: { fr: "Votre nom ou un code…", en: "Your name or a code…" },
  startBtn: { fr: "Commencer", en: "Start" },
  trainerLink: { fr: "Vous êtes formateur ? Accès cockpit", en: "Are you a trainer? Cockpit access" },
  classLink: { fr: "J'ai un code de classe", en: "I have a class code" },
  classTitle: { fr: "Rejoindre votre classe", en: "Join your class" },
  classSub: { fr: "Votre formateur vous a communiqué un code de classe. Saisissez-le pour rejoindre la cohorte et recevoir ses séances.", en: "Your trainer gave you a class code. Enter it to join the cohort and receive their sessions." },
  classCodePh: { fr: "PMP-2026-A", en: "PMP-2026-A" },
  classCodeLabel: { fr: "Code de classe", en: "Class code" },
  classNameLabel: { fr: "Votre nom", en: "Your name" },
  classJoinBtn: { fr: "Rejoindre la cohorte", en: "Join the cohort" },
  classFound: { fr: "✓ Classe trouvée", en: "✓ Class found" },
  classJoining: { fr: "Connexion…", en: "Joining…" },
  emailRecTitle: { fr: "Retrouvez-vous partout", en: "Find yourself everywhere" },
  emailRecSub: { fr: "Pour retrouver votre progression sur votre téléphone et votre ordinateur, ajoutez votre email — un lien de connexion vous y sera envoyé quand vous en aurez besoin.", en: "To find your progress on your phone and computer, add your email — a sign-in link will be sent there when you need it." },
  emailRecLabel: { fr: "Email (facultatif)", en: "Email (optional)" },
  emailRecBtn: { fr: "Lier mon email", en: "Link my email" },
  emailRecLater: { fr: "Plus tard", en: "Later" },
  emailRecPrivacy: { fr: "Nous n'envoyons jamais de publicité. L'email sert uniquement à retrouver votre compte.", en: "We never send advertising. Your email is only used to recover your account." },
  emailRecDone: { fr: "✓ Email lié — vous pourrez vous reconnecter partout.", en: "✓ Email linked — you can now reconnect anywhere." },
  emailRecSettings: { fr: "Lier un email de récupération", en: "Link a recovery email" },
  recoverLink: { fr: "Déjà inscrit ? Retrouver ma progression", en: "Already registered? Recover my progress" },
  recoverTitle: { fr: "Retrouver ma progression", en: "Recover my progress" },
  recoverSub: { fr: "Saisissez l'email lié à votre compte. Nous vous enverrons un lien de connexion — aucun mot de passe à retenir.", en: "Enter the email linked to your account. We'll send you a sign-in link — no password to remember." },
  recoverBtn: { fr: "M'envoyer un lien de connexion", en: "Send me a sign-in link" },
  recoverSending: { fr: "Envoi…", en: "Sending…" },
  magicChecking: { fr: "Connexion en cours…", en: "Signing you in…" },
  magicOk: { fr: "Vous voilà de retour — progression conservée.", en: "You're back — progress kept." },
  magicExpired: { fr: "Ce lien de connexion a expiré. Demandez-en un nouveau depuis l'accueil.", en: "This sign-in link has expired. Request a new one from the home screen." },
  magicInvalid: { fr: "Ce lien de connexion n'est pas valide.", en: "This sign-in link is not valid." },
  magicContinue: { fr: "Continuer vers Certifizer", en: "Continue to Certifizer" },
  trainerAccess: { fr: "Accès formateur", en: "Trainer access" },
  trainerPh: { fr: "Identifiant formateur…", en: "Trainer identifier…" },
  trainerOpen: { fr: "Ouvrir le cockpit", en: "Open the cockpit" },
  backLink: { fr: "← Retour", en: "← Back" },
  switchUser: { fr: "changer", en: "switch" },
  cockpitTitle: { fr: "Cockpit formateur", en: "Trainer cockpit" },
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

// ---- Process groups — RÉFÉRENTIEL DE PRATIQUE, pas la structure de l'examen.
// L'examen suit l'ECO 2026 (3 domaines / 26 tâches). Ce découpage reste un
// échafaudage mental utile, mais ne doit JAMAIS être présenté comme le blueprint. ----
export const PG = {
  init:  { fr: "Démarrage", en: "Initiating", c: "#8A6FB0" },
  plan:  { fr: "Planification", en: "Planning", c: "#2E8C9E" },
  exec:  { fr: "Exécution", en: "Executing", c: "#3DA776" },
  mc:    { fr: "Maîtrise", en: "M&C", c: "#E89A3C" },
  close: { fr: "Clôture", en: "Closing", c: "#D2664E" },
};

// ---- Processus par domaine de connaissance (héritage PMBOK 6).
// Conservé comme aide au raisonnement — PAS comme architecture de l'examen. ----
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

// ---- Ma préparation (learner cockpit, wave 18) ----
export const PT = {
  prepa: { fr: "Ma préparation", en: "My preparation" },
  portrait: { fr: "Mon portrait", en: "My portrait" },
  reglages: { fr: "Réglages", en: "Settings" },
  hello: { fr: "Bonjour", en: "Hello" },
  readyLabel: { fr: "Prêt·e examen", en: "Exam-ready" },
  readyHint: { fr: "Ton indice pondère ta maîtrise par le poids réel de l'examen (33·41·26).", en: "Your index weights mastery by the real exam weights (33·41·26)." },
  priorityNow: { fr: "Priorité du moment", en: "Top priority now" },
  attempts: { fr: "Tentatives", en: "Attempts" },
  streak: { fr: "Série", en: "Streak" },
  exam: { fr: "Examen 09/07", en: "Exam 07/09" },
  days: { fr: "j", en: "d" },
  sessionTitle: { fr: "Séance du jour", en: "Today's session" },
  sessionSub: { fr: "questions · ≈ 15 min · composée pour toi", en: "questions · ≈ 15 min · composed for you" },
  launch: { fr: "Lancer ma séance", en: "Start my session" },
  compWeak: { fr: "leviers prioritaires", en: "priority levers" },
  compMissed: { fr: "à retravailler", en: "to review" },
  compMaint: { fr: "entretien", en: "maintenance" },
  byDomain: { fr: "Ma maîtrise par domaine", en: "My mastery by domain" },
  levers: { fr: "Mes leviers prioritaires", en: "My priority levers" },
  leversSub: { fr: "poids examen × faiblesse", en: "exam weight × weakness" },
  revise: { fr: "Réviser", en: "Review" },
  missedTitle: { fr: "À retravailler — mes questions ratées", en: "To review — my missed questions" },
  missedEmpty: { fr: "Aucune question en attente de révision. Beau travail !", en: "No questions due for review. Nice work!" },
  replay: { fr: "Rejouer mes ratées", en: "Replay my missed" },
  reflexTitle: { fr: "Mes réflexes", en: "My reflexes" },
  reflexEmpty: { fr: "Sauve des réflexes depuis le mode Cas réel pour bâtir ta bibliothèque de jugement.", en: "Save reflexes from Cas réel mode to build your judgment library." },
  domPeople: { fr: "Personnes", en: "People" },
  domProcess: { fr: "Processus", en: "Process" },
  domBusiness: { fr: "Env. d'affaires", en: "Business Env." },
  loading: { fr: "Chargement de ta préparation…", en: "Loading your preparation…" },
  needData: { fr: "Réponds à quelques questions (mode « Me tester ») pour activer ton tableau de préparation.", en: "Answer a few questions (Quiz mode) to activate your preparation cockpit." },
  strong: { fr: "fort", en: "strong" },
  weak: { fr: "fragile", en: "shaky" },
  missCount: { fr: "ratée", en: "missed" },
  reviewDue: { fr: "à revoir", en: "due" },
  sessLoading: { fr: "Préparation de ta séance…", en: "Preparing your session…" },
  sessRetry: { fr: "Le serveur se réveille — réessayer", en: "Server waking up — retry" },
  sessGo: { fr: "Question", en: "Question" },
  sessOf: { fr: "sur", en: "of" },
  sessNext: { fr: "Continuer →", en: "Continue →" },
  sessFinish: { fr: "Terminer la séance", en: "Finish session" },
  sessDone: { fr: "Séance terminée !", en: "Session complete!" },
  sessScore: { fr: "Ton score", en: "Your score" },
  sessCorrect: { fr: "bonnes réponses", en: "correct" },
  sessAgain: { fr: "Nouvelle séance", en: "New session" },
  sessBack: { fr: "Retour à ma préparation", en: "Back to my preparation" },
  sessReflex: { fr: "⟡ À retenir", en: "⟡ Key takeaway" },
  correct: { fr: "Correct", en: "Correct" },
  incorrect: { fr: "Incorrect", en: "Incorrect" },
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
    { id: "pe1", fr: "Bâtir une vision & un climat de confiance", en: "Build shared vision & trust", status: "solid", refs: ["PE.1"], area: "pe_vision", srcFr: "← banque People", srcEn: "← People bank" },
    { id: "pe2", fr: "Gérer les conflits", en: "Manage conflict", status: "solid", refs: ["PE.2"], area: "pe_conflict", srcFr: "← banque People", srcEn: "← People bank" },
    { id: "pe3", fr: "Diriger l'équipe", en: "Lead the team", status: "solid", refs: ["PE.3"], area: "pe_lead", srcFr: "← banque People", srcEn: "← People bank" },
    { id: "pe4", fr: "Soutenir la performance de l'équipe", en: "Support team performance", status: "solid", refs: ["PE.4"], area: "pe_performance", srcFr: "← banque People", srcEn: "← People bank" },
    { id: "pe5", fr: "Mobiliser les parties prenantes", en: "Engage stakeholders", status: "solid", refs: ["PE.5"], area: "stakeholder", srcFr: "← banque People ↔ Parties prenantes", srcEn: "← People bank ↔ Stakeholder" },
    { id: "pe6", fr: "Négocier & bâtir le consensus", en: "Negotiate & build consensus", status: "solid", refs: ["PE.6"], area: "pe_negotiation", srcFr: "← banque People", srcEn: "← People bank" },
    { id: "pe7", fr: "Assurer le transfert des connaissances", en: "Ensure knowledge transfer", status: "solid", refs: ["4.4", "PE.7"], area: "pe_knowledge", srcFr: "← banque People + processus 4.4", srcEn: "← People bank + process 4.4" },
    { id: "pe8", fr: "Planifier & gérer la communication", en: "Plan & manage communication", status: "solid", refs: ["PE.8"], area: "comms", srcFr: "← banque People ↔ Communications", srcEn: "← People bank ↔ Communications" },
  ],
  process: [
    { id: "pr1", fr: "Plan de management intégré & livraison", en: "Integrated PM plan & delivery", status: "solid", refs: ["4.1", "4.2", "4.3", "4.5"], area: "integration", srcFr: "← Intégration (banque approfondie)", srcEn: "← Integration (deep bank)" },
    { id: "pr2", fr: "Gérer le périmètre", en: "Manage scope", status: "solid", area: "scope", srcFr: "← Périmètre 5.x", srcEn: "← Scope 5.x" },
    { id: "pr3", fr: "Livraison par la valeur", en: "Value-based delivery", status: "solid", refs: ["PR.3"], area: "pr_value", srcFr: "← banque Processus", srcEn: "← Process bank" },
    { id: "pr4", fr: "Planifier & gérer les ressources", en: "Plan & manage resources", status: "solid", refs: ["9.3", "9.4", "9.6"], area: "resource", srcFr: "← Ressources 9.x", srcEn: "← Resource 9.x" },
    { id: "pr5", fr: "Planifier & gérer les approvisionnements", en: "Plan & manage procurement", status: "solid", refs: ["12.1", "12.3"], area: "procurement", srcFr: "← Approvisionnement 12.x", srcEn: "← Procurement 12.x" },
    { id: "pr6", fr: "Gérer les finances du projet", en: "Manage project finances", status: "solid", refs: ["7.3", "7.4"], area: "cost", srcFr: "← Coûts 7.x (EVM, réserves)", srcEn: "← Cost 7.x (EVM, reserves)" },
    { id: "pr7", fr: "Gérer la qualité (+ durabilité)", en: "Manage quality (+ sustainability)", status: "solid", refs: ["8.1", "8.2"], area: "quality", srcFr: "← Qualité 8.x + ESG", srcEn: "← Quality 8.x + ESG" },
    { id: "pr8", fr: "Planifier & gérer l'échéancier", en: "Plan & manage schedule", status: "solid", area: "schedule", srcFr: "← Échéancier 6.x", srcEn: "← Schedule 6.x" },
    { id: "pr9", fr: "Communiquer le statut du projet", en: "Communicate project status", status: "solid", refs: ["PR.9"], area: "comms", srcFr: "← banque Processus ↔ Communications", srcEn: "← Process bank ↔ Communications" },
    { id: "pr10", fr: "Gérer la clôture du projet", en: "Manage project closure", status: "solid", refs: ["4.7"], area: "integration", srcFr: "← Clôture 4.7 (approfondie)", srcEn: "← Closure 4.7 (deepened)" },
  ],
  biz: [
    { id: "be1", fr: "Établir la gouvernance du projet", en: "Establish project governance", status: "solid", refs: ["BE.1"], area: "be_governance", srcFr: "← Gouvernance (banque approfondie)", srcEn: "← Governance (deep bank)" },
    { id: "be2", fr: "Gérer la conformité (+ durabilité)", en: "Manage compliance (+ sustainability)", status: "solid", refs: ["BE.2"], area: "be_compliance", srcFr: "← Conformité & ESG (banque approfondie)", srcEn: "← Compliance & ESG (deep bank)" },
    { id: "be3", fr: "Maîtrise intégrée des changements", en: "Manage integrated change control", status: "solid", refs: ["4.6"], area: "integration", srcFr: "← Intégration 4.6 (approfondie)", srcEn: "← Integration 4.6 (deepened)" },
    { id: "be4", fr: "Gérer les risques", en: "Manage risk", status: "solid", refs: ["11.1", "11.5"], area: "risk", srcFr: "← Risques (banque approfondie)", srcEn: "← Risk (deep bank)" },
    { id: "be5", fr: "Soutenir l'amélioration continue", en: "Support continuous improvement", status: "solid", refs: ["BE.5"], area: "be_improvement", srcFr: "← Amélioration continue (banque approfondie)", srcEn: "← Continuous improvement (deep bank)" },
    { id: "be6", fr: "Soutenir le changement organisationnel", en: "Support organizational change", status: "solid", refs: ["BE.6"], area: "be_orgchange", srcFr: "← Changement organisationnel (banque approfondie)", srcEn: "← Org change (deep bank)" },
    { id: "be7", fr: "Évaluer & livrer la valeur / bénéfices", en: "Evaluate & deliver value / benefits", status: "solid", refs: ["BE.7"], area: "be_value", srcFr: "← Valeur & bénéfices (banque approfondie)", srcEn: "← Value & benefits (deep bank)" },
    { id: "be8", fr: "Environnement externe (IA, ESG)", en: "External environment (AI, ESG)", status: "solid", refs: ["BE.8"], area: "be_external", srcFr: "← IA, ESG & externe (banque approfondie)", srcEn: "← AI, ESG & external (deep bank)" },
  ],
};
// BE task-areas that aren't among the 10 knowledge areas but ARE quizzable
export const BE_AREAS = ["be_governance", "be_compliance", "be_improvement", "be_orgchange", "be_value", "be_external"];
// People-domain quizzable areas (non-KA), same pattern as BE_AREAS.
// pe5 reuses the existing 'stakeholder' KA and pe8 reuses 'comms' -> zero wiring for those.
export const PEOPLE_AREAS = ["pe_vision", "pe_conflict", "pe_lead", "pe_performance", "pe_negotiation", "pe_knowledge"];
// Process-domain quizzable areas (non-KA): value delivery is ECO-new; the other
// filled tasks (resources, procurement, finances, quality, status, closure) reuse existing KAs.
export const PR_AREAS = ["pr_value"];
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
