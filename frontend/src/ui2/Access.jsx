// Access gate of the Chantier interface. The current Gate/InviteGate/MagicGate live inside App.jsx and are not
// exported, so this is a minimal Chantier-styled gate that calls the SAME api.js functions and writes the SAME
// localStorage keys (cz_learner, cz_name, cz_role). Flows: name · class code · magic link · invite link · trainer.
import React, { useEffect, useState } from "react";
import { joinClass, requestMagicLink, consumeMagicLink, getInviteInfo, acceptInvite, linkEmail } from "../api.js";
import { T as T0 } from "../pmp.js";

const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NET = { fr: "Connexion impossible — le serveur se réveille peut-être, réessayez dans un instant.", en: "Could not connect — the server may be waking up, try again in a moment." };

function Logo() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 2.5 19.5h19L12 3Z" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" /><path d="M7 16.5h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>;
}

/** onSignIn(learnerId, name, role, cohortCode?) — the parent writes localStorage and continues. */
export default function Access({ lang, setLang, currentId, currentName, onSignIn, magicToken, inviteToken, clearToken }) {
  const t = (k) => (T0[k] ? T0[k][lang] : k);
  const T = (a, b) => (lang === "en" ? b : a);
  const [view, setView] = useState("main"); // main | class | recover | trainer | email
  const [name, setName] = useState("");
  const [code, setCode] = useState(""); const [cname, setCname] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(null); const [msg, setMsg] = useState(null);
  const [joined, setJoined] = useState(null); // {learner_id, name, cohort_code} → optional email step
  // magic link (?magic=TOKEN)
  const [magic, setMagic] = useState(magicToken ? "checking" : null);
  useEffect(() => {
    if (!magicToken) return;
    consumeMagicLink(magicToken).then((r) => {
      if (r && r.ok) { clearToken("magic"); onSignIn(r.learner_id, r.name, r.role === "trainer" ? "trainer" : "learner"); }
      else setMagic(r && r.error === "expired" ? "expired" : "invalid");
    }).catch(() => setMagic("invalid"));
  }, [magicToken]); // eslint-disable-line react-hooks/exhaustive-deps
  // invitation link (?invite=TOKEN)
  const [info, setInfo] = useState(null);
  useEffect(() => {
    if (!inviteToken) return;
    getInviteInfo(inviteToken).then((r) => { setInfo(r); if (r && r.name) setName(r.name); }).catch(() => setInfo({ error: "network" }));
  }, [inviteToken]);

  async function doJoin() {
    const c = code.trim(), nm = cname.trim(); if (!c || !nm || busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await joinClass({ code: c, name: nm });
      if (r && r.ok) setJoined({ learner_id: r.learner_id, name: r.name, cohort_code: r.cohort_code });
      else setErr(r && (lang === "en" ? r.message_en : r.message_fr) || T("Ce code de classe est introuvable.", "This class code was not found."));
    } catch { setErr(NET[lang]); }
    setBusy(false);
  }
  async function doRecover() {
    const e = email.trim();
    if (!EMAIL.test(e) || busy) { setErr(T("Saisissez un email valide.", "Enter a valid email.")); return; }
    setBusy(true); setErr(null); setMsg(null);
    try {
      const r = await requestMagicLink(e, lang);
      if (r && r.ok) setMsg(lang === "en" ? r.message_en : r.message_fr);
      else setErr(r && (lang === "en" ? r.message_en : r.message_fr) || T("L'envoi d'email n'est pas disponible.", "Email sending is not available."));
    } catch { setErr(NET[lang]); }
    setBusy(false);
  }
  async function doLinkEmail() {
    const e = email.trim(); if (!EMAIL.test(e) || busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await linkEmail(joined.learner_id, e);
      if (r && r.ok) finishJoin(); else setErr(r && (lang === "en" ? r.message_en : r.message_fr) || T("Impossible de lier cet email.", "Could not link this email."));
    } catch { setErr(NET[lang]); }
    setBusy(false);
  }
  const finishJoin = () => onSignIn(joined.learner_id, joined.name, "learner", joined.cohort_code);
  async function doAccept(useExisting) {
    if (busy) return; setBusy(true); setErr(null);
    try {
      const r = await acceptInvite(inviteToken, useExisting ? { existingPublicId: currentId } : { name: name.trim() });
      if (r && r.ok) { clearToken("invite"); onSignIn(r.learner_id, r.name || name.trim() || currentName, r.role === "trainer" ? "trainer" : "learner", info && info.cohort_code); return; }
      const m = { already_used: T("Ce lien a déjà été utilisé. Veuillez demander un nouveau lien à votre formateur.", "This link has already been used. Please ask your trainer for a new one."), revoked: T("Ce lien a été révoqué. Veuillez demander un nouveau lien à votre formateur.", "This link has been revoked. Please ask your trainer for a new one."), name_required: T("Veuillez saisir votre nom pour rejoindre la cohorte.", "Please enter your name to join the cohort.") };
      setErr((r && r.error === "seats_exhausted") ? (lang === "en" ? r.message_en : r.message_fr) : (m[r && r.error] || T("Ce lien d'invitation n'est pas valide.", "This invitation link is not valid.")));
    } catch { setErr(NET[lang]); }
    setBusy(false);
  }

  const Head = ({ title, sub }) => (<><div className="brand"><Logo /> Certifizer <small className="mono muted">PMP · ECO 2026</small></div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</>);
  const Lang = () => <div className="lang" role="group" aria-label="Langue" style={{ justifySelf: "start" }}>{["fr", "en"].map((l) => <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}</div>;
  const Err = () => (err ? <p className="err" role="alert">{err}</p> : null);

  let body;
  if (magicToken && magic) {
    body = (<div className="card">
      <Head title={magic === "checking" ? T("Connexion en cours…", "Signing you in…") : T("Lien indisponible", "Link unavailable")} />
      {magic !== "checking" && <><p className="muted">{magic === "expired" ? t("magicExpired") : t("magicInvalid")}</p><button type="button" className="btn btn-p" onClick={() => { clearToken("magic"); setMagic(null); }}>{t("magicContinue")}</button></>}
    </div>);
  } else if (inviteToken) {
    const invalid = info && (info.error || info.status === "revoked" || info.status === "accepted");
    body = (<div className="card">
      {!info && <Head title={T("Vérification de votre invitation…", "Checking your invitation…")} />}
      {info && invalid && <><Head title={T("Invitation indisponible", "Invitation unavailable")} sub={info.status === "accepted" ? T("Ce lien a déjà été utilisé.", "This link has already been used.") : info.status === "revoked" ? T("Ce lien a été révoqué.", "This link has been revoked.") : T("Ce lien d'invitation n'est pas valide.", "This invitation link is not valid.")} /><button type="button" className="btn btn-p" onClick={() => clearToken("invite")}>{t("magicContinue")}</button></>}
      {info && !invalid && <>
        <Head title={<>{T("Rejoindre la cohorte", "Join cohort")} <span className="mono" style={{ color: "var(--accent-ink)" }}>{info.cohort_code}</span></>} sub={info.role === "trainer" ? T("Vous êtes invité·e comme formateur : vous aurez accès au cockpit de la cohorte.", "You are invited as a trainer: you will have access to the cohort cockpit.") : T("Votre formateur vous a transmis ce lien. Votre progression est personnelle et commence immédiatement.", "Your trainer sent you this link. Your progress is personal and starts right away.")} />
        {currentId ? <><button type="button" className="btn btn-p" disabled={busy} onClick={() => doAccept(true)}>{busy ? T("Rattachement…", "Joining…") : T(`Rejoindre avec mon profil (${currentName})`, `Join with my profile (${currentName})`)}</button><p className="muted" style={{ fontSize: 12.5 }}>{T("Votre progression actuelle est conservée.", "Your current progress is kept.")}</p></>
          : <><label className="sr-only" htmlFor="inv-name">{T("Votre nom", "Your name")}</label><input id="inv-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={T("Votre nom", "Your name")} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) doAccept(false); }} /><button type="button" className="btn btn-p" disabled={busy || !name.trim()} onClick={() => doAccept(false)}>{busy ? T("Rattachement…", "Joining…") : T("Rejoindre la cohorte", "Join the cohort")}</button></>}
        <Err />
      </>}
    </div>);
  } else if (joined) {
    body = (<div className="card">
      <Head title={t("emailRecTitle")} sub={t("emailRecSub")} />
      <label className="sr-only" htmlFor="rec-email">{t("emailRecLabel")}</label>
      <input id="rec-email" className="field" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(null); }} placeholder="vous@exemple.com" onKeyDown={(e) => { if (e.key === "Enter") doLinkEmail(); }} />
      <div className="row"><button type="button" className="btn btn-p" disabled={!EMAIL.test(email.trim()) || busy} onClick={doLinkEmail}>{busy ? T("Liaison…", "Linking…") : t("emailRecBtn")}</button><button type="button" className="link" onClick={finishJoin}>{t("emailRecLater")}</button></div>
      <Err /><p className="muted" style={{ fontSize: 12 }}>{t("emailRecPrivacy")}</p>
    </div>);
  } else if (view === "class") {
    body = (<div className="card">
      <Head title={t("classTitle")} sub={t("classSub")} />
      <label className="sr-only" htmlFor="cls-code">{t("classCodeLabel")}</label>
      <input id="cls-code" className="field mono" style={{ textAlign: "center", letterSpacing: 2, textTransform: "uppercase", fontSize: 15 }} value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(null); }} placeholder={t("classCodePh")} autoComplete="off" />
      <label className="sr-only" htmlFor="cls-name">{t("classNameLabel")}</label>
      <input id="cls-name" className="field" value={cname} onChange={(e) => setCname(e.target.value)} placeholder={t("classNameLabel")} onKeyDown={(e) => { if (e.key === "Enter") doJoin(); }} />
      <div className="row"><button type="button" className="btn btn-p" disabled={!code.trim() || !cname.trim() || busy} onClick={doJoin}>{busy ? t("classJoining") : t("classJoinBtn")}</button><button type="button" className="link" onClick={() => { setView("main"); setErr(null); }}>{t("backLink")}</button></div>
      <Err />
    </div>);
  } else if (view === "recover") {
    body = (<div className="card">
      <Head title={t("recoverTitle")} sub={t("recoverSub")} />
      {msg ? <><p>{msg}</p><button type="button" className="link" style={{ justifySelf: "start" }} onClick={() => { setView("main"); setMsg(null); }}>{t("backLink")}</button></> : <>
        <label className="sr-only" htmlFor="rc-email">Email</label>
        <input id="rc-email" className="field" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(null); }} placeholder="vous@exemple.com" onKeyDown={(e) => { if (e.key === "Enter") doRecover(); }} />
        <div className="row"><button type="button" className="btn btn-p" disabled={busy} onClick={doRecover}>{busy ? t("recoverSending") : t("recoverBtn")}</button><button type="button" className="link" onClick={() => { setView("main"); setErr(null); }}>{t("backLink")}</button></div>
        <Err />
      </>}
    </div>);
  } else if (view === "trainer") {
    body = (<div className="card">
      <Head title={t("trainerAccess")} sub={T("Le cockpit formateur n'est pas encore disponible dans l'interface Chantier ; votre identifiant est conservé pour l'interface actuelle.", "The trainer cockpit is not available yet in the Chantier interface; your identifier is kept for the current interface.")} />
      <label className="sr-only" htmlFor="tr-name">{t("trainerPh")}</label>
      <input id="tr-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("trainerPh")} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSignIn(slugify(name) || "u" + Date.now(), name.trim(), "trainer"); }} />
      <div className="row"><button type="button" className="btn btn-g" disabled={!name.trim()} onClick={() => onSignIn(slugify(name) || "u" + Date.now(), name.trim(), "trainer")}>{t("trainerOpen")}</button><button type="button" className="link" onClick={() => setView("main")}>{t("backLink")}</button></div>
    </div>);
  } else {
    body = (<div className="card">
      <Head title={t("welcome")} sub={t("welcomeSub")} />
      <label className="sr-only" htmlFor="nm">{t("namePh")}</label>
      <input id="nm" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePh")} autoFocus onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSignIn(slugify(name) || "u" + Date.now(), name.trim(), "learner"); }} />
      <button type="button" className="btn btn-p" disabled={!name.trim()} onClick={() => onSignIn(slugify(name) || "u" + Date.now(), name.trim(), "learner")}>{t("startBtn")} →</button>
      <div style={{ display: "grid", gap: 8, justifyItems: "start", marginTop: 4 }}>
        <button type="button" className="link" onClick={() => { setView("class"); setErr(null); }}>{t("classLink")}</button>
        <button type="button" className="link" onClick={() => { setView("recover"); setErr(null); }}>{t("recoverLink")}</button>
        <button type="button" className="link muted" onClick={() => setView("trainer")}>{t("trainerLink")}</button>
      </div>
    </div>);
  }
  return (
    <div className="gate">
      <div className="box">{body}<Lang /><p className="muted" style={{ fontSize: 11.5 }}>{T("Interface Chantier · ECO PMP 2026 · 3 domaines · 26 tâches · 33/41/26 %", "Chantier interface · ECO PMP 2026 · 3 domains · 26 tasks · 33/41/26 %")}</p></div>
    </div>
  );
}
