// « Présentation » — the Chantier entry page of ui-lab (ui-lab/chantier.html → src/chantier/pages/Story.jsx), ported into
// ui2 as its first screen. Same text, sections, images and GSAP motion: hero + Gantt, the film that grows, 26 tasks →
// 3 domains, the critical path lights up, deliverables scroll sideways, the honest ring, people, trainers, film CTA.
// Differences with ui-lab, on purpose:
//  - every call to action opens the existing ui2 Access screen (`onCta(view)`: "main" | "class" | "trainer");
//    a signed-in learner is taken to Aujourd'hui instead;
//  - in-page links scroll without touching the hash (ui2 routes on #/…);
//  - no Lenis (it would be a new dependency): native scroll + GSAP ScrollTrigger;
//  - sample numbers are marked « Exemple » and never rounded up (the page promises it);
//  - the texts that were French-only (Gantt, network, deliverables, cohort, footer) have their English version.
import React, { useEffect, useRef, useState } from "react";
import "./landing.css";
import { ECO_DOMAINS } from "../../pmp.js";
import { useGsap } from "../motion.js";
import { gsap, ScrollTrigger, AFTER_PINS, ScrollProgress, Reveal, VideoScrollHero, HorizontalScrollGallery, RevealImageMask, ScrollRevealImage, Film } from "./landing-parts.jsx";

// Media are imported (not served from public/): Vite emits them only in the build that reaches this module,
// i.e. VITE_UI=chantier. The default build never references them, so it never ships them.
import boardPoster from "../assets/board-poster.webp";
import boardMp4 from "../assets/board.mp4";
import colleagues from "../assets/colleagues.webp";
import learnerPhoto from "../assets/learner.webp";
import pmPoster from "../assets/pm-poster.webp";
import pmMp4 from "../assets/pm.mp4";
import scenarioPhoto from "../assets/scenario.webp";
import siteEngineer from "../assets/site-engineer.webp";
import sitePoster from "../assets/site-poster.webp";
import siteMp4 from "../assets/site.mp4";
import teamRoadmap from "../assets/team-roadmap.webp";
import trainerPhoto from "../assets/trainer.webp";

const MEDIA = {
  "board-poster.webp": boardPoster, "board.mp4": boardMp4, "colleagues.webp": colleagues, "learner.webp": learnerPhoto,
  "pm-poster.webp": pmPoster, "pm.mp4": pmMp4, "scenario.webp": scenarioPhoto, "site-engineer.webp": siteEngineer,
  "site-poster.webp": sitePoster, "site.mp4": siteMp4, "team-roadmap.webp": teamRoadmap, "trainer.webp": trainerPhoto,
};
const M = (f) => MEDIA[f];
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const readLS = (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const writeLS = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
const floor1 = (x) => Math.floor(x * 10 + 1e-9) / 10;   // one decimal, never rounded up

/* ---------- hero Gantt (data from the reference page) ---------- */
const ROWS = [[["Diagnostic", "Diagnostic"], 0, 0.8, "process"], [["Personnes", "People"], 0.6, 2.4, "people"], [["Processus", "Process"], 1.2, 3.6, "process"], [["Gérer les risques", "Manage risk"], 1.8, 3.4, "accent"], [["Échéancier", "Schedule"], 3.4, 4.6, "accent"], [["Env. d'affaires", "Business env."], 2.4, 4.8, "biz"], [["Examen blanc", "Mock exam"], 5.0, 5.9, "fg"]];
const X0 = 150, W = 390, WK = W / 6, R0 = 34, RH = 40;
function Gantt({ t }) {
  const color = (c) => (c === "accent" ? "var(--accent)" : c === "fg" ? "var(--fg)" : `var(--${c})`);
  return (
    <svg id="gantt" viewBox="0 0 560 330" role="img" aria-labelledby="gantt-t">
      <title id="gantt-t">{t("Sept lots de travail répartis sur six semaines, le lot critique en ambre", "Seven work packages over six weeks, the critical one in amber")}</title>
      {Array.from({ length: 7 }, (_, w) => <g key={w}><line x1={X0 + w * WK} x2={X0 + w * WK} y1={18} y2={R0 + ROWS.length * RH - 6} stroke="var(--line)" strokeWidth="1" />{w < 6 && <text x={X0 + w * WK + 6} y={14} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--muted)">{t("S", "W")}{w + 1}</text>}</g>)}
      {ROWS.map(([label, a, b, c], i) => <g key={label[0]}><text x={0} y={R0 + i * RH + 17} fontFamily="Public Sans, sans-serif" fontSize="13" fill="var(--fg)">{t(label[0], label[1])}</text><rect className="gantt-bar" x={X0 + a * WK} y={R0 + i * RH + 4} width={(b - a) * WK} height={18} rx={9} fill={color(c)} /></g>)}
      <path className="gantt-link" d={`M ${X0 + 3.4 * WK} ${R0 + 3 * RH + 13} C ${X0 + 3.5 * WK} ${R0 + 3 * RH + 30}, ${X0 + 3.3 * WK} ${R0 + 4 * RH - 6}, ${X0 + 3.4 * WK + 2} ${R0 + 4 * RH + 6}`} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" />
      <g className="gantt-today" transform={`translate(${X0 + 2.3 * WK},0)`}><line x1={0} x2={0} y1={22} y2={R0 + ROWS.length * RH - 4} stroke="var(--fg)" strokeWidth="1.5" /><circle cx={0} cy={22} r={4} fill="var(--fg)" /><text x={6} y={R0 + ROWS.length * RH - 8} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--fg)">{t("aujourd'hui", "today")}</text></g>
    </svg>
  );
}

/* ---------- scene 1: 26 dots (8 · 10 · 8 tasks, the ECO 2026 domains of pmp.js) ---------- */
const GROUPS = [{ id: "people", n: 8, cx: 120 }, { id: "process", n: 10, cx: 320 }, { id: "biz", n: 8, cx: 520 }];
const DOTS = (() => { let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); const out = []; GROUPS.forEach((gr) => { const cols = 2, gap = 46, rowsN = Math.ceil(gr.n / cols); for (let i = 0; i < gr.n; i++) { const col = i % cols, row = Math.floor(i / cols); out.push({ id: gr.id, fx: gr.cx + (col - 0.5) * gap + (row % 2 ? 10 : -10), fy: 470 - (rowsN - 1 - row) * gap - 20, sx: 30 + rnd() * 580, sy: 30 + rnd() * 400 }); } }); return out; })();

/* ---------- scene 2: PERT ---------- */
const N = { S: [40, 220, ["Diagnostic", "Diagnostic"]], R: [190, 120, ["Risques", "Risk"]], I: [190, 330, ["Intégration", "Integration"]], E: [340, 120, ["Échéancier", "Schedule"]], Q: [340, 330, ["Qualité", "Quality"]], F: [480, 200, ["Finances", "Finance"]], C: [480, 360, ["Communication", "Communication"]], P: [600, 120, ["Parties prenantes", "Stakeholders"]], X: [620, 300, ["Examen", "Exam"]] };
const EDGES = [["S", "R", 1], ["S", "I", 0], ["R", "E", 1], ["I", "Q", 0], ["I", "E", 0], ["E", "F", 1], ["Q", "F", 0], ["Q", "C", 0], ["F", "P", 1], ["C", "X", 0], ["P", "X", 1]];
const CRIT = ["S", "R", "E", "F", "P", "X"];
const SEQ = [["S", "R"], ["R", "E"], ["E", "F"], ["F", "P"], ["P", "X"]];

/* ---------- the example learner of ui-lab (src/data.js) — « Exemple » everywhere it shows ----------
   Its four levers (exam weight of the task × (1 − mastery), as the engine computes them) and its readiness, 0.5467.
   Gains are the lever itself in points, one decimal, never rounded up; readiness is floored (54, not 55). */
const SAMPLE_LEVERS = [
  { id: "PE5", fr: "Aligner les attentes des parties prenantes", en: "Align stakeholder expectations", lever: 0.04125 },
  { id: "PE6", fr: "Gérer les attentes des parties prenantes", en: "Manage stakeholder expectations", lever: 0.04125 },
  { id: "PR4", fr: "Planifier et gérer les ressources", en: "Plan and manage resources", lever: 0.041 },
  { id: "BE7", fr: "Soutenir le changement organisationnel", en: "Support organizational change", lever: 0.0325 },
];
const STEPS = SAMPLE_LEVERS.map((l, i) => ({ ...l, gain: floor1(l.lever * 100), locked: i >= 2 }));
const SAMPLE_READINESS = 0.546745;
const READY = Math.floor(SAMPLE_READINESS * 100);
const READY_LABEL = { fr: "En construction", en: "Building" };      // engine tier for 0.50–0.70
const RR = 160, CIRC = 2 * Math.PI * RR;
const DOMAINS = ECO_DOMAINS.map((d) => ({ id: d.id, fr: d.fr, en: d.en, weight: d.wt }));

/** Holds the motion choice (OS setting or the footer toggle) and remounts the page body when it changes: GSAP's revert
 *  restores the start state of what it animated, so the body is rebuilt fresh, straight in its final state. */
export default function Landing({ reduced: osReduced, ...props }) {
  const [userReduced, setUserReduced] = useState(() => readLS("cz_ui2_reduced") === "true");
  const reduced = osReduced || userReduced;
  const toggleMotion = () => { const v = !userReduced; setUserReduced(v); writeLS("cz_ui2_reduced", String(v)); };
  useEffect(() => { window.scrollTo(0, 0); }, []);   // the page starts at the top
  return <LandingBody key={reduced ? "still" : "motion"} {...props} reduced={reduced} osReduced={osReduced} userReduced={userReduced} onToggleMotion={toggleMotion} />;
}

function LandingBody({ lang, setLang, reduced, osReduced, userReduced, onToggleMotion, signedIn, onCta }) {
  const t = (fr, en) => (lang === "en" && en ? en : fr);
  const mainRef = useRef(null);

  // ScrollTrigger re-measures when the language or the web fonts change the layout (App2 adds the font stylesheet
  // after this effect runs, so wait for each font load to finish rather than for document.fonts.ready alone)
  useEffect(() => { requestAnimationFrame(() => ScrollTrigger.refresh()); }, [lang]);
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts || reduced) return undefined;
    let raf = 0;
    const refresh = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => ScrollTrigger.refresh()); };
    fonts.addEventListener("loadingdone", refresh);
    fonts.ready.then(refresh);
    return () => { fonts.removeEventListener("loadingdone", refresh); cancelAnimationFrame(raf); };
  }, [reduced]);

  const cta = (view) => (e) => { if (e) e.preventDefault(); onCta(view); };
  const jump = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };
  const toTop = (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); };
  const toMain = (e) => { e.preventDefault(); if (mainRef.current) mainRef.current.focus(); };

  const root = useGsap((el) => {
    ScrollTrigger.create({ start: 8, end: "max", toggleClass: { targets: el.querySelector(".bar"), className: "scrolled" } });
    // hero load sequence (one entrance)
    const heroTl = gsap.timeline({ defaults: { ease: "expo.out" } });
    heroTl.from(".hero h1 .ln > span", { yPercent: 110, duration: 1.15, stagger: 0.09 })
      .fromTo(".hero h1 .site", { "--u": 0 }, { "--u": 1, duration: 0.9, ease: "power3.inOut" }, "-=0.55")
      .from(".hero .eyebrow, .hero .lead, .hero-cta, .hero-alt, .facts > div", { y: 18, opacity: 0, filter: "blur(8px)", duration: 0.8, stagger: 0.06, clearProps: "filter" }, "-=1.0")
      .from(".gantt-bar", { attr: { width: 0 }, duration: 1.0, stagger: 0.07, ease: "power4.out" }, 0.25)
      .from(".gantt-link", { opacity: 0, duration: 0.6 }, "-=0.3");
    gsap.to(".gantt-today", { attr: { transform: `translate(${X0 + 2.9 * WK},0)` }, duration: 6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.6 });
    gsap.to(".hero-media .gantt", { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.fromTo(".hero-photo img", { scale: 1.12, yPercent: -4 }, { scale: 1.02, yPercent: 4, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    const mm = gsap.matchMedia();
    mm.add({ desk: "(min-width: 961px)", mob: "(max-width: 960px)" }, (ctx) => {
      const { desk } = ctx.conditions;
      const pinLen = desk ? "+=140%" : "+=110%";
      // scene 1: scattered → three domains
      const t1 = gsap.timeline({ scrollTrigger: { trigger: '[data-pin="tasks"]', start: "top top", end: pinLen, scrub: 0.8, pin: true } });
      el.querySelectorAll("#dots circle[data-fx]").forEach((c, i) => t1.to(c, { attr: { cx: +c.dataset.fx, cy: +c.dataset.fy, fill: css("--" + c.dataset.id) }, duration: 1, ease: "power3.inOut" }, (i % 13) * 0.025));
      el.querySelectorAll("#taches .count").forEach((n) => { const o = { v: 0 }; t1.fromTo(o, { v: 0 }, { v: +n.dataset.to, duration: 0.8, ease: "power2.out", onUpdate: () => { n.textContent = Math.round(o.v); } }, 0.3); });
      // scene 2: the critical path draws and lights four steps
      const t2 = gsap.timeline({ scrollTrigger: { trigger: '[data-pin="path"]', start: "top top", end: desk ? "+=180%" : "+=140%", scrub: 0.8, pin: true } });
      const node = (k) => el.querySelector(`#pert [data-node="${k}"]`);
      const edge = (a, b) => el.querySelector(`#pert [data-edge="${a}${b}"]`);
      el.querySelectorAll('#pert path[data-crit="1"]').forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); });
      t2.to(node("S"), { attr: { fill: css("--accent"), stroke: css("--accent") }, duration: 0.2 });
      SEQ.forEach(([a, b]) => { t2.to(edge(a, b), { strokeDashoffset: 0, duration: 1, ease: "none" }).to(node(b), { attr: { fill: css("--accent"), stroke: css("--accent"), r: b === "X" ? 18 : 15 }, duration: 0.25, ease: "back.out(3)" }); });
      const steps = [...el.querySelectorAll(".steps li")]; const segDur = 1.25, head = 0.2, total = head + SEQ.length * segDur;
      t2.eventCallback("onUpdate", () => steps.forEach((li, i) => li.classList.toggle("on", t2.progress() >= (head + segDur * (i + 1)) / total)));
      // scene 4: the ring fills to the (example) value and stops
      const arc = el.querySelector("#ring-arc"), val = el.querySelector("#ringval"); const o = { v: 0 };
      gsap.set(arc, { attr: { "stroke-dashoffset": CIRC } });
      gsap.timeline({ scrollTrigger: { trigger: '[data-pin="ring"]', start: "top top", end: desk ? "+=110%" : "+=90%", scrub: 0.8, pin: true } })
        .to(o, { v: READY, duration: 1, ease: "power2.inOut", onUpdate: () => { val.textContent = Math.floor(o.v); arc.setAttribute("stroke-dashoffset", CIRC * (1 - o.v / 100)); } })
        .from(".truths p", { x: -14, opacity: 0, stagger: 0.18, duration: 0.4 }, 0.55);
      return () => { steps.forEach((li) => li.classList.remove("on")); };
    });
    el.querySelectorAll(".meter i").forEach((m) => gsap.from(m, { scaleX: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: m, start: "top 90%", once: true, refreshPriority: AFTER_PINS } }));
    // the parts' triggers were created before these pins: re-sort (pins first, by refreshPriority) and re-measure
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }, [reduced], reduced);

  // deliverables: per-card entrances driven by the gallery's containerAnimation (as in the 21st gallery demo)
  const onGallery = (hz) => {
    if (!root.current) return undefined;
    const ctx = gsap.context(() => {
      const ph = root.current.querySelector(".doc.photo");
      if (ph) gsap.fromTo(ph, { clipPath: "inset(0 0 100% 0 round 16px)" }, { clipPath: "inset(0 0 0% 0 round 16px)", duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".hz", start: "top 60%", toggleActions: "play none none reverse", refreshPriority: AFTER_PINS - 1 } });
      root.current.querySelectorAll(".doc:not(.photo)").forEach((doc) => {
        const st = { trigger: doc, containerAnimation: hz, start: "left 82%", toggleActions: "play none none reverse", refreshPriority: AFTER_PINS - 1 };
        gsap.from(doc.querySelectorAll(".rl, tr, .node"), { scaleX: 0, opacity: 0, transformOrigin: "0 50%", stagger: 0.05, duration: 0.6, ease: "power3.out", scrollTrigger: st });
        gsap.from(doc.querySelector(".stamp, .lvl"), { scale: 1.6, opacity: 0, rotate: -12, duration: 0.5, delay: 0.35, ease: "back.out(2.4)", scrollTrigger: { ...st } });
        gsap.fromTo(doc, { rotate: 2.5, y: 30 }, { rotate: 0, y: 0, ease: "none", scrollTrigger: { trigger: doc, containerAnimation: hz, start: "left right", end: "left 40%", scrub: true, refreshPriority: AFTER_PINS - 1 } });
      });
    }, root);
    return () => ctx.revert();
  };

  const startLabel = t("Commencer", "Start");
  return (
    <div className={`ld${reduced ? " reduced" : ""}`} ref={root}>
      <ScrollProgress reduced={reduced} />
      <a className="skip" href="#ld-main" onClick={toMain}>{t("Aller au contenu", "Skip to content")}</a>
      <header className="bar" id="bar">
        <div className="wrap bar-in">
          <a className="brand" href="#top" onClick={toTop} aria-label={t("Certifizer, haut de page", "Certifizer, top of page")}>
            <svg width="30" height="30" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 6 L34 31 L6 31 Z" fill="none" stroke="var(--accent)" strokeWidth="2.8" strokeLinejoin="round" /><circle cx="20" cy="6" r="3.2" fill="var(--accent)" /><circle cx="6" cy="31" r="3.2" fill="var(--fg)" /><circle cx="34" cy="31" r="3.2" fill="var(--process)" /></svg>
            Certifizer
          </a>
          <nav className="nav" aria-label={t("Sections", "Sections")}>
            <a href="#taches" onClick={jump("taches")}>{t("Les 26 tâches", "The 26 tasks")}</a><a href="#chemin" onClick={jump("chemin")}>{t("Chemin critique", "Critical path")}</a><a href="#projet" onClick={jump("projet")}>{t("Votre projet", "Your project")}</a><a href="#formateurs" onClick={jump("formateurs")}>{t("Formateurs", "Trainers")}</a>
          </nav>
          <div className="lang" role="group" aria-label={t("Langue", "Language")}>
            <button type="button" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>FR</button><button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
          </div>
          <button type="button" className="btn btn-primary" onClick={cta("main")}>{signedIn ? t("Aujourd'hui", "Today") : startLabel}</button>
        </div>
      </header>

      <main id="ld-main" ref={mainRef} tabIndex={-1}>
        <section className="wrap hero" aria-labelledby="hero-title">
          <div>
            <p className="eyebrow">{t("Préparation PMP · ECO 2026", "PMP exam prep · ECO 2026")}</p>
            <h1 id="hero-title" style={{ marginTop: 18 }}>
              <span className="ln"><span>{t("Préparez le PMP", "Prepare the PMP")}</span></span>
              <span className="ln"><span>{t("sur votre vrai", "on your real")}</span></span>
              <span className="ln"><span className="site">{t("chantier.", "project.")}</span></span>
            </h1>
            <p className="lead">{t("Une préparation adaptative et bilingue, fidèle au plan d'examen 2026. Vous vous entraînez sur votre propre projet, et votre indice de préparation n'est jamais gonflé.", "Adaptive, bilingual preparation built on the 2026 exam outline. You practise on your own project, and your readiness score is never inflated.")}</p>
            <div className="hero-cta">
              <button type="button" className="btn btn-primary" onClick={cta("main")}>{t("Faire mon diagnostic", "Take my diagnostic")} <span className="arr" aria-hidden="true">→</span></button>
              <a className="btn btn-ghost" href="#chemin" onClick={jump("chemin")}>{t("Voir comment ça marche", "See how it works")}</a>
            </div>
            <button type="button" className="hero-alt" onClick={cta("class")}>{t("J'ai un code de classe", "I have a class code")} <span aria-hidden="true">→</span></button>
            <div className="facts">
              <div><b>26</b><span>{t("tâches ECO 2026", "ECO 2026 tasks")}</span></div>
              <div><b>33 · 41 · 26</b><span>{t("poids des domaines, %", "domain weights, %")}</span></div>
              <div><b>FR / EN</b><span>{t("partout", "everywhere")}</span></div>
            </div>
          </div>
          <div className="hero-media">
            <div className="hero-photo"><img src={M("site-engineer.webp")} alt={t("Une ingénieure en casque et gilet de sécurité consulte un plan sur sa tablette devant un chantier au coucher du soleil", "An engineer in a hard hat and safety vest checks a plan on her tablet in front of a construction site at sunset")} width="900" height="1117" fetchpriority="high" /></div>
            <figure className="gantt" aria-label={t("Exemple d'échéancier de préparation sur six semaines", "Example six-week preparation schedule")}>
              <div className="gantt-head"><p className="gantt-title">{t("Votre échéancier de préparation", "Your preparation schedule")}</p><span className="tag">{t("Exemple", "Example")}</span></div>
              <Gantt t={t} />
            </figure>
          </div>
        </section>

        <VideoScrollHero src={M("site.mp4")} poster={M("site-poster.webp")} reduced={reduced} label={t("Votre projet sert de manuel", "Your project is the textbook")}>
          <p className="eyebrow">{t("Votre projet sert de manuel", "Your project is the textbook")}</p>
          <h2 id="treel">{t("Chaque notion PMP, reliée à un vrai chantier.", "Every PMP notion, tied to a real worksite.")}</h2>
          <p>{t("Risques, échéancier, parties prenantes : vous les révisez sur le projet que vous menez vraiment.", "Risks, schedule, stakeholders: you revise them on the project you actually run.")}</p>
        </VideoScrollHero>

        {/* Scene 1 */}
        <section className="scene" id="taches" aria-labelledby="t1">
          <div className="wrap stage" data-pin="tasks">
            <div className="scene-grid">
              <div className="scene-copy">
                <p className="eyebrow">{t("Le plan de l'examen", "The exam blueprint")}</p>
                <h2 id="t1">{t("26 tâches. Trois domaines.", "26 tasks. Three domains.")}</h2>
                <p className="lead">{t("Chaque question que vous traitez est rattachée à l'une des 26 tâches de l'ECO 2026, pondérée exactement comme le jour de l'examen.", "Every question you answer is tied to one of the 26 tasks of the ECO 2026, weighted exactly as on exam day.")}</p>
                <div className="weights">
                  {DOMAINS.map((d) => <div className="weight" key={d.id}><b style={{ color: `var(--${d.id}-ink)` }}><span className="count" data-to={d.weight}>{reduced ? d.weight : 0}</span> %</b><span>{t(d.fr, d.en)}</span></div>)}
                </div>
              </div>
              <svg className="viz" id="dots" viewBox="0 0 640 520" role="img" aria-label={t("26 points qui se regroupent en trois domaines : 8 tâches Personnes, 10 Processus, 8 Environnement d'affaires", "26 dots gathering into three domains: 8 People tasks, 10 Process, 8 Business Environment")}>
                {DOTS.map((d, i) => <circle key={i} cx={reduced ? d.fx : d.sx} cy={reduced ? d.fy : d.sy} r="15" fill={reduced ? `var(--${d.id})` : "var(--line)"} data-fx={d.fx} data-fy={d.fy} data-id={d.id} />)}
                {GROUPS.map((gr) => <line key={gr.id} x1={gr.cx - 60} x2={gr.cx + 60} y1="500" y2="500" stroke="var(--line)" strokeWidth="2" />)}
              </svg>
            </div>
          </div>
        </section>

        {/* Scene 2 */}
        <section className="scene" id="chemin" aria-labelledby="t2">
          <div className="wrap stage" data-pin="path">
            <div className="scene-grid">
              <div className="scene-copy">
                <p className="eyebrow">{t("Votre chemin critique", "Your critical path")}</p>
                <h2 id="t2">{t("Quatre étapes. Dans le bon ordre.", "Four steps. In the right order.")}</h2>
                <p className="lead">{t("Certifizer repère les tâches qui freinent toute votre préparation, puis les ordonne pour que chacune débloque la suivante.", "Certifizer finds the tasks that hold back your whole preparation, then orders them so each one unlocks the next.")}</p>
                <span className="tag steps-tag">{t("Exemple", "Example")}</span>
                <ol className="steps" aria-label={t("Étapes du chemin critique (exemple)", "Critical path steps (example)")}>
                  {STEPS.map((s, i) => <li key={s.id} className={`${reduced ? "on " : ""}${s.locked ? "locked" : ""}`}><span className="n">{i + 1}</span><span className="t">{t(s.fr, s.en)}</span><span className="g">+{lang === "en" ? s.gain.toFixed(1) : s.gain.toFixed(1).replace(".", ",")} pts</span>{s.locked && <span className="prem">Premium</span>}</li>)}
                </ol>
              </div>
              <svg className="viz" id="pert" viewBox="0 0 660 440" role="img" aria-label={t("Réseau de tâches : le chemin critique s'allume en ambre, du diagnostic à l'examen", "Task network: the critical path lights up in amber, from diagnostic to exam")}>
                {EDGES.map(([a, b, crit]) => { const [x1, y1] = N[a], [x2, y2] = N[b]; const mx = (x1 + x2) / 2; return <path key={a + b} data-edge={a + b} data-crit={crit} d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke={crit ? "var(--accent)" : "var(--line)"} strokeWidth={crit ? 4 : 2} strokeLinecap="round" />; })}
                {Object.entries(N).map(([k, [x, y, label]]) => { const crit = CRIT.includes(k); const lit = reduced && crit; return <g key={k}><circle data-node={k} cx={x} cy={y} r={lit ? (k === "X" ? 18 : 15) : k === "S" || k === "X" ? 14 : 11} fill={lit ? "var(--accent)" : "var(--bg)"} stroke={lit ? "var(--accent)" : crit ? "var(--fg)" : "var(--line)"} strokeWidth="2.5" /><text x={x} y={y - 22} textAnchor="middle" fontFamily="Public Sans, sans-serif" fontSize="14" fontWeight="600" fill={crit ? "var(--fg)" : "var(--muted)"}>{t(label[0], label[1])}</text></g>; })}
              </svg>
            </div>
          </div>
        </section>

        {/* Scene 3: deliverables, horizontal */}
        <div id="projet">
          <HorizontalScrollGallery reduced={reduced} onAnimation={onGallery} aria-labelledby="t3" regionLabel={t("Livrables, défilement horizontal", "Deliverables, horizontal scroll")} intro={(
            <div className="wrap hz-intro">
              <div className="scene-copy">
                <p className="eyebrow">{t("Relier à mon projet", "Relate to my project")}</p>
                <h2 id="t3">{t("Réviser en produisant du vrai travail.", "Revision that produces real work.")}</h2>
                <p className="lead">{t("Vous décrivez votre projet. Vous en sortez avec de vrais livrables PMP, évalués selon des grilles PMI et validés par votre formateur.", "You describe your project. You come out with real PMP deliverables, reviewed against PMI rubrics and validated by your trainer.")}</p>
                <span className="tag" style={{ justifySelf: "start" }}>{t("Exemple : projet de station de pompage", "Example: pumping station project")}</span>
              </div>
              <div className="hz-film"><Film src={M("board.mp4")} poster={M("board-poster.webp")} reduced={reduced} /></div>
            </div>
          )}>
            <figure className="doc photo" style={{ margin: 0 }}>
              <img src={M("team-roadmap.webp")} alt={t("Une équipe projet annote une feuille de route imprimée avec des notes adhésives", "A project team annotates a printed roadmap with sticky notes")} width="900" height="1117" loading="lazy" />
              <figcaption>{t("Votre équipe, votre feuille de route", "Your team, your roadmap")}</figcaption>
            </figure>
            <article className="doc" aria-label={t("Charte de projet", "Project charter")}>
              <div className="meta mono"><span>DOC-01</span><span>v3</span></div><h3>{t("Charte de projet", "Project charter")}</h3>
              <div className="body"><div className="rl k" style={{ width: "42%" }} /><div className="rl" style={{ width: "96%" }} /><div className="rl" style={{ width: "88%" }} /><div className="rl" style={{ width: "70%" }} /><div className="rl k" style={{ width: "36%", marginTop: 10 }} /><div className="rl" style={{ width: "92%" }} /><div className="rl" style={{ width: "80%" }} /><div className="rl k" style={{ width: "48%", marginTop: 10 }} /><div className="rl" style={{ width: "84%" }} /></div>
              <span className="stamp">{t("Validé · formateur", "Validated · trainer")}</span>
            </article>
            <article className="doc" aria-label={t("Registre des risques", "Risk register")}>
              <div className="meta mono"><span>DOC-02</span><span>v2</span></div><h3>{t("Registre des risques", "Risk register")}</h3>
              <div className="body"><table><thead><tr><th>{t("Risque", "Risk")}</th><th>P×I</th><th>{t("Réponse", "Response")}</th></tr></thead><tbody>
                <tr><td>{t("Retard livraison pompes", "Late pump delivery")}</td><td className="mono">{t("0,6", "0.6")}</td><td>{t("Atténuer", "Mitigate")}</td></tr>
                <tr><td>{t("Crue en saison", "Seasonal flood")}</td><td className="mono">{t("0,4", "0.4")}</td><td>{t("Éviter", "Avoid")}</td></tr>
                <tr><td>{t("Permis tardif", "Late permit")}</td><td className="mono">{t("0,3", "0.3")}</td><td>{t("Transférer", "Transfer")}</td></tr>
                <tr><td>{t("Hausse de l'acier", "Steel price rise")}</td><td className="mono">{t("0,3", "0.3")}</td><td>{t("Accepter", "Accept")}</td></tr>
              </tbody></table></div>
              <span className="lvl">{t("Niveau 3 · infléchit une décision", "Level 3 · shapes a decision")}</span>
            </article>
            <article className="doc" aria-label={t("Structure de découpage du projet", "Work breakdown structure")}>
              <div className="meta mono"><span>DOC-03</span><span>v1</span></div><h3>WBS</h3>
              <div className="body wbs"><div className="node">{t("1. Station de pompage", "1. Pumping station")}</div><div className="kids"><div className="node">{t("1.1 Génie civil", "1.1 Civil works")}</div><div className="node">{t("1.2 Équipements", "1.2 Equipment")}</div><div className="node">{t("1.3 Mise en service", "1.3 Commissioning")}</div></div><div className="kids"><div className="node">{t("1.1.1 Fondations", "1.1.1 Foundations")}</div><div className="node">{t("1.2.1 Pompes", "1.2.1 Pumps")}</div><div className="node">{t("1.3.1 Essais", "1.3.1 Tests")}</div></div></div>
              <span className="lvl">{t("Niveau 2 · décrit", "Level 2 · describes")}</span>
            </article>
            <article className="doc" aria-label={t("Plan de communication", "Communication plan")}>
              <div className="meta mono"><span>DOC-04</span><span>v1</span></div><h3>{t("Plan de communication", "Communication plan")}</h3>
              <div className="body"><table><thead><tr><th>{t("Partie prenante", "Stakeholder")}</th><th>{t("Canal", "Channel")}</th><th>{t("Rythme", "Cadence")}</th></tr></thead><tbody>
                <tr><td>{t("Maître d'ouvrage", "Project owner")}</td><td>{t("Comité", "Committee")}</td><td className="mono">{t("Mensuel", "Monthly")}</td></tr>
                <tr><td>{t("Riverains", "Local residents")}</td><td>{t("Réunion", "Meeting")}</td><td className="mono">{t("Trimestriel", "Quarterly")}</td></tr>
                <tr><td>{t("Équipe chantier", "Site team")}</td><td>{t("Point", "Stand-up")}</td><td className="mono">{t("Quotidien", "Daily")}</td></tr>
              </tbody></table></div>
              <span className="lvl">{t("En cours", "In progress")}</span>
            </article>
          </HorizontalScrollGallery>
        </div>

        {/* Scene 4: honest portrait */}
        <section className="mirror" aria-labelledby="t4">
          <div className="wrap stage" data-pin="ring">
            <div className="scene-grid">
              <div className="scene-copy">
                <p className="eyebrow">{t("Votre portrait", "Your portrait")}</p>
                <h2 id="t4">{t("Un miroir, pas un trophée.", "A mirror, not a trophy.")}</h2>
                <p className="lead">{t("Votre indice ne compte que ce que vos réponses prouvent. Une tâche jamais travaillée compte pour zéro.", "Your readiness score counts only what your answers prove. A task you have never practised counts for zero.")}</p>
                <div className="truths">
                  <p>{t("Il n'est jamais arrondi pour vous rassurer.", "It never rounds up to reassure you.")}</p>
                  <p>{t("Il peut redescendre quand une compétence s'efface.", "It can go down when a skill fades.")}</p>
                  <p>{t("Il nomme toujours la prochaine tâche à travailler.", "It always names the next task to work on.")}</p>
                </div>
              </div>
              <div className="ring-wrap">
                <svg className="viz" viewBox="0 0 400 400" aria-hidden="true">
                  <circle cx="200" cy="200" r={RR} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="26" />
                  {[50, 70, 85].map((v) => { const a = (v / 100) * Math.PI * 2 - Math.PI / 2; return <g key={v}><line x1={200 + Math.cos(a) * (RR - 20)} y1={200 + Math.sin(a) * (RR - 20)} x2={200 + Math.cos(a) * (RR + 20)} y2={200 + Math.sin(a) * (RR + 20)} stroke="rgba(255,255,255,.45)" strokeWidth="2" /><text x={200 + Math.cos(a) * (RR + 34)} y={200 + Math.sin(a) * (RR + 34) + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="rgba(255,255,255,.6)">{v}</text></g>; })}
                  <circle id="ring-arc" cx="200" cy="200" r={RR} fill="none" stroke="var(--accent)" strokeWidth="26" strokeLinecap="round" transform="rotate(-90 200 200)" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - READY / 100)} />
                </svg>
                <div className="ring-num" role="img" aria-label={t(`Préparation estimée : ${READY} %, ${READY_LABEL.fr.toLowerCase()} (exemple)`, `Estimated readiness: ${READY}%, ${READY_LABEL.en.toLowerCase()} (example)`)}><b><span id="ringval">{READY}</span> %</b><span>{t(`${READY_LABEL.fr} · exemple`, `${READY_LABEL.en} · example`)}</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap people" aria-labelledby="tpeople">
          <Reveal className="scene-copy" reduced={reduced}>
            <p className="eyebrow">{t("Pour qui", "Who it is for")}</p>
            <h2 id="tpeople">{t("Ceux qui mènent de vrais projets.", "People who run projects for real.")}</h2>
          </Reveal>
          <div className="people-grid">
            <RevealImageMask reduced={reduced} src={M("colleagues.webp")} width="900" height="1117" alt={t("Deux collègues échangent autour d'un document et d'une tablette", "Two colleagues discuss a document and a tablet")} caption={<><b>{t("En binôme ou en cohorte", "In pairs or in a cohort")}</b><span>{t("Votre formateur suit le groupe, tâche par tâche.", "Your trainer follows the group, task by task.")}</span></>} />
            <RevealImageMask reduced={reduced} src={M("scenario.webp")} width="900" height="1117" alt={t("Une cheffe de projet réfléchit devant un scénario sur son ordinateur", "A project manager thinks through a scenario on her computer")} caption={<><b>{t("Quinze minutes quand vous pouvez", "Fifteen minutes when you can")}</b><span>{t("Des séances courtes, construites sur vos erreurs récentes.", "Short sessions built from your recent mistakes.")}</span></>} />
            <RevealImageMask reduced={reduced} src={M("learner.webp")} width="900" height="1117" alt={t("Un ingénieur révise à son bureau avec un carnet de notes", "An engineer revises at his desk with a notebook")} caption={<><b>{t("Sur votre propre projet", "On your own project")}</b><span>{t("Chaque notion appliquée au travail sur votre bureau.", "Each notion applied to the work on your desk.")}</span></>} />
          </div>
          <p className="ph-note">{t("Photos d'illustration", "Illustrative photos")}</p>
        </section>

        <section className="wrap trainers" id="formateurs" aria-labelledby="t5">
          <Reveal className="scene-copy" reduced={reduced}>
            <p className="eyebrow">{t("Pour les formateurs", "For trainers")}</p>
            <h2 id="t5">{t("Voyez ce qui freine la cohorte.", "See what holds the cohort back.")}</h2>
            <p className="lead">{t("Chaque matin, un brief : les sujets qui bloquent le groupe, qui accompagner, et un clic pour assigner une séance ciblée.", "Each morning, one brief: the topics blocking the group, who needs support, and one click to assign a targeted session.")}</p>
            <div style={{ marginTop: 24 }}><ScrollRevealImage reduced={reduced} src={M("trainer.webp")} width="900" height="1117" boxHeight="46vh" alt={t("Une formatrice présente le tableau de bord de la cohorte à six apprenants", "A trainer presents the cohort dashboard to six learners")} /></div>
          </Reveal>
          <Reveal className="cohort" reduced={reduced} index={1} aria-label={t("Exemple de cohorte PMP-2026-A", "Example cohort PMP-2026-A")}>
            <div className="gantt-head"><p className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{t("Cohorte PMP-2026-A · 18 apprenant·es", "Cohort PMP-2026-A · 18 learners")}</p><span className="tag">{t("Exemple", "Example")}</span></div>
            {[[["Gérer les risques", "Manage risk"], 39, "biz"], [["Échéancier", "Schedule"], 46, "process"], [["Parties prenantes", "Stakeholders"], 52, "people"], [["Gouvernance", "Governance"], 61, "biz"]].map(([l, v, c]) => <div className="cohort-row" key={l[0]}><span>{t(l[0], l[1])}</span><span className="meter" role="img" aria-label={`${t(l[0], l[1])} : ${v} %`}><i style={{ width: `${v}%`, background: `var(--${c})` }} /></span><span className="mono">{v} %</span></div>)}
            <button type="button" className="btn btn-ghost" onClick={cta("trainer")} style={{ justifySelf: "start" }}>{t("Créer une séance ciblée", "Create a targeted session")}</button>
          </Reveal>
        </section>

        <section className="cta-film" id="commencer" aria-labelledby="t6">
          <Film src={M("pm.mp4")} poster={M("pm-poster.webp")} reduced={reduced} />
          <div className="wrap cta">
            <Reveal as="p" className="eyebrow" reduced={reduced}>{t("Quinze minutes suffisent", "Fifteen minutes is enough")}</Reveal>
            <Reveal as="h2" id="t6" reduced={reduced} index={1}>{t("Commencez là où vous en êtes vraiment.", "Start where you really are.")}</Reveal>
            <Reveal className="hero-cta" reduced={reduced} index={2}>
              <button type="button" className="btn btn-primary" onClick={cta("main")}>{t("Faire mon diagnostic", "Take my diagnostic")} <span className="arr" aria-hidden="true">→</span></button>
              <button type="button" className="btn btn-ghost" onClick={cta("class")}>{t("J'ai un code de classe", "I have a class code")}</button>
              <button type="button" className="btn btn-ghost" onClick={cta("trainer")}>{t("Accès formateur", "Trainer access")}</button>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="wrap">
        <span>{t("Les chiffres de cette page sont des exemples. Votre indice réel ne vient que de vos réponses.", "The numbers on this page are examples. Your real readiness comes only from your answers.")}</span>
        <span className="mono">{t("Motion : GSAP ScrollTrigger · composants 21st.dev adaptés : « Reveal » (@asanshay), « Scroll Progress » (@cnippet-dev), « Horizontal Scroll Gallery » (@pulkitxm), « Video Scroll Hero » (@isaiahbjork), « Reveal Image Mask » (@daiwiikharihar), « Scroll Reveal Image » (@unlumen). Photos et films générés pour l'illustration.", "Motion: GSAP ScrollTrigger · adapted 21st.dev components: “Reveal” (@asanshay), “Scroll Progress” (@cnippet-dev), “Horizontal Scroll Gallery” (@pulkitxm), “Video Scroll Hero” (@isaiahbjork), “Reveal Image Mask” (@daiwiikharihar), “Scroll Reveal Image” (@unlumen). Photos and films generated for illustration.")}</span>
        {!osReduced && <button type="button" className="link" onClick={onToggleMotion} aria-pressed={userReduced}>{userReduced ? t("Réactiver les animations", "Turn animations back on") : t("Réduire les animations", "Reduce animations")}</button>}
      </footer>
    </div>
  );
}
