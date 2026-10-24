// Certifizer — interface « Chantier » (ui2). Rendered by main.jsx when VITE_UI=chantier.
// Frontend only: same api.js, same identity keys (cz_learner, cz_name, cz_role), same backend. Nothing is inflated.
import "./apiBase.js"; // first: API fallback for preview deployments without VITE_API_URL
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./chantier.css";
import { getMe, getMastery, getReadiness, pingHealth } from "../api.js";
import { useReducedMotion } from "./motion.js";
import { Bar, SCREEN_TITLE } from "./Chrome.jsx";
import Access from "./Access.jsx";
import Placeholder from "./Placeholder.jsx";
import Landing from "./screens/Landing.jsx";
import Today from "./screens/Today.jsx";
import Quiz from "./screens/Quiz.jsx";
import MasteryMap from "./screens/MasteryMap.jsx";
import Weaknesses from "./screens/Weaknesses.jsx";
import Chat from "./screens/Chat.jsx";

const FONTS = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=Public+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
const readLS = (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const writeLS = (k, v) => { try { if (v == null || v === "") localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* private mode */ } };

/** Hash routes: #/today · #/quiz?area=risk · #/quiz?session=1 · #/quiz?assigned=12 · #/map · #/weak · #/explain … */
export function parseHash() {
  const raw = (window.location.hash || "#/today").replace(/^#\/?/, "");
  const [path, q] = raw.split("?");
  return { screen: path || "today", params: Object.fromEntries(new URLSearchParams(q || "")) };
}
export function hrefTo(screen, params) {
  const q = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== "")).toString() : "";
  return `#/${screen}${q ? "?" + q : ""}`;
}

export default function App2() {
  const reduced = useReducedMotion();
  const [lang, setLangState] = useState(() => (readLS("cz_ui2_lang") === "en" ? "en" : "fr"));
  const setLang = (l) => { setLangState(l); writeLS("cz_ui2_lang", l); };
  const [learner, setLearner] = useState(() => readLS("cz_learner"));
  const [learnerName, setLearnerName] = useState(() => readLS("cz_name"));
  const [role, setRole] = useState(() => readLS("cz_role"));
  const [cohort, setCohort] = useState(() => readLS("cz_cohort"));
  const [route, setRoute] = useState(parseHash);
  const [me, setMe] = useState(null);
  const [mastery, setMastery] = useState(null);     // {mastery, recommended, processes}
  const [readiness, setReadiness] = useState(null); // {readiness, top_levers, stale_mastered}
  const [access, setAccess] = useState(null);       // signed out: null = Présentation, "main" | "class" | "trainer" = Access
  const [tokens, setTokens] = useState(() => { try { const u = new URLSearchParams(window.location.search); return { magic: u.get("magic") || "", invite: u.get("invite") || "" }; } catch { return { magic: "", invite: "" }; } });

  // Fonts are loaded here, at runtime, because index.html is shared with the current interface.
  useEffect(() => {
    document.documentElement.classList.add("ui2-on");
    document.body.style.background = "";
    // index.html has no icon: an empty data URL stops the browser's /favicon.ico request (a 404 in the console).
    const links = [["icon", "data:,"], ["preconnect", "https://fonts.googleapis.com"], ["preconnect", "https://fonts.gstatic.com", "anonymous"], ["stylesheet", FONTS]]
      .map(([rel, href, cross]) => { const l = document.createElement("link"); l.rel = rel; l.href = href; if (cross) l.crossOrigin = cross; document.head.appendChild(l); return l; });
    return () => { links.forEach((l) => l.remove()); document.documentElement.classList.remove("ui2-on"); };
  }, []);
  useEffect(() => {
    const h = () => { setRoute(parseHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    if ((!learner && !access && !tokens.magic && !tokens.invite) || (learner && route.screen === "presentation")) {
      document.title = lang === "en" ? "Certifizer · Prepare the PMP on your real project" : "Certifizer · Préparez le PMP sur votre vrai chantier";
      return;
    }
    const t = SCREEN_TITLE[route.screen];
    document.title = `${t ? (lang === "en" ? t.en : t.fr) : "Certifizer"} · Certifizer`;
  }, [route.screen, lang, learner, access, tokens.magic, tokens.invite]);
  // keep the free-tier backend warm, like the current interface
  useEffect(() => { pingHealth(); const id = setInterval(pingHealth, 10 * 60 * 1000); return () => clearInterval(id); }, []);

  const refreshReadiness = useCallback(() => { if (learner) getReadiness(learner).then(setReadiness).catch(() => {}); }, [learner]);
  const refreshMastery = useCallback(() => { if (learner) getMastery(learner).then(setMastery).catch(() => {}); }, [learner]);
  const refreshMe = useCallback(() => { if (learner) getMe(learner).then(setMe).catch(() => {}); }, [learner]);
  const refresh = useCallback(() => { refreshReadiness(); refreshMastery(); refreshMe(); }, [refreshReadiness, refreshMastery, refreshMe]);
  useEffect(() => { setMe(null); setMastery(null); setReadiness(null); refresh(); }, [learner, refresh]);

  /** A graded answer (quiz/answer, chat verdict) carries fresh mastery: keep it, then refresh the index. */
  const onGraded = useCallback((d) => {
    if (d && d.mastery) setMastery({ mastery: d.mastery, recommended: d.recommended ?? null, processes: d.processes || [] });
    refreshReadiness();
  }, [refreshReadiness]);

  const go = useCallback((screen, params) => { window.location.hash = hrefTo(screen, params); }, []);
  const signIn = (id, nm, r, cohortCode) => {
    writeLS("cz_learner", id); writeLS("cz_name", nm); writeLS("cz_role", r); if (cohortCode) writeLS("cz_cohort", cohortCode);
    setLearner(id); setLearnerName(nm); setRole(r); if (cohortCode) setCohort(cohortCode);
    setAccess(null);
    if (parseHash().screen === "presentation") go("today");
  };
  const signOut = () => { ["cz_learner", "cz_name", "cz_role", "cz_cohort"].forEach((k) => writeLS(k, null)); setLearner(""); setLearnerName(""); setRole(""); setCohort(""); setAccess(null); go("today"); };
  const clearToken = (which) => {
    try { const u = new URL(window.location.href); u.searchParams.delete(which); window.history.replaceState({}, "", u.pathname + (u.search || "") + u.hash); } catch { /* */ }
    setTokens((t) => ({ ...t, [which]: "" }));
  };

  if (tokens.magic || tokens.invite) {
    return <Access lang={lang} setLang={setLang} currentId={learner} currentName={learnerName} onSignIn={signIn} magicToken={tokens.magic} inviteToken={tokens.invite} clearToken={clearToken} />;
  }
  if (!learner) {
    if (!access) return <Landing lang={lang} setLang={setLang} reduced={reduced} signedIn={false} onCta={(view) => { setAccess(view || "main"); window.scrollTo(0, 0); }} />;
    return <Access lang={lang} setLang={setLang} currentId={learner} currentName={learnerName} onSignIn={signIn} magicToken="" inviteToken="" clearToken={clearToken} initialView={access} onBack={() => setAccess(null)} key={access} />;
  }
  // a signed-in user can open the Présentation again from the menu; its calls to action lead back to Aujourd'hui
  if (route.screen === "presentation") {
    return <Landing lang={lang} setLang={setLang} reduced={reduced} signedIn onCta={() => go("today")} />;
  }

  const T = (a, b) => (lang === "en" ? b : a);
  const isTrainer = role === "trainer" || ["formateur", "trainer", "coach"].includes((learner || "").toLowerCase()) || (me && me.is_trainer && role === "trainer");
  const rScore = readiness && readiness.readiness ? Math.floor(readiness.readiness.score * 100 + 1e-9) : null; // never rounded up
  const common = { lang, learner, learnerName, me, mastery, readiness, params: route.params, go, onGraded, refresh, reduced };
  const screen = route.screen;
  const title = SCREEN_TITLE[screen] ? T(SCREEN_TITLE[screen].fr, SCREEN_TITLE[screen].en) : screen;

  let body;
  if (isTrainer) body = <Placeholder lang={lang} go={go} title={T("Cockpit formateur", "Trainer cockpit")} note={T("Le cockpit formateur n'est pas dans cette version de l'interface Chantier. Utilisez l'interface actuelle, ou changez d'utilisateur depuis le menu.", "The trainer cockpit is not in this version of the Chantier interface. Use the current interface, or switch user from the menu.")} />;
  else if (screen === "today") body = <Today {...common} />;
  else if (screen === "quiz") body = <Quiz {...common} />;
  else if (screen === "map") body = <MasteryMap {...common} />;
  else if (screen === "weak") body = <Weaknesses {...common} />;
  else if (["explain", "scenario", "relate", "coreflexion"].includes(screen)) body = <Chat {...common} mode={screen} key={screen} />;
  else if (SCREEN_TITLE[screen]) body = <Placeholder lang={lang} go={go} title={title} />;
  else body = <Placeholder lang={lang} go={go} title={T("Page introuvable", "Page not found")} note={T("Cette adresse ne correspond à aucun écran.", "This address matches no screen.")} />;

  return (
    <div className="ui2">
      <Bar lang={lang} setLang={setLang} screen={screen} go={go} readinessScore={rScore} cohort={cohort} learnerName={learnerName || learner} plan={me && me.effective_plan} onSignOut={signOut} reduced={reduced} />
      <main id="main" key={screen}>{body}</main>
    </div>
  );
}
