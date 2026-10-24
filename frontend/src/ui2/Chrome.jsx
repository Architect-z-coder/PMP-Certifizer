// Shell chrome of the Chantier interface: one slim bar — brand · « where am I » dropdown · readiness + cohort.
// The dropdown groups the screens in four families (Apprendre · Sur votre projet · Mesuré · Vous), plus Aujourd'hui.
import React, { useEffect, useRef, useState } from "react";
import { gsap, rise } from "./motion.js";

/** [id, fr, en, badge?] — ids are the hash routes of App2. */
export const MENU = [
  { g: null, it: [["today", "Aujourd'hui", "Today"]] },
  { g: ["Apprendre", "Learn"], it: [["explain", "Expliquer", "Explain"], ["quiz", "Me tester", "Quiz me"], ["scenario", "Cas d'examen", "Exam scenario"]] },
  { g: ["Sur votre projet", "On your project"], it: [["relate", "Relier à mon projet", "Relate to my work"], ["coreflexion", "Cas réel", "Real case"]] },
  { g: ["Mesuré", "Measured"], it: [["scene", "Scènes terrain", "Field scenes", "bientôt"]] },
  { g: ["Vous", "You"], it: [["map", "Carte et chemin critique", "Map and critical path"], ["weak", "Mes faiblesses", "My weaknesses"], ["prepa", "Préparation", "Readiness", "bientôt"], ["portrait", "Mon portrait", "My portrait", "bientôt"], ["reglages", "Réglages", "Settings", "bientôt"]] },
];
export const SCREEN_TITLE = {};
MENU.forEach((G) => G.it.forEach((it) => { SCREEN_TITLE[it[0]] = { fr: it[1], en: it[2], group: G.g }; }));
SCREEN_TITLE.presentation = { fr: "Présentation", en: "Presentation", group: null };

export function Brand({ onClick }) {
  return (
    <a className="b" href="#/today" onClick={(e) => { e.preventDefault(); onClick(); }} aria-label="Certifizer, Aujourd'hui">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 2.5 19.5h19L12 3Z" stroke="var(--accent)" strokeWidth="2.6" strokeLinejoin="round" /></svg>
      <span>Certifizer</span>
    </a>
  );
}

export function Bar({ lang, setLang, screen, go, readinessScore, cohort, learnerName, plan, onSignOut, reduced }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null), menu = useRef(null);
  const T = (a, b) => (lang === "en" ? b : a);
  const cur = SCREEN_TITLE[screen] || SCREEN_TITLE.today;
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", h); document.addEventListener("keydown", k);
    if (!reduced && menu.current) { gsap.fromTo(menu.current, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: .22, ease: "power2.out", clearProps: "transform,opacity" }); rise(menu.current.querySelectorAll(".mi"), { duration: .28, stagger: .02 }); }
    return () => { document.removeEventListener("click", h); document.removeEventListener("keydown", k); };
  }, [open, reduced]);
  const pick = (id) => { setOpen(false); go(id); };
  return (
    <header className="tn">
      <Brand onClick={() => pick("today")} />
      <div className="ddw" ref={box}>
        <button type="button" className="dd" aria-expanded={open} aria-haspopup="menu" aria-controls="ui2-menu" onClick={() => setOpen((o) => !o)}>
          {cur.group && <span className="g">{T(...cur.group)}</span>}
          <span className="cur">{T(cur.fr, cur.en)}</span><span className="cv" aria-hidden="true">▼</span>
        </button>
        {open && (
          <div className="menu" id="ui2-menu" role="menu" ref={menu}>
            {MENU.map((G, gi) => (
              <div className="grp" key={gi}>
                <span className="k">{G.g ? T(...G.g) : " "}</span>
                {G.it.map(([id, fr, en, badge]) => (
                  <button type="button" key={id} role="menuitem" className={`mi ${id === screen ? "on" : ""}`} onClick={() => pick(id)}>
                    <span className="ico" aria-hidden="true" /><span>{T(fr, en)}</span>{badge && <small>{badge}</small>}
                  </button>
                ))}
              </div>
            ))}
            <div className="side">
              <div>{learnerName}{plan ? <> · <span>{plan === "institution" ? "Institution" : plan === "premium" ? "Premium" : T("Gratuit", "Free")}</span></> : null}</div>
              <div className="lang" role="group" aria-label={T("Langue", "Language")}>
                {["fr", "en"].map((l) => <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
              </div>
              <button type="button" className="link" onClick={() => pick("presentation")}>{T("Présentation", "Presentation")}</button>
              <button type="button" className="link" onClick={() => { setOpen(false); onSignOut(); }}>{T("Changer d'utilisateur", "Switch user")}</button>
            </div>
            <p className="why"><span>ECO PMP 2026 · 3 {T("domaines", "domains")} · 26 {T("tâches", "tasks")} · 33/41/26 %</span>{T("Une famille par intention : apprendre, travailler sur votre projet, être mesuré, vous retrouver. Un écran montre une seule chose.", "One family per intention: learn, work on your project, be measured, find yourself. A screen shows one thing.")}</p>
          </div>
        )}
      </div>
      <span className="sp" />
      <span className="rd" title={T("Indice de préparation (sur 100)", "Readiness index (out of 100)")}>
        <span className="lbl">{T("indice", "readiness")}</span> <b>{readinessScore == null ? "—" : readinessScore}</b>
        {cohort && <span className="chip">{cohort}</span>}
      </span>
    </header>
  );
}
