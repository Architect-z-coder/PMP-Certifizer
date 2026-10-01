import React, { useEffect, useState } from "react";
import { CalendarClock, Clock, ListChecks, Lock } from "lucide-react";
import { C } from "../pmp.js";
import Journey from "../Journey.jsx";
import CertifizerBackground from "../CertifizerBackground.jsx";

/*
  DEV-ONLY visual tryout — /dev/background-preview.html (served by `npm run dev` only).
  Everything below is SAMPLE DATA. No API calls, no saving, nothing starts an assessment.
  To remove the tryout: delete src/dev/, dev/ and src/CertifizerBackground.jsx.
*/

const VARIANTS = [
  { id: "lavender", label: "Lavender" },
  { id: "yellow", label: "Yellow" },
  { id: "none", label: "Original / No Glow" },
];

// Sample mastery rows, same shape as getMastery() -> [{ area, score (0-1), attempts }]
const SAMPLE_MASTERY = [
  { area: "pe_vision", score: 0.78, attempts: 14 }, { area: "pe_conflict", score: 0.64, attempts: 11 },
  { area: "pe_lead", score: 0.71, attempts: 9 }, { area: "stakeholder", score: 0.52, attempts: 8 },
  { area: "comms", score: 0.69, attempts: 12 }, { area: "integration", score: 0.58, attempts: 17 },
  { area: "scope", score: 0.73, attempts: 10 }, { area: "schedule", score: 0.46, attempts: 13 },
  { area: "cost", score: 0.41, attempts: 9 }, { area: "quality", score: 0.66, attempts: 7 },
  { area: "resource", score: 0.62, attempts: 6 }, { area: "risk", score: 0.37, attempts: 11 },
  { area: "be_governance", score: 0.49, attempts: 5 }, { area: "be_value", score: 0.55, attempts: 4 },
];

const SAMPLE_RESULTS = [
  { id: "r1", mode: "Quiz", topic: "Gérer les risques", score: "6 / 10", when: "Aujourd'hui" },
  { id: "r2", mode: "Cas d'examen", topic: "Planifier & gérer l'échéancier", score: "7 / 10", when: "Hier" },
  { id: "r3", mode: "Quiz", topic: "Gérer les conflits", score: "8 / 10", when: "27 sept." },
  { id: "r4", mode: "Quiz", topic: "Gérer les finances du projet", score: "5 / 10", when: "26 sept." },
  { id: "r5", mode: "Cas d'examen", topic: "Mobiliser les parties prenantes", score: "7 / 10", when: "24 sept." },
];

function useIsMobile(bp = 760) {
  const get = () => (typeof window !== "undefined" ? window.innerWidth < bp : false);
  const [m, setM] = useState(get);
  useEffect(() => {
    const on = () => setM(get());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return m;
}

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 20px", boxShadow: "0 10px 30px -22px rgba(14,26,43,.35)", minWidth: 0 };
const h2 = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: C.text, margin: 0 };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const Sample = () => <span style={{ ...mono, fontSize: 10, color: C.muted, border: `1px dashed ${C.line}`, borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap" }}>Exemple</span>;

export default function BackgroundPreview() {
  const [variant, setVariant] = useState("lavender");
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: C.text, background: C.paper }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        button { font-family: inherit; }
        .bp-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 18px; }
        .bp-side { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
        @media (max-width: 860px) { .bp-grid { grid-template-columns: 1fr; } }
        .bp-seg input { position: absolute; opacity: 0; width: 1px; height: 1px; }
        .bp-seg label { cursor: pointer; padding: 7px 13px; border-radius: 8px; font-size: 13px; color: ${C.muted}; display: inline-block; }
        .bp-seg input:checked + label { background: ${C.ink}; color: #fff; }
        .bp-seg input:focus-visible + label, .bp-preview button:focus-visible { outline: 2px solid ${C.teal}; outline-offset: 2px; }
      `}</style>

      {/* Tryout header (not part of the design under review) */}
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "12px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <h1 style={{ ...h2, fontSize: 18 }}>Certifizer — Background Tryout</h1>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Aperçu de développement · données d'exemple · aucune action réelle</div>
        </div>
        <fieldset className="bp-seg" style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 3, margin: 0, display: "flex", flexWrap: "wrap", gap: 2, background: C.paper }}>
          <legend style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Fond</legend>
          {VARIANTS.map((v) => (
            <span key={v.id} style={{ position: "relative" }}>
              <input type="radio" name="bg-variant" id={`bg-${v.id}`} value={v.id} checked={variant === v.id} onChange={() => setVariant(v.id)} />
              <label htmlFor={`bg-${v.id}`}>{v.label}</label>
            </span>
          ))}
        </fieldset>
      </header>

      {/* The design under review: identical content, only the background changes */}
      <CertifizerBackground variant={variant} className="bp-preview" style={{ minHeight: "calc(100vh - 64px)" }}>
        <main style={{ maxWidth: 1120, margin: "0 auto", padding: isMobile ? "18px 16px 36px" : "28px 24px 48px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div role="note" style={{ ...mono, fontSize: 11.5, color: C.muted, background: "rgba(255,255,255,.7)", border: `1px dashed ${C.line}`, borderRadius: 10, padding: "8px 12px" }}>
            Données d'exemple : apprenant fictif, résultats fictifs. Rien n'est lu ni enregistré.
          </div>

          {/* Welcome */}
          <section style={{ ...card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, padding: isMobile ? "18px" : "22px 24px" }} aria-labelledby="bp-welcome">
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Sample /><span style={{ ...mono, fontSize: 11, color: C.muted }}>Cohorte PMP-2026-A</span></div>
              <h2 id="bp-welcome" style={{ ...h2, fontSize: isMobile ? 21 : 24, lineHeight: 1.2 }}>Bonjour, Apprenant démo</h2>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted, maxWidth: "60ch" }}>Votre prochaine étape : consolider « Gérer les risques », la tâche la plus fragile de votre parcours.</p>
            </div>
            <div style={{ display: "flex", gap: 22 }}>
              {[["Préparation", "54 %"], ["Réponses", "218"], ["Jours actifs", "14"]].map(([k, v]) => (
                <div key={k}><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, fontVariantNumeric: "tabular-nums" }}>{v}</div><div style={{ fontSize: 11.5, color: C.muted }}>{k}</div></div>
              ))}
            </div>
          </section>

          <div className="bp-grid">
            {/* Certification progress — existing Journey component with sample mastery */}
            <section style={{ ...card, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }} aria-label="Progression de certification">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px 0" }}>
                <span style={{ fontSize: 12, color: C.muted }}>Progression de certification</span><Sample />
              </div>
              <Journey lang="fr" mastery={SAMPLE_MASTERY} processes={[]} recommended={{ area: "risk" }} onStudyArea={() => {}} isMobile={isMobile} />
            </section>

            <div className="bp-side">
              {/* Practice session (display only) */}
              <section style={card} aria-labelledby="bp-practice">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h2 id="bp-practice" style={h2}>Séance d'entraînement</h2><Sample />
                </div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Gérer les risques · Environnement d'affaires</div>
                <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 16px", display: "flex", flexDirection: "column", gap: 7, fontSize: 13, color: C.muted }}>
                  <li style={{ display: "flex", alignItems: "center", gap: 8 }}><ListChecks size={15} color={C.teal} /> 12 questions adaptées à vos erreurs</li>
                  <li style={{ display: "flex", alignItems: "center", gap: 8 }}><Clock size={15} color={C.teal} /> Environ 15 minutes</li>
                  <li style={{ display: "flex", alignItems: "center", gap: 8 }}><CalendarClock size={15} color={C.teal} /> Proposée aujourd'hui</li>
                </ul>
                <button type="button" disabled aria-disabled="true" style={{ width: "100%", padding: "11px", border: "none", borderRadius: 11, background: C.amber, color: C.ink, fontWeight: 600, fontSize: 14, opacity: 0.55, cursor: "not-allowed", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Lock size={15} /> Commencer la séance
                </button>
                <div style={{ fontSize: 11.5, color: C.muted, textAlign: "center", marginTop: 7 }}>Désactivé dans l'aperçu</div>
              </section>

              {/* Recent results (pattern adapted from 21st.dev "Recent Activity Card") */}
              <section style={card} aria-labelledby="bp-results">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <h2 id="bp-results" style={h2}>Résultats récents</h2><Sample />
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {SAMPLE_RESULTS.map((r, i) => (
                    <li key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: C.text }}>{r.topic}</div>
                        <div style={{ fontSize: 11.5, color: C.muted }}>{r.mode} · {r.when}</div>
                      </div>
                      <span style={{ ...mono, fontSize: 12.5, fontWeight: 500, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.score}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </main>
      </CertifizerBackground>
    </div>
  );
}
