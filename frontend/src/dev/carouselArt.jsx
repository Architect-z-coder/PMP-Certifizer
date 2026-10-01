import React, { useId } from "react";
import { ECO_DOMAINS } from "../pmp.js";

/*
  DEV-ONLY drawn visuals for the carousel tryouts (no photos, no network).
  Every motif is drawn on an 800×800 canvas centred on 400,400 and uses
  preserveAspectRatio "slice", so it crops cleanly to portrait, square or wide cards.
*/

const base = { viewBox: "0 0 800 800", preserveAspectRatio: "xMidYMid slice", width: "100%", height: "100%", "aria-hidden": true, focusable: "false", style: { display: "block" } };
const SG = "Space Grotesk, sans-serif";
const MONO = "IBM Plex Mono, monospace";
const gid = (id, k) => `${id.replace(/:/g, "")}${k}`;

export function ArtDomains() {
  const id = useId();
  return (
    <svg {...base}>
      <defs><linearGradient id={gid(id, "g")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1d3150" /><stop offset="1" stopColor="#0e1a2b" /></linearGradient></defs>
      <rect width="800" height="800" fill={`url(#${gid(id, "g")})`} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1="0" x2="800" y1={160 + i * 90} y2={160 + i * 90} stroke="#fff" strokeOpacity=".06" />)}
      {ECO_DOMAINS.map((d, i) => {
        const h = d.wt * 9; const x = 190 + i * 150;
        return (<g key={d.id}>
          <rect x={x} y={640 - h} width="120" height={h} rx="12" fill={d.c} />
          <text x={x + 60} y={640 - h - 22} textAnchor="middle" fontFamily={SG} fontWeight="700" fontSize="44" fill="#fff">{d.wt}%</text>
        </g>);
      })}
    </svg>
  );
}

export function ArtPath() {
  const N = { A: [150, 400], B: [280, 250], C: [300, 540], D: [420, 380], E: [440, 640], F: [560, 250], G: [570, 500], H: [680, 380] };
  const E = [["A", "B"], ["A", "C"], ["B", "D"], ["C", "D"], ["C", "E"], ["D", "F"], ["D", "G"], ["E", "G"], ["F", "H"], ["G", "H"]];
  const CP = new Set(["AC", "CD", "DG", "GH"]);
  const crit = ["A", "C", "D", "G", "H"];
  return (
    <svg {...base}>
      <rect width="800" height="800" fill="#f5f8fb" />
      {Array.from({ length: 21 }, (_, i) => <line key={"v" + i} x1={i * 40} x2={i * 40} y1="0" y2="800" stroke="#dfe7ef" />)}
      {Array.from({ length: 21 }, (_, i) => <line key={"h" + i} y1={i * 40} y2={i * 40} x1="0" x2="800" stroke="#dfe7ef" />)}
      {E.map(([s, t]) => { const c = CP.has(s + t); return <line key={s + t} x1={N[s][0]} y1={N[s][1]} x2={N[t][0]} y2={N[t][1]} stroke={c ? "#e0572e" : "#9fb2c6"} strokeWidth={c ? 6 : 2.5} strokeDasharray={c ? "none" : "8 8"} />; })}
      {Object.entries(N).map(([k, [x, y]]) => { const c = crit.includes(k); return (<g key={k}>
        <rect x={x - 38} y={y - 24} width="76" height="48" rx="10" fill="#fff" stroke={c ? "#e0572e" : "#c9d6e3"} strokeWidth={c ? 3 : 1.5} />
        <text x={x} y={y + 9} textAnchor="middle" fontFamily={MONO} fontSize="24" fontWeight="600" fill={c ? "#e0572e" : "#5a6b7e"}>{k}</text></g>); })}
    </svg>
  );
}

export function ArtLoop() {
  const id = useId();
  return (
    <svg {...base}>
      <defs><radialGradient id={gid(id, "g")} cx=".5" cy=".5" r=".7"><stop offset="0" stopColor="#3aa5b8" /><stop offset="1" stopColor="#1d6674" /></radialGradient></defs>
      <rect width="800" height="800" fill={`url(#${gid(id, "g")})`} />
      {[100, 170, 240, 310].map((r, i) => <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="#fff" strokeOpacity={0.5 - i * 0.1} strokeWidth="2.5" strokeDasharray={i % 2 ? "3 12" : "none"} />)}
      {[[400, 230], [570, 400], [400, 570], [230, 400]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="18" fill={i === 0 ? "#E89A3C" : "#fff"} />)}
      <text x="400" y="420" textAnchor="middle" fontFamily={SG} fontWeight="700" fontSize="64" fill="#fff">×3</text>
    </svg>
  );
}

export function ArtSite() {
  const id = useId();
  return (
    <svg {...base}>
      <defs><linearGradient id={gid(id, "g")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6cf92" /><stop offset="1" stopColor="#e8903c" /></linearGradient></defs>
      <rect width="800" height="800" fill={`url(#${gid(id, "g")})`} />
      <rect x="0" y="640" width="800" height="160" fill="#b8661f" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="330" y={560 - i * 80} width="240" height="74" fill={i === 4 ? "none" : "#15263a"} stroke={i === 4 ? "#15263a" : "none"} strokeWidth="3" strokeDasharray="12 8" opacity={1 - i * 0.08} />)}
      {[0, 1, 2, 3].map((i) => [0, 1, 2].map((j) => <rect key={i + "-" + j} x={352 + j * 76} y={580 - i * 80} width="36" height="26" fill="#f6cf92" opacity=".55" />))}
      <rect x="170" y="150" width="18" height="490" fill="#15263a" />
      <rect x="90" y="140" width="560" height="16" fill="#15263a" />
      <line x1="520" y1="156" x2="520" y2="250" stroke="#15263a" strokeWidth="3" />
      <rect x="492" y="250" width="56" height="36" fill="#e0572e" />
    </svg>
  );
}

export function ArtCockpit() {
  const pts = Array.from({ length: 26 }, (_, i) => { const a = i * 2.39996; const r = 40 + 11 * i; return [400 + Math.cos(a) * r, 400 + Math.sin(a) * r, i]; });
  return (
    <svg {...base}>
      <rect width="800" height="800" fill="#0e1a2b" />
      {pts.slice(1).map(([x, y, i]) => <line key={"l" + i} x1={pts[Math.floor(i / 2)][0]} y1={pts[Math.floor(i / 2)][1]} x2={x} y2={y} stroke="#fff" strokeOpacity=".14" strokeWidth="1.5" />)}
      {pts.map(([x, y, i]) => <circle key={i} cx={x} cy={y} r={8 + (i * 7) % 12} fill={ECO_DOMAINS[i % 3].c} fillOpacity=".9" />)}
      <circle cx="400" cy="400" r="26" fill="#fff" />
    </svg>
  );
}

export function ArtPortrait({ pct = 54 }) {
  const r = 190, c = 2 * Math.PI * r;
  return (
    <svg {...base}>
      <rect width="800" height="800" fill="#ece6f8" />
      <circle cx="400" cy="400" r={r} fill="none" stroke="#d6cbef" strokeWidth="38" />
      <circle cx="400" cy="400" r={r} fill="none" stroke="#6d4fb8" strokeWidth="38" strokeLinecap="round" strokeDasharray={`${c * pct / 100} ${c}`} transform="rotate(-90 400 400)" />
      <text x="400" y="430" textAnchor="middle" fontFamily={SG} fontWeight="700" fontSize="96" fill="#2c1f55">{pct}%</text>
    </svg>
  );
}

export function ArtCase() {
  return (
    <svg {...base}>
      <rect width="800" height="800" fill="#e4eef2" />
      {[0, 1, 2, 3].map((i) => {
        const y = 230 + i * 100; const ok = i === 2;
        return (<g key={i}>
          <rect x="190" y={y} width="420" height="72" rx="14" fill="#fff" stroke={ok ? "#3DA776" : "#c9d6e3"} strokeWidth={ok ? 4 : 2} />
          <circle cx="232" cy={y + 36} r="16" fill={ok ? "#3DA776" : "none"} stroke={ok ? "#3DA776" : "#9fb2c6"} strokeWidth="3" />
          <rect x="268" y={y + 26} width={[240, 280, 200, 260][i]} height="20" rx="10" fill={ok ? "#bfe5cf" : "#dfe7ef"} />
        </g>);
      })}
      <rect x="190" y="140" width="320" height="26" rx="13" fill="#15263a" />
      <rect x="190" y="180" width="220" height="18" rx="9" fill="#9fb2c6" />
    </svg>
  );
}

export function ArtLang() {
  return (
    <svg {...base}>
      <rect width="800" height="800" fill="#c85a3a" />
      <text x="260" y="470" textAnchor="middle" fontFamily={SG} fontWeight="700" fontSize="230" fill="#fff">FR</text>
      <text x="545" y="470" textAnchor="middle" fontFamily={SG} fontWeight="700" fontSize="230" fill="#fff" fillOpacity=".45">EN</text>
    </svg>
  );
}

export function ArtCompass() {
  return (
    <svg {...base}>
      <rect width="800" height="800" fill="#f3efe6" />
      {[300, 230, 160].map((r, i) => <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="#d8ccb4" strokeWidth={i ? 2 : 3} />)}
      {Array.from({ length: 26 }, (_, i) => { const a = (i / 26) * Math.PI * 2 - Math.PI / 2; const d = i < 8 ? 0 : i < 18 ? 1 : 2;
        return <circle key={i} cx={400 + Math.cos(a) * 300} cy={400 + Math.sin(a) * 300} r="12" fill={ECO_DOMAINS[d].c} />; })}
      <polygon points="400,170 428,400 400,630 372,400" fill="#15263a" />
      <polygon points="400,170 428,400 372,400" fill="#e0572e" />
      <circle cx="400" cy="400" r="18" fill="#f3efe6" stroke="#15263a" strokeWidth="5" />
    </svg>
  );
}

export const ART = { domains: ArtDomains, path: ArtPath, loop: ArtLoop, site: ArtSite, cockpit: ArtCockpit, portrait: ArtPortrait, case: ArtCase, lang: ArtLang, compass: ArtCompass };
