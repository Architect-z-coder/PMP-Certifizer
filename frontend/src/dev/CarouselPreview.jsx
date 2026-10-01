import React, { useEffect, useState } from "react";
import { C, ECO_DOMAINS } from "../pmp.js";
import SqueezeCarousel from "../SqueezeCarousel.jsx";

/*
  DEV-ONLY tryout — /dev/carousel-preview.html (served by `npm run dev` only).
  Squeeze Carousel (21st.dev, @yura) with Certifizer content. Panel visuals are drawn
  in SVG (no photos). Buttons do nothing real: this is a visual experiment.
  To remove: delete src/dev/CarouselPreview.jsx, dev/carousel-preview.html,
  src/dev/carouselPreviewMain.jsx and src/SqueezeCarousel.jsx.
*/

const svgProps = { viewBox: "0 0 1600 900", preserveAspectRatio: "xMidYMid slice", width: "100%", height: "100%", style: { display: "block" } };
const mark = (t) => <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: ".2px" }}>{t}</span>;

// 1 — ECO domains as three weighted columns
const ArtDomains = () => (
  <svg {...svgProps}>
    <defs><linearGradient id="a1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1b2d47" /><stop offset="1" stopColor="#0e1a2b" /></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#a1)" />
    {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1="0" x2="1600" y1={150 + i * 120} y2={150 + i * 120} stroke="#ffffff" strokeOpacity=".06" />)}
    {ECO_DOMAINS.map((d, i) => {
      const h = d.wt * 14; const x = 470 + i * 240;
      return (<g key={d.id}>
        <rect x={x} y={780 - h} width="170" height={h} rx="14" fill={d.c} />
        <text x={x + 85} y={780 - h - 30} textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="64" fill="#fff">{d.wt}%</text>
      </g>);
    })}
  </svg>
);

// 2 — critical path through a PERT network
const ArtPath = () => {
  const N = { A: [300, 450], B: [520, 260], C: [560, 560], D: [800, 380], E: [820, 690], F: [1060, 300], G: [1080, 520], H: [1300, 420] };
  const E = [["A", "B"], ["A", "C"], ["B", "D"], ["C", "D"], ["C", "E"], ["D", "F"], ["D", "G"], ["E", "G"], ["F", "H"], ["G", "H"]];
  const CP = new Set(["AC", "CD", "DG", "GH"]);
  return (
    <svg {...svgProps}>
      <rect width="1600" height="900" fill="#f5f8fb" />
      {Array.from({ length: 41 }, (_, i) => <line key={"v" + i} x1={i * 40} x2={i * 40} y1="0" y2="900" stroke="#dfe7ef" />)}
      {Array.from({ length: 23 }, (_, i) => <line key={"h" + i} y1={i * 40} y2={i * 40} x1="0" x2="1600" stroke="#dfe7ef" />)}
      {E.map(([s, t]) => { const c = CP.has(s + t); return <line key={s + t} x1={N[s][0]} y1={N[s][1]} x2={N[t][0]} y2={N[t][1]} stroke={c ? "#e0572e" : "#9fb2c6"} strokeWidth={c ? 8 : 3} strokeDasharray={c ? "none" : "10 10"} />; })}
      {Object.entries(N).map(([k, [x, y]]) => { const c = ["A", "C", "D", "G", "H"].includes(k); return (<g key={k}>
        <rect x={x - 62} y={y - 34} width="124" height="68" rx="14" fill="#fff" stroke={c ? "#e0572e" : "#c9d6e3"} strokeWidth={c ? 4 : 2} />
        <text x={x} y={y + 12} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="32" fontWeight="600" fill={c ? "#e0572e" : "#5a6b7e"}>{k}</text></g>); })}
    </svg>
  );
};

// 3 — adaptive loop: mistakes come back
const ArtLoop = () => (
  <svg {...svgProps}>
    <defs><radialGradient id="a3" cx=".5" cy=".5" r=".7"><stop offset="0" stopColor="#3aa5b8" /><stop offset="1" stopColor="#1d6674" /></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#a3)" />
    {[120, 210, 300, 390].map((r, i) => <circle key={r} cx="800" cy="450" r={r} fill="none" stroke="#fff" strokeOpacity={0.5 - i * 0.1} strokeWidth="3" strokeDasharray={i % 2 ? "4 16" : "none"} />)}
    {[[800, 330], [1010, 450], [800, 660], [590, 450]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="22" fill={i === 0 ? "#E89A3C" : "#fff"} />)}
    <text x="800" y="470" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="70" fill="#fff">×3</text>
  </svg>
);

// 4 — relate to your project: a site under construction
const ArtSite = () => (
  <svg {...svgProps}>
    <defs><linearGradient id="a4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3c27d" /><stop offset="1" stopColor="#e8903c" /></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#a4)" />
    <rect x="0" y="720" width="1600" height="180" fill="#b8661f" />
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="700" y={620 - i * 90} width="300" height="84" fill={i === 4 ? "none" : "#15263a"} stroke={i === 4 ? "#15263a" : "none"} strokeWidth="4" strokeDasharray="14 10" opacity={1 - i * 0.08} />)}
    {[0, 1, 2, 3].map((i) => [0, 1, 2].map((j) => <rect key={i + "-" + j} x={730 + j * 90} y={642 - i * 90} width="44" height="30" fill="#f3c27d" opacity=".55" />))}
    <rect x="470" y="160" width="22" height="560" fill="#15263a" />
    <rect x="360" y="150" width="700" height="20" fill="#15263a" />
    <line x1="880" y1="170" x2="880" y2="300" stroke="#15263a" strokeWidth="4" />
    <rect x="845" y="300" width="70" height="44" fill="#e0572e" />
  </svg>
);

// 5 — trainer cockpit: cohort constellation
const ArtCockpit = () => {
  const pts = Array.from({ length: 26 }, (_, i) => { const a = i * 2.39996; const r = 60 + 13 * i; return [800 + Math.cos(a) * r * 1.5, 450 + Math.sin(a) * r * 0.8, i]; });
  const col = (i) => ECO_DOMAINS[i % 3].c;
  return (
    <svg {...svgProps}>
      <rect width="1600" height="900" fill="#0e1a2b" />
      {pts.slice(1).map(([x, y, i]) => <line key={"l" + i} x1={pts[Math.floor(i / 2)][0]} y1={pts[Math.floor(i / 2)][1]} x2={x} y2={y} stroke="#ffffff" strokeOpacity=".14" strokeWidth="2" />)}
      {pts.map(([x, y, i]) => <circle key={i} cx={x} cy={y} r={10 + (i * 7) % 16} fill={col(i)} fillOpacity=".9" />)}
      <circle cx="800" cy="450" r="34" fill="#fff" />
    </svg>
  );
};

// 6 — honest portrait: readiness ring
const ArtPortrait = () => {
  const r = 230, c = 2 * Math.PI * r;
  return (
    <svg {...svgProps}>
      <rect width="1600" height="900" fill="#e9e3f7" />
      <circle cx="800" cy="450" r={r} fill="none" stroke="#d3c8ef" strokeWidth="46" />
      <circle cx="800" cy="450" r={r} fill="none" stroke="#6d4fb8" strokeWidth="46" strokeLinecap="round" strokeDasharray={`${c * 0.54} ${c}`} transform="rotate(-90 800 450)" />
      <text x="800" y="480" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="120" fill="#2c1f55">54%</text>
    </svg>
  );
};

// 7 — bilingual
const ArtLang = () => (
  <svg {...svgProps}>
    <rect width="1600" height="900" fill="#c85a3a" />
    <text x="640" y="560" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="300" fill="#fff">FR</text>
    <text x="970" y="560" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="300" fill="#fff" fillOpacity=".45">EN</text>
  </svg>
);

export default function CarouselPreview() {
  const [note, setNote] = useState("");
  const [auto, setAuto] = useState(false);
  const [narrow, setNarrow] = useState(() => window.innerWidth < 640);
  useEffect(() => { const on = () => setNarrow(window.innerWidth < 640); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, []);
  const act = () => setNote("Aperçu : les boutons ne mènent nulle part pour l'instant.");

  const slides = [
    { id: "eco", title: "Trois domaines, 26 tâches.", description: "Votre préparation suit la structure de l'examen en vigueur depuis juillet 2026 : Personnes, Processus, Environnement d'affaires.", action: "Voir le parcours", onAction: act, overlay: mark("Parcours ECO 2026"), render: () => <ArtDomains /> },
    { id: "path", title: "Votre chemin critique, recalculé à chaque réponse.", description: "Les tâches à travailler d'abord, dans l'ordre où elles débloquent les suivantes.", action: "Voir mon chemin", onAction: act, overlay: mark("Chemin critique"), render: () => <ArtPath /> },
    { id: "adaptive", title: "Vos erreurs reviennent au bon moment.", description: "Une réponse fausse revient plus tard, sous un autre angle, jusqu'à ce qu'elle tienne.", action: "Commencer une séance", onAction: act, overlay: mark("Apprentissage adaptatif de vos erreurs"), render: () => <ArtLoop /> },
    { id: "ojt", title: "Chaque notion reliée à votre vrai projet.", description: "Décrivez votre projet : Certifizer transforme les concepts PMP en livrables concrets pour votre contexte.", action: "Relier à mon projet", onAction: act, overlay: mark("Relier à mon projet"), render: () => <ArtSite /> },
    { id: "cockpit", title: "Le formateur voit toute la cohorte.", description: "Qui avance, qui décroche, et quelles tâches bloquent le groupe, sans tableur.", action: "Ouvrir le cockpit", onAction: act, overlay: mark("Cockpit formateur"), render: () => <ArtCockpit /> },
    { id: "portrait", title: "Une lecture honnête de votre préparation.", description: "Jamais arrondie à la hausse : le portrait montre ce que vos réponses prouvent, et rien de plus.", action: "Voir mon portrait", onAction: act, overlay: mark("Portrait d'apprentissage"), render: () => <ArtPortrait /> },
    { id: "lang", title: "En français ou en anglais.", description: "L'interface et les explications suivent la langue que vous choisissez.", action: "Changer de langue", onAction: act, overlay: mark("Bilingue FR / EN"), render: () => <ArtLang /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.paper, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'); *{box-sizing:border-box} body{margin:0} button{font-family:inherit}`}</style>
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "12px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, margin: 0 }}>Certifizer — Squeeze Carousel Tryout</h1>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Composant 21st.dev « Squeeze Carousel » (@yura), adapté · aperçu, rien n'est enregistré</div>
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: C.muted, cursor: "pointer" }}>
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Défilement automatique
        </label>
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "36px 20px 56px" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(24px, 3.2vw, 34px)", letterSpacing: "-.01em", margin: "0 0 6px", textWrap: "balance" }}>Ce que Certifizer fait pour votre préparation</h2>
        <p style={{ margin: "0 0 26px", color: C.muted, maxWidth: "60ch" }}>Cliquez sur une bande, utilisez les flèches ou le clavier (← →).</p>
        <SqueezeCarousel slides={slides} label="Fonctionnalités Certifizer" autoplay={auto} accent="#15263a" gap={narrow ? 8 : 16} slatGap={narrow ? 6 : 8} slatWidth={narrow ? 6 : 8} height={narrow ? "clamp(120px, 34cqi, 200px)" : "clamp(200px, 34cqi, 380px)"} />
        <div role="status" aria-live="polite" style={{ minHeight: 22, marginTop: 14, fontSize: 12.5, color: C.muted }}>{note}</div>
      </main>
    </div>
  );
}
