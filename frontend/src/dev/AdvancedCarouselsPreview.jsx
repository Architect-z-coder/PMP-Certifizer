import React, { useEffect, useState } from "react";
import { C, ECO_DOMAINS, ECO_TASKS } from "../pmp.js";
import ConnectedCarousel from "../ConnectedCarousel.jsx";
import LinearCarousel from "../LinearCarousel.jsx";
import CoverflowCarousel from "../CoverflowCarousel.jsx";
import { ArtCase, ArtCockpit, ArtCompass, ArtDomains, ArtLang, ArtLoop, ArtPath, ArtPortrait, ArtSite } from "./carouselArt.jsx";

/*
  DEV-ONLY tryout — /dev/advanced-carousels-preview.html (served by `npm run dev` only).
  Three 21st.dev carousels ported to Certifizer's stack, each furnished with Certifizer content.
  Everything is SAMPLE DATA: fictional learner, fictional scores. No API calls, nothing is saved,
  no button starts an assessment.
  To remove: delete src/dev/AdvancedCarouselsPreview.jsx, src/dev/advancedCarouselsPreviewMain.jsx,
  src/dev/carouselArt.jsx, dev/advanced-carousels-preview.html and the three src/*Carousel.jsx files.
*/

const SG = "'Space Grotesk', sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const dom = (id) => ECO_DOMAINS.find((d) => d.id === id);

function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const on = () => setW(window.innerWidth); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, []);
  return w;
}

const Sample = ({ dark }) => (
  <span style={{ fontFamily: MONO, fontSize: 10, color: dark ? "rgba(255,255,255,.8)" : C.muted, border: `1px dashed ${dark ? "rgba(255,255,255,.45)" : C.line}`, borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap" }}>Exemple</span>
);

/* ───────────────────────── 1 · Connected: the learner journey ───────────────────────── */

const JOURNEY = [
  { id: "j1", label: "Diagnostic", step: "Étape 1", stat: "26", statLabel: "tâches ECO 2026 situées", title: "Un premier diagnostic, tâche par tâche", body: "Une trentaine de questions situent chacune des 26 tâches de l'ECO 2026. Vous voyez d'emblée où vous êtes solide et où vous ne l'êtes pas encore.", domain: null, Art: ArtCompass },
  { id: "j2", label: "Priorités", step: "Étape 2", stat: "3", statLabel: "tâches à consolider d'abord", title: "Commencer par ce qui pèse le plus", body: "Gérer les risques, gérer les finances du projet et planifier l'échéancier ressortent sous 50 %. Ce sont elles qui ouvrent vos prochaines séances.", domain: "biz", Art: ArtDomains },
  { id: "j3", label: "Échéancier", step: "Étape 3", stat: "5", statLabel: "activités sur le chemin critique", title: "Lire un réseau comme à l'examen", body: "Vous tracez le chemin critique d'un réseau PERT, calculez les marges et voyez ce qu'un retard sur l'activité D change à la date de fin.", domain: "process", Art: ArtPath },
  { id: "j4", label: "Apprentissage adaptatif", step: "Étape 4", stat: "×3", statLabel: "retours d'une erreur, jusqu'à maîtrise", title: "Apprentissage adaptatif de vos erreurs", body: "Une question manquée revient sous un autre angle, à un autre moment, jusqu'à ce que la bonne réponse tienne. Rien n'est répété pour rien.", domain: "process", Art: ArtLoop },
  { id: "j5", label: "Relier à mon projet", step: "Étape 5", stat: "1", statLabel: "projet réel comme fil conducteur", title: "Relier chaque notion à votre chantier", body: "Vous décrivez votre projet en quelques lignes ; les cas d'examen s'y rattachent : vos parties prenantes, vos contraintes, vos arbitrages.", domain: "people", Art: ArtSite },
  { id: "j6", label: "Portrait honnête", step: "Étape 6", stat: "54 %", statLabel: "préparation estimée, jamais gonflée", title: "Savoir quand vous êtes prêt", body: "Le portrait ne s'arrondit jamais vers le haut. Tant qu'une tâche reste fragile, il vous le dit, et vous dit laquelle travailler.", domain: null, Art: ArtPortrait },
];

function JourneyPanel({ s }) {
  const d = s.domain && dom(s.domain);
  return (
    <div className="jp" style={{ position: "absolute", inset: 0, containerType: "size", color: C.text }}>
      <div className="jp-in">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted }}>{s.step}</span>
          <Sample />
        </div>
        <div className="jp-stat" style={{ fontFamily: SG, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em" }}>{s.stat}</div>
        <div className="jp-statlabel" style={{ color: C.muted }}>{s.statLabel}</div>
        <h3 className="jp-title" style={{ fontFamily: SG, fontWeight: 700, margin: 0, lineHeight: 1.15 }}>{s.title}</h3>
        <p className="jp-body" style={{ margin: 0, color: C.muted, lineHeight: 1.5 }}>{s.body}</p>
        <div style={{ marginTop: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, background: C.paper, borderRadius: 20, padding: "4px 10px", color: C.text }}>Profil d'exemple · ingénieure travaux</span>
          {d && <span style={{ fontSize: 11.5, borderRadius: 20, padding: "4px 10px", color: C.text, background: `${d.c}1f`, display: "inline-flex", alignItems: "center", gap: 6 }}><i style={{ width: 7, height: 7, borderRadius: 9, background: d.c, display: "inline-block" }} />{d.fr}</span>}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 2 · Linear: what Certifizer does ───────────────────────── */

const Detail = ({ text, points }) => (
  <>
    <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.55, color: C.muted }}>{text}</p>
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
      {points.map((p) => (
        <li key={p} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.45, color: C.text }}>
          <span aria-hidden="true" style={{ flex: "0 0 auto", width: 18, height: 18, marginTop: 1, borderRadius: 9, background: `${C.teal}22`, color: C.teal, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>✓</span>{p}
        </li>
      ))}
    </ul>
  </>
);

const FEATURES = [
  { id: "f1", category: "Plan d'examen", title: "Parcours ECO 2026", art: <ArtDomains />, detail: <Detail text="Tout le parcours suit le plan de l'examen : trois domaines pondérés 33 / 41 / 26 et leurs 26 tâches." points={["Personnes 33 %, Processus 41 %, Environnement d'affaires 26 %", "Chaque question est rattachée à une tâche précise", "Environ 60 % d'agile et d'hybride, tissé partout"]} /> },
  { id: "f2", category: "Échéancier", title: "Chemin critique", art: <ArtPath />, detail: <Detail text="Des réseaux PERT à lire, à compléter et à faire glisser, comme dans les questions situationnelles." points={["Marges totales et libres calculées pas à pas", "Effet d'un retard sur la date de fin", "Compression : accélération ou chevauchement"]} /> },
  { id: "f3", category: "Méthode", title: "Apprentissage adaptatif de vos erreurs", art: <ArtLoop />, detail: <Detail text="Ce que vous manquez revient, reformulé, jusqu'à ce que la bonne réponse tienne dans la durée." points={["Une erreur revient sous un autre angle", "Les tâches solides cèdent la place aux fragiles", "Vous voyez pourquoi chaque question vous est proposée"]} /> },
  { id: "f4", category: "Mise en situation", title: "Relier à mon projet", art: <ArtSite />, detail: <Detail text="Vous décrivez votre projet réel ; les cas d'examen s'appuient sur vos parties prenantes et vos contraintes." points={["Quelques lignes suffisent pour démarrer", "Vos exemples restent privés", "Les notions abstraites prennent un visage concret"]} /> },
  { id: "f5", category: "Entraînement", title: "Cas d'examen situationnels", art: <ArtCase />, detail: <Detail text="Des scénarios à plusieurs bonnes réponses apparentes, où il faut choisir la meilleure, comme le jour de l'examen." points={["Explication de chaque option, pas seulement de la bonne", "Repère vers la tâche ECO concernée", "Séances courtes, d'environ 15 minutes"]} /> },
  { id: "f6", category: "Formateurs", title: "Cockpit de cohorte", art: <ArtCockpit />, detail: <Detail text="Le formateur voit sa cohorte d'un coup d'œil, tâche par tâche, sans noms de clients ni données superflues." points={["Cohortes codées, par exemple PMP-2026-A", "Tâches fragiles communes à la cohorte", "Séances ciblées à proposer au groupe"]} /> },
  { id: "f7", category: "Préparation", title: "Portrait honnête", art: <ArtPortrait />, detail: <Detail text="Votre préparation est estimée sans arrondi flatteur : on vous dit où vous en êtes, et ce qui manque." points={["Jamais gonflé pour rassurer", "Une tâche fragile reste visible tant qu'elle l'est", "La prochaine étape est toujours nommée"]} /> },
  { id: "f8", category: "Langues", title: "Bilingue FR / EN", art: <ArtLang />, detail: <Detail text="Chaque question, explication et écran existe en français et en anglais ; vous passez de l'un à l'autre à tout moment." points={["Vocabulaire PMI en anglais à côté du français", "Utile si vous passez l'examen en anglais", "Même progression dans les deux langues"]} /> },
];

/* ───────────────────────── 3 · Coverflow: the 26 ECO tasks ───────────────────────── */

// Sample mastery per area (0–1). Fictional learner.
const SAMPLE_SCORE = {
  pe_vision: 0.78, pe_conflict: 0.64, pe_lead: 0.71, pe_performance: 0.6, stakeholder: 0.52, pe_negotiation: 0.57, pe_knowledge: 0.68, comms: 0.69,
  integration: 0.58, scope: 0.73, pr_value: 0.5, resource: 0.62, procurement: 0.44, cost: 0.41, quality: 0.66, schedule: 0.46,
  be_governance: 0.49, be_compliance: 0.53, risk: 0.37, be_improvement: 0.61, be_orgchange: 0.48, be_value: 0.55, be_external: 0.43,
};
const ALL_TASKS = ECO_DOMAINS.flatMap((d) => (ECO_TASKS[d.id] || []).map((t, i) => ({ ...t, domain: d, n: i + 1, label: t.fr })));
const hash = (str) => [...str].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 997, 7);
const answered = (area) => 4 + (hash(area) % 19);
const lastSeen = (area) => ["aujourd'hui", "hier", "il y a 3 jours", "il y a 6 jours"][hash(area) % 4];
const level = (s) => (s >= 0.7 ? { t: "Solide", c: C.green } : s >= 0.5 ? { t: "En progrès", c: C.amber } : { t: "Fragile", c: C.red });

function TaskCard({ t, active, onReview }) {
  const s = SAMPLE_SCORE[t.area] ?? 0.5; const lv = level(s); const pct = Math.round(s * 100);
  return (
    <div style={{ width: "100%", height: "100%", borderRadius: 20, background: "#fff", border: `1px solid ${C.line}`, boxShadow: active ? "0 30px 50px -28px rgba(14,26,43,.55)" : "0 16px 30px -24px rgba(14,26,43,.45)", overflow: "hidden", display: "flex", flexDirection: "column", userSelect: "none" }}>
      <div style={{ background: t.domain.c, color: "#fff", padding: "11px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.domain.fr}</span>
        <span style={{ fontFamily: MONO, fontSize: 11.5, opacity: 0.9, whiteSpace: "nowrap", flex: "0 0 auto" }}>Tâche {t.n}</span>
      </div>
      <div style={{ padding: "14px 16px 14px", display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0 }}>
        <div style={{ fontFamily: SG, fontWeight: 700, fontSize: 18, lineHeight: 1.2, color: C.text }}>{t.fr}</div>
        <div style={{ fontSize: 12, color: C.muted }}>{answered(t.area)} réponses · dernière séance {lastSeen(t.area)}</div>
        <div style={{ marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12, color: C.muted, marginBottom: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><i style={{ width: 7, height: 7, borderRadius: 9, background: lv.c, display: "inline-block" }} />{lv.t}</span>
            <span style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", color: C.text }}>{pct} %</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: C.paper, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: lv.c, borderRadius: 6 }} /></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Sample />
          {active && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onReview(t); }} style={{ border: 0, borderRadius: 999, padding: "7px 14px", background: C.ink, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Réviser</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */

function SectionHead({ n, id, kicker, title, text, credit }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "8px 24px", marginBottom: 22 }}>
      <div style={{ maxWidth: 640, minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".08em", textTransform: "uppercase", color: C.teal }}>{n} · {kicker}</div>
        <h2 id={id} style={{ fontFamily: SG, fontWeight: 700, fontSize: "clamp(24px, 3.4vw, 34px)", lineHeight: 1.1, margin: "6px 0 8px", color: C.text, letterSpacing: "-.01em", textWrap: "balance" }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: C.muted, textWrap: "pretty" }}>{text}</p>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{credit}</div>
    </div>
  );
}

export default function AdvancedCarouselsPreview() {
  const w = useWidth();
  const narrow = w < 640;
  const [motion, setMotion] = useState(true);
  const [filter, setFilter] = useState("all");
  const [note, setNote] = useState("");
  const tasks = filter === "all" ? ALL_TASKS : ALL_TASKS.filter((t) => t.domain.id === filter);
  const firstFragile = Math.max(0, tasks.findIndex((t) => (SAMPLE_SCORE[t.area] ?? 0.5) < 0.4));

  useEffect(() => { if (!note) return; const t = setTimeout(() => setNote(""), 3200); return () => clearTimeout(t); }, [note]);

  const journeyItems = JOURNEY.map((s) => ({ id: s.id, label: s.label, art: <s.Art />, content: <JourneyPanel s={s} /> }));
  const pad = narrow ? 16 : 28;

  return (
    <div style={{ minHeight: "100vh", background: C.paper, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; } body { margin: 0; } button { font-family: inherit; }
        .jp-in { height: 100%; display: flex; flex-direction: column; gap: 8px; padding: 34px 30px 28px; }
        .jp-stat { font-size: 68px; line-height: 1; margin-top: 18px; }
        .jp-statlabel { font-size: 13.5px; margin-bottom: 18px; }
        .jp-title { font-size: 23px; }
        .jp-body { font-size: 14.5px; }
        @container (max-height: 360px) {
          .jp-in { padding: 16px 18px 16px; gap: 5px; }
          .jp-stat { font-size: 40px; margin-top: 6px; }
          .jp-statlabel { font-size: 12px; margin-bottom: 6px; }
          .jp-title { font-size: 18px; }
          .jp-body { font-size: 13px; line-height: 1.45; }
        }
        @container (max-width: 300px) and (min-height: 361px) { .jp-in { padding: 26px 22px 22px; } .jp-stat { font-size: 54px; } .jp-title { font-size: 20px; } }
        .acp-nav a { color: ${C.text}; text-decoration: none; font-size: 13px; padding: 7px 12px; border-radius: 999px; border: 1px solid ${C.line}; background: #fff; white-space: nowrap; }
        .acp-nav a:hover { background: ${C.ink}; color: #fff; border-color: ${C.ink}; }
        .acp-nav a:focus-visible, .acp-seg button:focus-visible, .acp-toggle:focus-within { outline: 2px solid ${C.amber}; outline-offset: 2px; }
        .acp-seg button { border: 0; background: none; padding: 7px 12px; border-radius: 8px; font-size: 13px; color: ${C.muted}; cursor: pointer; white-space: nowrap; }
        .acp-seg button[aria-pressed="true"] { background: ${C.ink}; color: #fff; }
        section[id] { scroll-margin-top: 80px; }
      `}</style>

      <header style={{ position: narrow ? "relative" : "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}`, padding: `12px ${pad}px`, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px" }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <h1 style={{ fontFamily: SG, fontWeight: 700, fontSize: 18, margin: 0 }}>Certifizer — Carrousels avancés</h1>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Aperçu de développement · données d'exemple · aucune action réelle</div>
        </div>
        <nav className="acp-nav" aria-label="Sections" style={{ display: "flex", gap: 6, overflowX: "auto", maxWidth: "100%" }}>
          <a href="#parcours">1 · Parcours</a><a href="#fonctions">2 · Fonctionnalités</a><a href="#taches">3 · Tâches ECO</a>
        </nav>
        <label className="acp-toggle" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: C.muted, cursor: "pointer", borderRadius: 8 }}>
          <input type="checkbox" checked={motion} onChange={(e) => setMotion(e.target.checked)} style={{ accentColor: C.ink }} /> Défilement automatique
        </label>
      </header>

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: `${narrow ? 28 : 48}px ${pad}px 64px`, display: "flex", flexDirection: "column", gap: narrow ? 56 : 88 }}>
        <section id="parcours" aria-labelledby="h-parcours">
          <SectionHead n="01" id="h-parcours" kicker="Connected Carousel" title="Votre parcours, étape par étape" text="Six étapes reliées, du diagnostic au portrait de préparation. Survolez pour mettre en pause ; flèches du clavier, balayage ou onglets pour naviguer." credit="Adapté de 21st.dev · @arunachalam" />
          <ConnectedCarousel items={journeyItems} autoplay={motion} interval={6000} label="Parcours d'apprentissage" bridgeColor={C.ink} accent={C.amber} tabColor={C.ink} mutedColor={C.muted} />
        </section>

        <section id="fonctions" aria-labelledby="h-fonctions">
          <SectionHead n="02" id="h-fonctions" kicker="Linear Carousel" title="Ce que Certifizer fait pour vous" text="Une bande continue que l'on fait glisser à la souris ou au doigt. Ouvrez une carte pour le détail ; Échap pour la refermer." credit="Adapté de 21st.dev · animbits" />
          <div style={{ marginInline: narrow ? -pad : 0 }}>
            <LinearCarousel items={FEATURES} autoplay={motion} label="Fonctionnalités" accent={C.amber} ink={C.ink} textColor={C.text} mutedColor={C.muted} />
          </div>
        </section>

        <section id="taches" aria-labelledby="h-taches">
          <SectionHead n="03" id="h-taches" kicker="Coverflow Carousel" title="Les 26 tâches de l'ECO 2026" text="Chaque carte est une tâche du plan d'examen, avec la maîtrise d'un apprenant fictif. Filtrez par domaine ; la carte centrale propose une révision." credit="Adapté de 21st.dev · @educalvolpz" />
          <div className="acp-seg" role="group" aria-label="Filtrer par domaine" style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: 3, border: `1px solid ${C.line}`, borderRadius: 10, background: "#fff", width: "fit-content", maxWidth: "100%", marginBottom: 8 }}>
            {[{ id: "all", fr: "Toutes (26)" }, ...ECO_DOMAINS.map((d) => ({ id: d.id, fr: `${d.fr} (${(ECO_TASKS[d.id] || []).length})` }))].map((f) => (
              <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.fr}</button>
            ))}
          </div>
          <CoverflowCarousel key={filter} items={tasks} startIndex={firstFragile} loop autoplay={false} cardWidth={narrow ? 236 : 300} cardHeight={narrow ? 232 : 248} label="Tâches ECO 2026" accent={C.amber} ink={C.ink}
            renderCard={(t, { active }) => <TaskCard t={t} active={active} onReview={(x) => setNote(`Aperçu : « Réviser ${x.fr} » ne lance rien pour l'instant.`)} />} />
          <div role="status" style={{ minHeight: 22, marginTop: 10, textAlign: "center", fontSize: 13, color: C.muted }}>{note}</div>
        </section>

        <footer style={{ borderTop: `1px solid ${C.line}`, paddingTop: 18, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          Aperçu visuel seulement : apprenant fictif, scores fictifs, aucun appel réseau, rien n'est enregistré. Visuels dessinés en SVG.
        </footer>
      </main>
    </div>
  );
}
