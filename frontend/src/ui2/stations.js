// Carte de maîtrise — the 12 stations of the mock-up (positions as drawn there, 760×420 viewBox),
// each mapped to one or more ECO 2026 tasks of pmp.js. FIRST DRAFT for review: one comment per line.
//
// `tasks`  : pmp.js task ids (ECO_TASKS) — drive the node state (evidence rolled up from getMastery()).
// `engine` : task ids as the backend names them in /api/readiness `top_levers[].area` (PE1…BE8, canonical
//            ECO 2026 list in backend/reference). They draw the amber route. pmp.js and the canonical list
//            differ on a few tasks (pe4–pe6, be4–be7): the pairing below is by meaning, not by number.
// `area`   : knowledge area sent to getQuizNext(learnerId, area) by « Me tester sur ce sujet ».
// `level`  : 0 Connaître · 1 Appliquer · 2 Décider en situation · 3 Juger sous pression (column of the map).
export const STATIONS = [
  { id: "N1", x: 88, y: 205, level: 0, fr: "Intégration & charte", en: "Integration & charter",
    tasks: ["pr1", "pr10"], engine: ["PR1", "PR10"], area: "integration" },            // plan de management intégré (pr1) ; la clôture (pr10) reste de l'intégration (4.7)
  { id: "N2", x: 172, y: 112, level: 0, fr: "Périmètre & WBS", en: "Scope & WBS",
    tasks: ["pr2"], engine: ["PR2"], area: "scope" },                                   // gérer le périmètre (5.x)
  { id: "N3", x: 172, y: 300, level: 0, fr: "Échéancier", en: "Schedule",
    tasks: ["pr8"], engine: ["PR8"], area: "schedule" },                                // planifier & gérer l'échéancier (6.x)
  { id: "N4", x: 300, y: 330, level: 1, fr: "Budget & valeur acquise", en: "Budget & earned value",
    tasks: ["pr6", "pr4", "pr5"], engine: ["PR6", "PR4", "PR5"], area: "cost" },         // finances (EVM, 7.x) ; ressources (9.x) et approvisionnements (12.x) rangés avec les moyens — à revoir
  { id: "N5", x: 290, y: 108, level: 1, fr: "Qualité & communications", en: "Quality & communications",
    tasks: ["pr7", "pe8", "pr9"], engine: ["PR7", "PE8", "PR9"], area: "quality" },      // qualité (8.x) ; communication (PE.8) ; statut du projet (PR.9) = communiquer l'état
  { id: "N6", x: 300, y: 212, level: 1, fr: "Risques", en: "Risk",
    tasks: ["be4"], engine: ["BE5", "BE4"], area: "risk" },                             // pmp.js be4 = gérer les risques ; côté moteur BE5 = risques, BE4 = obstacles & problèmes (même station — à revoir)
  { id: "N7", x: 440, y: 212, level: 2, fr: "Parties prenantes", en: "Stakeholders",
    tasks: ["pe5"], engine: ["PE4", "PE5", "PE6"], area: "stakeholder" },               // mobiliser (PE4), aligner (PE5) et gérer (PE6) les attentes : une seule tâche pmp.js (pe5)
  { id: "N8", x: 470, y: 330, level: 2, fr: "Gérer les changements", en: "Manage changes",
    tasks: ["be3", "be6"], engine: ["BE3", "BE7"], area: "integration" },               // maîtrise intégrée des changements (4.6, zone integration) ; changement organisationnel (be6 / BE7)
  { id: "N9", x: 452, y: 96, level: 2, fr: "Équipe & conflits", en: "Team & conflict",
    tasks: ["pe2", "pe3", "pe4", "pe6", "pe1", "pe7"], engine: ["PE1", "PE2", "PE3", "PE7"], area: "pe_conflict" }, // conflits, diriger, performance, négocier, vision, transfert : le domaine Personnes hors parties prenantes
  { id: "N10", x: 600, y: 128, level: 3, fr: "Gouvernance & conformité", en: "Governance & compliance",
    tasks: ["be1", "be2", "be8"], engine: ["BE1", "BE2", "BE8"], area: "be_governance" }, // gouvernance (BE.1), conformité (BE.2), environnement externe IA/ESG (BE.8)
  { id: "N11", x: 600, y: 272, level: 3, fr: "Valeur & bénéfices", en: "Value & benefits",
    tasks: ["be7", "pr3", "be5"], engine: ["PR3", "BE6"], area: "be_value" },           // valeur & bénéfices (be7), livraison par la valeur (pr3 / PR3), amélioration continue (be5 / BE6)
  { id: "N12", x: 700, y: 205, level: 3, fr: "Examen blanc · jugement", en: "Mock exam · judgment",
    tasks: [], engine: [], area: null, soon: true },                                    // pas de tâche : l'examen blanc n'existe pas dans l'API → « bientôt »
];

/** Soft links of the mock-up (left → right). */
export const LINKS = [["N1", "N2"], ["N1", "N3"], ["N2", "N5"], ["N2", "N6"], ["N3", "N6"], ["N3", "N4"], ["N5", "N9"], ["N6", "N7"], ["N4", "N8"], ["N7", "N8"], ["N7", "N10"], ["N9", "N10"], ["N8", "N11"], ["N10", "N12"], ["N11", "N12"]];

/** Four level words along the bottom, and the column separators (x) of the map. */
export const LEVELS = [["1 · Connaître", "1 · Know"], ["2 · Appliquer", "2 · Apply"], ["3 · Décider", "3 · Decide"], ["4 · Juger", "4 · Judge"]];
export const COLS = [20, 230, 390, 550, 740];

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s]));
/** engine task id (PE1…) → station */
export const STATION_OF_ENGINE = {};
STATIONS.forEach((s) => s.engine.forEach((e) => { STATION_OF_ENGINE[e] = s.id; }));
/** pmp.js task id (pe1…) → station */
export const STATION_OF_TASK = {};
STATIONS.forEach((s) => s.tasks.forEach((t) => { STATION_OF_TASK[t] = s.id; }));
