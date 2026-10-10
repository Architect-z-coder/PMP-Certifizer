// Sample data for the lab. Everything here is "Exemple" — no real learner, no client name.
// ECO 2026: official EN titles (PMI) + Certifizer FR translations (non officielles).

export const DOMAINS = [
  { id: 'people', code: 'PEOPLE', fr: 'Personnes', en: 'People', short: 'Les gens', weight: 0.33, tasks: 8 },
  { id: 'process', code: 'PROCESS', fr: 'Processus', en: 'Process', short: 'Le projet', weight: 0.41, tasks: 10 },
  { id: 'business', code: 'BUSINESS_ENVIRONMENT', fr: "Environnement d'affaires", en: 'Business Environment', short: "L'entreprise", weight: 0.26, tasks: 8 },
]

export const TASKS = [
  ['PE1','people','Développer une vision commune','Develop a common vision',4],
  ['PE2','people','Gérer les conflits','Manage conflicts',6],
  ['PE3','people',"Diriger l'équipe de projet",'Lead the project team',7],
  ['PE4','people','Mobiliser les parties prenantes','Engage stakeholders',6],
  ['PE5','people','Aligner les attentes des parties prenantes','Align stakeholder expectations',4],
  ['PE6','people','Gérer les attentes des parties prenantes','Manage stakeholder expectations',3],
  ['PE7','people','Assurer le transfert des connaissances','Help ensure knowledge transfer',3],
  ['PE8','people','Planifier et gérer la communication','Plan and manage communication',6],
  ['PR1','process','Élaborer un plan de management de projet intégré et planifier la livraison','Develop an integrated project management plan and plan delivery',9],
  ['PR2','process','Élaborer et gérer le périmètre du projet','Develop and manage project scope',3],
  ['PR3','process','Favoriser une livraison fondée sur la valeur','Help ensure value-based delivery',6],
  ['PR4','process','Planifier et gérer les ressources','Plan and manage resources',2],
  ['PR5','process','Planifier et gérer les approvisionnements','Plan and manage procurement',10],
  ['PR6','process','Planifier et gérer les finances','Plan and manage finance',7],
  ['PR7','process','Planifier et optimiser la qualité des produits/livrables','Plan and optimize quality of products/deliverables',7],
  ['PR8','process',"Planifier et gérer l'échéancier",'Plan and manage schedule',8],
  ['PR9','process',"Évaluer l'état du projet",'Evaluate project status',8],
  ['PR10','process','Gérer la clôture du projet','Manage project closure',4],
  ['BE1','business','Définir et établir la gouvernance du projet','Define and establish project governance',3],
  ['BE2','business','Planifier et gérer la conformité du projet','Plan and manage project compliance',7],
  ['BE3','business','Gérer et maîtriser les changements','Manage and control changes',4],
  ['BE4','business','Lever les obstacles et gérer les problèmes','Remove impediments and manage issues',6],
  ['BE5','business','Planifier et gérer les risques','Plan and manage risk',7],
  ['BE6','business','Amélioration continue','Continuous improvement',3],
  ['BE7','business','Soutenir le changement organisationnel','Support organizational change',2],
  ['BE8','business',"Évaluer les évolutions de l'environnement d'affaires externe",'Evaluate external business environment changes',3],
].map(([id, domain, fr, en, enablers]) => ({ id, domain, fr, en, enablers }))

// 13 themes (zone visible de l'interface). Un thème regroupe plusieurs tâches officielles;
// la maîtrise reste enregistrée par tâche (politique de conception Certifizer).
export const THEMES = [
  { id: 't1', domain: 'people', fr: "Mener l'équipe", en: 'Lead the team', tasks: ['PE3','PE1'] },
  { id: 't2', domain: 'people', fr: 'Tensions & accord', en: 'Tension & agreement', tasks: ['PE2'] },
  { id: 't3', domain: 'people', fr: 'Impliquer', en: 'Engage', tasks: ['PE4','PE5','PE6'] },
  { id: 't4', domain: 'people', fr: 'Transmettre', en: 'Transfer knowledge', tasks: ['PE7','PE8'] },
  { id: 't5', domain: 'process', fr: 'Cadrer', en: 'Frame', tasks: ['PR1','PR2'] },
  { id: 't6', domain: 'process', fr: 'Temps & argent', en: 'Time & money', tasks: ['PR8','PR6'] },
  { id: 't7', domain: 'process', fr: 'Ressources & achats', en: 'Resources & procurement', tasks: ['PR4','PR5'] },
  { id: 't8', domain: 'process', fr: 'Qualité & valeur', en: 'Quality & value', tasks: ['PR7','PR3'] },
  { id: 't9', domain: 'process', fr: 'Suivre & clôturer', en: 'Track & close', tasks: ['PR9','PR10'] },
  { id: 't10', domain: 'business', fr: 'Gouvernance', en: 'Governance', tasks: ['BE1','BE2'] },
  { id: 't11', domain: 'business', fr: 'Risques & obstacles', en: 'Risk & impediments', tasks: ['BE5','BE4'] },
  { id: 't12', domain: 'business', fr: 'Changement', en: 'Change', tasks: ['BE3','BE7'] },
  { id: 't13', domain: 'business', fr: 'Amélioration & externe', en: 'Improvement & external', tasks: ['BE6','BE8'] },
]

// Readiness tiers — exactly as backend/app/mastery.py READINESS_LABELS
export const READINESS_TIERS = [
  { min: 0.85, code: 'exam_ready', fr: "Prêt·e pour l'examen", en: 'Exam-ready', tier: 4 },
  { min: 0.70, code: 'close', fr: 'Presque prêt·e', en: 'Close', tier: 3 },
  { min: 0.50, code: 'building', fr: 'En construction', en: 'Building', tier: 2 },
  { min: 0.0, code: 'not_ready', fr: 'Pas encore prêt·e', en: 'Not ready', tier: 1 },
]
export const tierOf = (score) => READINESS_TIERS.find(t => score >= t.min)

// Task light (mastery.py light()): untested | red <0.5 | amber <0.75 | green
export const lightOf = (score, attempts) => attempts === 0 ? 'untested' : score < 0.5 ? 'fragile' : score < 0.75 ? 'progress' : 'solid'
export const LIGHT_LABEL = {
  untested: { fr: 'À découvrir', en: 'To discover', tier: 0 },
  fragile: { fr: 'Fragile', en: 'Fragile', tier: 1 },
  progress: { fr: 'En progression', en: 'In progress', tier: 2 },
  solid: { fr: 'Maîtrisé', en: 'Mastered', tier: 3 },
}

// Exemple learner — "Exemple" everywhere it is shown
export const LEARNER = { name: 'Nadia (Exemple)', initials: 'NE', cohort: 'PMP-2026-A', plan: 'free', examDate: '2026-11-14' }

// Per-task mastery for the example learner (score 0..1, direct attempts)
const M = {
  PE1:[0.62,5], PE2:[0.81,9], PE3:[0.77,8], PE4:[0.44,6], PE5:[0,0], PE6:[0,0], PE7:[0.86,7], PE8:[0.58,6],
  PR1:[0.73,12], PR2:[0.88,14], PR3:[0.41,7], PR4:[0,0], PR5:[0.69,8], PR6:[0.52,5], PR7:[0.3,4], PR8:[0.9,15], PR9:[0.76,9], PR10:[0.83,9],
  BE1:[0.79,10], BE2:[0.47,6], BE3:[0.84,9], BE4:[0.33,4], BE5:[0.55,6], BE6:[0.71,5], BE7:[0,0], BE8:[0.36,4],
}
export const MASTERY = TASKS.map(t => {
  const [score, attempts] = M[t.id]
  const d = DOMAINS.find(x => x.id === t.domain)
  const weight = d.weight / d.tasks
  return { ...t, score, attempts, covered: attempts > 0, weight, light: lightOf(score, attempts), lever: weight * (1 - (attempts ? score : 0)) }
})

export function readiness() {
  const domains = DOMAINS.map(d => {
    const ts = MASTERY.filter(m => m.domain === d.id)
    const avg = ts.reduce((s, m) => s + (m.covered ? m.score : 0), 0) / ts.length
    return { ...d, score: avg, covered: ts.filter(m => m.covered).length }
  })
  const score = domains.reduce((s, d) => s + d.score * d.weight, 0)
  return { score, label: tierOf(score), domains }
}

export const LEVERS = [...MASTERY].sort((a, b) => b.lever - a.lever).slice(0, 4)
export const STALE = MASTERY.filter(m => m.score >= 0.75).slice(0, 2)
export const TOTAL_ATTEMPTS = MASTERY.reduce((s, m) => s + m.attempts, 0)

export const SESSION = {
  size: 10, minutes: 15,
  composition: { weak: 4, missed: 3, maintenance: 1, weighted: 2 },
}

export const MISSED = [
  { id: 'be-x-BE.4-02', task: 'BE4', fr: 'Un fournisseur critique annonce un retard de 3 semaines. Le sponsor demande une réponse sous 24 h. Que faites-vous en premier ?', due: 'aujourd’hui', stage: 0, miss: 2 },
  { id: 'pr-x-PR.3-05', task: 'PR3', fr: 'Le product owner conteste la valeur d’un incrément livré. Quelle action illustre le mieux une livraison fondée sur la valeur ?', due: 'aujourd’hui', stage: 1, miss: 1 },
  { id: 'pr-x-PR.7-01', task: 'PR7', fr: 'Les tests de recette révèlent 14 anomalies mineures récurrentes. Quelle est l’action la plus appropriée ?', due: 'dans 2 jours', stage: 0, miss: 3 },
  { id: 'be-x-BE.8-01', task: 'BE8', fr: 'Une nouvelle réglementation locale entre en vigueur en cours de projet. Comment l’évaluer ?', due: 'dans 5 jours', stage: 1, miss: 1 },
]

export const REFLEXES = [
  { text: 'Avant de répondre au sponsor, je qualifie l’impact sur le chemin critique, pas seulement sur la tâche.', seat: 'moa', seatLabel: 'Maître d’ouvrage', at: '28 sept.' },
  { text: 'Une anomalie récurrente est un signal de processus, pas un défaut isolé : je remonte à la cause.', seat: 'moe', seatLabel: 'Maître d’œuvre', at: '21 sept.' },
  { text: 'Je sépare ce que le client veut de ce que le contrat dit, puis je négocie l’écart explicitement.', seat: 'both', seatLabel: 'Les deux angles', at: '14 sept.' },
]

export const ASSIGNED = [
  { id: 'a1', title: 'Risques & obstacles — révision ciblée', questions: 8, status: 'pending', by: 'votre formateur' },
]

export const QUESTION = {
  id: 'be-x-BE.4-02', task: 'BE4', difficulty: 2, type: 'scenario',
  prompt: 'Vous dirigez la rénovation d’une station de pompage. Un fournisseur critique annonce un retard de trois semaines sur la livraison des pompes. Le sponsor demande une réponse sous 24 heures. Quelle est votre première action ?',
  options: [
    'Demander immédiatement une rallonge budgétaire pour un fournisseur de substitution.',
    'Évaluer l’impact du retard sur le chemin critique et les options de réponse avant de répondre au sponsor.',
    'Informer le sponsor que le projet sera livré avec trois semaines de retard.',
    'Escalader le problème au comité de pilotage sans analyse préalable.',
  ],
  answer: 1,
  rationale: 'Lever un obstacle commence par qualifier son impact réel. Un retard fournisseur ne décale le projet que s’il touche le chemin critique ; l’analyse précède toute réponse au sponsor et toute demande de ressources. (ECO 2026 · BE4 · Lever les obstacles et gérer les problèmes)',
}

export const TRAJECTORY = [
  { day: '18 août', r: 0.21 }, { day: '25 août', r: 0.27 }, { day: '1 sept.', r: 0.31 }, { day: '8 sept.', r: 0.34 },
  { day: '15 sept.', r: 0.40 }, { day: '22 sept.', r: 0.44 }, { day: '29 sept.', r: 0.49 },
]

// Cohort — Exemple. Codes génériques, jamais de nom de client.
export const COHORT = {
  code: 'PMP-2026-A', name: 'Promotion de démonstration (Exemple)', size: 14, seats: 20, examDate: '2026-11-14',
  learners: [
    ['Nadia','NE',0.49,3,118],['Karim','KB',0.87,1,204],['Léa','LF',0.72,2,160],['Yacine','YM',0.31,12,42],['Sofia','SR',0.66,0,131],
    ['Idir','IA',0.91,2,221],['Amina','AT',0.54,5,97],['Mehdi','MK',0.22,19,28],['Inès','IZ',0.78,1,176],['Rayan','RD',0.58,4,104],
    ['Lina','LB',0.44,8,73],['Omar','OS',0.69,3,142],['Sara','SC',0.83,0,198],['Nour','NH',0.37,6,61],
  ].map(([name, initials, r, inactive, attempts]) => ({ name: `${name} (Exemple)`, initials, readiness: r, inactive, attempts })),
}
export const cohortBand = (l) => l.inactive > 7 || l.readiness < 0.5 ? 'accompany' : l.readiness < 0.7 ? 'consolidate' : l.readiness < 0.85 ? 'challenge' : 'maintain'
export const BANDS = [
  { id: 'accompany', fr: 'À accompagner', sub: 'bloqués ou inactifs', tier: 1 },
  { id: 'consolidate', fr: 'À consolider', sub: 'proches du seuil', tier: 2 },
  { id: 'challenge', fr: 'À challenger', sub: 'solides, niveau examen', tier: 3 },
  { id: 'maintain', fr: 'À maintenir', sub: 'prêts, entretien léger', tier: 4 },
]

// Cohort average per task — Exemple
export const COHORT_TASKS = TASKS.map((t, i) => {
  const base = [0.62,0.71,0.68,0.41,0.33,0.0,0.74,0.55,0.66,0.79,0.38,0.29,0.6,0.5,0.35,0.82,0.7,0.76,0.72,0.44,0.77,0.31,0.52,0.64,0.2,0.39][i]
  const tested = base === 0 ? 0 : Math.round(6 + (i * 7) % 8)
  return { ...t, avg: base, tested, fragile: base === 0 ? 0 : Math.round(tested * Math.max(0, 0.9 - base)) }
})

export const FLAGS = [
  { id: 'pr-x-PR.5-07', count: 3, reason: 'Deux réponses semblent défendables (B et D).' },
  { id: 'pe-x-PE.2-01', count: 1, reason: 'Traduction EN ambiguë sur « escalate ».' },
]

export const INVITATIONS = [
  { who: 'Samir (Exemple)', email: 's.exemple@formation.example', status: 'pending', link: 'https://certifizer.app/?invite=k3Jx9…' },
  { who: 'Hana (Exemple)', email: 'h.exemple@formation.example', status: 'accepted', link: '' },
  { who: 'Formateur adjoint', email: 'adjoint@formation.example', status: 'revoked', link: '', role: 'trainer' },
]

export const BANK = [
  { id: 'be-x-BE.5-03', task: 'BE5', difficulty: 2, prompt: 'Le registre des risques n’a pas été revu depuis trois mois. Quelle action prioritaire ?' },
  { id: 'be-x-BE.4-05', task: 'BE4', difficulty: 3, prompt: 'Un obstacle réglementaire bloque la mise en service. Le comité attend une recommandation.' },
  { id: 'pr-x-PR.8-02', task: 'PR8', difficulty: 1, prompt: 'Quelle technique estime la durée d’une activité à partir de trois valeurs ?' },
  { id: 'pe-x-PE.4-02', task: 'PE4', difficulty: 2, prompt: 'Un élu local s’oppose publiquement au projet. Quelle stratégie d’engagement ?' },
]

export const DELIVERABLES = [
  { id: 'charte', fr: 'Charte de projet', task: 'BE1', state: 'applique', hint: 'Objectifs, périmètre de haut niveau, parties prenantes clés.' },
  { id: 'wbs', fr: 'Structure de découpage (WBS)', task: 'PR2', state: 'compris', hint: 'Exigences + périmètre défini → WBS.' },
  { id: 'risques', fr: 'Registre des risques', task: 'BE5', state: 'decouvert', hint: 'Identification, analyse qualitative, réponses.' },
  { id: 'comm', fr: 'Plan de communication', task: 'PE8', state: 'decouvert', hint: 'Qui, quoi, quand, par quel canal.' },
]
export const EVIDENCE_STATES = [
  ['decouvert','Découvert'],['compris','Compris'],['applique','Appliqué'],['valide','Validé'],['retenu','Retenu'],['transfere','Transféré'],
]
